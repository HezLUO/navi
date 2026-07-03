# Navi Public Narrative System Design

## Status

This design was approved in conversation on 2026-07-03. It defines the public narrative system Navi should use after the alpha.7 Coordination Layer work and the product-positioning decision that Navi is an independent product surface while Along remains the parent/lab context.

This is a design artifact only. It does not approve README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, internal id migration, runtime UI, background automation, or implementation work.

## Product Context

Navi's public docs are already partly Navi-first: the root README describes Navi as helping non-expert users understand, supervise, and steer expert agents, and it explains that Along is the broader long-term vision.

The narrative is not yet fully aligned with the current product model:

- Some text still frames the V1 alpha mainly as Progress/Rhythm Maps plus Challenge Layer, even though alpha.5, alpha.6, and alpha.7 added pause semantics, stage/vision supervision, and coordination guidance.
- The root README still names `0.1.0-alpha.3` as the latest source release while `main` now contains post-release alpha.7 behavior that is not yet a release.
- Along is explained, but the public narrative should make it clearer that Along is parent/lab context rather than prerequisite user knowledge.
- `along-working-thread` compatibility naming is explained in multiple places; it should be concentrated and described as legacy/internal naming.
- README.zh-CN is valuable but creates a synchronization burden whenever public narrative changes.

## Product Goal

Create a public narrative system that lets an external reader understand Navi without first understanding Along.

The narrative should answer, in order:

1. What is Navi?
2. Who is it for?
3. What does the current alpha actually include?
4. What does it not include?
5. How do I verify the source package?
6. How do I connect Navi to a target project?
7. What is the relationship between Navi and Along?
8. Why do some internal names still say `along-working-thread`?

The goal is a stable story, not a one-off README rewrite.

## Core Narrative Model

Navi's public narrative should use a three-layer model.

### 1. One-Line Product Promise

Use this as the stable public promise:

```text
Navi helps non-expert users understand, supervise, and steer expert agents.
```

This line should remain the first product explanation in README-like surfaces.

### 2. Current Alpha Promise

Use this as the current alpha boundary:

```text
Current alpha is a Codex skill/plugin behavior layer with project-local docs and `navi init` setup for active sessions.
```

This should be paired with an explicit source-alpha statement:

```text
This is a GitHub source alpha. It is not yet npm distribution, public marketplace installation, a global installer, runtime UI, or background automation.
```

### 3. Mechanism List

Describe the current behavior set as:

```text
Progress/Rhythm Maps, Challenge Layer, pause semantics, stage/vision supervision, and coordination guidance.
```

For non-expert readers, translate that mechanism list into user-facing outcomes:

```text
Navi shows where the project is, what is missing, whether to continue, when to stop, how much validation is enough, and whether parallel work should wait or continue.
```

The mechanism list should not become the product definition. Navi is the supervision product; the mechanisms are the current alpha implementation surface.

## Along Relationship

Along should be explained as a secondary relationship, not the entrypoint.

Recommended relationship wording:

```text
Along is the parent/lab context and broader long-term product family. Navi is an independent product surface from that work and should be understandable without knowing Along.
```

Use Along to explain origin, broader product family, and historical context. Do not require readers to understand Along before they understand Navi.

Avoid wording that implies Navi is only a module of Along, only a handoff document, or only Progress Maps.

## Compatibility Naming

`along-working-thread` should be explained once in a concentrated compatibility note.

Recommended note:

```text
Some internal ids, paths, and package directories still use `along-working-thread` for alpha compatibility. Treat that as legacy/internal naming, not the customer-facing product name.
```

The note should be near the current V1 shape or architecture section, not repeated throughout the main product story.

Do not rename internal ids casually. A full rename would be a compatibility migration involving skill paths, package directories, tests, local installs, and verification scripts.

## Alpha Surface Boundary

The public narrative must distinguish current alpha surface from future capability layers.

Current alpha includes:

- Codex skill/plugin behavior;
- project-local trigger docs;
- project-local Project Map or Rhythm Map records;
- `navi init` dry-run and `--write` setup;
- source package verification through `npm run verify:plugin-package`;
- active-session supervision behavior.

Current alpha does not include:

- npm publication;
- public Codex marketplace publication;
- global plugin installer;
- one-click sync;
- runtime UI;
- local app surface;
- background watcher, scheduler, notifications, or always-on presence;
- Hermes, Claude Code, or other agent adapters;
- Memory v2;
- relationship modes;
- delegation or write delegation;
- automatic final decision-making in every professional domain.

The public narrative should keep `src/web` framed as historical Along Shared Desk / future capability evidence, not a current Navi alpha UI.

## Release-State Wording

The README and release docs must not blur `main` behavior with released source packages.

Use separate language:

- **Latest GitHub source release**: the latest tagged release external users can download as a release artifact.
- **Current main branch behavior**: unreleased changes merged after the latest release.

If README describes post-release behavior on `main`, it should say that it is in `main` and not necessarily in the latest tagged source release.

This prevents a user from reading alpha.7 behavior in the README and expecting it to exist in `v0.1.0-alpha.3` release source unless a later release is prepared.

## Documents Governed By This Narrative

The narrative system should guide:

- `README.md`;
- `README.zh-CN.md`;
- `package.json` description;
- plugin metadata short description;
- GitHub Release bodies;
- `docs/releases/*.md`;
- `docs/along/navi-product-debt.md`;
- `docs/along/roadmaps/navi-post-alpha-roadmap.md`;
- future marketplace or npm package descriptions.

Implementation does not need to edit all of these at once. The design establishes the public language contract; later implementation plans can choose a narrow first pass.

## README Structure Recommendation

The root README should prefer this order:

1. Product name and one-line promise.
2. Short problem statement.
3. Current alpha boundary and quick verification path.
4. Target-project setup with `navi init`.
5. What the current alpha includes.
6. What the current alpha does not include.
7. What Navi does, with examples.
8. Current V1 shape and architecture boundary.
9. Relationship to Along.
10. Compatibility note for `along-working-thread`.
11. Feedback requested.
12. Release notes and license.

The Along relationship should not be in the first viewport unless it is a short secondary sentence. The first viewport should establish Navi itself.

## README.zh-CN Synchronization Strategy

README.zh-CN should remain aligned with README.md for public narrative changes.

However, because bilingual maintenance is a known risk, implementation plans should choose one of two explicit strategies:

1. update English and Chinese together in the same implementation pass; or
2. update English first and add a visible tracking note that README.zh-CN needs synchronization before the next release.

Silent drift is not acceptable for public product narrative changes.

## Non-Goals

This design does not include:

- direct README edits;
- release note edits;
- GitHub Release body updates;
- npm publication;
- marketplace publication;
- package id or skill id migration;
- plugin path rename;
- runtime UI;
- Web UI rebrand;
- `src/web` changes;
- background runtime;
- Memory v2;
- agent adapters;
- delegation or write delegation;
- a requirement to rewrite every historical doc.

Historical docs may preserve historical wording when clearly archival. Public entry surfaces should use the narrative system.

## Success Criteria

This narrative system succeeds if:

- a new external reader can understand Navi without first learning Along;
- the first product promise is Navi-first and user-facing;
- current alpha scope is explicit and not overstated;
- release-state wording separates latest tagged release from current `main`;
- `along-working-thread` appears as a compatibility note, not the product identity;
- current alpha mechanisms include maps, challenge, pause semantics, stage/vision supervision, and coordination guidance;
- future surfaces such as runtime UI, local app, adapters, Memory v2, and delegation remain visibly out of current alpha scope;
- README.zh-CN synchronization is handled intentionally rather than forgotten.

## Risks

### Over-Correcting Away From Along

If the narrative removes Along entirely, it loses useful origin and future-family context. Mitigation: keep Along as parent/lab context in a secondary section.

### Over-Explaining Internal History

If the README spends too much space explaining `along-working-thread`, it may recreate the same confusion. Mitigation: use one concentrated compatibility note.

### Blurring Release State

If README lists alpha.7 behavior while the latest tagged source release is alpha.3, external users may think the release includes behavior that only exists on `main`. Mitigation: separate latest release wording from current main behavior.

### Bilingual Drift

If English public narrative changes without README.zh-CN synchronization, the repo will tell two public stories. Mitigation: either update both together or explicitly record the sync debt before release.

## Open Product Judgment

The first implementation pass should probably update README.md and README.zh-CN.md together, then update package/plugin metadata only if the existing descriptions conflict with this narrative. Release notes and GitHub Release bodies should wait for an explicit Release-mode decision.
