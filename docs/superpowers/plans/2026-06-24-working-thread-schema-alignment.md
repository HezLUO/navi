# Working Thread Schema Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow Working Thread records to keep read-only appendix sections after the canonical core while preserving strict confirmed write-back safety.

**Architecture:** Keep the `WorkingThread` contract unchanged. Extend the Markdown parser to distinguish canonical core sections from read-only appendices, and make section patching preserve appendix content. Repair the active Working Thread record ordering so `Open Questions` remains part of the canonical core before appendices begin.

**Tech Stack:** TypeScript strict mode, Vitest, existing Node/tsx MCP server, existing docs-backed Working Thread store. No new dependencies.

---

## Current Constraints

- Approved spec: `docs/superpowers/specs/2026-06-24-working-thread-schema-alignment-design.md`.
- Do not add new MCP tools, resources, prompts, transports, package bins, or runtime behavior.
- Do not add background runtime, watcher, scheduler, presence, adapters, delegation, Memory v2, `.along/` state, or LLM calls.
- Do not change `src/core/working-thread-contract.ts` unless a compile error proves the existing type cannot express appendices.
- Appendices are read-only in V1.
- Confirmed write-back must remain limited to canonical section patches.
- Unknown headings before the canonical core is complete remain malformed.
- Unknown headings after the canonical core is complete become appendices and must not make the record malformed.
- The active real record currently has appendix sections before `Open Questions`; this plan fixes that ordering as a docs cleanup.
- Preserve `.superpowers/` as untracked local runtime data.

## File Structure

- Modify `src/mcp/working-thread-markdown.ts`
  - Add appendix parsing metadata.
  - Keep canonical parsing strict until all seven canonical sections have appeared.
  - Treat unknown headings after core completion as appendices.
  - Keep section patching scoped to canonical sections and preserving appendix content.
- Modify `tests/mcp/working-thread-markdown.test.ts`
  - Add focused parser and patch tests for appendices.
  - Preserve existing malformed tests for unknown headings before core completion and nested headings in core sections.
- Modify `tests/mcp/working-thread-docs-store.test.ts`
  - Add a store-level confirmed write-back test against a record with appendices.
