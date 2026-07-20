# Navi Native Plugin Update Calibration Design

## Status

Approved product and calibration design. This document defines how Navi will
decide whether Codex's native Git marketplace update path is sufficient for
ordinary automatic plugin updates and for reloading an updated Navi skill in
an existing long-running task.

This design does not authorize implementation, calibration execution, an
alternate `CODEX_HOME`, credential copying, a local HTTP service, a new
worktree, dependency installation, repository changes outside this design
record, creation or movement of `stable` or `preview`, integration, pushing,
tagging, a GitHub Release, publication, or Public Plugin Directory work.

The design revises only the update portions of
`docs/superpowers/specs/2026-07-17-navi-distribution-ready-design.md` that say
Git-backed plugin updates are always explicit and that automatic updates are
out of scope. The remaining Distribution Ready channel, artifact, onboarding,
release-identity, permission, and project-write boundaries stay active.

## Summary

Navi should use Codex's native configured-Git-marketplace auto-upgrade path
before considering a custom Update Host. The supported V1 behavior is:

1. Codex checks configured Git marketplaces when the App Server starts.
2. A future ordinary-user `stable` ref moves only to a release that satisfies
   Navi's stable-update safety contract.
3. Codex stages, validates, and atomically activates the new marketplace, then
   refreshes installed plugin state.
4. A task already present before the update loads the new plugin Skill snapshot
   on its next turn after the host restart and completed update.
5. Plugin update does not run `navi init` and does not rewrite project state.
6. Navi does not check for updates before each prompt and does not add a timer,
   daemon, background service, or separate updater.

One isolated two-scenario calibration must prove both the successful A-to-B
path and the failed-update preservation path before Navi describes this as a
reliable user-facing capability.

## Product Problem

The Distribution Ready design deliberately avoided an updater until the Codex
plugin lifecycle was better understood. That conservative boundary left three
important questions unresolved:

- Can a Git-backed Navi installation update without a manual marketplace
  upgrade command?
- Can the user's existing main task load the updated Skill, or must the user
  abandon the task and create a successor?
- Does a failed update preserve the previous working installation?

A custom Update Host could answer these questions by taking ownership of
network checks, scheduling, version state, installation, activation, rollback,
and task migration. That would duplicate responsibilities now present in
Codex, add a security-sensitive runtime surface, and make Navi responsible for
host lifecycle behavior.

The smaller product decision is to calibrate the native path first. A custom
Update Host becomes a later design candidate only if native behavior fails a
material acceptance boundary.

## Platform Findings

The design is based on read-only inspection of Codex CLI `0.144.5` and current
OpenAI Codex source behavior available on 2026-07-19.

### Startup Upgrade

Codex contains a configured-marketplace startup task that queries configured
Git marketplaces, compares the remote revision with the recorded revision,
stages changed content, validates the marketplace root, activates it, refreshes
configured plugin caches, and clears affected capability caches.

The trigger is App Server startup. It is not a per-prompt update check and is
not a Navi-owned daily scheduler.

Relevant source owners:

- `codex-rs/core-plugins/src/manager.rs`
- `codex-rs/core-plugins/src/marketplace_upgrade.rs`
- `codex-rs/core-plugins/src/marketplace_upgrade/activation.rs`
- `codex-rs/app-server/src/message_processor.rs`

### Atomic Marketplace Activation

Codex clones an updated marketplace into a staging directory. It validates the
staged root before activation. When replacing an existing marketplace, it
moves the old root to a backup, activates the staged root, and restores the old
root if activation or config recording fails. A rollback failure is surfaced
as an error and leaves a recoverable backup path rather than silently declaring
success.

This implementation basis supports a preservation expectation, but the
calibration must still exercise one failed update. Static source inspection is
not acceptance evidence for the installed host.

### Existing-Task Skill Reload

