# Navi Alpha 5 Pause Semantics Design

## Status

This design was approved in conversation on 2026-07-02. It defines the proposed alpha.5 behavior direction after alpha.4 supervision work and continuation-friction calibration.

This is a design artifact only. It does not approve implementation, worktree execution, tagging, release preparation, GitHub Release creation, npm publication, marketplace publication, runtime UI, background automation, or any automatic execution system.

## Product Direction

Alpha.4 strengthened Navi as a supervision layer: phase judgment, verification budget, proactive decision signals, parallel-work supervision, and lightweight vision-distance judgment.

Alpha.5 should add a smaller but important layer: **pause semantics**.

The user problem is not simply that Codex stops. Some stops are necessary. The problem is that Codex often stops at places where the user has no meaningful decision to make, forcing the user to type `continue` or `继续` just to keep an already-approved loop moving. For non-expert users, that creates friction and transfers supervision work back onto the person Navi is supposed to help.

Alpha.5 should make Navi better at answering:

- Why are we stopping now?
- Is this stop necessary?
- If we continue, what exactly happens next?
- Should Codex continue to an already-defined acceptance point?
- Where is the next real decision point?

The product goal is not "never stop". The goal is:

> Continue inside a bounded, already-approved loop; stop at decisions the user can actually judge.

## Evidence

The immediate calibration evidence came from continuation-friction work on 2026-07-02:

- After a design-recording task had already written docs and passed `git diff --check`, the user still had to type `continue` to push the session to the next real decision point.
- The same friction repeated after the first calibration seed was recorded.
- A fresh read-only calibration thread in `/Users/james/Codex Project/General Codex Project/sub_ag_ski` produced a positive example: it gave a bounded continuation contract for release-readiness review and named the real stop points.

The useful pattern from the positive example was:

```text
Continue to: local release-readiness checks and repository release-state review.
Stop at: a short conclusion covering passed checks, failed checks, blockers, and whether another dogfood run is needed.
Do not: commit, push, tag, release, or expand v1 scope.
```

Alpha.5 should make this kind of pause boundary easier for Navi to produce when useful, without forcing a heavy template into every answer.

## Alpha 5 Promise

Navi alpha.5 should reduce meaningless continuation prompts and make necessary pauses legible.

More specifically:

- If the next action, boundary, and acceptance point are already clear, Navi should help Codex continue to that acceptance point instead of stopping at every local completion.
- If Codex must stop, Navi should explain the pause reason briefly.
- If continuing would cross a mode boundary, permission boundary, risk boundary, project boundary, or release boundary, Navi should stop for user approval.
- If the user says `continue` / `继续` and the boundary is already clear, Navi should avoid re-rendering a full map and should continue directly.
- If the boundary is unclear, stale, or unsafe, Navi should give a short map or ask for confirmation before continuing.

## Non-Goals

Alpha.5 does not include:

- Background automation.
- Always-on runtime behavior.
- A scheduler, watcher, or local daemon.
- Worktree orchestration.
- Automatic creation of Codex threads.
- Automatic test selection beyond prompt guidance.
- Bypassing Codex tool approval, sandbox approval, or user confirmation.
- Runtime UI or `src/web` rebranding.
- MCP server changes.
- Memory v2.
- Agent adapters.
- Delegation or write delegation.
- npm publication.
- Marketplace distribution.
- Release automation.
- A rule that all `continue` prompts are avoidable.

Some pauses are required. Alpha.5 should distinguish meaningful stops from friction, not remove user control.

## Behavior Principles

### 1. Continue Inside A Known Boundary

When the current task already has a clear goal, scope, acceptance point, and forbidden actions, Navi should prefer continuing through ordinary intermediate steps until that acceptance point is reached.

Example:

```text
I will write the calibration note, run a doc-only diff check, then stop at the commit decision. I will not push or release.
```

After that contract is established, successful file write or diff check is not a user decision point. The user should not need to type `continue` merely to reach the commit decision.

### 2. Stop At Real Decision Points

Navi should stop when the next action requires user judgment or permission:

- writing to files when the current mode was read-only;
- touching another project;
- staging, committing, pushing, tagging, or releasing;
- changing from design to implementation;
- changing from implementation to release;
- expanding scope beyond the approved task;
- spending a higher validation budget than the current mode allows;
- accepting a known risk;
- choosing between materially different product directions;
- resolving a failed check that requires code or behavior changes.

### 3. Explain Necessary Pauses Briefly

When Navi stops, it should make the pause reason visible in one sentence when possible.

Good:

```text
I am stopping here because the next step is a git commit; if you approve, I will commit only the calibration log and will not push or release.
```

Too heavy for ordinary cases:

```text
Current mode / stage / evidence / options / risks / next step / approval gate ...
```

Alpha.5 should not force a full Progress Map every time a pause reason is enough.

### 4. Do Not Stop On Local Completion

