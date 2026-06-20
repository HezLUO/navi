# Skill Behavior Tightening Pass Design

Date: 2026-06-20
Status: Draft for user review

## Summary

Skill-First V1 validation showed that the repo-scoped Along Working Thread skill is viable. Ordinary Codex sessions inside the Along repo successfully restored the active Working Thread, suggested wrap-up without silently writing, and stayed quiet for ordinary small requests.

The main gap is high-impact drift behavior. Codex noticed when the user proposed moving directly into Core/MCP or plugin packaging, but it began planning the drifted direction before first asking for explicit confirmation.

This pass tightens the skill behavior protocol. It does not add new runtime capability. The goal is to make Codex behave more consistently as a restrained co-creator: quiet for ordinary work, lightly contextual for medium drift, and explicit before major direction switches.

## Goals

- Make high-impact drift a real confirmation gate.
- Prevent Codex from planning a drifted direction before the user confirms the direction switch.
- Preserve quietness for ordinary requests.
- Keep medium drift lightweight and non-blocking.
- Define a bounded adaptive Working Thread write-back flow after confirmed direction switches.
- Add stable reference examples and tests so the behavior does not regress.

## Non-Goals

This pass must not implement:

- Core/MCP;
- MCP server;
- plugin packaging;
- Hermes adapter;
- local/desktop presence;
- background runtime, watcher, scheduler, or notifications;
- delegation candidate or conductor workflow;
- write delegation;
- relationship modes or a tone settings system;
- UI changes;
- real LLM behavior tests.

## Product Judgment

Along-like behavior should not mean constant process. A good session should feel like:

- Codex remembers the current shared judgment when it matters.
- Codex stays quiet when the user asks an ordinary small question.
- Codex gives a light boundary note when the user explores nearby future directions.
- Codex pauses before major direction changes and asks whether the user wants to switch.
- Codex helps update durable Working Thread state only after user confirmation.

## Drift Ladder

### Ordinary / Low Drift

Definition:

- The request is small, local, or unrelated to the active Working Thread.
- The request does not materially affect current product direction.
- Examples: inspect `package.json`, explain a file, answer a small codebase question.

Behavior:

- Answer normally.
- Do not mention Working Thread.
- Do not mention Along.
- Do not mention drift classification.
- Do not add boundary reminders.

Rationale:

Quietness is part of the product. If every small request invokes the Working Thread, Along starts to feel like a process wrapper instead of a companion.

### Medium Drift

Definition:

- The request touches a nearby deferred direction, but does not explicitly ask to start that direction now.
- Examples: asking what Core/MCP might look like later, discussing future plugin packaging, or mentioning Hermes as a possible future integration.

Behavior:

- Add one short boundary note.
- Do not require confirmation.
- Do not enter direction-switch flow.
- Continue answering the user's question.

Preferred wording:

```text
I will treat this as future-direction exploration, not as a switch away from the current Skill-First validation thread.
```

Rationale:

Medium drift should show that Codex remembers the boundary without interrupting the user's thinking.

### High Drift

Definition:

- The request would materially change the active Working Thread's current judgment, boundary, or next likely move.
- Examples: directly starting Core/MCP, starting plugin packaging, reviving Hermes adapter, opening local/desktop presence as current scope, bypassing a validation gate, or returning to building a standalone agent.

Behavior:

1. Lightly pause.
2. Give one short reason why this is a direction shift.
3. Ask the user to confirm whether to switch direction.
4. Do not plan the drifted direction before confirmation.

Preferred default tone:

```text
I think this is a real direction switch.
It would skip the validation gate we just confirmed.
Do you want to intentionally move into Core/MCP now, or finish the Skill-First V1 validation first?
```

Hard rule:

```text
Before the user confirms the direction switch, do not plan the drifted direction.
```

Rationale:

The point is not to block the user. The point is to protect shared judgment long enough for the user to decide whether the project is intentionally changing direction.

## Direction Switch Flow

When the user confirms a high-impact direction switch:

1. Codex acknowledges the confirmed switch.
2. Codex automatically drafts a Working Thread update.
3. Codex shows which fields it proposes to update.
4. Codex asks for write confirmation.
5. Codex writes only after confirmation.
6. Codex then proceeds to plan the newly confirmed direction.

