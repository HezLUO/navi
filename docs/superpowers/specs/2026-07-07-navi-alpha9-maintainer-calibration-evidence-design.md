# Navi Alpha 9 Maintainer Calibration Evidence Design

## Status

This design was approved in conversation on 2026-07-07. It defines the proposed alpha.9 direction after alpha.5 pause semantics, alpha.6 stage-and-vision supervision, alpha.7 coordination, and alpha.8 decision handoff quality.

This is a design artifact only. It does not approve implementation, worktree execution, `navi init` changes, target-project writes, README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, or write delegation.

## Product Context

Navi's recent alpha work strengthened the supervision layer:

- Alpha.5 clarified when Codex should continue or stop.
- Alpha.6 added product stage, work mode, and vision-distance supervision.
- Alpha.7 clarified lane coordination across main sessions, worktrees, calibration, review/merge, release, and external waits.
- Alpha.8 improved the quality of handoff when Codex gives control back to the user.

These improvements came from real use. The product risk is now less about lacking rules and more about deciding which real signals should change the product.

If every feedback sample immediately becomes an implementation task, Navi will become reactive and heavy. If samples stay only in memory or chat history, Navi will lose the evidence needed for product judgment. Alpha.9 should add a maintainer-side evidence layer so real use can inform product direction without interrupting every design loop.

## Product Goal

Alpha.9 should create a lightweight maintainer calibration evidence system for Navi.

The goal is:

```text
Turn real or semi-real Navi usage samples into reviewable product decisions without turning every sample into an immediate fix, release gate, or user-facing workflow.
```

This is not an end-user feature. It is a product-learning mechanism for Navi maintainers during the alpha stage.

## User And Maintainer Boundary

Alpha.9 is primarily for:

- Navi maintainers;
- product designers working on Navi;
- the main supervision/design session during alpha development.

Alpha.9 is not for ordinary target-project users. A normal Navi user may say things like:

- "Why did it stop?"
- "What should I do now?"
- "This is too much structure."
- "It is testing again instead of helping me decide."
- "It did not understand what I asked."

They are unlikely to say maintainer phrases such as "this continue is meaningless." That kind of feedback is a product-construction signal from the maintainer, not a customer-facing interaction requirement.

Alpha.9 should therefore not add a project-local evidence log to `navi init`, require target-project users to fill forms, or make the evidence workflow visible in ordinary Navi use.

## Core Principle

The core principle is:

```text
Evidence should inform product decisions, not interrupt every product loop.
```

Each evidence entry should end in a decision. Otherwise it becomes a diary instead of a product instrument.

## Proposed Files

Alpha.9 should use two maintainer-side docs:

```text
docs/along/calibration/decision-rubric.md
docs/along/calibration/evidence-log.md
```

### Decision Rubric

`decision-rubric.md` should define:

- what counts as calibration evidence;
- what does not count as calibration evidence;
- evidence categories;
- decision outcomes;
- when evidence may interrupt the current work;
- when evidence must not trigger implementation or release escalation.

### Evidence Log

`evidence-log.md` should record only meaningful product samples.

Each entry should include:

- Date;
- Source;
- Prompt or event;
- Project shape;
- Expected Navi behavior;
- Actual behavior;
- User or maintainer judgment;
- Category;
- Decision;
- Follow-up link.

## Evidence Schema

Each evidence entry should be structured enough to support product judgment but light enough to write quickly.

Recommended entry shape:

```markdown
## YYYY-MM-DD - Short evidence title

- Source:
- Prompt / event:
- Project shape:
- Expected behavior:
- Actual behavior:
- User / maintainer judgment:
- Category:
- Decision:
- Follow-up:
```

The required product rule is:

```text
Every evidence entry must end in a decision.
```

## Judgment Rubric

Each evidence item should have one primary category. Secondary tags are allowed but should not replace the main category.

### Success

Navi behaved as intended and can be kept as a positive sample.

Decision options:

- Close;
- use as a doc example;
- keep as calibration baseline.

### Friction

The user could complete the work, but the experience created unnecessary friction.

Examples:

- unnecessary `continue`;
- repeated confirmation without a real decision;
- unclear next step;
- valid stop with poor handoff;
- too much effort required to understand what Codex needs.

Decision options:

- Watch;
- Design if repeated;
- Implement only after a clear repeated pattern or approved design.

### Miss

Navi should have triggered or used available evidence but did not.

Examples:

- language following failed;
- project record was ignored;
- wrong map type was chosen;
- a progress or next-step prompt received ordinary task advice only;
- source records existed but were not used.

Decision options:

- Design;
- Implement if the expected behavior is already specified;
- Watch if the sample is ambiguous.

### Overreach

Navi or Codex did too much structure, too much challenge, too much validation, or crossed a boundary too early.

Examples:

- over-structured output for a simple task;
- release-level verification in design mode;
- Challenge Moment used as constant critique;
- implementation started from a design discussion;
- a default recommendation sounded like approval.

Decision options:

- Design;
- tighten prompt boundaries;
- Watch if isolated.

### Boundary Confusion

The product, mode, lane, release, target-project, or naming boundary became unclear.

Examples:

- main session treated lane-level waiting as whole-session blocked;
- user could not tell whether work was design, implementation, calibration, or release;
- Along and Navi relationship confused external readers;
- `along-working-thread` internal naming confused the public product surface.

Decision options:

- Design;
- docs correction;
- Implement if the boundary rule is already approved.

### Product Signal

The sample is not necessarily a bug but points to a possible future product direction.

Examples:

- project-local evidence log;
- runtime UI;
- installer workflow;
- adapter support;
- stronger execution contract;
- public distribution or trust signal.

Decision options:

- Roadmap;
- Defer;
- Design only when it blocks the current product wedge.

## Decision Outcomes

Every evidence item should end with one of these outcomes:

- Close: no further action.
- Watch: keep for repeat evidence.
- Roadmap: record as future direction.
- Design: start or propose a design pass.
- Implement: proceed only when the behavior is already specified and implementation is explicitly approved.
- Defer: valid signal, but not useful for the current alpha wedge.

## Initial Evidence Set

The initial evidence log should include a small number of representative historical samples, not every conversation detail.

Recommended initial entries:

1. English `what's next` produced a Chinese Navi map.
   - Category: Miss.
   - Decision: Implemented in alpha.3.

2. Repeated meaningless `continue` prompts.
   - Category: Friction.
   - Decision: addressed through alpha.5 pause semantics and alpha.8 decision handoff quality.

3. Completed worktree raised the question of whether the main session should stop and wait.
   - Category: Boundary Confusion.
   - Decision: addressed through alpha.7 coordination layer.

4. External readers could confuse Navi with Along or `along-working-thread`.
   - Category: Boundary Confusion.
   - Decision: public narrative alignment implemented.

5. Validation and testing consumed too much of the workflow compared with design.
   - Category: Overreach.
   - Decision: addressed through alpha.6 Work Mode and release-mode boundary.

This first set should be enough to prove the evidence format without turning alpha.9 into retrospective bookkeeping.

## Review Loop

The maintainer calibration loop should be light:

1. Capture only real or semi-real samples with product judgment value.
2. Classify each sample using the rubric.
3. Decide the outcome.
4. Batch non-urgent samples instead of interrupting the current design flow.
5. Review evidence after an alpha line closes or after two to three similar samples appear.

The review goal is to decide whether to close, keep watching, move to roadmap, start design, or start implementation.

This loop should not be presented as a user-facing workflow.

## Interruption Rules

Evidence may interrupt the current main line only when it reveals:

- a publishing or release error;
- a safety or data-loss risk;
- a misleading public claim;
- a product premise that invalidates the current design;
- repeated user-control friction that blocks the current task.

Otherwise, record the sample and continue the approved main line until the next real decision point.

## Non-Goals

Alpha.9 does not include:

- changing Navi prompt behavior;
- adding runtime behavior;
- adding UI;
- modifying `navi init`;
- generating target-project files;
- requiring ordinary users to maintain logs;
- collecting all conversation history;
- logging every test, commit, push, or status update;
- converting every evidence item into a bug;
- automatic implementation from evidence;
- automatic release escalation from evidence;
- full test runs;
- typecheck;
- tag or GitHub Release work;
- npm publication;
- marketplace distribution.

## Success Criteria

Alpha.9 succeeds if Navi maintainers can:

- record meaningful real-use evidence in a consistent format;
- distinguish Success, Friction, Miss, Overreach, Boundary Confusion, and Product Signal;
- attach an explicit product decision to each sample;
- avoid interrupting the main design flow for non-urgent one-off evidence;
- use repeated evidence to justify future design or implementation work;
- keep evidence collection separate from user-facing Navi behavior.

## Risks

### Evidence Bureaucracy

If alpha.9 makes maintainers record every small event, it fails. Mitigation: record only samples with product judgment value.

### Reactive Product Changes

If every evidence item becomes an immediate implementation task, Navi becomes reactive. Mitigation: use Watch, Roadmap, and Defer decisions.

### Hidden User Burden

If evidence logging leaks into target projects or `navi init`, it becomes a user burden. Mitigation: keep alpha.9 maintainer-side only.

### Release Process Creep

If evidence log updates trigger release-grade validation, alpha.9 repeats the over-validation problem it is meant to control. Mitigation: do not run full tests, typecheck, tag, release, or GitHub Release checks for evidence docs unless Release mode is explicitly approved.

## Open Product Judgment

Alpha.9 should stay maintainer-side until enough evidence shows that target-project users benefit from local calibration records. A future design may explore optional project-local evidence logs, but that should not be part of alpha.9.
