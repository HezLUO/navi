# Navi Non-Expert Progress Map Design

Date: 2026-06-27
Status: Draft for user review

## Summary

Navi is Along's first customer-facing product surface for non-expert users supervising expert agents.

The short-term product concept is **Progress Map**: when a user asks what is happening, what comes next, whether to continue, or says they do not understand the current progress, Navi translates the agent's work into a map the user can supervise.

The V1 product promise is:

```text
Navi helps non-expert users understand, supervise, and steer expert agents.
```

Navi is not a new agent. It is an Along experience layer built on the existing Working Thread and Challenge Layer behavior. Challenge Moment remains important, but it becomes Navi's risk-escalation mechanism rather than the main customer-facing concept.

## Product Context

Many users now work with agents in domains where the agent may know more than they do. Software development is the first concrete example, but the pattern is broader: legal review, data analysis, research, design, finance, operations, and other expert-agent workflows can all put a non-expert user in charge of a specialized agent they cannot fully evaluate.

In that situation, the user's problem is not only lack of status updates. The deeper problem is loss of supervisory control:

- the user cannot tell whether completed work is visible product progress or internal preparation;
- the user does not know whether the agent's next suggestion is actually necessary;
- the user does not know how far the work is from the original goal;
- the user cannot tell whether the work has drifted away from the need;
- the user does not know when to inspect, test, accept, reject, or pause;
- the user does not know what to ask for next;
- the user does not know when to request testing, review, subagents, or phased validation;
- the user does not know where "continue" will lead.

Challenge Layer V1 proved a useful narrower behavior: Along can challenge self-certifying momentum and turn questionable judgments into validation. Navi expands that behavior into a more useful default experience for non-expert users. It gives the user a map first, and escalates into a Challenge Moment when the map reveals risk.

## Goals

- Define Navi as Along's first customer-facing product surface.
- Focus V1 on non-expert progress understanding and supervisory control.
- Make Progress Map the default response when the user asks about progress or next steps.
- Preserve Challenge Moment as a risk-escalation mechanism inside Navi.
- Help users understand why the next step matters instead of only telling them what to do.
- Help users know what they need to confirm, inspect, or ask the agent to validate.
- Keep V1 lightweight enough to implement through the existing skill/plugin behavior.
- Record broader non-expert decision support, agent-use coaching, and structured progress state as later roadmap work.

## Non-Goals

This design must not:

- turn Navi into a standalone general agent;
- replace Codex, Hermes, Claude Code, or other expert agents;
- add a new UI in V1;
- add background monitoring, watcher, scheduler, notification, or desktop presence behavior;
- require a Working Thread schema change for the first implementation;
- make every answer a project management report;
- teach prompting in every response;
- claim that Navi can automatically give the final correct decision in every professional domain;
- replace necessary legal, medical, financial, engineering, or other high-risk professional review.

## Product Positioning

Along is the broader product and long-term companion layer. Navi is the first concrete customer-facing product surface under Along.

The product relationship is:

```text
Along
  -> Working Thread: durable judgment, goal, boundary, and continuity record
  -> Challenge Moment: risk escalation when momentum may be misleading
  -> Navi: non-expert progress and decision guidance experience
```

Customer-facing positioning should lead with Navi, not Challenge Moment:

```text
Navi helps non-expert users understand, supervise, and steer expert agents.
```

Challenge Moment remains an internal or advanced concept. Customers should experience it as Navi noticing that the current path may be risky and suggesting a more reliable next step.

## Target User

Navi V1 targets users who are responsible for outcomes in a domain where they lack enough expertise to supervise the agent confidently.

The first concrete user is a non-technical person using Codex to design and build software. They may discuss design intent with the agent but struggle to understand implementation progress, technical tradeoffs, testing status, or whether their original requirement is actually being satisfied.

The same pattern should later generalize to other domains, but V1 should not pretend to have domain-complete judgment across all expert fields.

## Default Behavior: Progress Map

When the user asks "what should we do next?", "what is the current progress?", "should we continue?", "where are we?", or otherwise signals that they do not understand the current state, Navi should not jump straight to another task recommendation.

It should first provide a Progress Map.

Recommended structure:

```text
Current position:
We are currently in <stage>.

Completed:
- <completed item>
- <completed item>

What this means for your goal:
- <plain-language meaning>

Still missing:
- <remaining item>
- <remaining item>

Recommended next step:
<next step>, because <reason>.

What you need to confirm now:
<one decision, inspection, or acceptance action the user can actually make>
```

If there is a meaningful risk, add one concise risk marker:

```text
Main risk:
<risk and why continuing blindly may be costly>
```

The default personality is:

- **Project navigator** by structure: orient the user on the map.
- **Warm supervisor** by tone: protect the user from being carried along by opaque expert work.
- **Professional advisor** when risk appears: give clearer judgment when the next step is unsafe or premature.
- **Agent-use coach** only when the user is visibly confused or asks how to use the agent better.

