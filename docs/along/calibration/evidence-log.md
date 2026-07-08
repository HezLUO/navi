# Navi Maintainer Calibration Evidence Log

Status: maintainer-side calibration evidence
Last updated: 2026-07-08

This log records real or semi-real Navi usage samples that change product judgment. This log is not a release checklist, not a test report, and not proof of full product correctness.

Use `docs/along/calibration/decision-rubric.md` to classify entries. Every entry must end in a product decision.

## Entry Template

```markdown
## YYYY-MM-DD - Short evidence title

- Date:
- Source:
- Prompt / event:
- Project shape:
- Expected Navi behavior:
- Actual behavior:
- User / maintainer judgment:
- Category:
- Decision:
- Follow-up:
```

## 2026-07-01 - English `what's next` produced a Chinese Navi map

- Date: 2026-07-01
- Source: Maintainer screenshot and fresh-session observation.
- Prompt / event: The user asked `what's next` in English, but Navi returned a Chinese project rhythm/map because the saved project evidence was Chinese.
- Project shape: Long-running application/advising flow with Chinese project records.
- Expected Navi behavior: Navi should follow the user's current prompt language for headings, explanation, recommended next step, confirmation gate, and risk wording while translating or bilingualizing saved labels when needed.
- Actual behavior: The map headings and explanation stayed Chinese.
- User / maintainer judgment: This was a real language-following miss. Project record language should be source evidence, not the answer-language controller.
- Category: Miss.
- Decision: Implemented.
- Follow-up: Implemented in alpha.3 language-following fix; see `44b301c docs: make navi maps follow prompt language` and release `v0.1.0-alpha.3`.

## 2026-07-02 - Repeated meaningless `continue` prompts

- Date: 2026-07-02
- Source: Main Navi maintainer session.
- Prompt / event: The user repeatedly had to type `continue` or `继续` after local sub-steps even though the broader approved loop had not reached a real decision point.
- Project shape: Navi product design and implementation supervision.
- Expected Navi behavior: Codex should continue inside an already-approved boundary and stop only at a real user decision such as write approval, commit, push, release, mode change, scope expansion, validation-budget escalation, or risk acceptance.
- Actual behavior: Several responses stopped after local completion reports or small documentation/checking steps, leaving the user to say `continue`.
- User / maintainer judgment: This was avoidable continuation friction. The user adaptation was not the product goal; Navi should reduce opaque stopping.
- Category: Friction.
- Decision: Implemented.
- Follow-up: Addressed through alpha.5 pause semantics and alpha.8 decision handoff quality.

## 2026-07-02 - Completed worktree raised whether the main session should wait

- Date: 2026-07-02
- Source: Main Navi maintainer session during alpha.5 worktree supervision.
- Prompt / event: After a true worktree session had been created, the main session described itself as stopped at a waiting point until the worktree completed.
- Project shape: Multi-lane Navi development with main session design/supervision and implementation worktree execution.
- Expected Navi behavior: Navi should distinguish lane-level waiting from whole-session blocked. Review/merge may wait for a worktree, but the main session can continue non-conflicting design, supervision, acceptance criteria, roadmap, or risk work.
- Actual behavior: The wording collapsed a review/merge wait into a whole-session wait.
- User / maintainer judgment: This exposed a coordination boundary problem rather than an implementation bug.
- Category: Boundary Confusion.
- Decision: Implemented.
- Follow-up: Addressed through alpha.7 coordination layer.

## 2026-07-03 - External readers could confuse Navi with Along

- Date: 2026-07-03
- Source: External-reader review and public narrative design.
- Prompt / event: The repository still contained public-facing Along and `along-working-thread` names near Navi installation and product explanation.
- Project shape: GitHub source alpha and public README/release narrative.
- Expected Navi behavior: A new reader should understand Navi as an independent product surface without first understanding Along. Along should be origin or parent/lab context, and `along-working-thread` should be explained as legacy/internal naming.
- Actual behavior: The relationship could still be confusing for new readers.
- User / maintainer judgment: This was boundary confusion in public narrative, not a runtime behavior issue.
- Category: Boundary Confusion.
- Decision: Implemented.
- Follow-up: public narrative alignment implemented in `b72a7cb docs: align navi public narrative`.

## 2026-07-03 - Validation and testing consumed too much workflow space

- Date: 2026-07-03
- Source: Maintainer feedback during Navi planning.
- Prompt / event: The user observed that Codex often spent much more time testing and verifying than designing, and asked whether that was normal or a workflow problem.
- Project shape: Navi alpha product development and release-adjacent work.
- Expected Navi behavior: Validation strength should match Work Mode. Design should not be blocked by release-grade tests; Implementation should use targeted tests; Release is the place for full checklists.
- Actual behavior: Release-level habits could leak into design and ordinary implementation loops.
- User / maintainer judgment: This was overreach and validation-budget confusion. More tests are not automatically better when the task is product judgment.
- Category: Overreach.
- Decision: Implemented.
- Follow-up: Addressed through alpha.6 Work Mode and release-mode boundary.

## 2026-07-07 - Push success ended without a next decision

- Date: 2026-07-07
- Source: Main Navi maintainer session after alpha.10 merge and push.
- Prompt / event: After `main` was pushed successfully, the response reported the push result and said no release mode was entered, but did not provide a next decision. The user had to type `继续` and identified it as another meaningless continue.
- Project shape: Navi product development with a main session supervising design, implementation worktrees, merge, and push lanes.
- Expected Navi behavior: When a lane closes but the session remains active, Navi/Codex should give the smallest useful next-decision signal: a recommended next action, real options, or explicit closure. A successful push closes the merge lane, not necessarily the whole product conversation.
- Actual behavior: The response gave a correct status closeout but no next decision, leaving the user with no visible action except `继续`.
- User / maintainer judgment: This is a real continuation-friction sample. Alpha.8 made handoff quality visible, but push/merge/lane-closure moments still need sharper behavior.
- Category: Friction.
- Decision: Design.
- Follow-up: Start alpha.11 design for lane-closure next-decision handoff.

## 2026-07-08 - Quietness gate reduced over-structured handoffs

- Date: 2026-07-08
- Source: Main Navi maintainer session after alpha.11 lane-closure handoff and alpha.12 quietness design.
- Prompt / event: Recent lane closeouts and supervision responses were checked against the alpha.12 Quietness Gate. Some responses correctly exposed a real next decision, while others used more mode framing or numbered options than the moment required.
- Project shape: Navi product development with a main session supervising design, worktree review, merge, push, and follow-on product planning.
- Expected Navi behavior: Navi should choose the smallest surface that creates user control gain. If a response only needs a direct answer, embedded hint, or one-sentence handoff, it should not expand into a full mode frame or option set.
- Actual behavior: The alpha.11 push/review moments showed that next-decision handoff was useful, but nearby status checks such as checking whether a worktree was complete could have been quieter. They needed a direct check plus a light handoff, not a full supervision structure.
- User / maintainer judgment: This is a valid alpha.12 calibration sample. Alpha.11 reduces meaningless `continue` after lane closure, but without a quietness gate the product can swing into pseudo-supervision and create a different kind of friction.
- Category: Overreach.
- Decision: Design.
- Follow-up: Use this sample as calibration evidence for alpha.12 Quietness / Rule Density Control. Later implementation should apply the quietness gate before choosing any Navi map, handoff, or option surface.
