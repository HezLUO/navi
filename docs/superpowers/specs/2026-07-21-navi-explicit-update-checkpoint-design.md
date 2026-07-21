# Navi Explicit Update Checkpoint Design

## Status

Approved product design. The design discussion was completed on 2026-07-21.

This design defines the minimum safe update checkpoint for a Git-backed Navi
installation. It uses the accepted same-thread explicit Skill reload evidence
without claiming that the Stock Codex App already schedules or performs the
complete update sequence.

This design does not authorize Stock App inspection, implementation, model
turns, credential access, marketplace or plugin mutation, a release channel,
release, publication, Public Plugin Directory submission, Update Host, panel,
daemon, scheduler, watcher, database, queue, or Runtime Surface work. Those
remain separate decisions.

## Evidence Basis

The accepted native-update calibration established a bounded host limitation:
marketplace checkout and versioned plugin cache reached B, while a natural
resumed turn in the original A task still returned A.

The later accepted `FULL-SAME-THREAD` calibration at repository snapshot
`49d84a410d6f9308611fe5cf3e96e3a7bec01bfe` established the missing activation
boundary:

- forced discovery found the verified installed B Skill;
- one explicit B Skill input activated B in the exact A task;
- a distinct later natural turn without another Skill input continued to use
  B;
- an invalid B update was rejected;
- valid A storage and same-task behavior survived the failed update;
- all five bounded `gpt-5.6-sol` plus low probes completed;
- protected real Codex, repository, and auth-source state remained unchanged;
  and
- cleanup passed.

`skills_changed_observed` remained `no`. The evidence therefore proves that
an App Server client can preserve one-main-task continuity with one explicit
reload and injection. It does not prove automatic Stock App scheduling,
background checks, release-channel behavior, or a visible notification path.

## Product Decision

Navi uses a Stock-App-first update direction with an explicit request fallback.

The preferred product path is:

1. reuse official Codex marketplace, installed-cache, Skill-discovery, and
   turn-input capabilities;
2. activate a verified update at one stable checkpoint;
3. preserve the existing Main task;
4. inject the updated Skill once rather than on every turn; and
5. keep a user-visible explicit `check Navi updates` request when the Stock App
   does not provide native scheduling or invocation.

Navi does not build an Update Host merely to guarantee daily checks. A Host
Adapter may be reconsidered only after read-only Stock App inspection and
natural product evidence show that explicit fallback is materially inadequate.

## Goals

- Prevent a long-lived Main task from remaining permanently on an old Navi
  Skill after a safe update is prepared.
- Avoid changing Navi instructions during an active turn or delivery chain.
- Keep Main, Execution, and Validation roles on one coherent version lease for
  each bounded delivery group.
- Use at most one remote check per 24-hour interval unless the user explicitly
  requests a check.
- Keep ordinary compatible updates and first ordinary failures quiet.
- Preserve the last verified version when an update fails.
- Require user approval for major versions, new permissions, destructive
  migrations, or project-state migrations.
- Preserve project-local Map and managed-trigger state without another
  `navi init`.

## Non-Goals

- A network request on every prompt.
- Mid-turn Skill switching.
- Per-turn Skill injection after successful activation.
- Cancelling or rebuilding active Execution or Validation tasks merely to
  adopt a new Navi version.
- Automatically judging a model response as a bad release and rolling back.
- A Navi database, daemon, scheduler, watcher, timer service, persistent queue,
  update panel, or background Runtime Surface.
- Creating or moving `stable` or `preview` refs.
- GitHub Release, ZIP, checksum, tag, release notes, publication, or Public
  Plugin Directory work.
- Updating `.navi/project-map.md`, the Navi `AGENTS.md` managed block, or any
  target-project file.

## Terms

### Stable Checkpoint

A stable checkpoint is a turn boundary after the current response and every
already-approved action have completed, before the Main task enters another
work stage. It is not the middle of a model turn, write transaction, tool call,
validation decision, or release operation.

### Delivery Group

A delivery group is one Main-owned bounded workflow plus its active Execution
and Validation tasks. The group uses one Navi version lease until its accepted
delivery, remediation, or terminal decision closes.

### Version Lease

A version lease identifies the effective Navi Skill version for one Main task
or delivery group. It is coordination evidence derived from the installed and
explicitly injected Skill. This design does not introduce a Navi version
database or rewrite historical task evidence.

### Prepared Update