- Modify `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
  - Move `Open Questions` before appendix sections so the canonical core is complete before appendices.
  - Do not rewrite or delete appendix content.
- Modify `docs/superpowers/notes/2026-06-24-minimal-mcp-client-validation.md`
  - Add a short follow-up section after revalidation.
- Modify `docs/superpowers/notes/2026-06-23-anti-self-certification-baseline-record.md`
  - Add a short Round 5 result after revalidation.

---

### Task 1: Parser Tests For Read-Only Appendices

**Files:**
- Modify: `tests/mcp/working-thread-markdown.test.ts`

- [ ] **Step 1: Add appendix fixture text near `validRecord`**

Add this fixture after `validRecord`:

```ts
const recordWithAppendices = `${validRecord}

## Validation Notes

2026-06-24 validation showed the MCP client can read the record.

### Nested Evidence

Appendix evidence may contain lower-level headings because it is read-only.

## Packaging Metadata

- Package version remains 0.1.0.
- This appendix is not part of the WorkingThread contract.
`;
```

- [ ] **Step 2: Add a test that appendices do not make a complete core malformed**

Add this test inside `describe("Working Thread Markdown", () => { ... })`:

```ts
it("parses appendices after the canonical core as read-only context", () => {
  const parsed = parseWorkingThreadMarkdown({
    id: "appendix-thread",
    sourcePath: "docs/along/working-threads/appendix-thread.md",
    markdown: recordWithAppendices,
  });

  expect(parsed.malformed).toBe(false);
  expect(parsed.thread).toMatchObject({
    id: "appendix-thread",
    currentJudgment: "The Minimal MCP Server spec is approved and awaiting implementation.",
    nextLikelyMove: "Implement the docs-backed stdio MCP server.",
  });
  expect(parsed.thread?.openQuestions).toEqual([
    "Which agent client should validate the server first?",
  ]);
  expect(parsed.warnings).toEqual([]);
  expect(parsed.appendices).toHaveLength(2);
  expect(parsed.appendices?.[0]).toMatchObject({
    heading: "Validation Notes",
    markdown: expect.stringContaining("2026-06-24 validation showed"),
    startOffset: expect.any(Number),
    endOffset: expect.any(Number),
  });
  expect(parsed.appendices?.[0]?.markdown).toContain("### Nested Evidence");
  expect(parsed.appendices?.[1]).toMatchObject({
    heading: "Packaging Metadata",
    markdown: expect.stringContaining("Package version remains 0.1.0."),
    startOffset: expect.any(Number),
    endOffset: expect.any(Number),
  });
});
```

- [ ] **Step 3: Add a test that unknown headings before core completion remain malformed**

Add this test:

```ts
it("keeps unknown headings before canonical core completion malformed", () => {
  const appendixBeforeOpenQuestions = validRecord.replace(
    "## Open Questions",
    `## Validation Notes

This appears before Open Questions, so the canonical core is incomplete.

## Open Questions`,
  );

  const parsed = parseWorkingThreadMarkdown({
    id: "misordered-appendix-thread",
    sourcePath: "docs/along/working-threads/misordered-appendix-thread.md",
    markdown: appendixBeforeOpenQuestions,
  });

  expect(parsed.malformed).toBe(true);
  expect(parsed.thread).toBeUndefined();
  expect(parsed.warnings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "unknown-section",
        message: expect.stringContaining("Validation Notes"),
      }),
    ]),
  );
});
```

- [ ] **Step 4: Add a test that patches preserve appendix content**

Add this test:

```ts
it("preserves read-only appendices when patching canonical sections", () => {
  const patched = createWorkingThreadSectionPatch(recordWithAppendices, [
    {
      section: "lastWrapUp",
      currentValue: "The user approved the Minimal MCP Server spec.",
      proposedValue: "The schema alignment pass preserved appendix content.",
      rationale: "Appendices must remain read-only and preserved.",
    },
  ]).markdown;

  expect(patched).toContain("The schema alignment pass preserved appendix content.");
  expect(patched).toContain("## Validation Notes");
  expect(patched).toContain("### Nested Evidence");
  expect(patched).toContain("## Packaging Metadata");
  expect(patched).toContain("- Package version remains 0.1.0.");
});
```

- [ ] **Step 5: Run parser tests and verify the new tests fail**

Run:

```bash
npm test -- tests/mcp/working-thread-markdown.test.ts
```

Expected: FAIL because `ParsedWorkingThreadDocument` has no `appendices` field and unknown post-core headings are still treated as malformed.

- [ ] **Step 6: Commit failing tests**

Commit only the test change:

```bash
git add tests/mcp/working-thread-markdown.test.ts
git commit -m "test: cover working thread appendices"
```

---

### Task 2: Parser Implementation For Appendices

**Files:**
- Modify: `src/mcp/working-thread-markdown.ts`
- Modify if TypeScript requires it: `tests/mcp/working-thread-markdown.test.ts`

- [ ] **Step 1: Add appendix types**

In `src/mcp/working-thread-markdown.ts`, add this interface after `PartialWorkingThreadDocument`:

```ts
export interface WorkingThreadAppendix {
  heading: string;
  markdown: string;
  startOffset: number;
  endOffset: number;
}
```

Then add this field to `ParsedWorkingThreadDocument`:

```ts
appendices: WorkingThreadAppendix[];
```

- [ ] **Step 2: Replace `parseSections` with core-aware parsing**

Replace the existing `parseSections` function with this implementation:

```ts
function parseSections(
  markdown: string,
  warnings: WorkingThreadParseWarning[],
): {
  sections: Map<WorkingThreadSection, string[]>;
  appendices: WorkingThreadAppendix[];
} {
  const sections = new Map<WorkingThreadSection, string[]>();
  const appendices: WorkingThreadAppendix[] = [];
  const headingRegex = /^ {0,3}(#{1,6})\s+(.+?)\s*$/gm;
  const headings = [...markdown.matchAll(headingRegex)];
  const consumedAppendixHeadingIndexes = new Set<number>();

  for (let index = 0; index < headings.length; index += 1) {
    if (consumedAppendixHeadingIndexes.has(index)) {
      continue;
    }

    const heading = headings[index];
    const marker = heading[1] ?? "";
    const headingText = heading[2] ?? "";
    const headingIndex = heading.index;
    if (headingIndex === undefined) {
      continue;
    }

    if (marker === "#" && isDocumentTitleHeading(markdown, headingIndex)) {
      continue;
    }

    const headingEnd = headingIndex + heading[0].length;
    const nextHeading = headings[index + 1];
    const sectionEnd = nextHeading?.index ?? markdown.length;
    const body = markdown.slice(headingEnd, sectionEnd).trim();
    const section = marker === "##"
      ? headingSections.get(normalizeHeading(headingText))
      : undefined;

    if (section) {
      const existing = sections.get(section) ?? [];
      existing.push(body);
      sections.set(section, existing);
      continue;
    }

    if (marker === "##" && isCanonicalCoreComplete(sections)) {
      const nextAppendixHeadingIndex = findNextLevelTwoHeadingIndex(headings, index + 1);
      const appendixEnd = nextAppendixHeadingIndex === undefined
        ? markdown.length
        : headings[nextAppendixHeadingIndex]?.index ?? markdown.length;
      for (let appendixIndex = index + 1; appendixIndex < (nextAppendixHeadingIndex ?? headings.length); appendixIndex += 1) {
        consumedAppendixHeadingIndexes.add(appendixIndex);
      }

      appendices.push({
        heading: headingText.trim(),
        markdown: markdown.slice(headingEnd, appendixEnd).trim(),
        startOffset: headingIndex,
        endOffset: appendixEnd,
      });
      continue;
    }

    warnings.push({
      code: "unknown-section",
      message: `Unknown Working Thread section heading: ${headingText.trim()}.`,
    });
  }

  return { sections, appendices };
}
```

- [ ] **Step 3: Add `isCanonicalCoreComplete` helper**

Add these helpers near `parseSections`:

```ts
function isCanonicalCoreComplete(
  sections: Map<WorkingThreadSection, string[]>,
): boolean {
  return workingThreadSections.every((section) => (sections.get(section) ?? []).length > 0);
}

function findNextLevelTwoHeadingIndex(
  headings: RegExpMatchArray[],
  startIndex: number,
): number | undefined {
  for (let index = startIndex; index < headings.length; index += 1) {
    if ((headings[index]?.[1] ?? "") === "##") {
      return index;
    }
  }

  return undefined;
}
```

- [ ] **Step 4: Update `parseWorkingThreadMarkdown` to carry appendices**

Replace:

```ts
const sections = parseSections(input.markdown, warnings);
```

with:

```ts
const { sections, appendices } = parseSections(input.markdown, warnings);
```

In both return objects from `parseWorkingThreadMarkdown`, add:

```ts
appendices,
```

- [ ] **Step 5: Keep Setext warnings strict only before core completion**

If `addSetextHeadingWarnings` causes the appendix fixture to fail because of lower-level appendix text, replace it with this simpler core-only guard:

```ts
function addSetextHeadingWarnings(
  markdown: string,
  warnings: WorkingThreadParseWarning[],
): void {
  const coreEnd = findCanonicalCoreEnd(markdown);
  const coreMarkdown = coreEnd === undefined ? markdown : markdown.slice(0, coreEnd);
  const lines = coreMarkdown.split(/\r?\n/);
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const previousLine = lines[index - 1] ?? "";
    if (/^ {0,3}(?:=+|-+)\s*$/.test(line) && previousLine.trim()) {
      warnings.push({
        code: "unknown-section",
        message: `Unknown Working Thread section heading: ${previousLine.trim()}.`,
      });
    }
  }
}

