# Navi Semantic Config Drift Calibration Design

## Status

Approved calibration-method design. This document defines how a future bounded
Navi installation calibration distinguishes harmless Codex-managed config
updates from unexplained or product-relevant global state changes.

This design does not authorize a diagnostic run, global Codex state mutation,
plugin or marketplace switching, target-project access, implementation,
worktree creation, merge, push, release, or publication.

## Problem

The Git-backed marketplace calibration successfully demonstrated:

- installation from an immutable Git candidate;
- natural installed-skill activation;
- package-local read-only `navi init` preview generation;
- a concrete two-file declared write set and plan fingerprint;
- zero target-project writes; and
- restoration of the original local Navi installation.

The final continuation also changed the SHA-256 hash of
`~/.codex/config.toml`. The calibration retained only pre/post hashes, not the
private before/after configuration snapshots. It therefore cannot identify the
changed keys or determine whether the difference was expected Codex-managed
state, an unexplained host side effect, or a security/product-impacting change.

The prior rule treated every byte change as failure. That is safe but too
coarse: it can misclassify normal host persistence as a Navi product defect.

## Product And Calibration Judgment

The current evidence supports these separate conclusions:

```text
Git installation: PASS
Natural activation: PASS
Read-only installed-package preview: PASS
Target safety before approval: PASS
Global config stability: INCONCLUSIVE
Complete Distribution journey: INCOMPLETE
```

The complete Distribution journey remains incomplete because no approved
target write or second fresh task occurred. Config diagnosis cannot upgrade the
old journey to complete PASS.

## Boundary

Semantic config analysis belongs only to calibration tooling and procedure. It
must not become a normal Navi runtime capability, project-entry requirement,
background monitor, or reason for Navi to read a user's global configuration
during ordinary product use.

The calibration compares global configuration only around an explicitly
authorized global plugin or marketplace experiment.

## Snapshot Model

Capture four private points:

```text
A: original local Navi state
B: exact Git marketplace/plugin switch completed
C: bounded Codex session completed
D: original local Navi state restored
```

Each comparison answers a different question:

- `A -> B`: approved installation-transaction effects;
- `B -> C`: session-created drift;
- `A -> D`: restoration completeness.

The session-drift verdict must never compare `A` directly with `C`, because the
approved marketplace/plugin switch may legitimately change config state.

## Evidence Safety

Raw snapshots may contain private paths, user preferences, credentials, MCP
configuration, or other sensitive values. Therefore:

- create one private temporary root with directory mode `0700`;
- store raw snapshots with mode `0600`;
- never commit raw snapshots;
- never include raw config text in task messages, test logs, or repository
  documentation;
- compute and retain hashes for identity checks;
- produce only a redacted structured diff for delivery;
- report changed TOML key paths, value types, sensitivity class, and a minimal
  redacted summary;
- never expose tokens, credentials, unknown free text, or full machine-local
  paths; and
- retain failure evidence for diagnosis until a separate cleanup decision.

If a safe structured comparison cannot be produced, return
`evidence-insufficient`. Do not fall back to printing a raw textual diff.

## Classification

### `no-change`

`B` and `C` are byte-identical or parse to the same semantic configuration.

### `expected-managed-change`

Every changed key is attributable to documented or independently verified
Codex-managed behavior, is reversible, and does not change a security or
product control surface.

This classification requires evidence. A field is not expected merely because
Codex wrote it.

### `unexplained-change`

The changed key paths are known, but the calibration cannot establish why they
changed or whether the behavior is stable.

This prevents global-state acceptance but is not automatically a Navi product
defect.

### `security-or-product-impact`

The change affects or may affect:

- model selection;
- sandbox or approval policy;
- trusted directories;
- hooks or command execution;
- MCP configuration;
- marketplace or plugin identity, source, version, or enabled state;
- credentials or authentication state; or
- another user-controlled global behavior.

This is a material failure. Restore first, then return to user or product-risk
judgment.

### `evidence-insufficient`

Only hashes or incomplete snapshots are available, or a safe semantic diff
cannot be generated.

The current Git-backed calibration belongs to this class. Its config-stability
result is `INCONCLUSIVE`, not a proven Navi or Codex defect.

## Verdict Rules

- `no-change`: config-stability PASS.
- `expected-managed-change`: config-stability PASS with a harness observation.
- `unexplained-change`: global-state calibration does not pass; Navi product
  attribution remains open.
- `security-or-product-impact`: stop and fail the affected calibration.
- `evidence-insufficient`: return `INCONCLUSIVE` without product attribution.

Target-project writes remain a separate strict boundary. Any unapproved target
write fails the calibration regardless of config classification.

## Minimum Diagnostic Experiment

Do not repeat the complete installation and onboarding journey merely to
diagnose configuration.

Use one separate stateful Calibration Task with one bounded primary experiment:

1. prove the current local Navi state and official-command restoration path;
2. create the private evidence root and capture `A`;
3. perform one explicitly authorized immutable Git-backed Navi switch;
4. capture `B`;
5. run one minimum read-only Codex session that performs no `navi init`, does
   not inspect a real target project, and writes no project file;
6. capture `C`;
7. generate the redacted semantic `B -> C` diff and classify it;
8. restore the original local Navi state immediately;
9. capture `D` and verify `A -> D`; and
10. deliver one structured result directly to the Main Task.

The primary experiment runs once. It does not automatically start a local
plugin control, another session, or a second reproduction.

If the changed keys remain unexplained after the primary experiment, the Main
Task decides whether one separate control is worth its cost. This preserves the
user's preference against validation loops.

## Operational Boundaries

- One stateful operator owns switch, snapshots, session, classification, and
  restoration.
- Global mutation uses only official Codex plugin and marketplace commands.
- Direct edits to `config.toml` or the managed plugin cache are forbidden.
- Restoration outranks additional diagnosis after any mutation.
- The Navi repository, original target projects, `docs/navi/calibration-log.md`,
  and `work/` remain unchanged.
- No repository test, full product journey, release check, tag, or publication
  is part of the diagnostic experiment.
- Grouped switch/restore permission remains an explicit user decision.
- Results use direct task delivery plus the separately designed bounded
  receiver-side reconciliation policy.

## Attribution

The retained session event stream shows installed Navi reads, creation of a
candidate Map outside the target, and execution of the installed package-local
dry-run entry. It does not show an agent command that writes
`~/.codex/config.toml`.

That evidence is sufficient to avoid prematurely fixing Navi. It is not
sufficient to prove Codex host responsibility. Attribution requires the
semantic key-path diff from the minimum diagnostic experiment.

Possible outcomes are:

- correct the calibration contract for expected host persistence;
- report a Codex host or CLI issue with bounded evidence;
- fix a proven Navi side effect; or
- retain an explicit unresolved environment limitation.

## Acceptance

The diagnostic design is satisfied when one bounded experiment returns:

- exact `A`, `B`, `C`, and `D` hashes;
- restoration confirmation;
- a safe redacted list of changed key paths or `no-change`;
- one classification from this design;
- explicit separation of Navi product evidence from harness evidence;
- no raw configuration disclosure;
- no real target-project write; and
- no automatic retry or expanded experiment.

The next product action remains a Main Task decision. Diagnosis alone does not
authorize another Distribution calibration, target write, merge, push, tag,
release, or publication.
