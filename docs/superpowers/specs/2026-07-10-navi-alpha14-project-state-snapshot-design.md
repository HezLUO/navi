# Navi Alpha 14 Confirmed Project State Design

## Status

This design was revised and approved in conversation on 2026-07-10.

The original alpha.14 proposal created an uncalibrated `.navi/state.md` during
`navi init --write`. That approach is superseded. Alpha.14 now creates Project
State only after Navi has enough reliable navigation evidence, shows the user a
compact preview, and receives approval.

This design does not approve code implementation, worktree execution, release
preparation, tags, publication, runtime UI, background automation, Memory v2,
agent adapters, delegation, or write delegation.

## Product Context

Navi should stand independently as a product. Along may consume Navi later, but
Navi must not depend on Along for its identity, project state, installation
model, or core behavior.

The current product surface is still:

```text
skill/plugin behavior
+ project-local guidance
+ Project Maps
+ navi init
```

Project Maps improve structural orientation, but a fresh session may still need
to reconstruct the current goal, stage, focus, parallel work, and next decision
from scattered documents and recent activity. Alpha.14 introduces an optional,
compact navigation snapshot for projects where saving that state would
materially reduce future reconstruction.

## Problem Definition

Project evidence is commonly distributed across README files, specs, plans,
commits, task records, handoffs, and user instructions. Reading all of it can be
expensive, and the latest activity can be mistaken for the project's actual
direction.

Three artifacts answer different questions:

| Artifact | Primary question | Expected stability | Detail level |
| --- | --- | --- | --- |
| Project Map | What route or rhythm does this project follow? | Relatively stable | Structural |
| Project State | Where are we now, and what decision matters next? | Changes at meaningful boundaries | Compact |
| Handoff | What context does another session or owner need to continue safely? | Written for a transfer event | Detailed |

Project State must not become another task list, transcript, or runtime memory
store.

## Product Goal

Alpha.14 should let Navi save one compact, human-readable project-local
navigation snapshot only when:

1. the state is sufficiently known;
2. the user can review the proposed content;
3. saving it will improve a future session; and
4. the user approves the durable write.

The governing model is:

```text
Project Map   = route and structure
Project State = confirmed current navigation snapshot
Handoff       = session-transfer package
```

## State Location And Ownership

The first version uses:

```text
.navi/state.md
```

The file is Markdown, not JSON. It remains readable and editable without a
runtime, and it fits Navi's current docs-backed product surface.

Project State is optional. A project without `.navi/state.md` remains fully
usable with Navi. `navi init --write` must not create the file, and alpha.14 does
not add a `navi state` command.

The file must not contain secrets, hidden model memory, private conversation
history, hidden reasoning, or source-thread data that does not already belong in
the target project.

## Delayed Creation

### Eligibility Gate

Navi may offer to create `.navi/state.md` only when all of the following are
true:

- the project is likely to continue across sessions rather than end as a narrow
  one-shot task;
- the project goal is clear;
- the current product or delivery stage is reliable;
- the current main-session focus is clear;
- one real next decision can be named;
- those navigation facts were provided or confirmed by the user;
- `.navi/state.md` does not already exist; and
- saving the snapshot would materially reduce future reconstruction.

Navi must not offer creation when:

- the map or judgment is provisional;
- the task is narrow and likely to end in the current session;
- the project is closing rather than continuing;
- any required core field remains unclear;
- a state file already exists;
- the user already rejected creation in the current session; or
- the offer would interrupt an already-approved bounded execution loop.

There is no timer, prompt count, token threshold, or fixed number of sessions.
Eligibility is based on navigation quality and future utility.

### Preview And Approval

When eligible, Navi should use one short sentence to offer saving the confirmed
navigation state. Before writing, it must show this compact preview:

```text
Goal: ...
Stage: ...
Focus: ...
Next decision: ...
Stop boundary: ...
```

The user approves or rejects the proposed durable write. Navi must not create an
empty template first and ask the user to fill it later.

## State Contract

An initial file uses this structure:

```md
# Navi Project State

State status: user-confirmed

## Project Goal
<confirmed project outcome>

## Current Stage
<confirmed product or delivery stage>

## Current Focus
<single main-session focus>

## Parallel Work
None.

## Next Decision
<one decision the user can actually judge>

## Stop / Continue Policy
<current bounded continuation rule and stop boundary>

## Evidence
- <project-local source or current user confirmation>
- User confirmed on YYYY-MM-DD.

## Last Updated
YYYY-MM-DD - Created after user confirmation.
```

The required core fields are `Project Goal`, `Current Stage`, `Current Focus`,
and `Next Decision`. They must not contain `Unclear`, placeholder instructions,
or invented certainty when the file is created.

`Parallel Work` may contain `None.`. When present, a parallel item records only
work that can affect a later decision, including its status and return condition.
It is not a general task list.

`Stop / Continue Policy` must match the active Work Mode and the user's approved
execution boundary. `Evidence` must cite at least one project-local source or
current user confirmation.

Project State must not include transcripts, source-thread metadata, hidden
reasoning, test logs, percentage-complete guesses, long risk registers, or
general task backlogs.

## Reading And Authority

When `.navi/state.md` exists, Navi should read it early for orientation, then
challenge it against the current prompt and relevant newer project evidence.

Project State is a navigation cache, not unquestionable truth:

```text
current user instruction
> newer relevant approved project evidence
> stored Project State
```

Ordinary low-level edits or test results do not automatically invalidate a
still-correct state. A state conflict matters only when it could change current
navigation, a stop boundary, or the next decision.

## Update Lifecycle

Navi considers an update only when a navigation fact changes materially:

- Project Goal;
- Current Stage;
- Current Focus;
- relevant Parallel Work, including its return condition;
- Next Decision; or
- Stop / Continue Policy.

Routine file edits, targeted test results, commits, pushes, temporary debugging,
and a user saying `continue` inside an approved loop do not justify state churn.

Alpha.14 uses a hybrid maintenance rule:

- when a state change is a direct consequence of an already-approved bounded
  write lane, Navi may include the smallest state patch in that lane without
  creating a second `continue` gate;
- when no current approval covers the durable state change, Navi waits for a
  meaningful stage closure or decision point, previews the change, and asks for
  approval;
- Navi never rewrites state from an uncertain inference; and
- unrelated user-authored content must be preserved.

There is no periodic refresh, per-turn rewrite, modification-time expiry,
background watcher, freshness score, or automatic repair.

## Missing, Invalid, And Opt-Out Behavior

- A missing state file is normal and must not reduce Navi's basic usefulness.
- If the user rejects creation, Navi must not offer again in the same session.
- If the user deletes an existing state file, treat deletion as an opt-out. Do
  not recreate it unless the user explicitly asks or explicitly approves a new
  proposal later.
- If the file is incomplete or malformed, use only clearly readable content,
  lower confidence, and do not repair it silently.
- If state conflicts with the current prompt or newer evidence, the newer source
  wins; surface the conflict only when it affects navigation or a decision.
- If the file cannot be read, mention it only when that failure matters to the
  current request. Navi itself must continue to work.
- Repair or replacement uses the same compact preview and approval boundary as
  initial creation.

Alpha.14 adds no schema migration, automatic backup, recovery database, or
background reconciliation.

## Version Control Policy

Navi does not decide whether `.navi/state.md` belongs in source control.

After creating or updating the file, Navi must not automatically:

- run `git add`;
- create a commit;
- modify `.gitignore`; or
- repeatedly remind the user about tracking status.

Teams may commit shared navigation state. A user may keep personal or sensitive
state local. Navi follows the target project's existing policy.

## Quietness And Output Behavior

Project State is an input to supervision, not a mandatory response template.
Alpha.12 still applies:

```text
No control gain, no Navi surface.
```

Navi should expose state only when doing so improves orientation, reveals a
material conflict, clarifies a stop boundary, identifies a real next decision,
or supports an approved state write.

## Multi-Lane Behavior

