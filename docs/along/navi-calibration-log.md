# Navi Calibration Log

Status: working evidence log
Last updated: 2026-07-02

This log records real or semi-real Navi calibration observations. It is not a release checklist and does not prove full product correctness. Each entry should capture the target project, prompt shape, observed behavior, user judgment, and product follow-up.

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