## Scope And Triggering

V1 supports Progress Map primarily when the user explicitly asks:

- what should we do next;
- what is the current progress;
- should we continue;
- are we done;
- what remains;
- I do not understand the current progress.

Future versions may trigger Progress Map proactively at phase boundaries or after repeated confusion signals. V1 should not overreach into constant status reporting.

If context is insufficient, Navi should not invent project state. It should say what it can infer and request or inspect the relevant source:

```text
I can only infer the current progress from this conversation. To give you a reliable map, I need to inspect the project record, recent changes, or active plan.
```

## Challenge Moment Inside Navi

Navi's default experience is Progress Map. Challenge Moment becomes the escalation behavior when the map reveals risk.

V1 Challenge Moment triggers inside Navi include:

- the work is drifting away from the user's original goal;
- the agent's proposed next step does not match the current stage;
- the user wants to keep implementing before a key acceptance check;
- the user or agent treats implementation completion as requirement satisfaction;
- most completed work is internal preparation, but the user thinks visible product progress is done;
- the user repeatedly says "continue", "then what", or "next" without a clear acceptance point;
- the agent suggests more work without explaining why it is necessary;
- the agent expands scope before the user understands the impact.

Challenge Moment should appear as part of the map, not as a separate lecture:

```text
Current position:
We have completed part of the internal implementation, not a user-verifiable product result.

Main risk:
If we continue adding features now, you may expand scope before confirming whether the core experience matches your original need.

More reliable next step:
Ask the agent to show a version you can try, then confirm whether it satisfies the first user flow.
```

## Professional Judgment Boundary

Navi exists because non-expert users need help with professional judgment. V1 must help with that problem, but its promise should be process reliability rather than omniscient domain correctness.

Navi should:

- point out unclear requirements;
- point out unsupported agent recommendations;
- distinguish internal work from user-verifiable progress;
- flag next steps that are premature, too broad, goal-drifting, or insufficiently validated;
- ask the agent to provide tradeoffs, cost/risk explanation, acceptance criteria, or read-only review;
- recommend expert review in high-risk domains when needed.

Navi should not:

- claim it can automatically decide the final correct answer in every domain;
- pretend certainty when evidence is missing;
- replace legal, medical, financial, engineering, or other high-risk professional responsibility;
- treat "the agent says so" as sufficient evidence;
- let the user continue blindly when they clearly do not understand the state.

The working principle is:

```text
Navi does not pretend the user understands the expert domain.
Navi helps the user supervise whether the agent's professional judgment is reliable enough to continue.
```

## V1 Implementation Shape

V1 should be implemented as behavior in the existing Along Working Thread / Challenge Layer skill and plugin.

It should not require:

- new runtime behavior;
- new UI;
- new MCP resources or tools;
- new Working Thread schema fields;
- background monitoring;
- automatic write-back.

The first implementation can update the skill and reference docs so that progress/next-step questions produce a Progress Map and risk cases produce a Challenge Moment inside that map.

## Roadmap

Later Navi versions should consider:

- adding structured Progress Map fields to Working Thread records;
- triggering Progress Map proactively when a phase ends;
- triggering Progress Map after repeated confusion signals;
- stronger Decision Challenge for product requirements, technical approach, execution path, cost, risk, and validation quality;
- Agent Use Coaching for prompting, review requests, testing, subagent use, decomposition, and acceptance criteria;
- domain-specific Navi variants such as software, legal, research, data, design, or operations;
- a richer UI only after the conversational behavior proves valuable.

## Success Criteria

Navi V1 is successful if a non-expert user can say:

- "I know where we are now."
- "I understand what has actually changed."
- "I understand what still does not exist."
- "I understand why the next step is necessary."
- "I know what I should inspect or decide before continuing."
- "Navi stopped me from blindly following the agent into unclear work."

Navi V1 is not successful if:

- it merely gives another next-step suggestion without orienting the user;
- it becomes a verbose project management report;
- it teaches prompting in every answer;
- it challenges constantly without helping the user understand the map;
- it claims expertise it cannot justify;
- the user still has to repeatedly ask what is happening and when the work ends.

## Validation

V1 should be validated subjectively in real sessions and with fresh-session checks.

Priority prompts:

```text
接下来我们应该做什么？
```

Expected: Navi gives a Progress Map before recommending more work.

```text
现在做到哪了？我看不懂。
```

Expected: Navi distinguishes visible progress from internal preparation and says what the user can inspect.

```text
继续吧。
```

Expected: If there is no clear acceptance point, Navi asks whether the current stage has been verified before blindly continuing.

```text
这个方案可以吗？我不懂技术。
```

Expected: Navi explains what evidence is missing and asks the agent for tradeoffs, risks, or review instead of pretending certainty.

Calibration should ask whether the answer gave the user more control, whether it was understandable, whether it avoided unnecessary teaching, and whether the challenge felt useful rather than obstructive.
