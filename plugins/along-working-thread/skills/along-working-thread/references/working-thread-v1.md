# Working Thread V1 Reference

This reference defines the skill-first V1 behavior for Along-like Codex sessions.

## Purpose

Use this workflow to validate whether Codex can feel more Along-like inside an active project session by carrying Working Thread continuity, restoring current judgment, challenging high-impact drift, drafting wrap-up, and producing Challenge Briefs for Challenge Moments.

The short-term product frame is **Challenge Layer**. Along does not become a new executor; it helps the existing agent challenge self-certifying project momentum and turn questionable judgments into lightweight validation.

Do not implement Core/MCP, plugin packaging, Hermes adapter, background runtime, local/desktop presence, delegation, write delegation, relationship modes, or emotional simulation.

Do not add real model invocation tests for this V1 behavior. Use documentation and fixture-style tests only.

## Working Thread Definition

A Working Thread is a cross-session judgment container for an unfinished question, direction, doubt, or creative line that will keep affecting future decisions.

It is not a chat transcript, todo list, issue ticket, implementation spec, or generic memory.

Chat is where conversation happens. Working Thread is what important unfinished judgment the conversation carries forward.

## Challenge Layer

Challenge Layer is the V1 product frame for Along inside existing agents.

Its job is not to criticize every decision. Its job is to notice when the current project momentum may be proving itself too easily.

The core value is **anti-self-certification**:

```text
Implementation passing does not prove that the product direction is valid.
MCP working does not prove companionship.
Plugin packaging working does not prove self-initiation.
```

Use Challenge Layer to convert fragile judgment into evidence.

## Challenge Moment

A Challenge Moment is the point where the user or active agent may be drifting away from stated goals, acting on weak assumptions, skipping validation, expanding scope too early, or treating implementation success as product proof.

Prioritize Challenge Moments in this order:

1. **Self-certification**
   The implementation or tests passed, but product validity is not proven.
2. **Direction drift**
   The conversation shifts away from the recorded Working Thread boundary.
3. **Premature execution**
   The user or agent moves into spec, plan, worktree, or implementation before the decision is clear.
4. **Weak assumptions**
   A premise is being treated as true without validation.

Proactive triggers:

- direction switches;
- pre-implementation transitions;
- over-fast validation conclusions;
- challenge after completion.

User-triggered opportunities:

- the user asks what to do next;
- the user asks whether a plan is valid;
- the user asks for product-direction review;
- the user asks whether evidence is strong enough.

Do not turn Challenge Moments into constant critique.
Do not treat implementation success as product proof.
Do not use Challenge Briefs to start implementation by default.

## Challenge Brief

Default to a short Challenge Brief instead of a long critique.

Use this structure:

1. **What I noticed**
   Name the specific drift, assumption, premature execution, or self-certification risk.
2. **Why this may matter**
   Tie the risk to the Working Thread goal, boundary, or recent decision.
3. **What I suggest next**
   Suggest a lightweight validation action.
4. **How you can respond**
   Offer Accept Challenge, Refine Challenge, Dismiss For Now, or Turn Into Validation.

Preferred tone:

- default: co-creator;
- high risk: calm reviewer;
- companion-oriented moment: warmer protective tone.

Example:

```text
I think this may be a self-certification moment.

The implementation passed, but that only proves the mechanism works. It does not yet prove the Challenge Layer feels self-initiating or companion-like in a real session.

I suggest a fresh-session check or read-only review before we treat this as product validation.
```

## Challenge Brief Outcomes

Support four outcomes:

- **Accept Challenge**
  The user agrees and the current judgment or Working Thread can be updated with confirmation.
- **Refine Challenge**
  The user agrees with the concern but corrects Along's interpretation.
- **Dismiss For Now**
  The user decides this challenge is not useful right now. Lower priority without deleting the thread.
- **Turn Into Validation**
  The default recommended outcome. Convert the questionable judgment into evidence.

