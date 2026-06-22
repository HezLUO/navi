import {
  type RiskLevel,
  type WorkingThread,
  type WorkingThreadSection,
  type WorkingThreadSectionChange,
  type WorkingThreadStatus,
  type WorkingThreadSummary,
  workingThreadSections,
  workingThreadStatuses,
} from "../core/working-thread-contract";

export interface WorkingThreadParseWarning {
  code:
    | "missing-title"
    | "missing-status"
    | "invalid-status"
    | "missing-last-updated"
    | "invalid-last-updated"
    | "missing-section"
    | "duplicate-section";
  message: string;
  section?: WorkingThreadSection;
}

export interface PartialWorkingThreadDocument {
  id: string;
  title?: string;
  status?: string;
  lastUpdated?: string;
  sections: Partial<Record<WorkingThreadSection, string>>;
}

export interface ParsedWorkingThreadDocument {
  id: string;
  sourcePath: string;
  rawMarkdown: string;
  malformed: boolean;
  warnings: WorkingThreadParseWarning[];
  partial: PartialWorkingThreadDocument;
  thread?: WorkingThread;
}

export interface ParseWorkingThreadMarkdownInput {
  id: string;
  sourcePath: string;
  markdown: string;
}

const sectionHeadings = {
  whyThisMatters: "Why This Matters",
  currentJudgment: "Current Judgment",
  boundary: "Boundary",
  driftTriggers: "Drift Triggers",
  nextLikelyMove: "Next Likely Move",
  lastWrapUp: "Last Wrap-Up",
  openQuestions: "Open Questions",
} satisfies Record<WorkingThreadSection, string>;

const headingSections = new Map<string, WorkingThreadSection>(
  Object.entries(sectionHeadings).map(([section, heading]) => [
    normalizeHeading(heading),
    section as WorkingThreadSection,
  ]),
);

export function parseWorkingThreadMarkdown(
  input: ParseWorkingThreadMarkdownInput,
): ParsedWorkingThreadDocument {
  const warnings: WorkingThreadParseWarning[] = [];
  const partial: PartialWorkingThreadDocument = { id: input.id, sections: {} };
  const title = input.markdown.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
  const status = input.markdown.match(/^Status:\s*(.+?)\s*$/m)?.[1]?.trim();
  const lastUpdated = input.markdown.match(/^Last updated:\s*(.+?)\s*$/m)?.[1]?.trim();
  const sections = parseSections(input.markdown);

  if (title) {
    partial.title = title;
  } else {
    warnings.push({ code: "missing-title", message: "Missing H1 title." });
  }

  if (!status) {
    warnings.push({ code: "missing-status", message: "Missing status." });
  } else {
    partial.status = status;
    if (!isWorkingThreadStatus(status)) {
      warnings.push({ code: "invalid-status", message: `Invalid status: ${status}.` });
    }
  }

  if (lastUpdated) {
    partial.lastUpdated = lastUpdated;
    if (!isValidIsoDate(lastUpdated)) {
      warnings.push({
        code: "invalid-last-updated",
        message: `Invalid last updated date: ${lastUpdated}.`,
      });
    }
  } else {
    warnings.push({ code: "missing-last-updated", message: "Missing last updated date." });
  }

  for (const section of workingThreadSections) {
    const matches = sections.get(section) ?? [];
    if (matches.length === 0) {
      warnings.push({
        code: "missing-section",
        message: `Missing required section: ${sectionHeadings[section]}.`,
        section,
      });
      continue;
    }

    if (matches.length > 1) {
      warnings.push({
        code: "duplicate-section",
        message: `Duplicate required section: ${sectionHeadings[section]}.`,
        section,
      });
    }

    assignSectionValue(partial, section, matches[0] ?? "");
  }

  const thread = buildWorkingThread(input.id, partial);
  if (warnings.length > 0 || !partial.title || !partial.status || !partial.lastUpdated) {
    return {
      id: input.id,
      sourcePath: input.sourcePath,
      rawMarkdown: input.markdown,
      malformed: true,
      warnings,
      partial,
    };
  }

  return {
    id: input.id,
    sourcePath: input.sourcePath,
    rawMarkdown: input.markdown,
    malformed: false,
    warnings,
    partial,
    thread,
  };
}

export function summarizeWorkingThread(
  parsed: ParsedWorkingThreadDocument,
): WorkingThreadSummary {
  if (!parsed.thread) {
    const status = toWorkingThreadStatus(parsed.partial.status);

    return {
      id: parsed.id,
      title: parsed.partial.title ?? parsed.id,
      status,
      lastUpdated: parsed.partial.lastUpdated ?? "unknown",
      currentJudgmentBrief:
        parsed.partial.sections.currentJudgment ?? "Malformed Working Thread record.",
      nextLikelyMove: "Repair the Working Thread record before write-back.",
      riskLevel: "high",
      needsUserDecision: true,
    };
  }

  const needsUserDecision = parsed.thread.openQuestions.length > 0;
  const riskLevel = getRiskLevel(parsed.malformed, parsed.thread.status, needsUserDecision);

  return {
    id: parsed.thread.id,
    title: parsed.thread.title,
    status: parsed.thread.status,
    lastUpdated: parsed.thread.lastUpdated,
    currentJudgmentBrief: brief(parsed.thread.currentJudgment),
    nextLikelyMove: parsed.thread.nextLikelyMove,
    riskLevel,
    needsUserDecision,
  };
}

export function applyWorkingThreadSectionPatches(
  markdown: string,
  changes: WorkingThreadSectionChange[],
): string {
  let patched = markdown;

  for (const change of changes) {
    patched = applySingleSectionPatch(patched, change);
  }

  return patched;
}