function findCanonicalCoreEnd(markdown: string): number | undefined {
  const openQuestionsRanges = findSectionRange(markdown, "openQuestions");
  return openQuestionsRanges.length === 1 ? openQuestionsRanges[0].bodyEnd : undefined;
}
```

- [ ] **Step 6: Run parser tests**

Run:

```bash
npm test -- tests/mcp/working-thread-markdown.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run TypeScript check**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit parser implementation**

Commit implementation and any test type adjustment:

```bash
git add src/mcp/working-thread-markdown.ts tests/mcp/working-thread-markdown.test.ts
git commit -m "feat: allow read-only working thread appendices"
```

---

### Task 3: Store-Level Write-Back With Appendices

**Files:**
- Modify: `tests/mcp/working-thread-docs-store.test.ts`
- Modify only if needed: `src/mcp/working-thread-docs-store.ts`

- [ ] **Step 1: Locate existing write-back tests**

Run:

```bash
rg -n "applySectionPatchProposal|write-back|stale|section patch" tests/mcp/working-thread-docs-store.test.ts
```

Expected: existing tests cover confirmed section patching and stale conflicts.

- [ ] **Step 2: Add a fixture helper for a record with appendices**

In `tests/mcp/working-thread-docs-store.test.ts`, add this helper near other record fixtures:

