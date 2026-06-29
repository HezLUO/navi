# Along

Along is the parent project for Navi.

Navi is the current V1 product surface: it helps non-expert users understand, supervise, and steer expert agents. Its current behavior is **Progress Map + Challenge Layer**. Progress Maps answer where the user's target project stands, what is missing, what comes next, and what the user needs to confirm. Challenge Layer behavior appears when the map reveals drift, weak assumptions, premature execution, or self-certifying momentum.

## Current V1 shape

- Codex skill/plugin behavior with project-local docs.
- Navi Progress Maps for progress, next-step, continue, confusion, and plan-reliability questions.
- Rhythm Maps for flowing long-running projects with recurring cycles, waiting states, and decision gates.
- Challenge Layer behavior for anti-self-certification moments.
- Working Thread continuity for project judgment that needs durable carry-forward.
- Project-local Navi initialization through `AGENTS.md` and `docs/along/project-maps/`.
- No background autonomy, notifications, or always-on presence in V1.

## Architecture boundary

Current V1 uses skill/plugin behavior with project-local docs. MCP, runtime, local app, background presence, companion memory, and adapter surfaces are experimental or later layers unless explicitly called out for a focused validation pass.

The repository still contains older Along companion ideas, including local memory, Shared Desk, soundscape, and `.along/` runtime concepts. Treat those as historical or future-facing context, not the current recommended Navi installation path.

## Development

```bash
npm install
npm test
npm run typecheck
npm run web
```

In another terminal:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

## Demo Flow

1. Start the local server.
2. Open the Shared Desk.
3. Along chooses one small curiosity.
4. Along shows what it is reading.
5. Ask Along one question or correct one assumption.
6. Wrap up and inspect `.along/journal/` and `.along/graph/`.

## Safety Boundary

Along may read bounded project context, remember, and suggest. It does not modify project code, create branches, make commits, or run broad shell commands in the MVP.