Codex constructs a plugin and Skill snapshot when creating each new turn
context. Effective plugin changes clear plugin and Skill caches. Therefore a
task does not inherently own one immutable Navi version for its entire thread
lifetime. After host restart and completed plugin activation, the next turn in
the same thread should receive the new Skill snapshot.

The calibration must prove this with the same thread ID. A new task that loads
the new version is insufficient evidence.

Relevant source owners:

- `codex-rs/core/src/session/turn_context.rs`
- `codex-rs/app-server/src/effective_plugin_change.rs`
- `codex-rs/app-server/src/request_processors/plugins.rs`

### Supported Git Source Shapes

The marketplace parser accepts local directory paths, GitHub shorthand,
HTTP/HTTPS Git URLs, and SSH Git URLs. It explicitly rejects `file://` sources.
The isolated calibration must therefore expose its temporary Git repository
through a loopback HTTP URL rather than relying on an unsupported file URL.

Relevant source owner:

- `codex-rs/core/src/plugins/marketplace_add/source.rs`

## Product Decisions

1. Navi does not build a custom Update Host for V1.
2. Git-backed automatic update is host-owned Codex behavior, not a Navi
   background runtime capability.
3. Native update is triggered by App Server startup.
4. Navi does not perform a network check before every prompt.
5. Navi does not claim a daily check interval while relying only on native
   startup behavior.
6. A long-running Codex process may remain on its installed Navi version until
   the host restarts.
7. The current turn never changes its Navi instructions mid-turn.
8. After completed activation, an existing task should load the new Skill on
   its next turn; task migration is not the normal update mechanism.
9. Plugin update never implies project initialization or project migration.
10. Ordinary users do not need a persistent version indicator. Version and
    revision remain available for diagnostics and release evidence.
11. Successful native updates remain quiet.
12. Navi does not promise a user-facing update-failure notification that the
    host does not expose. A failure must preserve the old working version and
    may be retried by the host at a later startup.
13. Formal channel refs are Release decisions and are not created by this
    design.
14. One local mechanism calibration precedes any real moving-ref GitHub smoke
    test.

## Distribution Channel Semantics

Automatic update differs by acquisition channel. Documentation must not imply
that every channel has the same update behavior.

| Channel | Acquisition | V1 update behavior |
| --- | --- | --- |
| Future Git-backed `stable` | Codex configured Git marketplace | Native App Server startup update |
| Future Git-backed `preview` | Explicit opt-in configured Git marketplace | Native App Server startup update |
| Fixed commit SHA | Reproducible Git installation | Pinned; no movement until reconfigured |
| GitHub Release local bundle | Download and add local marketplace | Explicit download and reinstall |
| Source checkout | Developer-owned repository | Developer-owned Git workflow |
| Public Plugin Directory | Host directory installation | Host-owned behavior, separately calibrated |

The future ordinary-user command is expected to name a moving release channel,
for example:

```bash
codex plugin marketplace add HezLUO/navi --ref stable
codex plugin add navi@navi-source
```

This is a future release shape, not a currently valid installation promise.
The repository has no approved `stable` ref at the time of this design.

The moving channel ref points only to a commit that corresponds to a complete,
immutable release identity. The Git tag, GitHub Release, plugin manifest,
marketplace contents, downloadable artifact, and checksums remain versioned
release records even though the channel pointer later moves to another release.

## Stable Update Safety Contract

Moving `stable` is a release activation decision. A release is eligible only
when all of the following are true:

- the plugin is backward compatible with supported project-local Navi state;
- it introduces no new host or project permission requirement;
- it does not require the user to rerun `navi init`;
- it does not require an automatic Project Map or managed-trigger write;
- it preserves existing user decisions and approved project boundaries;
- any schema additions remain readable without an immediate write migration;
- bounded verification and release checks pass for the exact release identity;
- update and rollback notes are complete; and
- the release decision explicitly authorizes moving `stable`.

A release that requires new permissions, a destructive migration, a breaking
schema transition, or a new major-version commitment must not move `stable`
silently. It remains on `preview`, a fixed tag, or a fixed SHA until a separate
user-facing transition design is approved.