A prepared update has passed source, version, manifest, containment, checkout,
cache, and discovery validation but has not yet replaced the active version
lease.

## Architecture And Ownership

### Stock Codex App

When the capability exists, the Stock App owns update scheduling, official
marketplace calls, cache readiness, forced Skill discovery, and the one Skill
input attached at a stable checkpoint.

### Navi

Navi owns checkpoint eligibility, delivery-group version coherence, risk
classification, approval boundaries, failure quietness, and truthful product
claims. Navi does not claim that a host operation exists until read-only
inspection proves it.

### Git-Backed Marketplace

The configured Git marketplace is the update source. Checkout identity,
revision, plugin identity, manifest version, and installed-cache identity must
remain coherent before activation.

### Project-Local Guidance

`.navi/project-map.md` and the bounded Navi `AGENTS.md` managed block are
project guidance, not plugin installation state. Ordinary plugin updates do
not change them and do not require another initialization.

### Host Adapter

No Host Adapter is part of this design. Native absence or partial support
routes to the explicit request fallback first.

## Checkpoint Eligibility

An automatic or explicit check may proceed only when:

- execution is at a turn boundary;
- the Main task is not in the middle of an approved action;
- no active Execution or Validation task from the current delivery group can
  still return a premise-, scope-, acceptance-, risk-, or integration-changing
  result;
- the current delivery group is closed or no delivery group exists;
- the last remote check is at least 24 hours old, unless the user explicitly
  requested a check; and
- no unresolved update approval is already pending.

Each prompt may perform a cheap host-local interval check. Only an expired
interval or explicit request permits a marketplace network check. If the host
does not expose suitable timestamp state, V1 does not create a Navi persistence
service; it uses the explicit request fallback.

## Update Transaction

### 1. Determine Eligibility

Classify the checkpoint and current delivery-group lease. An ineligible update
is `deferred`; it is not a failure and does not interrupt the user.

### 2. Read The Candidate

Use official marketplace capabilities to inspect the configured Git-backed
source. No newer version produces `no-update` and a quiet completion.

### 3. Classify Risk

Before upgrade or activation, inspect the candidate version, plugin manifest,
permission surface, and migration declarations.

- A compatible update may continue automatically.
- A major version, new permission, destructive migration, or project-state
  migration produces `approval-required`.
- Ambiguous identity, source, containment, version, manifest, or cache evidence
  rejects the candidate and preserves the old version.

### 4. Prepare And Verify

Call the official marketplace upgrade path. Then verify:

- configured marketplace identity and expected source;
- resolved checkout containment and revision;
- plugin identity and manifest version;
- exact versioned installed-cache containment;
- checkout and cache agreement for the installed plugin;
- executable/package integrity required by the current plugin; and
- forced Skill discovery returning one unambiguous Skill name and canonical
  installed-cache `SKILL.md` path.

The previous verified version remains available as the rollback point. Passing
these checks produces `prepared`, not active.

### 5. Activate At A Stable Checkpoint

Attach one explicit Skill input using the discovery-returned name and verified
installed-cache path to the next eligible Main turn. Do not switch an active
turn. Do not attach the new Skill while an old-version delivery group remains
open.

Host acceptance of the explicit input makes the B turn the activation turn.
After that turn completes normally, the Main task's effective lease becomes B.
Later natural Main turns do not repeat the Skill input. Execution and
Validation tasks created after activation inherit the B lease through their
ordinary task contracts.

Historical A delivery evidence remains A evidence. It is not rewritten or
revalidated merely because the Main task adopted B.

### 6. Complete Quietly

Ordinary success is quiet. Diagnostics may expose version and update evidence,
but ordinary responses do not display a persistent version badge or update
report.

## Transaction Results

The update checkpoint produces exactly one result:

- `no-update`: no newer compatible candidate exists;
- `deferred`: the checkpoint or delivery-group boundary is not eligible;
- `approval-required`: user approval is required before upgrade or migration;
- `activated`: one explicit B turn completed and the Main lease now uses B;
- `failed-preserved`: update preparation or activation failed while the prior
  verified version remained active.

These are product semantics, not a requirement to persist a new Navi state
machine. Reuse host marketplace/plugin metadata where available.

## Failure And Rollback

Activation is two-phase:

1. downloaded and verified B remains `prepared`;
2. one host-accepted explicit B turn activates B;
3. normal completion of that turn commits the effective B lease.

If source, upgrade, containment, cache, discovery, path, or input acceptance
fails before lease commitment, A remains active and no rollback is needed.

