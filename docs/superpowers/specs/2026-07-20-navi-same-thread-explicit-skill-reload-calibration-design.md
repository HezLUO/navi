# Navi Same-Thread Explicit Skill Reload Calibration Design

## Status

Approved product and calibration design. The design discussion was completed on
2026-07-20.

This design defines one bounded calibration that determines whether a Codex App
Server client can move an existing task from Skill version A to Skill version B
by using the host's explicit marketplace, Skill-discovery, and turn-input APIs.

This design does not authorize calibration execution, model turns, credential
copying, loopback services, alternate `CODEX_HOME` roots, repository changes
outside this design record and its later implementation plan, Navi product
implementation, a custom Update Host, a local panel, a successor task, release,
publication, or a public update-channel claim.

The accepted `HOST-LIMITED` result from the natural-activation calibration at
repository snapshot `b740d458a39ac26f6460ebbcc93b9caf461e6b1c` remains valid.
That result proved that storage reached B while a natural resumed turn in the
original task still returned A. This design asks a different question: whether
the official explicit Skill-input path can load B into that same task.

## Summary

Codex exposes three distinct host operations that must not be collapsed into
one update claim:

1. `marketplace/upgrade` updates one or more configured Git marketplaces.
2. `skills/list` with `forceReload: true` refreshes Skill discovery from disk.
3. A `turn/start` `skill` input item asks the backend to inject the complete
   Skill instructions identified by an absolute `SKILL.md` path.

The calibration keeps one positive App Server process and one positive thread
alive while moving an isolated synthetic Navi fixture from A to B. It then
refreshes Skill discovery, explicitly supplies the verified B Skill path to the
same thread, and sends one later natural turn without another Skill item.

A separate isolated failure case attempts an invalid B update and verifies that
the valid A installation and same-thread behavior remain usable.

The result distinguishes four product boundaries:

- full same-thread update;
- same-thread update that requires per-turn explicit injection;
- successor-task requirement; and
- unsafe failed-update behavior.

## Why A New Calibration Is Required

The prior accepted calibration established all of the following:

- the configured Git marketplace checkout advanced from A to B;
- the versioned installed-plugin cache advanced from A to B;
- checkout and cache B bytes matched;
- the exact original thread ID was resumed; and
- the resumed natural turn returned A without reading B from the installed
  Skill path.

That evidence blocks a native natural-reload claim. It does not prove that the
same task is permanently unable to use B. The turn did not exercise
`skills/list(forceReload: true)` followed by a `turn/start` Skill item pointing
at the verified installed B path.

Deleting A would not answer the missing question. A's instructions may already
exist in persisted task history or loaded turn context, so deleting the file
cannot retract them. It would also destroy rollback evidence and could turn a
reload question into a missing-file failure.

## Platform Basis

The design uses the public Codex App Server contract documented on 2026-07-20:

- `marketplace/upgrade` can upgrade all configured Git marketplaces or one
  named marketplace;
- `skills/list` accepts `forceReload` and refreshes cached discovery results
  from disk;
- `skills/changed` is an invalidation notification whose consumer should rerun
  `skills/list`; and
- a `turn/start` input item with type `skill`, Skill name, and absolute
  `SKILL.md` path is the recommended explicit invocation mechanism because the
  backend injects the full Skill instructions.

Reference:
<https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md#skills>

These APIs prove what a Codex App Server client can request. They do not prove
that the current Stock Codex App automatically performs the same sequence.
Stock App adoption remains a separate observation and product decision.

## Goals

The calibration must determine:

1. whether a valid marketplace update can materialize B in both checkout and
   versioned installed-plugin cache while one App Server process remains alive;
2. whether forced Skill discovery recognizes the installed Navi Skill after B
   materialization;
3. whether an explicit B Skill input changes the next turn of the exact A
   thread to B;
4. whether one later natural turn in that thread retains B without another
   Skill input;