## Version Activation Semantics

The product does not use a thread-lifetime version lease.

The bounded lifecycle is:

```text
task turn completes under version A
        |
App Server stops
        |
configured marketplace ref advances to B
        |
App Server starts and native update completes
        |
same thread resumes
        |
next turn receives version B Skill snapshot
```

The calibration waits for both marketplace checkout and installed plugin cache
evidence before resuming the thread. The checkout proves the configured Git
source and activated revision. The versioned cache proves the bytes Codex can
actually load for the installed plugin. Their Skill bytes must be identical at
each checkpoint. This avoids misclassifying either a startup race or a
checkout/cache split as a stable installed version.

If the user submits a turn before the background update finishes, that turn
may still use the old snapshot. V1 does not interrupt, replay, or mutate an
already-started turn. The following turn after completed activation is the
first required B turn.

## Calibration Architecture

### Isolation

The calibration uses a temporary `CODEX_HOME` with mode `0700`. It must not add,
remove, update, or reconfigure any marketplace or plugin in the user's real
Codex home.

The isolated App Server needs valid model authentication. The execution
contract may copy the existing Codex authentication file into the isolated
home only under all of these conditions:

- the source is read only for the bounded copy operation;
- the isolated copy has mode `0600`;
- neither source nor copy content is parsed, printed, quoted, hashed into public
  evidence, or included in a task prompt;
- authentication refreshes may affect only the isolated copy;
- the isolated home remains private for the complete calibration; and
- cleanup deletes the isolated copy with the rest of the temporary home.

Copying authentication data and starting real model turns require one explicit
grouped execution authorization. Approval of this design is not that
authorization.

### Loopback Git Marketplace

The calibration creates a temporary Git marketplace repository and serves it
only on `127.0.0.1` through an ephemeral HTTP port. The HTTP URL makes Codex
classify it as a real configured Git marketplace while avoiding GitHub writes.

The temporary Git server must:

- accept no non-loopback connection;
- expose only the temporary marketplace repository;
- publish updated dumb-HTTP metadata after a ref change, or use an equivalent
  bounded Git HTTP implementation;
- remain running while the App Server performs remote revision and clone
  operations; and
- stop during unconditional cleanup.

This proves Codex's Git update and task-reload mechanics. It does not prove
GitHub availability, credentials, or network reliability. Existing immutable
Git-backed Navi installation evidence covers the ordinary GitHub acquisition
shape; a later release smoke test covers a real moving channel.

### Minimal A/B Fixture

The calibration uses one small synthetic marketplace plugin rather than the
full Navi instruction set. Native marketplace update behavior is plugin
generic, and a minimal fixture removes unrelated model-routing and supervision
variables.

The identity remains constant across both versions:

```text
marketplace: navi-update-calibration
plugin: navi-update-calibration
skill: navi-update-calibration
```

Version A contains:

```text
version: 0.0.0-calibration.1
expected marker: NAVI_UPDATE_CALIBRATION_A
```

Version B contains:

```text
version: 0.0.0-calibration.2
expected marker: NAVI_UPDATE_CALIBRATION_B
```

The skill instruction requires the exact marker for one deterministic prompt.
The prompt, model, reasoning level, task metadata, and plugin identity remain
the same between A and B. Only the fixture version and marker change.

Codex activates an external Skill by reading the versioned plugin-cache
`SKILL.md`, not the marketplace-checkout source copy. Each marker turn may
therefore contain zero or one bounded `commandExecution`, but only when its
structured command action is one successful read of the exact cache Skill
already proved by the storage plane. The action must run from the isolated
session root, return bytes identical to both verified Skill copies, and perform
no other command action. Every other command, tool item, server request,
target-project access, or write remains forbidden.

Model output alone is not update proof. The fixture supports a two-plane audit.

## Positive Scenario

The positive scenario uses one isolated home and one persistent thread:

1. Create the private temporary home, Git repository, loopback HTTP service,
   and version A ref.
2. Add the HTTP source as a configured Git marketplace and install the
   calibration plugin.
3. Verify the configured source type is Git, checkout revision is A, plugin
   version is A, checkout and cache Skill bytes are identical, and both carry
   only the A marker.
4. Start one App Server and one new thread.
5. Send the deterministic calibration prompt and require exactly the A marker.
6. Record the thread ID and a bounded A evidence package.
7. Stop the App Server cleanly without deleting the isolated home or thread.
8. Advance the same Git ref to valid version B and refresh HTTP Git metadata.
9. Start a new App Server process against the same isolated home.
10. Wait until native startup update has completed and independently verify the
    marketplace checkout, recorded revision, versioned plugin cache, manifest
    version, and marker bytes are all B, with byte-identical checkout and cache
    Skill files.
11. Resume the original thread ID.
12. Send the same deterministic prompt and require exactly the B marker, with
    no A marker.
13. Verify that no successor task was created and no target-project path was
    written.
14. Run unconditional cleanup and real-home non-change checks.

## Failed-Update Preservation Scenario

The failure scenario uses a fresh isolated home so that expected failure state
cannot contaminate the positive evidence:

1. Install and activate valid A.
2. Verify one task turn returns the A marker.
3. Advance the same ref to a structurally invalid marketplace B that fails
   native marketplace validation before activation.
4. Restart the App Server once and allow the native update attempt to finish.
5. Verify the update is reported as failed.
6. Verify the active marketplace root, installed plugin cache, manifest, marker
   bytes, and resumed task all remain A.
7. Do not repair the fixture, retry the update, or add an alternate source in
   the same run.
8. Run unconditional cleanup and real-home non-change checks.

An unreachable-source case is not required in this first calibration because
it fails before staging and provides weaker rollback evidence than a fetched
but invalid marketplace revision.

## Evidence Model

### Storage Plane

For each relevant checkpoint, record bounded evidence for:

- configured marketplace source type and loopback source URL;
- configured ref and recorded revision;
- actual checkout HEAD;
- marketplace install metadata revision;
- plugin ID and enabled state;
- installed plugin version, checkout source root, and versioned cache root;
- separate checkout and cache Skill paths plus byte equality;
- marker file or Skill content digest for both copies; and
- absence of mixed A/B files.

Raw authentication content, model credentials, unrelated user config, and
machine-wide file listings are forbidden evidence.

### Task Plane

Record:

- one exact thread ID;
- A turn ID and exact A marker;
- App Server process boundary;
- B turn ID and exact B marker;
- proof that both turns belong to the same thread;
- proof that no successor thread was created by the harness; and
- proof that each turn used no tool activity except zero or one bounded read of
  the exact storage-verified plugin-cache calibration Skill; and
- proof that no target-project access or write occurred.

### Protected State

Before and after each scenario, verify:

- the Navi repository HEAD and tracked status are unchanged;
- the user's real Codex marketplace and installed-plugin structure is
  unchanged;
- protected real Codex config files are byte-identical where a bounded hash is
  safe and useful;
- no real project path was used as the calibration working directory;
- no listener or App Server process remains; and
- the temporary home and authentication copy are removed after evidence has
  been reduced to the approved non-secret report.

## Verdicts

### PASS

PASS requires every positive and failure-preservation assertion:

- A storage and task evidence agree before update;
- the valid ref moves from A to B;
- marketplace checkout and versioned plugin cache agree byte-for-byte on B;
- the same thread returns B on its next post-update turn;
- no task migration, `navi init`, or target write occurs;
- invalid B is rejected;
- valid A remains usable after the failed update;
- protected real state is unchanged; and
- cleanup succeeds.

### HOST-LIMITED

The result is HOST-LIMITED when the valid harness shows any of these outcomes:

- the configured Git marketplace does not advance to B;
- the marketplace advances but installed plugin state remains A;
- storage reaches B but the original thread remains on A after update
  completion;
