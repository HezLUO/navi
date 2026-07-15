# Navi Source-Alpha CLI Invocation Design

Date: 2026-07-15

Status: Approved in design discussion on 2026-07-15

## Summary

Navi's source-alpha setup can install a valid project-local npm link while the
active Codex process still cannot resolve the bare `navi` command from its
inherited `PATH`. Current doctor behavior checks that the CLI source root
exists, but it does not check whether the next command it prints can actually
run. Setup, doctor, and init can therefore recommend a bare command that is
unusable in the current environment.

The approved design adds one process-local **Invocation Context**. It verifies
the current Navi entrypoint, determines whether the first `navi` found on
`PATH` belongs to the same Navi package, selects one proven command prefix, and
renders every self-referential follow-up command through that prefix. A bare
`navi` command remains preferred. A verified absolute entrypoint or verified
source invocation is used when the bare command is unavailable or points to a
different package.

This design does not make Navi a PATH manager or public installer. It does not
edit shell configuration, persist invocation state, install packages, or
change plugin, transaction, fingerprint, or approval behavior.

## Observed Problem

The post-stabilization source-alpha calibration produced this state:

1. `npm link` completed successfully.
2. The linked executable existed at an npm prefix bin path.
3. The active Codex task did not inherit that bin directory in `PATH`.
4. `command -v navi` therefore failed.
5. `navi doctor`, when reached through an absolute entrypoint, reported the
   CLI root as available.
6. Doctor and setup still printed follow-up commands such as
   `navi setup --write`.

The filesystem installation was real, but the rendered next action was not
executable in the environment where Navi had diagnosed it. The user had to
translate internal installation evidence into an absolute command manually.

This is a product defect rather than merely a shell preference issue. Navi's
supervision contract requires one valid next action. A next action is not valid
when the product has evidence that its command name cannot be resolved.

## Relationship To Existing Designs

The global bootstrap design already states that Navi must not recommend a
command that cannot run. The bootstrap remediation design also establishes a
stable `navi` bin wrapper and separates the CLI source root, installed plugin
source root, and target project root. The source-alpha legacy migration design
requires doctor to render one executable next action at each stage.

This design does not replace those decisions. It supplies the missing command
reachability and rendering contract needed to satisfy them:

- CLI source existence is not the same as command reachability.
- A command name on `PATH` is not trustworthy merely because its name is
  `navi`.
- Doctor, setup, and init must not maintain separate fallback rules.
- The invocation decision remains process-local and does not become another
  installation or migration state machine.

## Product Goal

For every source-alpha CLI invocation, Navi must either:

1. render subsequent Navi commands through an entrypoint proven executable in
   the current environment; or
2. report that no usable CLI entrypoint is known and stop printing speculative
   self-referential commands.

The normal experience remains concise. Users with a trustworthy bare command
continue to see commands such as `navi setup --write`. Fallback detail appears
only when it improves control.

## Non-Goals

This design does not add:

- automatic `PATH` mutation;
- edits to `.zshrc`, `.zprofile`, shell profiles, Codex configuration, or
  operating-system settings;
- an npm installer, public npm publication, public marketplace release, or
  one-click distribution;
- a launcher copied into a Codex-owned global directory;
- a persistent invocation receipt, cache, database, or background process;
- execution of an unknown `navi` binary as an identity probe;
- plugin installation, removal, or migration automation;
- changes to setup transaction safety or project-init fingerprint approval;
- Windows installer or cross-shell distribution behavior; or
- release preparation.

## Core Decisions

### Always Provide A Proven Command

The minimum success condition is not that the bare word `navi` always works.
The minimum condition is that Navi prints a command proven usable in the
current environment.

Navi prefers these forms in order:

1. trusted bare command: `navi`;
2. verified absolute Navi entrypoint;
3. verified source invocation: `npm run navi --`.

If none can be established, command reachability fails. Navi explains the
missing prerequisite and does not print a fake setup, init, recovery, or
doctor command.

### Do Not Manage PATH

When a fallback works, missing bare-command reachability is a warning rather
than a blocker. Navi may explain that the npm bin directory must be included in
the `PATH` inherited by Codex and that Codex must be restarted before a changed
environment can take effect. This guidance remains optional.

Navi does not generate an unverified shell-edit command and does not modify any
profile. The user can finish source-alpha setup through the verified fallback
without first repairing `PATH`.

### Same Name Does Not Prove Identity

