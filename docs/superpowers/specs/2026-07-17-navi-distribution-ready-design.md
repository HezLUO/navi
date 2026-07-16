# Navi Distribution Ready Design

## Status

Approved product design. This document defines the bounded path from the
current Codex-first source product to a publicly installable Navi Distribution
Preview. It does not approve implementation, a new worktree, dependency
installation, target-project writes, calibration execution, integration,
pushing, tagging, publication, a GitHub Release, npm publication, or Public
Plugin Directory submission.

Distribution Ready remains separate from Codex-first Product Complete. This
design is the separately approved distribution decision permitted by the
Product Completion design; it does not declare the Product Complete evidence
gate satisfied.

## Summary

Navi must be installable without depending on acceptance into OpenAI's Public
Plugin Directory. Its controlled distribution baseline will therefore use:

1. GitHub Releases as the authoritative source, artifact, and version record;
2. a Navi-owned Git-backed Codex marketplace as the primary installation
   channel;
3. a GitHub Release bundle containing a local marketplace as the direct,
   offline, and reviewable installation path; and
4. the Public Plugin Directory as an optional discovery channel after the
   controlled path works.

All channels distribute the same versioned plugin artifact and enter the same
chat-native onboarding journey. They differ only in how the user obtains the
artifact. Navi does not build a store, daemon, background updater, or second
plugin format.

Channel catalogs may differ only in transport metadata: the Git-backed catalog
uses an immutable Git source selector, the Release bundle uses a local path,
and the Public Directory may add required listing metadata. The installed Navi
plugin bytes and behavior remain the same release artifact.

The first public installation milestone is a **Distribution Preview**, not a
stable `1.0` promise. The exact semantic version is chosen during an explicitly
approved release plan, but the tag, release, plugin manifest, marketplace
entry, downloadable artifact, checksum record, and any included CLI surface
must share one release identity.

## Product Problem

The current source alpha can demonstrate Navi behavior, but ordinary users
still face creator-oriented setup concepts:

- manual source marketplace configuration;
- source checkout and CLI reachability assumptions;
- global bootstrap and project initialization as separate expert operations;
- uncertainty about whether downloading a ZIP means the plugin is installed;
- no controlled public upgrade or rollback journey; and
- possible dependence on a public-directory review outcome that Navi does not
  control.

A distribution design that assumes Public Plugin Directory acceptance would
make Navi's basic availability depend on an external approval. A custom
installer or package manager built too early would solve that dependency by
adding a larger security, compatibility, and maintenance burden.

Navi instead needs one controlled, standards-based path that ordinary Codex
users can follow, plus optional channels that improve discovery without
changing the product.

## Product Decisions

1. Public Plugin Directory acceptance is not a Distribution Ready prerequisite.
2. GitHub Releases are the authoritative source and direct-download surface.
3. A Navi-owned Git-backed Codex marketplace is the primary installation
   channel.
4. The marketplace remains in the Navi repository initially; a separate
   distribution repository is unnecessary.
5. The existing technical marketplace identifier `navi-source` remains stable.
   `source` identifies the GitHub source channel, not a permanent alpha product
   name. User-facing copy may display **Navi** or **Navi Releases**.
6. The plugin product identifier remains `navi`.
7. A downloaded Release ZIP is an artifact acquisition path, not a direct
   cache-install path. It contains a local marketplace that Codex can install
   through its standard mechanism.
8. Public Plugin Directory, if approved later, distributes the same plugin
   artifact and uses the same onboarding.
9. A Bootstrap Installer is considered only if the controlled Codex
   marketplace journey fails or proves materially too difficult. It is not a
   default component.
10. The first broadly installable release is a Distribution Preview. Stable
    `1.0`, native Windows support, and long-term compatibility commitments are
    separate gates.
11. Plugin updates are explicit. Navi does not perform background version
    checks, download replacements, or bypass Codex's plugin lifecycle.
12. Installation does not initialize a project. Project evidence, preview, and
    user-approved writes remain a separate onboarding transaction.
13. Git-backed release entries resolve an immutable Git tag or commit SHA, not
    a floating plugin implementation on `main`.