```ts
function recordWithAppendices(): string {
  return `# Validation Thread

Status: active
Last updated: 2026-06-24

## Why This Matters

This record validates appendices.

## Current Judgment

Keep appendices read-only.

## Boundary

- Do not patch appendices.

## Drift Triggers

- The work writes outside canonical sections.

## Next Likely Move

Patch a canonical section.

## Last Wrap-Up

Appendix validation is pending.

## Open Questions

- Will appendices be preserved?

## Validation Notes

This appendix must remain unchanged.

### Evidence

Nested appendix content must also remain unchanged.
`;
}
```

- [ ] **Step 3: Add a store-level preservation test**

Add this test in the docs store `describe` block:

```ts
it("applies confirmed section patches while preserving appendices", async () => {
  const workspace = await createWorkspace({
    "validation-thread.md": recordWithAppendices(),
  });
  const store = createWorkingThreadDocsStore({ workspaceRoot: workspace.root });
  const parsed = await store.readThread("validation-thread");
  expect(parsed.malformed).toBe(false);
  expect(parsed.thread).toBeDefined();

  const proposal = {
    proposalId: "validation-thread-proposal",
    threadId: "validation-thread",
    baseLastUpdated: "2026-06-24",
    baseVersion: buildWorkingThreadBaseVersion(parsed.thread!),
    changes: [
      {
        section: "lastWrapUp",
        currentValue: "Appendix validation is pending.",
        proposedValue: "Appendix validation passed.",
        rationale: "Only canonical sections should change.",
      },
    ],
    confirmationPrompt: "Confirm this Working Thread update before any write-back is applied.",
    riskLevel: "low",
  } as const;

  await store.applySectionPatchProposal(proposal);

  const markdown = await readFile(
    path.join(workspace.recordsDir, "validation-thread.md"),
    "utf8",
  );
  expect(markdown).toContain("Appendix validation passed.");
  expect(markdown).toContain("## Validation Notes");
  expect(markdown).toContain("This appendix must remain unchanged.");
  expect(markdown).toContain("### Evidence");
  expect(markdown).toContain("Nested appendix content must also remain unchanged.");
});
```

This test uses imports and helpers that already exist in `tests/mcp/working-thread-docs-store.test.ts`: `readFile`, `path`, `createTempStore`, and `buildWorkingThreadBaseVersion`.

- [ ] **Step 4: Run store tests and verify behavior**

Run:

```bash
npm test -- tests/mcp/working-thread-docs-store.test.ts
```

Expected: PASS. If this fails because patch range includes appendices, adjust `findSectionRange` in `src/mcp/working-thread-markdown.ts` so canonical section ranges end at the next heading, including appendix headings.

- [ ] **Step 5: Commit store coverage**

Commit test and any required implementation fix:

```bash
git add tests/mcp/working-thread-docs-store.test.ts src/mcp/working-thread-markdown.ts src/mcp/working-thread-docs-store.ts
git commit -m "test: preserve appendices during working thread write-back"
```

---

### Task 4: Real Working Thread Record Ordering Cleanup

**Files:**
- Modify: `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`

- [ ] **Step 1: Confirm current heading order**

Run:

```bash
rg -n '^## ' docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
```

Expected before cleanup: `Open Questions` appears after appendix headings such as `Validation Notes` and `Packaging Source Strategy`.

- [ ] **Step 2: Move the `Open Questions` section before appendices**

Edit `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md` so this section:

```md
## Open Questions

- Is the medium-drift answer length acceptable, or should the skill push more concise first replies?
- What should the plugin promise to users without overselling background self-initiation?
```

appears immediately after `## Last Wrap-Up` and before `## Validation Notes`.