5. whether an invalid B update preserves valid A storage and same-thread A
   behavior; and
6. which minimum product mechanism is justified by the observed boundary.

## Non-Goals

The calibration does not:

- implement automatic updates;
- implement an Update Host, panel, daemon, scheduler, watcher, timer, queue, or
  background service;
- determine whether the Stock Codex App already calls these APIs;
- check a remote marketplace before every prompt;
- create or move `stable`, `preview`, tags, releases, or remote Git refs;
- test GitHub availability, release signing, staged rollout, rollback UI,
  cross-platform behavior, or Public Plugin Directory behavior;
- modify a real Navi installation or the user's real Codex configuration;
- access or initialize a target project;
- run `navi init` or update project-local Navi guidance;
- create a successor task;
- change model or reasoning routing policy; or
- authorize a user-facing automatic-update claim from design approval alone.

## Terminology

### Storage Plane

The configured marketplace checkout and the installed versioned plugin cache.
A storage-plane state is valid only when source identity, revision, plugin
identity, version, resolved containment, Skill bytes, and expected marker all
agree.

### Discovery Plane

The App Server Skill inventory returned after `skills/list` with
`forceReload: true`. Discovery success requires the expected Navi fixture to be
enabled, free of loading errors, and uniquely identified by the canonical
installed-cache `SKILL.md` path already accepted by the storage verifier. The
inventory-returned Skill name may be namespaced and is the authoritative name
for explicit turn input. Discovery does not by itself prove that a task uses the
discovered Skill.

### Turn Plane

The exact thread and turn behavior. Explicit turn-plane activation supplies a
`skill` input item with the inventory-returned Skill name and the verified
installed-cache Skill path. Natural turn-plane behavior supplies only text and
no Skill item.

### Same Task

The same persisted Codex thread ID. Different turn IDs are required. A fork,
replacement, resume into a different ID, or successor task is not same-task
evidence.

### Stable Checkpoint

A boundary between completed turns when no model generation, tool call, file
write, approval, or migration is in flight. No Skill version changes within an
active turn.

## Architecture

One stateful Calibration Operator owns both isolated cases sequentially. Case
state must not be split across agents because App Server process identity,
thread identity, temporary authentication, Git service lifecycle, update
ordering, and unconditional cleanup form one transaction.

Each case uses:

- a fresh private root with mode `0700`;
- a fresh isolated `CODEX_HOME`;
- one temporary authentication copy with mode `0600` created only after grouped
  user authorization;
- one synthetic Git marketplace served on loopback only;
- one App Server process over stdio;
- one synthetic plugin and Skill identity;
- one fresh thread; and
- a read-only empty session root unrelated to any target project.

The positive and failed-update cases use independent roots, repositories,
ports, homes, caches, processes, and thread IDs.

## Synthetic Fixture Contract

The synthetic fixture contains no Navi product logic and cannot inspect files,
call tools, or mutate state. Its only behavior is returning exact challenge
responses.

Identity is fixed:

```text
marketplace: navi-explicit-reload-calibration
plugin: navi-explicit-reload-calibration
skill: navi-explicit-reload-calibration
```

Versions are fixed:

```text
A: 0.0.0-calibration.1
B: 0.0.0-calibration.2
```

Version A carries these private instruction mappings:

```text
EXPLICIT_RELOAD_A_START -> NAVI_EXPLICIT_RELOAD_A_START
EXPLICIT_RELOAD_A_AFTER_INVALID -> NAVI_EXPLICIT_RELOAD_A_PRESERVED
EXPLICIT_RELOAD_POST_B -> NAVI_EXPLICIT_RELOAD_A_STALE
```

Version B carries these private instruction mappings:

```text
EXPLICIT_RELOAD_B_ACTIVATE -> NAVI_EXPLICIT_RELOAD_B_ACTIVE
EXPLICIT_RELOAD_POST_B -> NAVI_EXPLICIT_RELOAD_B_PERSISTED
```