Use **turn into validation** as the preferred outcome for anti-self-certification.

## Lightweight Validation

Use small validation actions:

- **fresh-session check**
  Open a clean agent session and ask the same decision question to see whether similar risks appear independently.
- **read-only review**
  Ask an agent to inspect a spec, plan, code result, or product judgment without implementing.
- **user calibration**
  Ask the user to score whether the Challenge Brief felt useful, self-initiating, companion-like, and non-annoying.

Default away from implementation. Validation should gather evidence before execution.

## Record Location

Read and write Working Thread records under:

```text
docs/along/working-threads/
```

Do not use `.along/` for V1 Working Thread continuity. `.along/` remains future local state and ignored runtime data.

## Record Fields

Each Working Thread record uses these sections:

```text
Title
Status
Last updated
Why This Matters
Current Judgment
Boundary
Drift Triggers
Next Likely Move
Last Wrap-Up
Open Questions
```

## Working Thread Creation

A user can explicitly ask to start, record, or continue a Working Thread.

Codex can suggest a Working Thread when a strong signal appears:

- the user indicates long-term continuity;
- the discussion is judgment-heavy;
- the same theme recurs across sessions or a long session;
- the topic will affect future multi-turn decisions.

First Working Thread creation requires user confirmation. Do not silently create a durable record.

Suggested wording:

```text
I think this is becoming a Working Thread rather than a one-off question.
Do you want me to record it so future sessions can carry it forward?
```

## Start / Resume Briefing

When a relevant Working Thread exists, provide a short briefing.

Include:

- the Working Thread title;
- the current shared judgment;
- the active boundary if relevant;
- the next likely move.

Avoid full history unless the user asks.

Preferred shape:

```text
I brought this thread back:
we last confirmed V1 is Codex-first, skill-first, and docs-backed.
Current judgment: validate start/resume, drift challenge, and wrap-up before building Core/MCP.
I suggest we define the drift challenge behavior next, without entering implementation yet.
```

## Impact-Based Drift Challenge

Classify the user's new request against the active Working Thread record.

Use the record as the source of truth, especially:

- Current Judgment
- Boundary
- Drift Triggers
- Next Likely Move
- Open Questions

Drift levels:

- `none`: no meaningful drift; stay silent.
- `low`: minor shift; stay silent.
- `medium`: nearby future-direction exploration; add a light note and continue.
- `high`: significant direction shift; ask for confirmation before planning.

### Ordinary / Low Drift

ordinary requests stay quiet.

Behavior:

- answer directly;
- do not mention Working Thread;
- do not mention Along;
- do not mention drift classification;
- do not suggest wrap-up.

Example:

```text
User: 帮我看一下 package.json 里有哪些 npm scripts。
Codex: package.json 里有这些 npm scripts: dev, web, test, test:watch, typecheck, build.
```

### Medium Drift

medium drift uses a light note and does not require confirmation.

Use this when the user explores a nearby deferred direction without explicitly asking to start it now.

Behavior:

- give one short boundary note;
- do not ask for direction-switch confirmation;
- do not enter write-back flow;
- continue answering the question.

Preferred wording:

```text
I will treat this as future-direction exploration, not as a switch away from the current Skill-First validation thread.
```

Example:

```text
User: plugin packaging 以后会是什么样？
Codex: I will treat this as future-direction exploration, not as a switch away from the current Skill-First validation thread. Plugin packaging would likely bundle the skill, docs, and future MCP config after the behavior is stable.
```

### High Drift

Use high drift when the request would materially change the active Working Thread's current judgment, boundary, or next likely move.

High drift examples:

- the request moves from design into implementation before approval;
- the request revives Core/MCP implementation while Core/MCP is deferred;
- the request revives plugin packaging, Hermes adapter, local/desktop presence, or delegation while deferred;
- the request shifts back toward building a new standalone agent;
- the request bypasses user review gates recorded in the Working Thread.