If B has activated and a later host-level Skill loading failure establishes
that B cannot be loaded, restore the retained A Skill once at the next stable
checkpoint and return to the A lease. Do not roll back automatically because a
model answer appears weak, unexpected, or stylistically different. Semantic
release quality requires user feedback or independent regression evidence.

There is no immediate retry loop:

- the first ordinary failure keeps A and remains quiet;
- the next expired interval may try once again;
- two consecutive failures produce one concise notice;
- an unsafe old version, permission request, migration, or required user action
  produces one immediate decision notice.

## User Experience

The ordinary path is invisible:

```text
eligible checkpoint
-> compatible update prepared
-> one explicit Skill activation
-> same Main task continues on the new version
```

The user does not need to understand version leases or rerun project
initialization. The user may request a check in natural language such as
`check Navi updates`; no fixed English, Chinese, slash command, or terminal
syntax is required by the product contract.

`navi doctor` may report:

- current installed/effective version;
- marketplace source and revision;
- last successful check;
- prepared or approval-required candidate;
- last update failure; and
- retained rollback version.

Diagnostics are not authority to expose raw credentials, private paths, or
unnecessary host configuration.

## Stock App Capability Inspection

Before implementation planning, one separately authorized read-only inspection
must determine whether the current Stock Codex App already performs or exposes
the required sequence.

The inspection checks:

1. startup or interval-based marketplace update checks;
2. official `marketplace/upgrade` invocation and versioned-cache readiness;
3. forced Skill discovery after installed state changes; and
4. one existing-task turn input carrying the discovery-returned Skill name and
   installed-cache path.

The inspection reads only public/local static capability evidence, installed
App Server schemas, and bounded client call paths. It does not read user
conversations, auth content, private project content, or mutate plugin state.

### Native Complete

All four capabilities exist in the Stock App. Navi adopts host behavior and
needs only contract, diagnostics, and documentation implementation.

### Native Partial

The complete on-demand chain exists: official upgrade, cache readiness, forced
discovery, and one existing-task Skill input. Automatic startup or interval
scheduling is absent. V1 exposes the natural-language explicit check fallback
and uses the official App Server sequence only when the user invokes it.

### Native Absent

The Stock App lacks upgrade/cache readiness, forced discovery, or one-time
existing-task Skill input, so it cannot complete the same-task checkpoint even
on demand. V1 retains official manual marketplace update plus the narrowest
truthful restart or reload instructions supported by inspection. Update Host
stays deferred pending separate product evidence and approval.

No inspection result authorizes implementation, marketplace mutation, release,
or publication by itself.

## Verification Strategy

Any later implementation plan must include focused coverage for:

- 24-hour interval suppression with no per-prompt network request;
- explicit-request bypass of the expired-interval requirement;
- stable-checkpoint eligibility;
- active delivery-group deferral;
- compatible update quietness;
- major-version, permission, and migration approval routing;
- checkout/cache/discovery containment and identity;
- prepared-versus-active two-phase behavior;
- one-time same-task Skill activation;
- new-task inheritance after activation;
- invalid-update old-version preservation;
- no immediate retry loop and two-failure notification threshold;
- host-level rollback to the retained previous version;
- no project Map, managed-trigger, target-project, release, or publication
  writes; and
- truthful capability wording for Native Complete, Partial, and Absent results.

Static contract tests do not prove Stock App behavior. A capability inspection
must precede implementation-path selection, and any later real update
calibration remains separately authorized.

## Acceptance Criteria

The design is ready for the next decision when:

- one stable-checkpoint definition covers Main and three-role delivery groups;
- long-lived Main tasks can adopt a prepared version without successor-task
  migration;
- active delivery groups cannot mix update rules mid-delivery;
- ordinary update success is quiet and bounded;
- failure preserves the prior verified version without retry loops;
- user-owned permission, migration, rollback, release, and publication
  decisions remain explicit;
- no new Navi runtime or persistence service is implied; and
- Stock App capability remains an inspected fact rather than an assumed claim.

## Follow-Up Order

1. Commit and review this design.
2. Perform one separately authorized read-only Stock App capability inspection.
3. Choose Native Complete, Native Partial, or Native Absent from evidence.
4. Write a bounded implementation plan only for the supported branch.
5. Use that real implementation journey as a candidate natural Product Complete
   calibration without weakening its independent acceptance gates.
6. Keep release channels, Release mode, and publication separate.