The B persistence response is never emitted in the explicit B activation turn.
This prevents a natural persistence result from passing merely by repeating the
previous assistant response. B's complete injected instructions must remain
available in task context for the later challenge to produce the expected
distinct marker.

The invalid B fixture uses the B revision and version intent but fails
marketplace-root validation before activation. An unreachable network endpoint
is insufficient because it would not exercise invalid-content preservation.

## Positive Case

### A Establishment

1. Start the loopback Git service and isolated App Server.
2. Add the configured Git marketplace at A and install the fixture plugin.
3. Verify checkout A and installed-cache A before any model turn.
4. Call `skills/list` with `forceReload: true` for the empty session root.
   Select exactly one enabled fixture by canonical equality with the verified
   installed-cache A `SKILL.md`; retain the nonempty inventory-returned name.
5. Start one fresh thread.
6. Start the first turn with text challenge `EXPLICIT_RELOAD_A_START` and one
   explicit Skill item carrying that returned name and pointing to the verified
   installed-cache A `SKILL.md`.
7. Require exact response `NAVI_EXPLICIT_RELOAD_A_START`.

### B Materialization And Discovery

1. Advance the temporary Git marketplace ref from valid A to valid B.
2. Call `marketplace/upgrade` for the exact configured marketplace on the same
   App Server connection.
3. Wait within a fixed non-mutating deadline for checkout B and installed-cache
   B to exist.
4. Run one authoritative storage verifier requiring checkout and cache B to be
   byte-identical and contained under their expected isolated roots.
5. Record whether `skills/changed` was emitted. Its absence is diagnostic only
   and does not fail the case.
6. Call `skills/list` with `forceReload: true` and require the fixture Skill to
   be uniquely selected by the authoritative installed-cache B path, enabled,
   and free of discovery errors; retain its inventory-returned name.

### Explicit B Activation

1. Reuse the exact A thread ID.
2. Start a distinct second turn with challenge
   `EXPLICIT_RELOAD_B_ACTIVATE` and one explicit Skill item pointing to the
   authoritative installed-cache B `SKILL.md` and carrying the name returned by
   B discovery.
3. Require exact response `NAVI_EXPLICIT_RELOAD_B_ACTIVE`.
4. Reject any tool item, alternate path read, task fork, or successor task.

### Natural B Persistence

1. Reuse the exact thread ID again.
2. Start a distinct third turn with text challenge `EXPLICIT_RELOAD_POST_B`.
3. Do not include a Skill item, `$skill` marker, plugin mention, injected raw
   history item, or alternate instruction.
4. Record whether the exact response is
   `NAVI_EXPLICIT_RELOAD_B_PERSISTED` or
   `NAVI_EXPLICIT_RELOAD_A_STALE`.

## Failed-Update Preservation Case

1. Establish valid A in a separate isolated home, cache, App Server, and
   thread.
2. Verify checkout A and installed-cache A.
3. Run one explicit A turn with challenge `EXPLICIT_RELOAD_A_START` and require
   `NAVI_EXPLICIT_RELOAD_A_START`.
4. Publish the structurally invalid B revision through the loopback Git source.
5. Call `marketplace/upgrade` and require a bounded update error rather than
   successful activation.
6. Verify checkout/cache remain or return to valid, byte-identical A with no B
   marker in active storage.
7. Call `skills/list` with `forceReload: true`; require exactly one enabled A
   selected by the authoritative installed-cache A path, retain its returned
   name, and require no discovery error.
8. Reuse the exact A thread ID for a natural turn containing only
   `EXPLICIT_RELOAD_A_AFTER_INVALID`.
9. Require exact response `NAVI_EXPLICIT_RELOAD_A_PRESERVED`.

## Turn Budget And Route

The complete calibration uses exactly five completed model turns:

1. positive explicit A;
2. positive explicit B;
3. positive natural post-B;
4. failure explicit A; and
5. failure natural preserved A.