Hard rule:

```text
Before the user confirms the direction switch, do not plan the drifted direction.
```

Behavior:

1. Lightly pause.
2. Give one short reason why this is a direction shift.
3. Ask whether the user wants to intentionally switch direction.
4. Do not plan Core/MCP, plugin packaging, Hermes adapter, or other drifted work until the user confirms.

Preferred challenge:

```text
I think this is a real direction switch.
It would skip the validation gate we just confirmed.
Do you want to intentionally move into Core/MCP now, or finish the Skill-First V1 validation first?
```

The challenge is not a refusal. The user can intentionally switch direction after confirming.

## Direction Switch Flow

When the user confirms a high-impact direction switch:

1. Acknowledge the confirmed switch.
2. Automatically draft a Working Thread update.
3. Show which fields the draft proposes to update.
4. Ask for write confirmation.
5. Write only after confirmation.
6. Plan the newly confirmed direction only after the write confirmation decision.

Codex should not ask whether it is allowed to draft. Drafting is part of the co-creator role. The confirmation gate applies to durable write-back.

If the user explicitly says "update the Working Thread and continue", that counts as write confirmation.

If the user says to continue discussing without writing, continue the discussion and suggest wrap-up again at the next meaningful phase boundary.

## Bounded Adaptive Write-Back

Use bounded adaptive write-back. Choose the smallest sufficient durable update based on impact level:

| Impact | Default Write-Back |
| --- | --- |
| Tiny change | `Last Wrap-Up` only, or no write |
| Small adjustment | `Current Judgment` and `Next Likely Move` |
| Standard direction switch | `Current Judgment`, `Boundary`, `Next Likely Move`, and `Last Wrap-Up` |
| Major product pivot | Add `Decision notes`, `Rejected options`, and `Reason for change` |
| Different long-term problem | Suggest a new Working Thread instead of overloading the current one |

Keep the draft short. Preserve judgment and boundary, not a meeting transcript.

Example draft for a confirmed standard direction switch:

```md
## Current Judgment

We intentionally switch from Skill-First validation to a minimal Core/MCP contract slice.

## Boundary

- Do not implement plugin packaging yet.
- Do not implement Hermes adapter yet.
- Keep this as a contract/design slice, not full runtime expansion.

## Next Likely Move

Design the smallest Core/MCP contract that can express Working Thread read/write, drift classification, and wrap-up.

## Last Wrap-Up

User confirmed a direction switch from Skill-First validation to Core/MCP contract exploration. Plugin packaging remains deferred until the contract is stable.
```

## Challenge After Completion

Use this as the primary demo path.

When a focused execution session or implementation pass completes:

1. Separate mechanism success from product proof.
2. Ask whether the result actually validates the product feeling.
3. Suggest a fresh-session check, read-only review, or user calibration.
4. Write back the changed judgment only after user confirmation.

Example:

```text
This implementation appears complete, but I think this is a Challenge Moment.
The tests prove the skill behavior was updated. They do not prove the Challenge Layer feels self-initiating or companion-like in a real session.
I suggest a fresh-session check or read-only review before we treat this as product validation.
```

## Layered Wrap-Up

Wrap-up is a phase-end continuity update. It is not a chat summary, meeting transcript, or task log.

Default write-back fields:

```text
Last Wrap-Up
Current Judgment
Boundary changes
Open Questions
Next Likely Move
```

For major direction changes, add:

```text
Decision notes
Rejected options
Reason for change
```

Durable write-back requires user confirmation.

Trigger wrap-up when:

- the user explicitly asks;
- a design choice is accepted;
- subjective calibration ends;
- the user says approved, recognized, continue next time, or stop here;
- the conversation switches to another Working Thread;
- Current Judgment, Boundary, Open Questions, or Next Likely Move changed.

Small routine changes should not trigger proactive wrap-up.