- loading B requires a successor thread;
- the failed update damages or disables A; or
- native behavior requires a product-visible manual step that the design did
  not authorize.

HOST-LIMITED blocks an automatic-update claim. The Main Thread then decides
whether to keep explicit updates, narrow the promise, or reopen a custom Update
Host design.

### HARNESS-INVALID

The result is HARNESS-INVALID when the experiment cannot establish native
behavior because of calibration defects such as:

- incorrect HTTP Git metadata;
- an App Server using the wrong Codex home;
- failed authentication;
- an unrecorded or replaced thread ID;
- nondeterministic A/B instructions;
- a prompt, model, or fixture change between turns; or
- incomplete protected-state evidence.

HARNESS-INVALID is not a product failure and does not authorize an automatic
retry. The Main Thread reviews a corrected contract before another run.

## Failure Handling And Cleanup

Cleanup runs after success, expected failure, unexpected failure, timeout, or
operator interruption. It must:

1. stop the isolated App Server;
2. stop the loopback HTTP Git service;
3. verify no child process or listener remains;
4. reduce evidence to the bounded non-secret result package;
5. delete the isolated authentication copy and temporary Codex home;
6. delete temporary Git fixture data unless retained evidence is explicitly
   required for a failed cleanup investigation; and
7. re-run protected real-state checks.

If cleanup or protected-state verification fails, the result cannot be PASS.
The operator stops, retains private evidence, and returns a decision-required
event. It does not attempt an unplanned second cleanup strategy.

## User Experience After A Passing Calibration

The normal Git-backed installation experience becomes:

1. The user installs Navi once from the future `stable` marketplace ref.
2. Codex checks that configured marketplace when the App Server starts.
3. A safe stable release is downloaded and activated by Codex.
4. New turns, including turns in an existing main task, load the updated Navi
   Skill after activation.
5. Existing project-local Navi guidance remains in place; `navi init` is not
   repeated.

The user does not need to inspect a version number for ordinary operation. The
version remains visible through diagnostics when troubleshooting, verifying a
release, or reporting a bug.

For a Codex process left running for a long time, Navi does not claim a daily
background refresh. Documentation may tell a user who specifically needs the
latest release to restart Codex. A future host capability could improve this
without changing Navi into an updater.

## Follow-Up Routing

After PASS:

1. retain native Git marketplace update as the product direction;
2. keep Update Host deferred and outside Product Complete;
3. update Distribution Ready installation and update documentation in a
   separately approved implementation;
4. create `stable` and optional `preview` only during explicit Release work;
5. perform one bounded real-GitHub moving-ref smoke test after a real channel
   exists; and
6. keep local-bundle and fixed-SHA update behavior explicit.

After HOST-LIMITED:

1. do not create or advertise an automatic `stable` channel;
2. preserve explicit update instructions;
3. classify the exact failed plane: remote fetch, marketplace activation,
   plugin cache, Skill reload, or rollback; and
4. make a new product decision before designing an Update Host.

## Non-Goals

- Creating or moving a release channel ref.
- Publishing a new Navi version.
- Testing Public Plugin Directory updates.
- Adding a per-prompt, daily, or weekly Navi update check.
- Adding a daemon, scheduler, persistent queue, watcher, or background service.
- Building an update panel, version badge, or notification UI.
- Automatically modifying Project Maps, AGENTS.md, or target projects.
- Running `navi init` after a plugin update.
- Proving GitHub network reliability with the loopback calibration.
- Designing staged rollout, signatures, publisher attestation, or enterprise
  update policy.
- Implementing a custom Update Host.

## Acceptance Boundary

This design is complete when it can support a bounded implementation plan for
the two isolated calibration scenarios without unresolved product choices.

The product capability remains unproven until that plan is separately approved,
the grouped credential and real-model operation is explicitly authorized, the
calibration runs, and the Main Thread accepts a PASS result. Design approval
alone does not change Navi's current update claims.
