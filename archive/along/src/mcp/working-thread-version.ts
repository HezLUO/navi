import { createHash } from "node:crypto";
import type { WorkingThread } from "../core/working-thread-contract";

export function buildWorkingThreadBaseVersion(thread: WorkingThread): string {
  return createHash("sha256")
    .update(JSON.stringify({
      boundary: thread.boundary,
      currentJudgment: thread.currentJudgment,
      driftTriggers: thread.driftTriggers,
      id: thread.id,
      lastUpdated: thread.lastUpdated,
      lastWrapUp: thread.lastWrapUp,
      nextLikelyMove: thread.nextLikelyMove,
      openQuestions: thread.openQuestions,
      status: thread.status,
      title: thread.title,
      whyThisMatters: thread.whyThisMatters,
    }))
    .digest("hex");
}