Every turn uses `gpt-5.6-sol` with reasoning effort `low`, approval policy
`never`, and read-only sandboxing. The prompts and fixture bytes are identical
across any preflight review and the authorized execution. There is no retry,
control model, alternate prompt, alternate profile, or additional diagnostic
turn.

Low reasoning is sufficient because each turn performs one deterministic
instruction-selection probe. Higher reasoning would add cost without improving
the storage, discovery, path, thread, or exact-marker evidence.

## Result Classification

### `FULL-SAME-THREAD`

Requires all of the following:

- B checkout/cache storage passes;
- forced discovery after B passes;
- explicit B turn in the exact A thread returns B active;
- later natural turn in the same thread returns B persisted;
- invalid B is rejected;
- valid A storage and same-thread behavior survive the failed update; and
- protected real state and cleanup pass.

Product meaning: one explicit reload and injection at an update checkpoint is
enough for the same main task. No successor task and no per-turn Skill
injection are required.

### `PER-TURN-INJECTION`

Requires explicit B activation to pass while the later natural turn returns A
stale, with failed-update preservation and cleanup still passing.

Product meaning: the same task can use B only when a client supplies the
current Skill on each turn. Stock App automatic-update behavior remains
unproven. A Host Adapter could provide this behavior, but its implementation is
not justified or authorized by this calibration alone.

### `SUCCESSOR-REQUIRED`

Applies when storage and discovery reach B but the explicit B turn in the exact
A thread does not return B.

Product meaning: the tested host path cannot reliably replace the task's
effective Skill instructions. A successor task may be considered only through
a separate product decision and user-visible continuity design.

### `UPDATE-UNSAFE`

Applies when the invalid B attempt damages, disables, or replaces valid A, or
when preserved-A task behavior fails after valid A storage is re-established.

Product meaning: automatic update remains blocked regardless of positive-case
behavior.

### `HARNESS-INVALID`

Applies when the experiment cannot establish behavior because of identity,
containment, path, thread, fixture, API, authorization, turn-count, cleanup, or
protected-state defects.

No product conclusion or automatic retry follows from `HARNESS-INVALID`.

## Stock App And Host Adapter Boundary

A `FULL-SAME-THREAD` result proves that the App Server interface supports the
same-task update sequence. It does not prove that the Stock Codex App currently
calls `marketplace/upgrade`, observes `skills/changed`, forces Skill discovery,
or attaches a B Skill input at the required checkpoint.

After `FULL-SAME-THREAD`, one later read-only Stock App capability inspection
may determine whether the native client already performs the sequence. If it
does, Navi can rely on host behavior. If it does not, the product must choose
between explicit update/restart instructions and a separately justified Host
Adapter.

`PER-TURN-INJECTION` is a stronger Adapter requirement because the client must
attach the current Skill to every applicable turn. A Navi panel or separate
local product remains deferred unless it solves broader supervision problems;
model switching or Skill updating alone does not justify that surface.

## Update Frequency And User Experience Boundary

This calibration does not add a network check to every prompt. A future product
may check at App Server startup or at most once per day, prepare a valid update,
and activate it only at a stable checkpoint.

A lightweight local timestamp may suppress repeated checks. Each prompt may
read that local state, but only an expired interval permits a marketplace
network check. Major versions, new permissions, destructive migration, or
project-state migration require user approval.

An ordinary successful plugin update does not require another `navi init`.
Plugin code and Skill instructions are global installation state;
`.navi/project-map.md` and the managed `AGENTS.md` block remain project-local
guidance. Project migration is a separate versioned operation.

## Identity And Containment Requirements

Before any Git or file-content read used as evidence, the operator must resolve
and prove:

- isolated `CODEX_HOME` containment;
- marketplace root containment under that home;
- plugin checkout containment under the marketplace root;
- checkout Skill containment under the plugin checkout;
- plugin-cache root containment under that home;
- exact marketplace/plugin/version cache-root containment; and
- installed Skill containment under the exact version root.