14. Checksums improve transfer-integrity verification but are not described as
    cryptographic publisher attestation. Signed provenance remains a later
    trust improvement.

## Platform Basis And Unproven Assumption

Codex officially supports plugin marketplaces from GitHub shorthand, Git URLs,
and local roots. A marketplace is a JSON catalog, and Codex installs its plugin
entries into a managed cache. Official material also documents marketplace
refresh and removal operations.

Relevant current references:

- [Build plugins and curated marketplace lists](https://learn.chatgpt.com/docs/build-plugins#build-your-own-curated-plugin-list)
- [Codex developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)
- [Submit plugins](https://developers.openai.com/codex/submit-plugins)

These platform facts establish a controlled marketplace distribution route.
They do not yet prove that an installed Navi skill can reliably locate and run
the package-local initialization entry from every relevant Codex cache and
version context. That behavior is an explicit feasibility gate, not an assumed
capability.

## Distribution Architecture

### Authoritative GitHub Release

Each Distribution Preview release contains:

```text
Git tag RELEASE_TAG
GitHub Release for the same tag
navi-codex-plugin-RELEASE_TAG.zip
SHA256SUMS
installation and verification instructions
upgrade, rollback, migration, and uninstall notes
```

`RELEASE_TAG` is the exact version and preview label selected by the later
release plan; it is a symbolic release identity here, not an unresolved design
decision.

GitHub's automatically generated source archives remain available for source
inspection. The prepared plugin ZIP is the installable release artifact.

### Navi Git-Backed Marketplace

The Navi repository owns a Codex marketplace catalog and the plugin source:

```text
Navi/
|-- .agents/plugins/marketplace.json
`-- plugins/navi/
    |-- .codex-plugin/plugin.json
    `-- skills/navi/
```

The catalog is refreshable, but its released Navi entry resolves the exact
release tag or commit SHA. The catalog must not expose an unreleased `main`
snapshot as an ordinary-user release.

The primary acquisition flow is:

```bash
codex plugin marketplace add HezLUO/navi
```

The user then opens Codex **Plugins**, selects the Navi marketplace source, and
installs Navi. Installation state and plugin cache ownership remain with Codex.

### GitHub Release Local Marketplace

The downloadable plugin ZIP contains a self-contained local marketplace root:

```text
navi-RELEASE_TAG/
|-- .agents/plugins/marketplace.json
`-- plugins/navi/
```

After verifying `SHA256SUMS`, an offline or review-oriented user adds the
extracted root as a local marketplace source:

```bash
codex plugin marketplace add ./navi-RELEASE_TAG
```

The ZIP does not write directly into `~/.codex/plugins/cache`. Without either a
Git-backed or local marketplace source, the downloaded bundle is source for
inspection rather than a supported installed state.

### Optional Public Plugin Directory

Public Plugin Directory is a discovery and convenience channel. It is evaluated
only after the controlled GitHub path and onboarding work. Directory rejection,
review delay, policy changes, or temporary unavailability do not block Navi's
GitHub Distribution Preview.

No Directory-only implementation is allowed. The submitted skill bundle is the
same artifact already released through GitHub, subject only to platform-required
listing metadata and review materials.

### Conditional Bootstrap Installer

A Bootstrap Installer is not part of the default architecture. It becomes a
design candidate only when calibration shows that:

- users cannot reliably complete the marketplace-add and plugin-install
  journey;
- the installed plugin cannot reach the approved package-local onboarding
  entry through a supported platform path; or
- a material platform limitation cannot be repaired within the standard
  marketplace artifact.

Any Bootstrap proposal receives a separate threat model, platform support
matrix, update policy, and complexity review. It must not silently become a
second package manager.

## One Release Identity

Every released surface must describe the same Navi version:

```text
Navi Distribution Preview X.Y.Z
|-- Git tag and GitHub Release
|-- plugin manifest
|-- Git-backed marketplace entry
|-- local-marketplace ZIP
|-- SHA256SUMS
`-- optional CLI surface, if the release contains one
```

The release transaction activates the marketplace entry only after the tagged
artifact and verification materials are available. A partially prepared
artifact must not become the marketplace default.

The marketplace catalog may change to point at a newer release. The referenced
plugin implementation does not drift after publication. Historical Releases
remain available for review and rollback.

The exact preview version number, tag suffix, and publication date are release
planning decisions. This design does not pre-authorize them.

## Ordinary User Installation And Onboarding

The recommended journey is:

```text
open Navi GitHub installation page
-> add the Navi Git-backed marketplace once
-> install Navi from Codex Plugins
-> start a new Codex task in the target project
-> ask naturally for setup or broad supervision
-> inspect Navi's evidence-backed baseline candidate
-> inspect the exact project-write preview
-> approve or reject the bounded project write
```

Natural entry prompts include, but are not limited to:

- `帮我接入 Navi`
- `Set up Navi for this project`
- a broad uninitialized-project question such as `what's next?`

Trigger phrases are not fixed and do not have to be Chinese. Navi follows the
current prompt language. Narrow, unrelated tasks remain quiet.

The ordinary user does not need to:

- install a global npm package;
- make a bare `navi` executable available in `PATH`;
- find the Codex plugin cache;
- edit global `AGENTS.md` manually;
- classify the project's evidence profile; or
- understand the source-alpha migration sequence.

### Package-Local Onboarding Entry

The plugin artifact contains a self-contained project-initialization entry near
the Navi skill, conceptually:

```text
plugins/navi/skills/navi/
|-- SKILL.md
|-- scripts/navi-project-init.mjs
`-- references/
```

The exact final path and invocation contract are implementation-plan details,
but the behavior is fixed:

- locate the entry from the actually loaded installed skill or another
  documented stable plugin-root mechanism;
- do not hardcode source checkout paths or cache paths;
- do not require the optional source CLI;
- use only a runtime guaranteed by the supported Codex environment, rather
  than assuming creator-local Node or npm installation;
- use no network for project evidence or initialization;
- inspect only bounded evidence under the selected project root;
- render an exact read-only preview first; and
- write only after explicit user approval.

Skill text may guide and supervise onboarding, but it does not become an
unbounded direct file writer. The package-local entry remains the formal,
testable project-write path.

## Project Write Boundary

Plugin installation changes Codex plugin state only. It does not modify the
active repository.

Project onboarding may prepare only:

- `.navi/project-map.md`; and
- the exact Navi-managed block in project-local `AGENTS.md`.

Before either write, Navi must:

1. identify the intended project root;
2. inspect bounded project evidence;
3. form or confirm a truthful baseline;
4. show the exact files and content to be changed;
5. bind approval to that exact preview; and
6. refuse if the target or current files no longer match the approved plan.

Existing transaction, unsafe-path, symlink, fingerprint, managed-block, and
non-Navi-content preservation rules continue to apply. Distribution does not
weaken them.

Navi does not scan unrelated projects, mutate global Codex state during project
initialization, start a watcher, or create background presence.

## Update, Rollback, And Uninstall

### Git-Backed Marketplace Update

The user explicitly refreshes the Navi marketplace through Codex, for example:

```bash
codex plugin marketplace upgrade navi-source
```

The user then reviews and installs the available plugin version through the
Codex plugin surface. Navi does not run its own update server or network check.

### Local Marketplace Update

A direct-download user:

1. learns about a release through GitHub Releases or an optional GitHub release
   notification;
2. downloads the new local-marketplace ZIP;
3. verifies its checksum;
4. extracts it to a stable local location;
5. refreshes or replaces the configured local marketplace source; and
6. confirms the plugin update in Codex.

This path is intentionally manual and reviewable. It is not marketed as the
lowest-friction default.

### Public Directory Update

If Navi later enters the Public Plugin Directory, the platform owns directory
refresh and plugin update delivery. Navi does not add a second updater. The
actual Directory update experience must be calibrated rather than inferred from
submission support alone.

### Project Format Migration

A plugin update does not silently rewrite a project's Map or trigger. When a
new version needs a project-file migration, Navi diagnoses the state, preserves
read compatibility where approved, shows the exact migration preview, and asks
for approval before writing.

### Rollback

Historical GitHub Releases provide the prior artifact, checksum, and tag. A
user may install a prior release through its bundled local marketplace.

Rolling back the plugin does not automatically roll back project files. Navi
must report compatibility truthfully and must not guess at a destructive
reverse migration.

### Uninstall

The user uninstalls Navi through Codex Plugins. Uninstallation removes the
plugin bundle from that Codex environment but does not scan for or delete
project-local Navi files.

`.navi/project-map.md` and the managed `AGENTS.md` block remain by default. A
separate project-level cleanup may be offered only as an exact preview that
removes recognized Navi-managed content after explicit approval.

## Technical Feasibility Gate

Before Distribution Preview release preparation, one bounded real-installation
calibration must prove all of the following:

1. Navi installs from the Git-backed marketplace rather than running from the
   source tree.
2. A fresh Codex task loads the installed skill.
3. The skill locates the installed package-local onboarding entry without a
   hardcoded cache or source path.
4. The entry runs in each supported clean environment without creator-local
   Node, npm, CLI, or shell-profile assumptions.
5. Changing the current working directory and moving or removing the source
   checkout does not break the installed copy.
6. Installing a second plugin version preserves correct package-local
   resolution.
7. Broad supervision remains read-only until initialization is approved.
8. Initialization preview produces no target-project change.
9. Approved initialization changes only the two authorized project surfaces.
10. The GitHub Release local-marketplace bundle completes the same onboarding.
11. Failure leaves plugin and target-project state understandable and
    recoverable, with one concrete next action.

The result routes as follows:

- all criteria pass: proceed to Distribution Preview release planning;
- package-root resolution fails: investigate a documented stable Codex
  plugin-root mechanism;
- standard plugin mechanisms remain insufficient: return to Design mode for a
  bounded Bootstrap Installer or optional CLI decision; or
- Public Plugin Directory is unavailable or rejects Navi: continue through the
  controlled GitHub path without changing architecture.

The feasibility gate is not a full release checklist and does not prove every
repository behavior.

## Public Plugin Directory Submission Gate

Directory submission may begin only after:

- the controlled GitHub installation path passes the feasibility gate;
- mature-project onboarding has one accepted real calibration;
- evidence-poor onboarding has one accepted real calibration;
- the released artifact, support boundary, and version identity are stable;
- public website, support, privacy, terms, logo, category, descriptions, starter
  prompts, reviewer cases, country availability, and release notes are ready;
  and
- current OpenAI submission requirements and identity permissions are checked
  again at submission time.

Directory approval is not presumed. Documentation must not claim public
directory availability before the listing is approved and published.

Review feedback routes by type:

- listing or legal-material issue: correct submission material;
- security or product-behavior issue: return to bounded product judgment and
  implementation;
- unsupported platform capability: retain the GitHub channel; or
- rejection without an actionable product defect: record the channel result
  without treating Navi as an unshippable product.

## Distribution Preview Completion Boundary

Distribution Preview is complete when an unfamiliar Codex user can rely only
on Navi-controlled GitHub surfaces to obtain, verify, install, initialize,
update, roll back, and uninstall the preview product without silent project
mutation or creator-only path knowledge.

The completion package includes:

- Navi Git-backed marketplace;
- immutable versioned plugin artifact;
- GitHub tag, Release, ZIP, and `SHA256SUMS`;
- local-marketplace download bundle;
- complete installed-plugin onboarding;
- project evidence, baseline, preview, and approval behavior;
- update, rollback, uninstall, migration, and recovery documentation;
- macOS, Linux, and WSL installation evidence;
- one mature-project real calibration;
- one evidence-poor-project real calibration; and
- accurate Preview capability and exclusion language.

The following do not block Distribution Preview:

- Public Plugin Directory approval;
- npm publication;
- a Bootstrap Installer when the standard journey passes;
- automatic updates or background version checks;
- Runtime Surface, UI, MCP, a daemon, or a cloud service;
- telemetry or an account system;
- agents other than Codex;
- full native Windows support; or
- stable `1.0` compatibility commitments.

## Validation Strategy

### Design And Implementation Modes

This spec is design evidence only. A later implementation requires a separate
approved plan and isolated Execution Thread.

Implementation uses directed TDD and tests only the changed distribution,
packaging, initialization, migration, and documentation surfaces. It does not
default to the full repository or a release checklist.

The Supervised Delivery Loop applies:

- the Main Thread owns scope, priority, acceptance, integration, and user
  decisions;
- the Execution Thread owns bounded implementation and exact-snapshot evidence;
  and
- a fresh read-only Validation Thread independently reviews the candidate.

At most two in-scope remediation rounds are automatic when preauthorized. A
repeated material issue returns to premise and product judgment.

### Calibration Mode

Calibration covers four user journeys:

1. first installation from the Git-backed marketplace;
2. first onboarding in a mature project;
3. first onboarding in a new or evidence-poor project; and
4. local-marketplace installation from the Release ZIP followed by one version
   update.

The observations focus on:

- whether the user encounters cache paths, source paths, or internal selector
  concepts;
- whether installation leaves a visible next action;
- whether any meaningless continuation request occurs;
- whether preview and approval boundaries are understandable;
- whether failure remains clean and recoverable;
- whether narrow tasks remain quiet; and
- whether an existing initialized project remains readable after update.

These journeys are product evidence, not attempts to prove the whole repository
correct.

### Release Mode

Only an explicit user decision enters Release mode. The release verification
budget then includes:

- the complete repository test command required by the release contract;
- typecheck;
- plugin package and canonical/package mirror verification;
- clean artifact build and unpack inspection;
- checksum generation and independent verification;
- Git-backed and local-marketplace installation replay;
- version, tag, manifest, release-note, and capability-truthfulness checks;
- diff and scope checks; and
- final GitHub Release inspection.

Release-level verification runs as one bounded closeout. It must not spill
backward into ordinary design, implementation, or calibration loops.

## Security And Trust Boundaries

- Marketplace installation uses Codex's plugin lifecycle; Navi does not write
  directly to Codex's private cache.
- Marketplace entries reference immutable release evidence.
- Project initialization is offline by default and bounded to the selected
  project root.
- Installation and project initialization remain separate permission events.
- No installer edits shell profiles, global `PATH`, unrelated repositories, or
  global Codex guidance.
- No background process checks versions, scans projects, or watches files.
- A release checksum detects artifact mismatch relative to trusted release
  metadata; it is not publisher identity proof by itself.
- Any future signing or provenance feature requires its own implementation and
  release-policy decision.
- Public-directory legal and identity requirements do not create telemetry or
  a Navi account requirement.

## Complexity Control

1. One plugin artifact serves every channel.
2. One chat-native onboarding serves every acquisition path.
3. GitHub remains the only Navi-controlled publication infrastructure for the
   Preview.
4. Codex owns marketplace installation and plugin caching.
5. Navi owns only release truthfulness and bounded project initialization.
6. Public Directory improves discovery but does not define product viability.
7. Bootstrap, npm, runtime, and UI remain conditional separate decisions.
8. No new mechanism is added when documentation or one existing Codex command
   is sufficient.
9. Distribution findings must be classified as channel, packaging, onboarding,
   security, or product defects before they generate implementation work.
10. Additional verification must change a release or product decision; more
    green output alone is not a reason to continue.

## Implementation Planning Boundary

A later implementation plan should decompose the work into bounded stages:

1. marketplace and artifact contract;
2. package-local onboarding feasibility implementation;
3. Git-backed and local-marketplace packaging;
4. update, rollback, uninstall, and migration surfaces;
5. targeted tests and independent validation;
6. real-installation feasibility calibration; and
7. a separately authorized Distribution Preview release plan.

The implementation plan must stop before tag, push, GitHub Release, npm
publication, Public Plugin Directory submission, or external target-project
write unless those actions receive their own explicit mode and permission.

## Non-Goals

- Guaranteeing acceptance into the Public Plugin Directory.
- Choosing the final Preview version number or release date.
- Publishing to npm.
- Building a custom plugin store or update service.
- Adding silent or background update checks.
- Implementing a Bootstrap Installer without feasibility evidence.
- Building Runtime Surface, local UI, MCP, background presence, Memory v2,
  delegation, relationship modes, or other-agent adapters.
- Rebranding Historical Along code as the current Navi distribution product.
- Treating checksums or source-package comparison as cryptographic attestation.
- Automatically entering implementation or Release mode from this design.
