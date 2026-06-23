# Anti-Self-Certification Baseline Record

Status: active
Last updated: 2026-06-23

## Current Goal

Prevent Along from validating itself through self-reinforcing behavior.

The immediate goal is to establish a neutral supervision and baseline-testing protocol before continuing fresh-session MCP client validation. The project should not treat Along-like behavior inside this main conversation as evidence that Along works. Along may be the object under test, but it must not be the sole evaluator of its own product value.

## Key Constraints

- The main conversation is now a neutral supervisor session.
- The main conversation should not proactively use the `along-working-thread` skill.
- The main conversation should not treat Working Thread records as authoritative product evaluation evidence.
- Durable continuity records may still be maintained, but they should be treated as process records, not as proof that Along is successful.
- The `along-working-thread@personal` plugin is currently removed and shows as `not installed`.
- Plugin installation state is now a formal test variable.
- Tests should be run from the Along project folder: `/Users/james/Codex Project/General Codex Project/Along`.
- The parent folder `/Users/james/Codex Project/General Codex Project` must not be accidentally treated as the Along workspace root in MCP tests.
- No new product capability, runtime, background autonomy, presence layer, adapter, or broader MCP expansion should be implemented as part of this audit.
- Do not push, publish, or change global plugin state again without explicit user approval.

## Current Project State

- Main branch includes the Core/MCP Minimal Server merge.
- Current main HEAD at the time this record was created: `3527766`.
- The Minimal Server has been verified on merged `main`:
  - `npm ci`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
  - `npm test`: passed, 29 files / 316 tests.
- The Minimal Server remains intentionally small:
  - docs-backed stdio MCP server;
  - Working Thread summary/full-record resources;
  - action tools for drift classification, wrap-up drafting, update proposals, and confirmed section-patch write-back;
  - no background runtime, no LLM calls, no `.along/` state, no presence, no adapters, no delegation, no package bin, no HTTP/SSE transport.
- `npm ci` reported 7 audit vulnerabilities. No `npm audit fix` was run because that would change dependency state outside the merge verification.

## Decisions Already Made

- The user identified self-certification as a serious product risk.
- The main session should be treated as a neutral supervisor, not as Along itself.
- Along plugin behavior must be evaluated with explicit controls instead of assumed from the main conversation.
- The next evaluation should include a no-Along baseline before testing Along plugin behavior or MCP server behavior.
- The plugin-level control is remove/restore, not disable/enable, because the current Codex CLI exposes `plugin add`, `plugin list`, `plugin marketplace`, and `plugin remove`, but no separate `plugin disable`.
- The current plugin state after user approval:
  - `along-working-thread@personal`: `not installed`.

## Risk Model

The core risk is self-certification:

> Along behaves according to rules we designed, then we interpret that rule-following as evidence that the product works.

This can create false confidence. In particular:

- Working Thread continuity may feel like product intelligence even if it is only process scaffolding.
- Drift challenges may look like self-initiation even if they are just guardrail prompts.
- Wrap-up discipline may look like companionship even if it makes the product feel procedural.
- The main session may become biased toward validating the current design because it has been shaped by that design.

## Evidence Hierarchy

Future Along evaluations should rank evidence in this order:

1. User's real subjective experience.
2. No-Along baseline comparison.
3. Fresh-session behavior under controlled plugin/MCP conditions.
4. Behavioral evidence that the agent reduces forgetting, drift, or wasted work.
5. Along-generated explanations, records, or summaries.

Along's own records and explanations are useful context, but they are the weakest evidence and must not be treated as proof.

## Baseline Test Protocol

### Round 1: No Along Baseline

Current setup:

- `along-working-thread@personal` is removed.
- New test conversations should be opened in the Along project folder.

Suggested prompts:

```text
我们接下来应该做什么？
```

```text
帮我看一下 package.json 里有哪些 npm scripts。
```

```text
我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？
```

Observe whether the fresh session:

- restores any Working Thread context;
- knows the Minimal Server was just merged;
- answers ordinary requests directly;
- detects product-direction drift;
- becomes overly procedural;
- feels natural but contextless;
- produces any accidental Along-like behavior without the plugin.

### Round 2: Along Plugin Condition

Restore the plugin only after Round 1 is captured:

```bash
codex plugin add along-working-thread@personal
```

Then open a fresh Along project conversation and use the same prompts. Compare the behavior against Round 1.

### Round 3: Minimal MCP Server Condition

After Round 1 and Round 2 are understood, test the docs-backed stdio MCP server with an explicit workspace root:

