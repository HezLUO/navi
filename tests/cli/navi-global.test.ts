import { describe, expect, it } from "vitest";
import {
  NAVI_GLOBAL_BLOCK_END,
  NAVI_GLOBAL_BLOCK_START,
  planGlobalAgentsContent,
  renderGlobalBootstrapBlock,
} from "../../src/cli/navi-global";

describe("Navi global bootstrap planning", () => {
  it("renders only first-use routing responsibilities", () => {
    const block = renderGlobalBootstrapBlock();

    expect(block).toContain(NAVI_GLOBAL_BLOCK_START);
    expect(block).toContain("broad progress, next-step, stop, wait, continue, confusion, or plan-reliability");
    expect(block).toContain("project-local Navi guidance");
    expect(block).toContain("provisional judgment");
    expect(block).toContain("ask whether to initialize");
    expect(block).toContain("keep narrow factual and bounded execution requests quiet");
    expect(block).toContain("do not repeat the reminder in the same session after the user declines");
    expect(block).toContain("Do not draw a full Progress Map or Rhythm Map");
    expect(block).toContain("Do not write files or run navi init automatically");
    expect(block).not.toContain("Product Stage");
  });

  it("creates a block without changing existing bytes", () => {
    const existing = "# User instructions\n\nKeep my existing rules.\n";
    const action = planGlobalAgentsContent(existing, "install");

    expect(action.kind).toBe("modify");
    expect(action.previousContent).toBe(existing);
    expect(action.content?.startsWith(existing)).toBe(true);
  });

  it("skips the exact current block", () => {
    const block = `${renderGlobalBootstrapBlock()}\n`;
    expect(planGlobalAgentsContent(block, "install").kind).toBe("skip");
  });

  it("removes only the exact managed region", () => {
    const before = "before\n";
    const after = "after\n";
    const existing = `${before}${renderGlobalBootstrapBlock()}\n${after}`;
    const action = planGlobalAgentsContent(existing, "remove");

    expect(action.kind).toBe("remove");
    expect(action.content).toBe(`${before}${after}`);
  });

  it.each([
    `${NAVI_GLOBAL_BLOCK_START}\nincomplete`,
    `${NAVI_GLOBAL_BLOCK_END}\nend only`,
    `${renderGlobalBootstrapBlock()}\n${renderGlobalBootstrapBlock()}`,
    `${NAVI_GLOBAL_BLOCK_START}\nuser-edited content\n${NAVI_GLOBAL_BLOCK_END}`,
  ])("rejects unsafe or user-modified managed regions", (existing) => {
    expect(planGlobalAgentsContent(existing, "install").kind).toBe("conflict");
    expect(planGlobalAgentsContent(existing, "remove").kind).toBe("conflict");
  });
});
