# Skill-First V1 Validation Report

Date: 2026-06-20
Status: Completed validation report
Related Working Thread: `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`

## Summary

Skill-First V1 is effective enough to continue. In ordinary Codex sessions inside the Along repo, the new repo-scoped skill showed clear Along-like behavior for resume, wrap-up, and quietness. The main weakness is drift challenge behavior: Codex noticed the drift, but started planning the new direction before first asking for explicit confirmation.

Recommended next step: do a **Skill Behavior Tightening Pass** before Core/MCP, plugin packaging, Hermes adapter, local/desktop presence, or background runtime.

## Validation Method

The user opened ordinary Codex sessions in the Along project folder and did not frame them as focused execution sessions.

The validation used four scenarios:

- Resume: ask what to do next.
- Drift: propose moving directly into Core/MCP or plugin packaging.
- Wrap-up: confirm the current validation direction and end the round.
- Quietness: ask for `package.json` npm scripts.

The user provided screenshots of the sessions for review.

## Results

| Scenario | Result | Judgment |
| --- | --- | --- |
| Resume | Pass | Codex restored the Working Thread and current judgment without starting from scratch. |
| Drift | Partial pass | Codex detected the direction shift, but moved into planning before confirmation. |
| Wrap-up | Pass | Codex drafted a durable write-back and waited for confirmation before writing. |
| Quietness | Pass | Codex answered a normal `package.json` question without over-triggering Working Thread behavior. |

## Observations

### Resume

The session restored `Existing-Agent Self-Initiation Layer`, named the current judgment as Codex-first, skill-first, and docs-backed, and restated the current validation gate. It also avoided a long history dump and suggested using the next step to validate the behavior.

This is the strongest evidence that the skill-first approach can produce turn-bound self-initiation inside ordinary Codex sessions.

### Drift

The session correctly recognized that moving directly into Core/MCP or plugin packaging would cross the current validation boundary. It also stated that doing so would be an explicit direction shift rather than a minor adjustment.

The weakness is that it immediately proposed a next implementation sequence: a Core/MCP contract-first slice followed by plugin packaging. That is too permissive for the intended drift challenge. A high-impact drift should first pause and ask whether the user wants to intentionally switch direction.

Desired behavior:

```text
This crosses the current validation gate.
Do you want to intentionally switch direction into Core/MCP or plugin packaging now,
or continue validating Skill-First V1 first?
```

Only after the user confirms the switch should Codex plan the new direction.

### Wrap-Up

The session recognized a meaningful phase boundary and proposed a Working Thread write-back. After the user said to stop there, it did not write to the record because durable write-back had not been confirmed.

This behavior matches the design: proactive wrap-up suggestion, user confirmation before durable docs, and no automatic logging.

### Quietness

The session answered the npm scripts question directly and did not invoke Working Thread behavior. This is important because Along-like behavior should not make every small request feel like process.

## Product Judgment

Skill-first is a viable validation layer. It cannot provide true background self-initiation, but it can make Codex behave more like an Along co-creator inside active sessions.

The evidence supports continuing with skill-first validation and tightening the skill before adding deeper infrastructure.

## Experience Gaps

1. Drift challenge must become a real confirmation gate.
   - It should not immediately plan the drifted direction.
   - It should ask the user to confirm the direction switch first.

2. Drift challenge tone needs refinement.
   - It should feel like a co-creator protecting shared judgment, not a rule engine.

3. Resume behavior should stay short.
   - The first validation result was good, but future revisions should avoid turning resume into a report.

4. Wrap-up drafts should stay judgment-oriented.
   - The wrap-up behavior worked, but future prompts should continue to avoid meeting-note style summaries.

## Recommendation

Do not proceed directly to Core/MCP or plugin packaging.

Next: design a **Skill Behavior Tightening Pass** focused on:

- high-impact drift confirmation before planning;
- concise co-creator wording;
- clearer distinction between soft note, drift challenge, and direction switch;
- preserving quietness for ordinary requests;
- validation examples for resume, drift, wrap-up, and quietness.

After that tightening pass is validated, decide whether the next layer should be plugin packaging or a minimal Core/MCP contract slice.

## Boundary

This validation does not approve:

- Core/MCP implementation;
- plugin packaging;
- Hermes adapter;
- local/desktop presence;
- background runtime;
- delegation or write delegation;
- relationship modes or emotional simulation.