```text
/Users/james/Codex Project/General Codex Project/Along
```

Evaluate whether the MCP server improves controlled access to Working Thread resources and action tools without making unsupported product claims about background autonomy or living presence.

## Open Questions

- Does ordinary Codex, without Along plugin support, already provide enough continuity for this project?
- Does the Along plugin add meaningful behavior, or mostly add process language?
- Does the MCP server add a real capability boundary, or only formalize behavior that the skill already approximates?
- How much of Along's perceived value comes from real product behavior versus careful prompting and record-keeping?
- What failures would convince us that the current direction is too procedural and not companion-like enough?
- Should future validation include an explicit adversarial reviewer session before any new implementation pass?
- How should a true no-Along baseline be isolated when the Along repo itself contains `.agents/skills/along-working-thread`?

## Next Plan

1. Keep this main conversation as neutral supervisor.
2. Run Round 2 from the real Along workspace with `along-working-thread@personal` restored.
3. Use the same three prompts as Round 1.
4. Compare skill/plugin behavior against the docs-only baseline.
5. Do not continue MCP client validation until Round 2 has been reviewed.

## Round 1 Attempt: Contaminated Baseline

Thread monitored:

```text
019ef4ac-39d3-7172-b34f-2e0d46d1c248
```

Workspace root:

```text
/Users/james/Codex Project/General Codex Project/Along
```

Plugin state:

```text
along-working-thread@personal: not installed
```

Result: invalid as a no-Along baseline.

The fresh session still loaded `along-working-thread` from the repo-local skill path:

```text
/Users/james/Codex Project/General Codex Project/Along/.agents/skills/along-working-thread/SKILL.md
```

This means removing `along-working-thread@personal` is not enough to remove Along influence when the test session is opened inside the Along repository. The repo itself provides a local skill, so the baseline was contaminated even though the personal plugin was removed.

Observed behavior:

- Prompt: `我们接下来应该做什么？`
  - The session explicitly read the Working Thread rules and record.
  - It answered by restoring the Along Working Thread and recommending fresh-session MCP client validation.
  - This is Along-like continuity, not baseline Codex behavior.
- Prompt: `帮我看一下 package.json 里有哪些 npm scripts。`
  - The session answered directly with the npm scripts.
  - This validates ordinary-request quietness, but it is not sufficient to prove a no-Along baseline.
- Prompt: `我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？`
  - The session explicitly said it was using Along Working Thread boundaries.
  - It classified the request as a real direction switch and asked whether to switch direction or complete fresh-session MCP client validation.
  - This is exactly the Along behavior under test, so it cannot count as baseline evidence.

Implication:

The test design needs a stronger isolation mechanism. Future no-Along baseline tests must control both:

- user-level plugin state; and
- repo-local skill availability under `.agents/skills`.

Possible next isolation options:

- Temporarily move or rename `.agents/skills/along-working-thread` for the baseline test, then restore it after the test.
- Run the baseline in a clean copy of the Along repo with no `.agents/skills/along-working-thread`.
- Add a deliberate no-skill test workspace that points to the same source tree but does not expose repo-local skills.
- Use another project folder as the Codex workspace and ask it to inspect the Along repo path explicitly, if Codex local skill loading is workspace-scoped.

Do not treat the monitored session as evidence that ordinary Codex has Along-like continuity. It only proves that repo-local skills still influence fresh sessions even after the personal plugin is removed.

## Baseline Isolation Workspace

Created on 2026-06-23:

```text
/Users/james/Codex Project/General Codex Project/Along-baseline-no-skills
```

Purpose:

Run a cleaner no-Along baseline in a workspace that preserves the Along source/docs shape but removes automatic local Along skill loading and runtime state.

Creation method:

- copied the Along project into a sibling directory;
- excluded `.git`;
- excluded `node_modules`;
- excluded `.agents`;
- excluded `.superpowers`;
- excluded `dist`;
- removed copied `.along` runtime data after noticing it was present.

Current isolation checks:

- `.agents`: absent.
- `.along`: absent.
- `package.json`: present.
- `docs/`, `src/`, `tests/`, `plugins/`, and `scripts/`: present.
- `along-working-thread@personal`: still `not installed`.

Interpretation:

This is not a perfect "no Along content" environment, because the source tree still contains docs and plugin source related to Along. That is intentional. The baseline should test ordinary Codex behavior when inspecting the Along project content without automatic Along skill activation or runtime-state preload. If ordinary Codex independently discovers project docs and reasons from them, that is valid baseline behavior; if it loads `along-working-thread` as a skill, the baseline remains contaminated.