Shell resolution uses the first matching command on `PATH`. Navi must inspect
that same candidate. It must not skip an untrusted first candidate and claim
that a later matching candidate makes the bare command safe.

The bare command is trusted only when the resolved candidate is executable and
its canonical entrypoint belongs to the currently running Navi package. A
same-named binary from another package, an older checkout, or an unverified
location is reported as an identity mismatch.

Navi never executes an unknown candidate to ask it for a version. Identity is
established through read-only path, symlink, package-root, and entrypoint
evidence.

### One Context For Every Self-Reference

Doctor, setup, and init use one Invocation Context. They do not implement
separate `PATH` probes or hard-code their own `navi ...` follow-up strings.

This includes ordinary apply instructions and less common paths such as:

- setup recovery;
- setup removal;
- doctor reruns;
- project trigger activation or upgrade;
- init fingerprint-bound writes; and
- any error recovery that asks the user to invoke Navi again.

Commands owned by another product, such as `codex plugin remove`, remain
unchanged.

## Invocation Context

The Invocation Context is a Command/Adapter boundary under the existing CLI
architecture. Environment inspection belongs to the adapter side; selecting
and rendering the command belongs to the command side. Domain modules do not
depend on shell text.

Conceptually, the context contains:

```text
current entrypoint
current Navi package root
PATH candidate and identity result
preferred command token prefix
reachability: pass | fallback | unavailable
optional PATH guidance evidence
```

The preferred prefix remains structured tokens rather than a prebuilt shell
string:

```text
["navi"]
["/absolute/path/to/navi"]
["npm", "run", "navi", "--"]
```

A renderer appends the subcommand tokens and quotes each token for the current
documented POSIX shell surface. This is required because source paths may
contain spaces or shell metacharacters.

The context exists only for the current process. It is not written to disk and
does not claim that a future Codex session will inherit the same environment.

## Resolution Algorithm

Resolution follows a deterministic order:

1. Derive the current CLI entrypoint and Navi package root from the executing
   wrapper/module location, not from `process.cwd()`.
2. Inspect the first `navi` candidate that the current process would resolve
   from `PATH`.
3. Reject a missing, non-executable, broken, uninspectable, or differently
   owned candidate for bare-command use.
4. Accept `navi` only when the candidate canonicalizes to the current
   entrypoint or to the corresponding bin entry under the same verified Navi
   package root.
5. Otherwise, use the verified absolute current entrypoint when that form is
   directly executable.
6. When the active invocation is a verified repository npm script and the
   source package still supplies the expected `navi` script, use
   `npm run navi --`.
7. If no candidate is proven, mark the CLI unavailable.

Environment reads and filesystem operations must be injectable so tests do not
depend on the developer machine's real `PATH`, npm prefix, or symlink layout.

## Doctor Semantics

The existing `cli` check gains truthful reachability semantics:

- **pass**: the trustworthy bare `navi` command is reachable;
- **warn**: the bare command is missing or mismatched, but a verified fallback
  is available; and
- **fail**: no verified CLI invocation is available.

A warning does not change migration stages such as `legacy-only`,
`transition-dual`, `current-only-bootstrap-missing`, or `current-active`.
Stage derivation continues to describe plugin and bootstrap state.

An unavailable CLI is an actionable prerequisite and takes precedence over a
later self-referential action. Existing higher-risk transaction and unsafe-path
precedence remains authoritative. Doctor must not hide those safety conditions
behind a PATH warning.

When reachability is a warning, rendered output briefly names the issue and the
verified fallback. Every `Next action` that invokes Navi uses that fallback.
Optional permanent PATH guidance remains secondary and does not displace the
current migration or setup action.

## Setup And Init Semantics

Setup and init do not independently diagnose installation state. They receive
the resolved Invocation Context from the CLI entry boundary.

Setup uses the preferred prefix for:

- preview apply instructions;
- transaction recovery instructions;
- install and remove writes; and
- requests to rerun setup after a bounded recovery.

Init uses the preferred prefix for:

- trigger activation and upgrade previews;
- Map candidate previews;
- fingerprint-bound writes; and
- safe repair or retry instructions.

Their write gates do not change. A fallback command is only a different route
to the same command contract; it is not additional approval.

## User-Facing Examples

### Trusted Bare Command

```text
[pass] cli: Navi CLI is reachable as `navi`.
Next action: navi setup --write
```

### Verified Absolute Fallback