Do not delete or rewrite the appendix sections. Preserve the content under:

```text
Validation Notes
Plan Audit
Deferred Capability Map
Packaging Positioning
Packaging Success Criteria
Packaging Metadata
Packaging Source Strategy
```

- [ ] **Step 3: Confirm heading order after cleanup**

Run:

```bash
rg -n '^## ' docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
```

Expected after cleanup:

```text
Why This Matters
Current Judgment
Boundary
Drift Triggers
Next Likely Move
Last Wrap-Up
Open Questions
Validation Notes
Plan Audit
Deferred Capability Map
Packaging Positioning
Packaging Success Criteria
Packaging Metadata
Packaging Source Strategy
```

- [ ] **Step 4: Run parser test against the real record through the docs store**

Run:

```bash
node --import tsx --input-type=module -e 'import { createWorkingThreadDocsStore } from "./src/mcp/working-thread-docs-store.ts"; const store = createWorkingThreadDocsStore({ workspaceRoot: process.cwd() }); const parsed = await store.readThread("2026-06-18-existing-agent-self-initiation-layer"); console.log(JSON.stringify({ malformed: parsed.malformed, warnings: parsed.warnings, hasThread: Boolean(parsed.thread), appendices: parsed.appendices?.map((item) => item.heading) ?? [] }, null, 2)); if (parsed.malformed || !parsed.thread) process.exit(1);'
```

Expected: command exits 0 and prints `malformed: false`, `hasThread: true`, and appendix headings including `Validation Notes`.

If sandbox blocks `tsx` with `listen EPERM`, rerun with escalated permissions and record that the escalation was for the known `tsx` IPC limitation.

- [ ] **Step 5: Commit docs ordering cleanup**

Commit only the real record cleanup:

```bash
git add docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
git commit -m "docs: align working thread appendices"
```

---

### Task 5: MCP Client Revalidation And Documentation

**Files:**
- Modify: `docs/superpowers/notes/2026-06-24-minimal-mcp-client-validation.md`
- Modify: `docs/superpowers/notes/2026-06-23-anti-self-certification-baseline-record.md`

- [ ] **Step 1: Re-run focused test suites**

Run:

```bash
npm test -- tests/mcp/working-thread-markdown.test.ts tests/mcp/working-thread-docs-store.test.ts tests/mcp/working-thread-operations.test.ts tests/mcp/working-thread-server.test.ts
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 2: Re-run MCP client validation against real repo**

Create or overwrite `/private/tmp/along-mcp-client-validation.mjs` with this exact validation script:

```js
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "/Users/james/Codex Project/General Codex Project/Along/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StdioClientTransport } from "/Users/james/Codex Project/General Codex Project/Along/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js";

const repoRoot = "/Users/james/Codex Project/General Codex Project/Along";
const threadId = "2026-06-18-existing-agent-self-initiation-layer";
const disposableThreadId = "validation-thread";
const disposableRecord = `# Validation Thread

Status: active
Last updated: 2026-06-24

## Why This Matters

This disposable record validates MCP write-back behavior without touching the real repository.

## Current Judgment

Keep validation scoped to a disposable workspace.

## Boundary

- Do not write to the real repository during validation.
- Do not add HTTP transport.

## Drift Triggers

- The work writes outside Working Thread records.
- The work adds HTTP transport.

## Next Likely Move

Validate confirmed section patch write-back.

## Last Wrap-Up

The validation record was created for a disposable MCP client run.

## Open Questions

- Does stale proposal handling reject the second write?

## Validation Notes

This appendix must be preserved.
`;

async function connect(workspaceRoot) {
  const transport = new StdioClientTransport({
    command: "npm",
    args: ["run", "mcp:working-thread", "--", "--workspace", workspaceRoot],
    cwd: repoRoot,
    stderr: "pipe",
  });
  const client = new Client({ name: "along-validation-client", version: "0.1.0" });
  await client.connect(transport);
  return { client, transport };
}

function parseTextResult(result) {
  const text = result.content?.find((item) => item.type === "text")?.text;
  return text ? JSON.parse(text) : result.structuredContent;
}

function parseResource(result) {
  return JSON.parse(result.contents[0].text);
}