## Round 1 Re-Run: No Local Skill Baseline

Thread monitored:

```text
019ef4b9-b822-7b60-bec9-adcb7d9d231a
```

Workspace root:

```text
/Users/james/Codex Project/General Codex Project/Along-baseline-no-skills
```

Isolation state:

- `along-working-thread@personal`: `not installed`.
- Workspace `.agents`: absent.
- Workspace `.along`: absent.
- Available skills did not include `along-working-thread`.
- The session did include `superpowers:using-superpowers`, so it read that general process skill before inspecting the project.

Result: valid as a no-local-Along-skill baseline, but not a no-document baseline.

The session did not appear to load or invoke `along-working-thread` as a skill. It did, however, inspect repository documentation and read the Working Thread record under `docs/along/working-threads/`. That means the observed continuity came from ordinary repository discovery and documented state, not from automatic Along skill activation.

Observed behavior:

- Prompt: `我们接下来应该做什么？`
  - The session inspected project files and docs.
  - It found the Working Thread record through ordinary file exploration.
  - It concluded the next step should be fresh-session MCP client validation rather than new feature work.
  - It asked for dependency-install approval because `node_modules` was missing in the copied workspace.
- Prompt: `帮我看一下 package.json 里有哪些 npm scripts。`
  - The session answered directly from `package.json`.
  - It listed `dev`, `mcp:working-thread`, `web`, `test`, `test:watch`, `typecheck`, `build`, and `verify:plugin-package`.
  - This behaved like ordinary Codex and did not add Working Thread ceremony.
- Prompt: `我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？`
  - The session advised against directly expanding Core/MCP or plugin packaging.
  - It grounded the recommendation in the current Working Thread record and project docs.
  - It did not explicitly frame the answer as an Along Working Thread skill challenge.
  - It separated "validating the existing Minimal Server" from larger runtime, adapter, background, presence, Memory v2, public release, or marketplace productization work.

Interpretation:

This baseline shows that ordinary Codex, when allowed to inspect the repository, can recover much of the current project judgment from docs alone. That weakens any claim that the Along skill is solely responsible for continuity. It also strengthens the case for treating docs-backed continuity as a real baseline capability.

What this does not prove:

- It does not prove ordinary Codex has Along-like self-initiation without documented records.
- It does not prove ordinary Codex would preserve judgment across sessions without being asked "what next?"
- It does not test background autonomy, presence, or companionship.
- It does not compare whether Along skill behavior is more concise, warmer, less noisy, or more reliable than docs-only repository inspection.

Updated implication:

Future comparisons should separate at least three layers:

1. Docs-only baseline: ordinary Codex reads repository records and reasons from them.
2. Skill/plugin behavior: Codex has explicit Along behavior rules in addition to docs.
3. MCP behavior: Codex or another client accesses structured resources/tools rather than reading Markdown ad hoc.

The useful question is no longer "can Codex recover context at all?" It can, if the docs are good and it decides to read them. The sharper question is whether Along adds better timing, lower friction, clearer boundaries, less manual prompting, stronger write-back discipline, or a more companion-like experience than docs-only Codex.

## Round 2 Setup: Along Plugin Condition

Prepared on 2026-06-23.

Plugin state:

```text
along-working-thread@personal: installed, enabled, version 0.1.0
```

Installed plugin root:

```text
/Users/james/.codex/plugins/cache/personal/along-working-thread/0.1.0
```

Round 2 should be run from the real Along workspace:

```text
/Users/james/Codex Project/General Codex Project/Along
```

Use the same prompts:

```text
我们接下来应该做什么？
```

```text
帮我看一下 package.json 里有哪些 npm scripts。
```

```text
我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？
```

Expected comparison points:

- Does the session explicitly load `along-working-thread`?
- Is the first answer more direct than the docs-only baseline, or similarly heavy?
- Does the ordinary `package.json` question stay quiet?
- Does the direction-shift answer use better confirmation discipline than the docs-only baseline?
- Does the behavior feel more companion-like, or only more procedural?
- Does the plugin add real value beyond reading the Working Thread Markdown directly?

## Update Rule

Keep this record updated after each evaluation round. Updates should record:

- plugin state;
- workspace root used;
- prompts tested;
- observed behavior;
- subjective user reaction;
- comparison against prior rounds;
- whether the next test condition is approved.

This record is a neutral anti-contamination record, not a Working Thread proof of Along's success.