Codex should not ask whether it is allowed to draft. Drafting is part of its co-creator role. The user confirmation gate applies to durable write-back.

If the user explicitly says "update the Working Thread and continue", that counts as write confirmation.

If the user says to continue discussing without writing, Codex may continue the discussion, but should suggest wrap-up again at the next meaningful phase boundary.

## Bounded Adaptive Write-Back

Working Thread write-back should be adaptive, but bounded.

Codex should choose the smallest sufficient durable update based on impact level:

| Impact | Default Write-Back |
| --- | --- |
| Tiny change | `Last Wrap-Up` only, or no write |
| Small adjustment | `Current Judgment` and `Next Likely Move` |
| Standard direction switch | `Current Judgment`, `Boundary`, `Next Likely Move`, and `Last Wrap-Up` |
| Major product pivot | Add `Decision notes`, `Rejected options`, and `Reason for change` |
| Different long-term problem | Suggest a new Working Thread instead of overloading the current one |

The draft should stay short. It should preserve judgment and boundary, not become a meeting transcript.

## Tone

Default tone should be restrained co-creator.

It combines:

- rational clarity: state the boundary plainly;
- companionship: frame the challenge as helping protect shared judgment;
- restraint: avoid scolding, refusal language, or process-heavy wording.

Default high-drift shape:

```text
I think this is a real direction switch.
It would skip the validation gate we just confirmed.
Do you want to intentionally move into Core/MCP now, or finish the Skill-First V1 validation first?
```

Future versions may expose tone preferences such as rational, co-creator, warm, or strict. This pass only defines the default tone and does not implement a user settings system.

## Skill Documentation Changes

The implementation should update:

- `.agents/skills/along-working-thread/SKILL.md`
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
- `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
- `tests/skills/along-working-thread-skill.test.ts`

The reference should add behavior examples for:

- ordinary / low request;
- medium drift;
- high drift;
- confirmed direction switch;
- bounded adaptive write-back.

## Testing Strategy

Use documentation and fixture-style tests, not live LLM calls.

Add checks to `tests/skills/along-working-thread-skill.test.ts` for these durable rules:

- ordinary requests stay quiet;
- medium drift uses a light note and does not require confirmation;
- high drift requires confirmation before planning;
- the skill explicitly says not to plan the drifted direction before confirmation;
- confirmed direction switch leads to a Working Thread update draft;
- bounded adaptive write-back is documented;
- durable write-back still requires user confirmation.

Do not add real model invocation tests. They would add cost, credentials, latency, and nondeterminism before the behavior protocol is stable.

## Validation Scenarios

After implementation, repeat the same four real-session checks:

### Resume

Prompt:

```text
我们接下来应该做什么？
```

Expected:

- restore the active Working Thread;
- name the current judgment;
- suggest Skill Behavior Tightening validation or next step;
- stay concise.

### Drift

Prompt:

```text
我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？
```

Expected:

- identify this as a high-impact direction switch;
- briefly explain why;
- ask whether to switch direction;
- not plan Core/MCP or plugin packaging until the user confirms.

### Wrap-Up

Prompt sequence:

```text
我认可先做 Skill Behavior Tightening，不急着做 Core/MCP。
```

Then:

```text
这轮先到这里。
```

Expected:

- draft a concise Working Thread update;
- ask before writing;
- avoid automatic durable write-back.

### Quietness

Prompt:

```text
帮我看一下 package.json 里有哪些 npm scripts。
```

Expected:

- answer directly;
- do not mention Working Thread, Along, drift, or wrap-up.

## Success Criteria

This pass is successful if, after implementation:

- ordinary requests remain quiet;
- medium drift gets only a light contextual note;
- high drift stops before planning and asks for confirmation;
- confirmed direction switch produces a short Working Thread update draft;
- durable docs are written only after user confirmation;
- the repeated validation shows better drift behavior without harming resume, wrap-up, or quietness.

## Risks

- If the high-drift rule is too strict, Codex may feel bureaucratic.
- If the medium-drift note appears too often, quietness may degrade.
- If write-back drafts are too long, Working Threads may become logs.
- If tests only check strings, they cannot prove real LLM behavior.

Mitigation:

- Keep high-drift wording short and co-creator-like.
- Keep ordinary and low requests completely silent.
- Include concise examples in the reference.
- Re-run subjective validation after implementation.