Alpha.14 does not turn Navi into a scheduler.

- `Current Focus` names the main-session focus.
- `Parallel Work` records only concurrent work that can affect a later decision.
- `Next Decision` remains the single primary project decision.
- A parallel item's return condition stays with that item.
- Worktree completion creates a review option but does not automatically replace
  the main focus.

## `navi init` Boundary

`navi init` remains project bootstrap, not state calibration.

- default dry-run does not write `.navi/state.md`;
- `navi init --write` does not create `.navi/state.md`;
- `--suggest-map` remains terminal-only and does not create or populate state;
- the generated project trigger may explain how Navi should read an existing
  state and when it may offer delayed creation; and
- initialization remains useful when state is absent.

## Expected Implementation Surface

A later implementation should touch only the smallest relevant surfaces:

- the canonical Navi skill and full reference;
- the generated and documented target-project trigger contract;
- project-initialization documentation;
- exact packaged skill copies when canonical files change;
- targeted skill and CLI contract tests.

The CLI implementation may change only to synchronize generated trigger wording
and to prove that initialization does not create state. Alpha.14 must not add a
state action, state writer, state command, or state-specific filesystem planner.

Because the Global Bootstrap implementation changes overlapping trigger, skill,
and test surfaces, alpha.14 implementation must start from main only after that
work is reviewed and merged.

## Acceptance Criteria

Alpha.14 is acceptable when:

1. projects without `.navi/state.md` continue to use Navi normally;
2. `navi init --write` does not create `.navi/state.md`;
3. insufficient or provisional evidence does not trigger a creation offer;
4. eligible creation uses one compact preview and waits for approval;
5. a newly created state has no unclear required core field;
6. existing state is read early but cannot override current user instruction or
   newer relevant approved evidence;
7. routine execution progress does not trigger update requests;
8. material navigation changes follow the hybrid update rule;
9. rejection or deletion does not cause automatic recreation;
10. Navi does not stage, commit, ignore, or automatically synchronize state;
11. state remains distinct from Project Map, handoff, task log, and runtime
    memory; and
12. targeted tests and package verification cover the changed contracts without
    requiring release-level validation.

## Risks And Mitigations

### State Becomes False Authority

Risk: a compact file looks more authoritative than its evidence.

Mitigation: require confirmed creation, preserve source priority, and surface
only material conflicts.

### Creation Adds More Friction

Risk: Navi interrupts useful work to offer another file.

Mitigation: use the eligibility gate, suppress repeated offers, and wait for a
natural decision boundary.

### State Becomes Another Report

Risk: the snapshot accumulates history and task details.

Mitigation: include only information that directly changes current navigation.

### Prompt-Backed Behavior Varies

Risk: model behavior depends on context quality and target-project evidence.

Mitigation: keep the contract explicit, test canonical and packaged copies, and
calibrate later in real projects rather than adding runtime machinery now.

### Sensitive Information Enters Git

Risk: current project state may contain information unsuitable for sharing.

Mitigation: prohibit secrets and automatic Git actions; leave tracking policy to
the project and user.

## Non-Goals

Alpha.14 is not:

- automatic state creation during `navi init`;
- an empty or uncalibrated starter state;
- a `navi state` CLI command;
- a runtime state database or JSON schema;
- automatic project-state inference;
- periodic refresh, background watching, or freshness scoring;
- a project-management system, task queue, or worktree scheduler;
- automatic Git staging, commits, or `.gitignore` edits;
- Memory v2, an agent adapter, delegation, or write delegation;
- a local or desktop Navi UI;
- an Along Shared Desk rebrand; or
- a release decision.

`src/web` remains historical Along Shared Desk / future capability evidence and
is outside this design.

## Deferred Directions

The following remain future product decisions until delayed, confirmed Markdown
state proves useful in real projects:

- a dedicated `navi state` command;
- structured metadata alongside Markdown;
- formal state patch tooling;
- runtime watching or reconciliation;
- Along display or enrichment;
- cross-project aggregation; and
- agent adapter integration.
