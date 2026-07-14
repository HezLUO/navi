# Navi Calibration Log

Status: working evidence log
Last updated: 2026-07-14

This log records real or semi-real Navi calibration observations. It is not a release checklist and does not prove full product correctness. Each entry should capture the target project, prompt shape, observed behavior, user judgment, and product follow-up.

## 2026-07-14 - No-Action Lane Wait Still Triggered A Continue Reflex

Target project: Navi
Mode: calibration / implementation-lane supervision

Prompt shape:

The Lane Handoff implementation worktree delivered a real `decision-required`
event because its clean isolated checkout lacked `node_modules`. The source main
task presented the exact `npm ci` permission gate, received approval, and sent
the decision directly back to the worktree. The main task then said that no
user relay or `continue` input was required. The user nevertheless had to type
`继续` and identified it as meaningless continuation friction.

Observed behavior:

- Task-to-task delivery and the bounded decision reply worked; the user did not
  have to copy the permission decision back to the worktree.
- The worktree resumed, installed lockfile dependencies without tracked-file
  drift, and continued into Task 1.
- The main response still ended like an ordinary conversational stop. Its text
  said that no action was needed, but the interaction did not yet make future
  event-driven resumption feel reliable.
- The main task had also made an overly broad Priority Gate judgment: because
  Lane Handoff implementation planning was not ready for another concurrent
  implementation lane, it concluded that no useful main-session work existed.
  A read-only Historical Along boundary inventory was both high-priority and
  non-conflicting.

Calibration judgment:

This `continue` carried no user decision. The user behavior is understandable
and product-induced rather than an error: prior task flows trained the user to
keep the main conversation moving manually, while pre-integration Lane Handoff
has not yet established trustworthy wake-up behavior.

The correct product response is not polling, keeping an assistant turn open,
or starting low-value work merely to stay busy. Navi should distinguish:

- a legitimate no-action external wait that will resume from a delivered
  transition;
- useful high-priority non-conflicting design or supervision that can continue;
  and
- low-priority work that should remain deferred even though it is technically
  available.

Product follow-up:

- Treat post-integration event-driven wake-up as part of Lane Handoff
  calibration, not merely successful event formatting.
- Do not ask the user to keep a source task alive with `continue` while waiting
  for a lane transition.
- Apply the Priority Gate to plausible non-conflicting work rather than using
  one deferred implementation lane to infer whole-session waiting.
- When no useful lane exists, say that no user action is required and let the
  next delivered event resume the source task; do not replace the wait with
  polling or filler work.

## 2026-07-03 - Alpha.6 Fresh-Session Stage / Vision Distance Check

Target project: `/Users/james/Codex Project/General Codex Project/sub_ag_ski`
Fresh thread: `019f25f9-e357-7582-b17c-e5493944862d`
Mode: calibration, read-only

Prompt shape:

The fresh thread was created in the real target project and asked:

> what's next? how far is this project from the original goal, and should I wait or continue?

The prompt also instructed the thread not to modify files, run tests, or commit, and to answer from a 2-3 minute new-session perspective.

Target-project context:

- The target project is still `agent-delegate`, a real MCP-first delegation-advisor repository.
- `navi init --write` had already appended the project-local Navi trigger to `AGENTS.md`.
- The older custom Chinese Navi section in `AGENTS.md` had been removed before this calibration so the alpha.6 trigger would be the primary entry point.
- The project map remained in Chinese, making this a useful mixed-language case: English orientation question plus Chinese project evidence.
- The target project still had unrelated uncommitted work; the calibration was read-only and did not try to clean or stage it.

Observed behavior:

- The Codex thread handler was available again: `list_projects`, `list_threads`, `create_thread`, and `read_thread` all worked.
- The fresh thread found the project-local Navi/working-thread rules and treated the task as read-only orientation.
- It initially had to correct a skill-path assumption, then continued by using the actual available project records.
- It found the confirmed project map and placed the target project at open-source release preparation.
- It identified the product stage as Distribution & Trust and the work mode as Release.
- It judged the project as close to the original goal, with the remaining gap being release-readiness judgment rather than core feature implementation.
- It did not claim the target project was already complete; it noted the remaining decision between accepting one successful real MCP dogfood plus release checklist evidence or running one more realistic agent workflow dogfood.
- It named the next real user decision: whether the current dogfood evidence is enough for an initial public release bar.

