import { describe, expect, it } from "vitest";
import { isAllowedInspectionCommand, isSensitivePath } from "../../src/core/safety";

describe("safety rules", () => {
  it("blocks sensitive paths", () => {
    expect(isSensitivePath(".env")).toBe(true);
    expect(isSensitivePath(".env.local")).toBe(true);
    expect(isSensitivePath("secrets/private.key")).toBe(true);
    expect(isSensitivePath("src/app.ts")).toBe(false);
  });

  it("allows only read-only inspection commands", () => {
    expect(isAllowedInspectionCommand(["git", "status", "--short"])).toBe(true);
    expect(isAllowedInspectionCommand(["git", "log", "--oneline", "-5"])).toBe(true);
    expect(isAllowedInspectionCommand(["npm", "test"])).toBe(false);
    expect(isAllowedInspectionCommand(["git", "commit", "-m", "x"])).toBe(false);
  });
});