```text
[warn] cli: Bare `navi` is not reachable from the PATH inherited by Codex.
Using verified fallback: "/Users/james/.hermes/node/bin/navi"
Next action: "/Users/james/.hermes/node/bin/navi" setup --write
```

### Verified Source Fallback

```text
[warn] cli: Bare `navi` is not reachable from the PATH inherited by Codex.
Using verified fallback: npm run navi --
Next action: npm run navi -- setup --write
```

### Identity Mismatch

```text
[warn] cli: The first `navi` on PATH does not belong to this Navi source.
Using verified fallback: "/verified/path/to/navi"
```

Navi may add a short optional note identifying the relevant bin directory for
future Codex sessions. It does not present shell profile mutation as the
required next action while the fallback remains usable.

## Failure And Safety Behavior

- A missing `PATH`, unreadable directory, broken symlink, or inaccessible
  candidate does not crash doctor. Resolution continues to a verified fallback.
- A mismatched first PATH candidate prevents bare-command use even when a later
  candidate appears valid, because shell execution would still select the
  first candidate.
- A source root without a valid Navi package/bin relationship cannot authorize
  a source fallback.
- A renderer must quote paths and arguments without treating them as shell
  fragments.
- Identity inspection is read-only and never invokes an unknown binary.
- No fallback may be invented from a guessed npm prefix.
- No PATH warning authorizes global writes, project writes, commits, pushes, or
  releases.

## Implementation Shape

Implementation should add one focused invocation module rather than another
installation subsystem. A likely boundary is:

- resolve invocation evidence and reachability;
- render one structured Navi command; and
- expose optional environment guidance.

The existing CLI dispatcher creates the context once and supplies it to the
doctor, setup, and init journeys. Tests may inject a context or resolver
dependencies. Existing public command arguments and exit-code contracts remain
unchanged.

Implementation must not create:

- a second plugin-installation parser;
- a general workflow or command-template framework;
- persistent invocation state;
- PATH mutation helpers; or
- duplicated per-command reachability checks.

## Targeted Verification

Implementation-mode verification should cover:

1. a same-source PATH candidate selects bare `navi`;
2. a missing PATH candidate selects a verified absolute entrypoint;
3. a mismatched first PATH candidate rejects bare-command use;
4. a verified source invocation selects `npm run navi --` when needed;
5. paths containing spaces render as executable shell commands;
6. missing, unreadable, and broken PATH evidence degrades without crashing;
7. pass, warning, and failure reachability do not corrupt migration-stage
   derivation;
8. setup apply, recovery, remove, and rerun text uses the selected prefix;
9. init preview, repair, and fingerprint-write text uses the selected prefix;
10. unknown PATH candidates are never executed; and
11. existing transaction, migration, fingerprint, and approval behavior stays
    green in the affected CLI suites.

The implementation worktree receives an independent read-only validation
review. Targeted CLI tests and typecheck are the default verification budget.
Full tests, plugin packaging verification, tag checks, and release preparation
are not implied unless the changed scope later proves broader than this design.

## Post-Integration Calibration

After explicit integration, one bounded Calibration-mode check should use the
real source-alpha environment that exposed the defect:

1. invoke doctor through the known absolute linked entrypoint while bare
   `navi` remains absent from the active Codex `PATH`;
2. confirm doctor reports a warning rather than a false pass or hard block;
3. confirm its next Navi action uses the verified fallback;
4. execute only the read-only or already-approved form needed to prove that
   fallback reaches the expected command; and
5. confirm no shell profile, PATH, plugin, project, or release state changed as
   a side effect of reachability diagnosis.

This is a single calibration of the observed source-alpha gap, not broad
distribution proof.

## Acceptance Criteria

The design is implemented when:

1. doctor distinguishes CLI source existence from command reachability;
2. the active Codex environment with a missing npm bin directory receives a
   warning and a proven executable fallback;
3. a same-named but differently owned `navi` is not trusted;
4. every doctor, setup, and init self-reference uses the shared renderer;
5. no self-referential next action is printed when no usable entrypoint is
   known;
6. PATH guidance remains optional and no environment file is modified;
7. migration stages, transaction precedence, project-init fingerprints, and
   approval boundaries remain unchanged;
8. focused tests and typecheck pass; and
9. the one bounded real-environment calibration confirms the fallback works.

## Authorization Boundary

Approval of this design authorizes only the design record. It does not
authorize CLI implementation, creation of an implementation worktree, global
npm or Codex mutation, target-project writes, merge, push, tag, release, or
publication. Those actions require their normal explicit mode and approval
gates.