Calibration judgment:

Positive signal. Alpha.6's Product Stage / Work Mode / Vision Distance framing helped a new session answer the user's big-picture question instead of only reporting immediate next commands. The answer gave the user a useful stop/continue judgment and surfaced the real decision.

Remaining risk:

- The final answer was useful, but the thread spent about 67 seconds doing context gathering and emitted several progress updates. This is acceptable for a real fresh-session calibration, but it suggests Navi should continue watching for over-reading or over-narrating on lighter orientation prompts.
- The prompt still included explicit read-only and 2-3 minute framing, so it is not a fully natural prompt sample.
- This validates one real target project after `navi init` setup, not broad cross-domain stability.
- The mixed-language setup behaved acceptably in this case, but language-following should continue to be watched in natural prompts.

Product follow-up:

- Treat this as evidence that alpha.6 should remain focused on supervision clarity, not as a reason to start release-mode validation.
- Keep the next calibration lightweight: a more natural prompt can check whether Navi still gives the same stage/distance/decision clarity without being told it is a calibration.
- Continue separating target-project release decisions from Navi release decisions.

## 2026-07-02 - Continuation Friction / Pause Boundary

Target project: `/Users/james/Codex Project/General Codex Project/sub_ag_ski`
Fresh thread: `019f1ea6-e0b9-76e2-8f4c-070e98494e45`
Mode: calibration, read-only

Prompt shape:

The fresh thread was asked to inspect the target project read-only and answer:

- where the project currently is;
- what should continue next;
- when it should stop for user decision;
- which pauses are necessary;
- which `continue` / `继续` prompts would only create friction;
- what bounded continuation contract would be safe.

Target-project context:

- The target project is `agent-delegate`, a real MCP-first delegation-advisor repository.
- The project already had a project-local `AGENTS.md` and `docs/along/project-maps/navi-current-project.md`.
- The project was not clean: it had uncommitted release-related source, test, dogfood, and changelog changes, plus untracked Navi files.
- The current project map placed the project at open-source release preparation, after product boundary, core implementation, local validation, and real MCP dogfood.

Observed behavior:

- Navi correctly used the project-local map rather than inventing a new project stage.
- It identified the current phase as open-source release preparation, not feature expansion.
- It recommended continuing only within a narrow release-readiness validation boundary.
- It gave a bounded continuation contract: continue through local release-checklist verification and repository release-state review, then stop with a short conclusion covering passed checks, failed checks, release blockers, and whether another real MCP dogfood run is recommended.
- It explicitly named necessary stop points: failed checks that require code changes, `git add` / `commit` / `push` / `tag` / release, scope expansion beyond v1, and the user decision between publishing an early pre-release or collecting more dogfood evidence.
- It identified avoidable pause friction: ordinary read-only status checks and release-readiness check steps should not each require another user `continue` when the boundary and acceptance point are already clear.
- It stated that it did not modify files.

Main-session verification:

- The main session rechecked the target project with `git status --short --branch`.
- No new target-project changes appeared after the fresh-thread calibration.
- The fresh thread was slow enough to produce several progress updates before the final answer, but it eventually produced a useful bounded answer without requiring user intervention.

Calibration judgment:

Positive signal. The project-local Navi trigger and map can support pause-boundary supervision in a real target project. The useful behavior is not simply "continue automatically"; it is "continue inside a bounded, already-approved loop, then stop at a decision the user can actually judge."

Remaining risk:

- This is one target-project sample, not broad proof.
- The prompt explicitly said this was a calibration and read-only observation, so it is not a fully natural prompt sample.
- The target project already had Navi files present; this does not validate a first-time `navi init` install path.
- The fresh thread's long intermediate checking phase suggests Navi may also need guidance on keeping calibration answers concise and avoiding excessive progress narration.

Product follow-up:

- Keep collecting examples of necessary pauses versus avoidable continuation friction.
- Treat repeated `continue` as a product signal when the next action, boundary, and acceptance point were already established.
- Consider alpha.5 only after more examples show that pause-reason visibility and bounded continuation contracts reduce friction without weakening user control.

## 2026-07-02 - Worktree Waiting Scope Misclassification

Target project: Navi
Mode: design / supervision

Prompt shape:

The user asked whether the main session actually needed to stop after an alpha.5 implementation worktree was created. The user challenged the wording "the main session is now stopped at a real waiting point: wait for the worktree session to complete, then review/merge."

Observed behavior:

The earlier wording incorrectly collapsed a lane-level wait into a whole-session wait. It was true that review/merge could not proceed until the implementation worktree returned. It was not true that the main conversation had to stop. The main session could still continue unrelated design, supervision, acceptance criteria, roadmap, or risk framing work as long as it did not modify the same files or silently change the worktree scope.

Calibration judgment:

This is a real alpha.5 pause-semantics issue. Navi should distinguish:

- a specific execution lane is waiting;
- a review/merge path is waiting;
- the whole session is blocked.

Only the last case should make the main session stop. When only one lane is waiting, Navi should state that lane's dependency and continue useful non-conflicting work until a real decision point appears.

Product follow-up:

- Add lane-level versus session-level waiting to alpha.5 pause semantics.
- Avoid phrases that imply the whole session must wait when only review/merge is blocked.
- If a worktree result might change the current design direction, say so explicitly; otherwise continue non-conflicting design/supervision work.

## 2026-07-02 - Completion Report Pause Friction

Target project: Navi
Mode: implementation / supervision

Prompt shape:

After the main session committed the waiting-scope documentation change and notified the alpha.5 implementation worktree, it reported completion and stopped. The user then typed `continue` and explicitly said this was another meaningless continuation prompt.

Observed behavior:

The previous response correctly reported that the documentation commit and worktree notification had succeeded. However, reporting a completed subtask was treated like the end of the active supervision loop. The next useful actions were still bounded and non-conflicting: record this new pause-friction example, or continue observing whether the worktree follow-up returned. The user was not being asked to approve a commit, push, tag, release, mode change, or risk acceptance.

The same pattern repeated immediately after the completion-pause example was committed. The response reported the commit hash and ahead-of-origin branch state, then stopped. The user again had to type `continue` only to label the pause as meaningless and request that it be recorded.

It repeated again after that repeated sample was written but not committed. The response stopped at a possible commit decision. Commit remains a real git boundary in general, but the user judged this stop as meaningless because the active instruction was to keep recording pause-friction samples until the next meaningful decision point. This suggests Navi needs a batching concept for evidence collection: do not force a commit decision after every tiny calibration note when the user has asked to continue collecting.

Calibration judgment:

This is an avoidable pause. A completion report should not automatically stop the main session when the broader user-approved loop is still active and the next step does not need user judgment. The agent should continue to the next real decision point, or state that the only remaining blocked lane is waiting on external/worktree output while the rest of the main session can keep doing non-conflicting work.

Product follow-up:

- Add completion-report pause friction to alpha.5 calibration evidence.
- Treat "I finished the local subtask" as progress, not a stop reason, unless the next action crosses a real approval boundary.
- When the next action is only monitoring or recording within an approved loop, continue without requiring the user to type `continue`.
- When the user explicitly asks to keep collecting examples, batch the observations and defer commit prompts until there is a meaningful batch boundary.

## 2026-07-02 - Missing Next Decision After Valid Stop

Target project: Navi
Mode: implementation / supervision closeout

Prompt shape:

After alpha.5 was merged into `main`, validated, and pushed to GitHub, the response reported the push result and stopped. The user then typed `continue` and explained that the problem was not the push gate itself; the response had not provided the next decision, so the user had to ask for continuation.

Observed behavior:

The push stop was valid as an external write gate, and the push result was correctly reported. The failure was the closeout shape: after the pushed state was confirmed, the response did not surface what the user could decide next. Good pause semantics should not only explain completed work; it should also make the next meaningful decision visible when the session is still active.

Calibration judgment:

This is a pause-quality issue rather than a pure over-stopping issue. A valid stop can still create continuation friction if it leaves the user with no visible choice except `continue`. When stopping after a completed action, Navi should give a concise next-decision menu or name the next default track, especially when the user is supervising a multi-stage product loop.

Product follow-up:

- Add "missing next decision" as a pause-friction subtype.
- When stopping after commit/push/merge, include next meaningful choices such as close the loop, run calibration, enter design, or prepare release, depending on mode.
- Avoid turning this into a fixed heavy template; only surface the smallest useful next decision.