Marketplace name, plugin name, Skill name, source URL, revision, version, and
resolved path must match the fixed fixture contract. Symlink escapes,
unexpected duplicate rows, absent fields, ambiguous installed roots, or path
identity disagreement are terminal harness failures.

The explicit `skill` input must use the authoritative installed-cache path, not
the marketplace checkout path. The checkout remains source evidence; the
installed cache is the execution artifact.

## Authorization And Safety

Execution requires one grouped user authorization after a mutation-free
preflight. The group covers only:

- two isolated private homes;
- temporary mode-`0600` copies of the existing Codex authentication file;
- two loopback-only Git services;
- isolated marketplace/plugin commands through App Server APIs;
- exactly five model turns; and
- unconditional credential, process, and temporary-case cleanup.

The source authentication file is never printed, parsed, quoted, included in a
prompt, or retained. The user's real `CODEX_HOME`, installed plugins,
marketplaces, configuration, trust state, repository, and external projects are
read-only protected state.

Cleanup runs after success, expected product failure, unexpected failure,
timeout, or interruption. Cleanup outranks diagnosis. A cleanup or protected
state failure prevents every product-positive result.

## Evidence Contract

The retained non-secret evidence package must contain:

- exact repository snapshot and accepted design/plan identifiers;
- exact grouped authorization identifier;
- Codex, Node, and Git versions;
- reduced protected-state before/after equality results;
- marketplace API request/result summaries;
- checkout and installed-cache revision/version/marker results;
- checkout/cache byte-equality results;
- forced-discovery result summaries;
- whether `skills/changed` was observed;
- exact thread and distinct turn identity summaries;
- input-item type summaries showing where explicit Skill items were and were
  not supplied;
- exact final marker for each of the five turns;
- tool-item and unexpected-action summaries;
- process, credential-copy, and temporary-case cleanup results; and
- one structured classification with the earliest failed boundary.

Raw authentication, raw real configuration, model reasoning, unrelated event
content, and temporary fixture bytes are not retained after validation.

## Validation

The result requires one fresh read-only validation task. Validation must inspect
the exact accepted plan, bounded evidence package, thread/turn identities,
API ordering, explicit versus natural input summaries, marker sequence,
storage/discovery gates, failed-update preservation, protected-state equality,
and cleanup.

Validation does not rerun the calibration, copy credentials, start services,
perform model turns, mutate marketplace/plugin state, or reinterpret a missing
case as evidence.

## Product Routing After Validation

After accepted `FULL-SAME-THREAD`:

1. preserve one-main-task continuity as the default;
2. design the minimum update-checkpoint behavior separately;
3. inspect whether Stock Codex App already performs the required explicit
   refresh and injection sequence;
4. keep per-prompt network checks and `navi init` out of the update path; and
5. keep release-channel creation behind Release authorization.

After accepted `PER-TURN-INJECTION`:

1. keep Stock App updates explicit or restart-bound by default;
2. describe per-turn injection as a Host Adapter requirement;
3. do not build a panel solely for this requirement; and
4. reconsider an Adapter only with broader supervision value.

After accepted `SUCCESSOR-REQUIRED`:

1. keep automatic same-task update blocked;
2. preserve the current main task until a user-visible upgrade boundary;
3. design successor continuity separately before recommending it; and
4. do not describe task replacement as a routine silent update.

After accepted `UPDATE-UNSAFE`:

1. retain fixed-version or explicit-update behavior;
2. do not activate an automatic stable channel; and
3. investigate preservation before any updater design.

## Acceptance Boundary

This design is complete when it can support a satisfiable implementation plan
for the two isolated cases, five exact turns, explicit and natural same-thread
probes, one failed-update preservation probe, unconditional cleanup, and one
read-only validation.

The product capability remains unproven until that plan is approved, grouped
execution is separately authorized, the calibration completes, and the Main
Thread accepts an independently validated result.