function applySingleSectionPatch(
  markdown: string,
  change: WorkingThreadSectionChange,
): string {
  const sectionRange = findSectionRange(markdown, change.section);
  if (sectionRange.length === 0) {
    throw new Error(`Cannot patch missing section: ${sectionHeadings[change.section]}.`);
  }
  if (sectionRange.length > 1) {
    throw new Error(
      `Cannot patch duplicate or ambiguous section: ${sectionHeadings[change.section]}.`,
    );
  }

  const [targetRange] = sectionRange;
  const existing = markdown.slice(targetRange.bodyStart, targetRange.bodyEnd).trim();
  const expected = formatSectionValue(change.currentValue).trim();
  if (existing !== expected) {
    throw new Error(
      `Cannot patch ${change.section}: current value does not match the document.`,
    );
  }

  const replacementBody = formatSectionValue(change.proposedValue).trim();
  if (containsMarkdownHeading(replacementBody)) {
    throw new Error(
      `Cannot patch ${change.section}: proposed value must not introduce Markdown headings.`,
    );
  }

  const suffix = targetRange.bodyEnd < markdown.length ? "\n\n" : "\n";
  return [
    markdown.slice(0, targetRange.bodyStart),
    replacementBody,
    suffix,
    markdown.slice(targetRange.bodyEnd).replace(/^\n+/, ""),
  ].join("");
}

function parseSections(markdown: string): Map<WorkingThreadSection, string[]> {
  const sections = new Map<WorkingThreadSection, string[]>();
  const headingRegex = /^##\s+(.+?)\s*$/gm;
  const headings = [...markdown.matchAll(headingRegex)];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const headingText = heading[1] ?? "";
    const section = headingSections.get(normalizeHeading(headingText));
    if (!section || heading.index === undefined) {
      continue;
    }

    const headingEnd = heading.index + heading[0].length;
    const nextHeading = headings[index + 1];
    const sectionEnd = nextHeading?.index ?? markdown.length;
    const body = markdown.slice(headingEnd, sectionEnd).trim();
    const existing = sections.get(section) ?? [];
    existing.push(body);
    sections.set(section, existing);
  }

  return sections;
}

function assignSectionValue(
  partial: PartialWorkingThreadDocument,
  section: WorkingThreadSection,
  value: string,
): void {
  partial.sections[section] = value.trim();
}

function buildWorkingThread(
  id: string,
  partial: PartialWorkingThreadDocument,
): WorkingThread {
  const status = toWorkingThreadStatus(partial.status);

  return {
    id,
    title: partial.title ?? "",
    status,
    lastUpdated: partial.lastUpdated ?? "",
    whyThisMatters: partial.sections.whyThisMatters ?? "",
    currentJudgment: partial.sections.currentJudgment ?? "",
    boundary: parseBulletList(partial.sections.boundary ?? ""),
    driftTriggers: parseBulletList(partial.sections.driftTriggers ?? ""),
    nextLikelyMove: partial.sections.nextLikelyMove ?? "",
    lastWrapUp: partial.sections.lastWrapUp ?? "",
    openQuestions: parseBulletList(partial.sections.openQuestions ?? ""),
  };
}

function findSectionRange(
  markdown: string,
  section: WorkingThreadSection,
): { bodyStart: number; bodyEnd: number }[] {
  const headingRegex = /^##\s+(.+?)\s*$/gm;
  const headings = [...markdown.matchAll(headingRegex)];
  const ranges: { bodyStart: number; bodyEnd: number }[] = [];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const headingText = heading[1] ?? "";
    if (normalizeHeading(headingText) !== normalizeHeading(sectionHeadings[section])) {
      continue;
    }

    if (heading.index === undefined) {
      continue;
    }

    let bodyStart = heading.index + heading[0].length;
    if (markdown.startsWith("\r\n", bodyStart)) {
      bodyStart += 2;
    } else if (markdown.startsWith("\n", bodyStart)) {
      bodyStart += 1;
    }
    if (markdown.startsWith("\r\n", bodyStart)) {
      bodyStart += 2;
    } else if (markdown.startsWith("\n", bodyStart)) {
      bodyStart += 1;
    }

    const nextHeading = headings[index + 1];
    let bodyEnd = nextHeading?.index ?? markdown.length;
    while (bodyEnd > bodyStart && /\s/.test(markdown[bodyEnd - 1] ?? "")) {
      bodyEnd -= 1;
    }

    ranges.push({ bodyStart, bodyEnd });
  }

  return ranges;
}

function formatSectionValue(value: string | string[]): string {
  if (Array.isArray(value)) {
    return value.map((item) => `- ${item}`).join("\n");
  }

  return value;
}

function containsMarkdownHeading(value: string): boolean {
  const lines = value.split(/\r?\n/);

  return lines.some((line, index) => {
    if (/^#{1,6}\s+\S/.test(line)) {
      return true;
    }

    return /^\s*(?:=+|-+)\s*$/.test(line) && Boolean(lines[index - 1]?.trim());
  });
}

function parseBulletList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(.+?)\s*$/)?.[1]?.trim())
    .filter((item): item is string => Boolean(item));
}

function brief(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function getRiskLevel(
  malformed: boolean,
  status: WorkingThreadStatus,
  needsUserDecision: boolean,
): RiskLevel {
  if (malformed) {
    return "high";
  }

  if (needsUserDecision || status === "active") {
    return "medium";
  }

  return "low";
}

function isWorkingThreadStatus(value: string): value is WorkingThreadStatus {
  return workingThreadStatuses.includes(value as WorkingThreadStatus);
}

function toWorkingThreadStatus(value: string | undefined): WorkingThreadStatus {
  return value && isWorkingThreadStatus(value) ? value : "active";
}

function isValidIsoDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

function normalizeHeading(value: string): string {
  return value.trim().toLowerCase();
}