async function withClient(workspaceRoot, fn) {
  const { client, transport } = await connect(workspaceRoot);
  try {
    return await fn(client);
  } finally {
    await client.close();
    await transport.close();
  }
}

const realResult = await withClient(repoRoot, async (client) => {
  const resources = await client.listResources();
  const templates = await client.listResourceTemplates();
  const tools = await client.listTools();
  const record = parseResource(await client.readResource({
    uri: `working-thread://threads/${threadId}/record`,
  }));
  if (record.malformed || !record.thread) {
    throw new Error(`Expected real record to parse after schema alignment: ${JSON.stringify({
      malformed: record.malformed,
      warnings: record.warnings,
    }, null, 2)}`);
  }
  const classify = parseTextResult(await client.callTool({
    name: "classifyDrift",
    arguments: {
      thread: record.thread,
      userRequest: "Let's add HTTP/SSE background adapter support now.",
      proposedDirection: "Expand Core/MCP runtime transport.",
    },
  }));
  const draft = parseTextResult(await client.callTool({
    name: "draftWrapUp",
    arguments: {
      thread: record.thread,
      sessionSummary: "Fresh MCP client validation checked the aligned real Working Thread record.",
      judgmentChange: "Keep validation ahead of new Core/MCP expansion.",
      nextLikelyMove: "Record validation evidence in the neutral audit note.",
    },
  }));
  const proposal = parseTextResult(await client.callTool({
    name: "proposeWorkingThreadUpdate",
    arguments: {
      thread: record.thread,
      draft: draft.data,
    },
  }));

  return {
    serverVersion: client.getServerVersion(),
    capabilities: client.getServerCapabilities(),
    resourceUris: resources.resources.map((resource) => resource.uri),
    resourceTemplates: templates.resourceTemplates.map((template) => template.uriTemplate),
    toolNames: tools.tools.map((tool) => tool.name),
    targetRecordMalformed: record.malformed,
    targetAppendices: record.appendices?.map((appendix) => appendix.heading) ?? [],
    classify,
    draft,
    proposal,
  };
});

