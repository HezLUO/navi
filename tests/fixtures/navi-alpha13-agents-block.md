<!-- NAVI:START -->
## Navi Progress Map Rules

When the user asks about project progress, next steps, whether to continue, or says they do not understand the current state, first give a compact Navi map before ordinary task advice. Trigger examples include:

- `接下来我们应该做什么？`
- `现在做到哪了？我看不懂。`
- `继续吧。`
- `这个方案可以吗？我不懂技术。`
- `what's next`
- `where are we`
- `continue`
- `should I stop?`
- `should I wait for the worktree?`
- `is this enough validation?`
- `can I approve this plan?`
- `how far are we from the original goal?`

Match the Navi map response language to the user's current prompt by default. English prompts such as `what's next`, `where are we`, or `continue` should use English map headings, explanations, recommended next step, confirmation gate, and risk wording. Chinese prompts should still allow Chinese headings and explanations. When project records contain stage labels in another language, translate or bilingualize those labels in the current response language instead of letting the record language control the whole answer.

Use Navi as a supervision layer, not just a progress reporter. Alpha.4 supervision covers phase supervision, verification budget, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment.

Users may ask Navi to stop, wait, approve, continue, or ask how far the current work is from the original goal; treat those as supervision requests, not ordinary execution prompts.

When the user's decision depends on it, identify the current Work Mode: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes. Design mode does not need tests. Calibration mode uses small real or semi-real observations. Implementation mode uses targeted tests around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks.

Recommend stopping when continued validation will not change the current decision. Navi should proactively surface a short decision signal when silence would cause loss of control. If Codex starts exceeding the verification budget, proactively surface that signal instead of continuing the loop silently.

Alpha.5 pause semantics: the goal is to continue inside a bounded, already-approved loop and stop at decisions the user can actually judge. When the next action, boundary, and acceptance point are already clear, continue to the already-defined acceptance point instead of stopping at each local sub-step. Do not stop just because a local sub-step finished, such as a doc write, read-only status check, or `git diff --check` passing.

Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance. When stopping, explain the pause reason in one sentence and say what continuing would do.

Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.

Next Decision Visibility: a valid stop can still create continuation friction if it hides the next decision. When Navi or Codex proactively stops and the user would otherwise have no visible next decision except `continue` or `继续`, provide the smallest useful next-decision hint. Use this after commit, push, merge, validation, or worktree handoff completes and the session remains active.

Use no hint when the decision is already visible, one default recommendation when there is one clear direction, or 2-4 short options when there are real branches. This does not force a Progress Map, fixed menu, or automatic next-stage transition. Use a Progress Map or Rhythm Map only when the user asks for broader orientation.

The main session should not default to waiting for every worktree. Wait only when the result will change the current design direction, is required before merge/release/irreversible decisions, or exposes a blocking fact that invalidates the current assumption.

Distinguish lane-level waiting from whole-session waiting. Do not treat a waiting worktree, external review, or background track as a reason to stop the whole main session; continue non-conflicting design, supervision, acceptance-criteria, roadmap, or risk work. Only make the whole session wait when all useful next steps depend on the result, or when continuing would change the worktree scope, touch the same files, cross a mode boundary, or require a user decision.

Before bounded implementation or worktree execution starts, state the task goal, allowed edit scope, allowed validation level, forbidden escalations, stop criteria, and expected return format.

Use vision-distance judgment when the user asks how far the current work is from the original goal or when the current loop is drifting away from that goal. Keep the answer lightweight: name what this work advances, what larger stage it belongs to, what remains missing, and the next phase that best serves the vision.

Alpha.6 stage-and-vision supervision uses Product Stage, Work Mode, and Vision Distance when the user needs big-picture orientation. Product Stage names the product layer being advanced: Product Definition, User Supervision, Project Integration, Behavior Calibration, Distribution & Trust, or Runtime Surface. Work Mode names the current loop's work type: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.

Use Silent Tracking by default. Use a Light Signal when the user is starting to lose orientation, validation is beginning to dominate design, a worktree completion might interrupt non-blocking design, or repeated `continue` prompts indicate friction. Use a Full Map when the user explicitly asks a broad orientation question or the session is visibly losing product direction.

Vision Distance should be stage-relative, not percentage-based: say what the current stage is trying to complete, whether it is close to enough, which product layers remain missing, and what next stage best serves the original vision. Do not print Product Stage, Work Mode, and Vision Distance in every response.

Alpha.7 coordination layer helps the main session supervise multiple active lanes without becoming a runtime scheduler or project-management system. This Coordination Layer stays prompt/docs-backed. Track lanes internally when useful: Main Lane, Implementation Lane, Calibration Lane, Review / Merge Lane, Release Lane, and External Lane. Distinguish lane-level waiting from whole-session blocked.

The main session can continue non-conflicting work while an implementation worktree, calibration thread, external review, or tool result is waiting, unless the pending result would change the current decision. A completed worktree should create a review option, not an automatic whole-session interruption. Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision. Defer review when the current main-lane work is non-conflicting and the result only matters after the current design segment closes.

Stop or switch attention when continuing would edit the same files as another lane, expand or contradict that lane's scope, invalidate acceptance criteria, make a pending result obsolete, require a release decision, or create incompatible product judgments. Review / Merge is a workflow lane, not a Work Mode. Release Lane requires explicit user approval to enter Release mode.

Use Silent Tracking by default. Use a Light Coordination Signal when a small orientation correction is enough. Use a Coordination Map only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue. Do not force lane tables into ordinary answers.

Alpha.8 decision handoff quality: Completion is not always a handoff. When Codex stops while the session remains active, use this rule: Stop with a decision, a recommendation, or closure instead of a bare completion report. Use Default Next Step when one next step is clearly best, Decision Options when real branches exist, Loop Closure when the current line is actually complete, or a blocked reason when no useful non-conflicting work remains. A real next decision must be something the user can judge. Do not include bare `continue` as a fake option. If continuing is an option, name the concrete next action, boundary, and stop point.

If the Project/Rhythm Map seems stale or misleading, suggest a small map update and ask for user approval before writing it.

Alpha.11 lane closure handoff: Lane closure is not automatically session closure. When commit, merge, push, worktree, review, validation, calibration, or design/documentation lanes close and the next user-relevant decision would otherwise be invisible, avoid lane-closure decision invisibility by adding the smallest useful next-decision signal: explicit closure, one default recommendation, short real options, approval gate, or blocked reason. Do not add this for narrow status answers, clear chained commands, already-approved bounded loops, or fake branches. Push completion is not automatic release preparation. Documentation closeout is not design confirmation.

Alpha.12 quietness gate: before choosing any Navi surface, ask whether the response creates control gain. No control gain, no Navi surface. Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect. Use the lightest sufficient surface: Silent Direct Answer, Embedded Hint, One-Sentence Handoff, Short Options, or Full Map. Keep Navi quiet for narrow status questions, clear chained instructions, approved bounded loops, lightweight design confirmations, no-real-branch moments, finished narrow tasks, and information that does not change the decision. Surface Navi when silence would reduce user control, such as visible confusion, approval/write/release/risk/scope boundaries, lane conflicts, over-validation, wrong waiting, hidden next decisions, stale project maps, or implementation success being treated as product proof. Do not create pseudo-supervision, fake branches, or menus just because a rule could technically apply.

No Menu Inside Approved Boundary: if the user already approved a bounded loop with a clear acceptance point, continue to that point unless a new approval gate, risk, scope change, or blocker appears. Close Finished Lines explicitly when a lane is complete. Blocked Means Actually Blocked: do not say the whole session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, external state, or user approval.

Use Silent Completion only when the user asked for a narrow status report or the task is genuinely done with no active follow-up. Use One-Sentence Handoff when one next step is clearly best. Use Short Decision Options when there are real branches. Use Closure Note when the current line is actually complete. Alpha.8 is not a mandatory menu, fixed checklist, automatic mode switch, automatic implementation plan, automatic worktree creation, automatic commit/push/merge/tag/release, or project-management layer.

Use the target project's own records to choose the map shape:

- If the work has a stable one-way delivery path, use a compact horizontal progress strip.
- If the work is a long-running flow with repeated cycles, parallel tracks, waiting states, or external feedback, use a Rhythm Map.

For flowing projects, prefer this English structure for English prompts and replace the labels with project-specific terms:

```text
Project rhythm
[Cycle/direction] + [Object/opportunity screening] + [Material/execution prep] + [Submit/follow up/feedback]
                              ▲
                         Current focus

Current track
[Read status] -> [Judge priority] -> [Execute smallest loop] -> [Record/wait for feedback]
                         ▲
                    Current action
```

For Chinese prompts, this Chinese structure is also valid:

```text
项目节奏
[周期/方向] + [对象/机会筛选] + [材料/执行准备] + [提交/跟进/反馈]
                              ▲
                           当前焦点

当前主线
[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]
                         ▲
                      当前动作
```

After the map, explain the marked position in plain language: what is happening now, why it matters, what should happen next, what the user needs to confirm, and the main risk if blindly continuing would be costly.

Use project-local records such as `PROJECT_STATE.md`, task/status files, trackers, workflow records, and the latest project-local handoff to place the current marker and choose the next small loop. Do not treat project-local handoff files as forbidden thread history.

If the user gives a clear execution command with the next action, boundary, and acceptance point already established, answer directly and keep Navi quiet.

Read-only checks of task files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks. For these tasks, report the requested facts directly; do not output a Progress Map or Rhythm Map unless the user also asks what those facts mean for overall progress, next steps, confusion, or plan reliability.
<!-- NAVI:END -->