Navi should not treat local sub-step completion as a stop point unless the local result changes the decision.

Examples of avoidable stop points:

- "The doc was written."
- "`git diff --check` passed."
- "The readonly status check completed."
- "The first file read finished."
- "A non-blocking worktree produced another progress update."
- "A worktree is still running, so the main session must wait."

These can be reported as progress if useful, but they should not require a user `continue` when the larger boundary is already approved.

## Behavior Rules

### Continue-Through Rule

If the user's last instruction or the current mode established the next action, purpose, boundary, and acceptance point, and no permission/risk/mode boundary is crossed, then `continue` / `继续` should continue directly to the acceptance point.

Navi should not print a full map first in this case.

### Decision-Point Stop Rule

Navi should stop only when the next step asks the user to decide something meaningful, approve an action, accept risk, change mode, or change scope.

### Pause Reason Rule

When stopping proactively, Navi should say why it is stopping and what would happen if the user approves continuing.

The default shape is one sentence, not a fixed block.

### No Local Completion Stop Rule

Navi should not stop simply because a sub-step finished. It should continue until the already-declared acceptance point unless a new fact creates a real decision.

### Waiting Scope Rule

Navi should distinguish lane-level waiting from whole-session waiting.

If an implementation worktree, external review, or background track is waiting, only the dependent lane is blocked. The main session should continue non-conflicting design, supervision, acceptance-criteria, or roadmap work unless the pending result would change the current decision.

Navi should stop the whole session only when all useful next actions depend on the pending result, or when continuing would change the worktree scope, touch the same files, cross a mode boundary, or require a user decision.

## Output Strategy

Navi should keep an internal supervision checklist, but user-facing output should remain situation-dependent.

Use the smallest useful intervention:

- **No map** when the user says `continue` and the continuation boundary is already clear.
- **One-sentence pause reason** when the only issue is why the agent stopped.
- **Light continuation contract** when the task will take multiple steps but the boundary is clear.
- **Compact Progress Map** when the user asks where the project is, what comes next, whether to continue, or says they do not understand.
- **Challenge Moment** when continuing would drift, over-validate, self-certify, or cross an unsafe boundary.

Alpha.5 should reduce noise. If the change makes Navi produce a strong structure on every response, it fails the design.

## Implementation Surface

The likely implementation should be limited to docs-backed prompt behavior:

- `.agents/skills/along-working-thread/SKILL.md`
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- `docs/along/project-maps/navi-project-trigger-template.md`
- `src/cli/navi-init.ts`
- targeted tests that inspect skill/reference/init behavior

The implementation should not modify runtime UI, `src/web`, MCP server behavior, distribution, release automation, or external target projects unless a later implementation plan explicitly approves that scope.

## Testing And Calibration

Recommended implementation validation:

- Targeted tests for the canonical skill and reference text.
- Targeted tests for the plugin package copy staying in sync.
- Targeted `navi init` tests proving generated trigger text includes alpha.5 pause semantics.
- `npm run verify:plugin-package` if package-copy consistency is touched.
- `git diff --check`.

Not default for alpha.5 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Those belong to release mode, not ordinary implementation mode.

Recommended calibration after implementation:

- One read-only fresh-session prompt in `sub_ag_ski` or another real target project.
- The prompt should ask for current state, whether to continue, and where to stop.
- The expected behavior is a bounded continuation contract or a clear pause reason, not a full proof of product correctness.

## Success Criteria

Alpha.5 is successful if:

- Navi guidance clearly distinguishes necessary pauses from meaningless continuation friction.
- `continue` / `继续` can proceed directly when a clear continuation boundary already exists.
- Necessary stops include a short reason and the next approved action.
- User-facing output remains lightweight and context-dependent.
- Implementation remains prompt/rule-level and does not become a runtime automation project.
- Tests cover the changed guidance without turning the work into release validation.

## Risks

### Over-Continuation

If the rule is too aggressive, Codex may continue past a decision the user expected to approve. Mitigation: keep explicit stop boundaries for write, commit, push, release, phase change, scope expansion, validation-budget escalation, and cross-project modification.

### More Noise Instead Of Less

If pause reasons and contracts become fixed boilerplate, Navi will feel heavier. Mitigation: define output as smallest-useful-intervention behavior.

### Prompt-Only Reliability

This is a docs-backed behavior change, not a runtime guarantee. Mitigation: keep expectations honest and validate with real fresh-session calibration.

### Mode Confusion

Alpha.5 may overlap with alpha.4 phase supervision. Mitigation: alpha.4 decides the current mode and budget; alpha.5 decides how to continue or stop within that mode.

## Open Product Judgment

Alpha.5 should be treated as a narrow supervision improvement, not a new product surface. If future calibration shows the same issue persists after prompt-level changes, the next design question should be whether Navi needs a stronger execution-contract mechanism. That should be a separate design, not scope creep inside alpha.5.