const tempRoot = await mkdtemp(path.join(tmpdir(), "along-mcp-validation-"));
try {
  const tempRecordsDir = path.join(tempRoot, "docs", "along", "working-threads");
  await mkdir(tempRecordsDir, { recursive: true });
  await writeFile(path.join(tempRecordsDir, `${disposableThreadId}.md`), disposableRecord);

  const disposableResult = await withClient(tempRoot, async (client) => {
    const record = parseResource(await client.readResource({
      uri: `working-thread://threads/${disposableThreadId}/record`,
    }));
    const draft = parseTextResult(await client.callTool({
      name: "draftWrapUp",
      arguments: {
        thread: record.thread,
        sessionSummary: "Disposable write-back validation succeeded through a real MCP stdio client.",
        judgmentChange: "Confirmed write-back works in a disposable workspace only.",
        nextLikelyMove: "Record validation evidence in the neutral audit note.",
      },
    }));
    const proposal = parseTextResult(await client.callTool({
      name: "proposeWorkingThreadUpdate",
      arguments: {
        thread: record.thread,
        draft: draft.data,
      },
    }));
    const confirmation = {
      proposalId: proposal.data.proposalId,
      approved: true,
      approvedAt: "2026-06-24T00:00:00.000Z",
      approvedBy: "user",
      sourceSessionId: "schema-alignment-validation",
      sourceTurnId: "mcp-client-validation",
      approvedIntent: "Validate confirmed Working Thread write-back in disposable workspace.",
      baseLastUpdated: proposal.data.baseLastUpdated,
      baseVersion: proposal.data.baseVersion,
    };
    const applied = parseTextResult(await client.callTool({
      name: "applyConfirmedWorkingThreadUpdate",
      arguments: {
        proposal: proposal.data,
        confirmation,
      },
    }));
    const stale = parseTextResult(await client.callTool({
      name: "applyConfirmedWorkingThreadUpdate",
      arguments: {
        proposal: proposal.data,
        confirmation,
      },
    }));
    const patchedMarkdown = await readFile(
      path.join(tempRoot, "docs", "along", "working-threads", `${disposableThreadId}.md`),
      "utf8",
    );

    return {
      applied,
      stale,
      patchedContainsValidationText: patchedMarkdown.includes(
        "Disposable write-back validation succeeded through a real MCP stdio client.",
      ),
      appendixPreserved: patchedMarkdown.includes("## Validation Notes"),
    };
  });

  console.log(JSON.stringify({
    ok: true,
    realWorkspace: repoRoot,
    disposableWorkspace: tempRoot,
    realResult,
    disposableResult,
  }, null, 2));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
```

Then run:

```bash
node /private/tmp/along-mcp-client-validation.mjs
```

Expected after schema alignment:

- real workspace summary and record resources work;
- target real record reports `targetRecordMalformed: false` or equivalent;
- action tools can operate on the real record;
- disposable write-back still passes;
- no real repository write-back is applied by the validation script.

- [ ] **Step 3: Update the MCP validation report**

Append this section to `docs/superpowers/notes/2026-06-24-minimal-mcp-client-validation.md`:

```md
## Schema Alignment Follow-Up

Date: 2026-06-24

The Working Thread schema alignment pass resolved the real-record malformed blocker.

Result:

- The active Working Thread record now keeps the canonical core before appendix sections.
- The parser treats appendix sections after the canonical core as read-only context.
- The active record parses as a complete `WorkingThread`.
- MCP resources can expose both the structured core and appendix-preserved full record context.
- Confirmed write-back remains limited to canonical sections.
- No new MCP tools, prompts, transports, runtime behavior, adapters, presence, or `.along/` state were added.

This resolves the schema/content alignment blocker found during the first MCP client validation. It does not change the broader product conclusion: Along still has turn-bound, docs-backed continuity, not background autonomy or living presence.
```

- [ ] **Step 4: Update the neutral anti-self-certification record**

Append this section to `docs/superpowers/notes/2026-06-23-anti-self-certification-baseline-record.md` before `## Update Rule`:

```md
## Round 5 Result: Working Thread Schema Alignment

Completed on 2026-06-24.

Result:

- The schema/content mismatch found in Minimal MCP client validation was resolved.
- Canonical Working Thread sections remain strict and writable only through confirmed section patches.
- Appendix sections are allowed after the canonical core as read-only context.
- The active Working Thread record was aligned so `Open Questions` is part of the canonical core before appendices begin.
- This pass did not add new MCP capability, runtime behavior, background autonomy, presence, adapters, delegation, Memory v2, or `.along/` state.

Interpretation:

This improves MCP usability against real project records without changing the evidence hierarchy. It proves the docs-backed MCP layer can handle long-running Working Thread records more realistically, but it still does not prove true self-initiation or companion presence.
```

- [ ] **Step 5: Run final verification**

Run:

```bash
git diff --check
npm test -- tests/mcp/working-thread-markdown.test.ts tests/mcp/working-thread-docs-store.test.ts tests/mcp/working-thread-operations.test.ts tests/mcp/working-thread-server.test.ts
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit documentation and verification notes**

Commit documentation updates:

```bash
git add docs/superpowers/notes/2026-06-24-minimal-mcp-client-validation.md docs/superpowers/notes/2026-06-23-anti-self-certification-baseline-record.md
git commit -m "docs: record working thread schema alignment"
```

---

## Final Whole-Branch Review

After all tasks are complete:

- [ ] Run:

```bash
npm test -- tests/mcp/working-thread-markdown.test.ts tests/mcp/working-thread-docs-store.test.ts tests/mcp/working-thread-operations.test.ts tests/mcp/working-thread-server.test.ts
npm run typecheck
npm run build
git status --short
```

- [ ] If full test suite is required by the reviewer, run:

```bash
npm test
```

If sandbox fails only on known local server or `tsx` IPC permissions, rerun with escalation and record the reason.

- [ ] Perform final review against the approved spec:

```text
docs/superpowers/specs/2026-06-24-working-thread-schema-alignment-design.md
```

Check:

- appendices are read-only;
- canonical section write-back remains strict;
- unknown headings before core completion remain malformed;
- real record parses as complete after ordering cleanup;
- no new MCP capabilities or runtime behavior were added.

- [ ] Final handoff should report:

```text
branch/worktree
final HEAD
task commits
verification commands and results
whether real MCP client revalidation passed
remaining git status
```
