# MCP Layer Value Calibration

Status: completed
Date: 2026-06-25

## Goal

Assess whether the Minimal MCP Server adds real product value beyond the Codex skill/plugin layer, without treating successful implementation as proof of Along's product thesis.

This is a product calibration pass, not an implementation plan.

## Current Evidence

Validated layers so far:

- Skill-First V1: packaged personal plugin can restore documented Working Thread context, stay quiet for ordinary factual requests, challenge drift, and preserve confirmation discipline.
- Minimal MCP Server: a real MCP SDK client can read Working Thread resources, call action tools, propose updates, and apply confirmed section patches in a disposable workspace.
- Schema Alignment: real long-running Working Thread records can now keep appendix history while preserving strict canonical write-back.

Important anti-self-certification constraint:

Along's own records and explanations are useful evidence, but they remain weaker than user subjective experience and controlled baseline comparisons.

## What MCP Adds Beyond Skill/Plugin

### 1. A Real Capability Boundary

The skill/plugin layer changes how Codex behaves. It guides the agent to read records, challenge drift, and ask for confirmation.

The MCP layer exposes actual callable capability:

- list/read Working Thread summaries and records as resources;
- classify drift through a deterministic tool;
- draft wrap-up payloads;
- create update proposals;
- apply confirmed write-back with stale conflict handling.

This matters because the behavior is no longer only prompt discipline. It becomes an interface another agent or client can call.

### 2. Safer Write-Back Mechanics

The skill can tell an agent to ask for confirmation before writing. The MCP server can enforce parts of that boundary:

- explicit confirmation envelope;
- proposal id matching;
- base version / stale proposal checks;
- path confinement under `docs/along/working-threads/`;
- section-patch-only mutation;
- malformed-record write rejection.

This is a meaningful increment over docs-only or skill-only behavior. It makes durable continuity safer and less dependent on every individual agent following instructions perfectly.

### 3. Cross-Agent Potential

The skill/plugin path is currently Codex-specific. The MCP server is a more general local interface.

In principle, any MCP-capable client could access the same Working Thread resources and tools. This is the strongest reason MCP belongs in Along's architecture: it can become the neutral substrate for existing agents, rather than another Codex-only prompt package.

This is only potential for now. We have not yet validated Hermes, Claude Code, or other clients.

### 4. Better Separation Of Roles

MCP helps separate:

- agent natural-language judgment;
- Along's local structured continuity;
- write-back safety checks;
- persistent docs-backed state.

That separation fits Along's positioning as a companion layer for existing agents rather than a new standalone coding agent.

## What MCP Does Not Add Yet

### 1. True Self-Initiation

The MCP server does not wake up, watch, schedule, notify, or initiate work.

It only responds when a client calls it. Therefore it does not solve the deeper self-initiation goal.

Current self-initiation remains turn-bound:

- the agent resumes context when asked;
- the agent challenges drift during a conversation;
- the agent proposes wrap-up at a boundary.

### 2. Living Presence Or Companionship

The MCP layer has no presence surface, no ambient state, no relationship mode, no emotion simulation, and no proactive companion behavior.

It may support future companionship by preserving continuity more safely, but it does not create companion feeling by itself.

### 3. Product Differentiation On Its Own

An MCP server is infrastructure. It is not the user-facing reason to care about Along.

If Along only becomes "a Working Thread MCP server," the product becomes useful but not emotionally or conceptually distinctive. The differentiator still has to be:

- self-initiation;
- continuity;
- companion-like presence;
- helping existing agents stay aligned with the user's real project arc.

### 4. Proof Of Cross-Agent Value

The server is compatible with the MCP model, but actual cross-agent usefulness is not yet validated.

We have not tested:

- Hermes using the server;
- Claude Code using the server;
- another MCP client reading and updating the same Working Thread;
- multi-client conflict behavior in a real workflow.

## Calibration Judgment

The MCP layer is valuable, but it is a **substrate**, not the product experience.

It should remain in the architecture because it provides:

- a real interface beyond prompt instructions;
- safer confirmed write-back;
- future cross-agent portability;
- a clean boundary between agent judgment and Along state.

However, the MCP layer should not become the next expansion focus by default. Expanding MCP before validating user-facing value risks turning Along into an infrastructure project and drifting away from the original goal: self-initiation and companionship.

## Recommended Next Direction

Do not immediately expand Core/MCP.

The next useful pass should be one of these:

1. **MCP Client Integration Guide**
   - Small, practical documentation showing how an MCP-capable client should connect to `mcp:working-thread`.
   - Good if the next goal is making the current layer reproducible.
   - Low product-risk, but mostly technical.

2. **Existing-Agent Self-Initiation Product Pass**
   - Design how a user actually experiences Along when using Codex/Hermes/Claude Code.
   - Focus on when Along appears, what it says, how it avoids noise, and how Working Threads feel companion-like rather than procedural.
   - Best aligned with the original product thesis.

3. **Cross-Agent Validation Spike**
   - Try one non-Codex MCP-capable client if available.
   - Test whether the server's resources/tools are understandable outside Codex.
   - Useful, but only if the client setup is available without a large toolchain detour.

Recommended choice:

Proceed with **Existing-Agent Self-Initiation Product Pass** before more engineering expansion.

Reason:

We now know the infrastructure can work. The bigger risk is not implementation feasibility. The bigger risk is that Along becomes a technically correct coordination layer that still does not feel self-initiating or companion-like.

## Decision Boundary

Before implementing any new runtime, adapter, expanded MCP tool, scheduler, notification system, or presence layer, the project should answer:

```text
What does the user experience that makes Along feel self-initiating and companion-like while using existing agents?
```

Until that is clearer, MCP should stay minimal and stable.

## Push Recommendation

Do not push solely because the engineering layer passed.

Push after either:

- the user wants remote backup of the current stable local state; or
- the next product pass records a clear direction and the local history represents a coherent checkpoint.

Current recommended state:

- keep `main` local;
- continue with product calibration;
- push after the next direction decision if the user wants the remote updated.
