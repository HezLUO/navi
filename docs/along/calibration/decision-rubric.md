# Navi Maintainer Calibration Decision Rubric

Status: maintainer-side alpha calibration rubric
Last updated: 2026-07-07

This rubric turns real or semi-real Navi usage samples into product decisions. It is for Navi maintainers and product designers during alpha development.

Maintainer-side only. This is not an end-user feature, not a target-project workflow, and not something ordinary Navi users need to fill in.

## Purpose

Use this rubric to decide what a real sample means for Navi:

- close it as a useful or irrelevant sample;
- watch for repeats;
- add it to the roadmap;
- start a design pass;
- approve a bounded implementation;
- defer it because it is outside the current alpha wedge.

Every evidence entry must end in a decision.

## What Counts As Evidence

Record a sample when it changes product judgment or could change a future decision.

Good evidence includes:

- real or semi-real target-project prompts;
- fresh-session behavior;
- external reader confusion;
- repeated user-control friction;
- trigger misses;
- language-following failures;
- over-structured or noisy Navi output;
- over-validation or release-mode leakage;
- boundary confusion around mode, lane, release, target project, or Navi/Along naming;
- maintainer observations that explain why a product decision changed.

## What Does Not Count As Evidence

Do not record ordinary workflow noise.

Avoid logging:

- every test result;
- every commit, push, or status update;
- ordinary implementation progress;
- chat transcripts without product judgment;
- one-off tool failures that do not change Navi behavior;
- feedback already captured in a clearer evidence entry;
- target-project private details that are not needed for the product decision.

## Categories

Choose one primary category for each evidence entry. Add secondary tags only when useful.

### Success

Navi behaved as intended and the sample can serve as a positive baseline.

Typical decision: Close, or keep as a calibration baseline.

### Friction

The user could complete the work, but Navi or Codex created unnecessary effort.

Examples:

- unnecessary `continue`;
- repeated confirmation without a real decision;
- unclear next step;
- valid stop with poor handoff;
- too much effort required to understand what Codex needs.

Typical decision: Watch for repeats, or Design if the pattern is already repeated.

### Miss

Navi should have triggered or used available evidence but did not.

Examples:

- language following failed;
- project records were ignored;
- wrong map type was chosen;
- a progress or next-step prompt received ordinary task advice only;
- source records existed but were not used.

Typical decision: Design, or Implement if the expected behavior is already specified.

### Overreach

Navi or Codex did too much.

Examples:

- over-structured output for a simple task;
- release-level verification in Design mode;
- Challenge Moment used as constant critique;
- implementation started from a design discussion;
- a default recommendation sounded like approval.

Typical decision: Design a tighter boundary, or Watch if isolated.

### Boundary Confusion

The product, mode, lane, release, target-project, or naming boundary became unclear.

Examples:

- lane-level waiting was treated as whole-session blocked;
- the user could not tell whether work was Design, Calibration, Implementation, or Release;
- Along and Navi relationship confused external readers;
- `along-working-thread` internal naming confused the public product surface.

Typical decision: Design, docs correction, or Implement if the rule is already approved.

### Product Signal

The sample is not necessarily a bug, but it points to a possible future direction.

Examples:

- project-local evidence log;
- runtime UI;
- installer workflow;
- adapter support;
- stronger execution contract;
- public distribution or trust signal.

Typical decision: Roadmap or Defer unless it blocks the current product wedge.

## Decision Outcomes

Each entry must choose one outcome:

- Close: no further action.
- Watch: keep for repeat evidence.
- Roadmap: record as future direction.
- Design: start or propose a design pass.
- Implement: proceed only when the behavior is already specified and implementation is explicitly approved.
- Defer: valid signal, but not useful for the current alpha wedge.

## Interruption Rules

Do not let a single non-urgent evidence item interrupt the current design loop.

Evidence may interrupt current work only when it reveals:

- a publishing or release error;
- a safety or data-loss risk;
- a misleading public claim;
- a product premise that invalidates the current design;
- repeated user-control friction that blocks the current task.

Otherwise, record the sample and continue to the next real decision point.

## Release And Validation Boundary

Evidence logging does not trigger full tests, typecheck, tag, release, npm publication, or marketplace work.

For docs-only evidence updates, the default validation is:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
git diff --check
```

Use Release mode only when the user explicitly asks to prepare a version, tag, release, or external publication.

## Target-Project Boundary

Do not add this log to `navi init`.

Do not create target-project evidence logs by default. A future design may explore optional project-local evidence if maintainer-side evidence shows ordinary users benefit from it.
