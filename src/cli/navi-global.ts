export const NAVI_GLOBAL_BLOCK_START = "<!-- NAVI:GLOBAL-BOOTSTRAP:START -->";
export const NAVI_GLOBAL_BLOCK_END = "<!-- NAVI:GLOBAL-BOOTSTRAP:END -->";

export type GlobalSetupOperation = "install" | "remove";
export type GlobalAgentsActionKind = "create" | "modify" | "remove" | "skip" | "conflict";

export interface GlobalAgentsAction {
  kind: GlobalAgentsActionKind;
  summary: string;
  content?: string;
  previousContent?: string;
}

export function renderGlobalBootstrapBlock(): string {
  return `${NAVI_GLOBAL_BLOCK_START}
Navi global bootstrap only:
- keep narrow factual and bounded execution requests quiet.
- For broad progress, next-step, stop, wait, continue, confusion, or plan-reliability questions, check whether the active project has project-local Navi guidance.
- If project-local Navi guidance is missing, avoid a confident stable map. Give at most one short provisional judgment, identify the likely project root, and ask whether to initialize that project with Navi.
- Do not draw a full Progress Map or Rhythm Map from the global bootstrap.
- Do not write files or run navi init automatically; do not repeat the reminder in the same session after the user declines.
- When project-local Navi guidance exists, let that guidance and the installed Navi skill own full supervision behavior.
${NAVI_GLOBAL_BLOCK_END}`;
}

const KNOWN_GLOBAL_BOOTSTRAP_BLOCKS = [renderGlobalBootstrapBlock()];

function markerOffsets(text: string): { starts: number[]; ends: number[] } {
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;

  while ((index = text.indexOf(NAVI_GLOBAL_BLOCK_START, index)) !== -1) {
    starts.push(index);
    index += NAVI_GLOBAL_BLOCK_START.length;
  }

  index = 0;
  while ((index = text.indexOf(NAVI_GLOBAL_BLOCK_END, index)) !== -1) {
    ends.push(index);
    index += NAVI_GLOBAL_BLOCK_END.length;
  }

  return { starts, ends };
}

export function planGlobalAgentsContent(
  existing: string | undefined,
  operation: GlobalSetupOperation,
): GlobalAgentsAction {
  const text = existing ?? "";
  const { starts, ends } = markerOffsets(text);

  if (starts.length === 0 && ends.length === 0) {
    if (operation === "remove") {
      return { kind: "skip", summary: "No Navi global bootstrap block is installed." };
    }

    const content = text.length === 0
      ? renderGlobalBootstrapBlock()
      : `${text}${text.endsWith("\n") ? "" : "\n"}${renderGlobalBootstrapBlock()}`;

    return existing === undefined
      ? { kind: "create", summary: "Create global instructions with the Navi bootstrap block.", content }
      : {
          kind: "modify",
          summary: "Append the Navi bootstrap block to global instructions.",
          content,
          previousContent: existing,
        };
  }

  if (starts.length !== 1 || ends.length !== 1 || starts[0] > ends[0]) {
    return { kind: "conflict", summary: "Navi global bootstrap markers are unsafe or incomplete." };
  }

  const start = starts[0];
  const end = ends[0] + NAVI_GLOBAL_BLOCK_END.length;
  const managedBlock = text.slice(start, end);

  if (!KNOWN_GLOBAL_BOOTSTRAP_BLOCKS.includes(managedBlock)) {
    return { kind: "conflict", summary: "Navi global bootstrap content was modified or is unrecognized." };
  }

  if (operation === "remove") {
    return {
      kind: "remove",
      summary: "Remove the Navi bootstrap block from global instructions.",
      content: `${text.slice(0, start)}${text.slice(end)}`,
      previousContent: existing,
    };
  }

  if (managedBlock === renderGlobalBootstrapBlock()) {
    return { kind: "skip", summary: "The current Navi global bootstrap block is already installed." };
  }

  return {
    kind: "modify",
    summary: "Upgrade the known Navi global bootstrap block.",
    content: `${text.slice(0, start)}${renderGlobalBootstrapBlock()}${text.slice(end)}`,
    previousContent: existing,
  };
}
