# Navi Post-Stabilization Real-Project Calibration Design

Date: 2026-07-15

Status: Approved in design discussion on 2026-07-15

## Purpose And Scope

This is narrow stabilization regression calibration. It answers whether the
complexity-stabilization refactor caused a material visible behavior regression
or new initialization burden.

Use Calibration mode only. This is not a full Navi product revalidation, alpha
release checklist, reuse of the old alpha.14 `state.md` calibration, or an
implementation plan. The superseded 2026-07-10 alpha.14 `state.md` protocol
must not be reused.

The calibration does not authorize:

- full tests or release checks;
- repeated sessions to force success;
- product implementation or target-project cleanup;
- trigger upgrades, `navi init`, or target-project writes;
- push, tag, publication, or release; or
- expansion into implementation planning.

## Selected Samples

Use exactly these two target projects.

### 1. Loopwright Clean, Uninitialized First Use

Target:
`/Users/james/Codex Project/General Codex Project/engineering_loop/engineering-loop-kit-transition-package`

This is a real clean Git repository with no project-local Navi initialization.
Observe whether first use is useful and quiet without forcing initialization.

### 2. `sub_ag_ski` Legacy, Dirty Compatibility

Target: `/Users/james/Codex Project/General Codex Project/sub_ag_ski`

Preserve its legacy Navi trigger, historical `docs/along` Project Map evidence,
ahead and untracked state, and user files. Observe compatibility, evidence
challenge, and non-interference.

Do not use `auto_model_reasoning`. Do not add a third sample without a new user
decision.

## Session Protocol

Run exactly one valid fresh session per selected project, with a maximum of two
valid sessions total.

The first prompt in each session is exactly:

> 接下来我们应该做什么？

Do not mention Navi, calibration, evidence files, read-time targets, output
fields, or source-thread history in that prompt.

After reading the completed first answer, ask one natural, project-specific
stop, continue, or phase decision based on the real decision exposed by that
answer.

If the first answer asks one genuinely necessary baseline question, the Main
Thread may present that real product question to the user and route the answer
directly back to the fresh task. The user must not become the information bus:
the Main Thread creates, reads, and messages fresh tasks directly.

If the first answer only pressures initialization and provides no useful
read-only help, record a burden failure and end the sample. Do not coach the
session to pass.

One replacement attempt is permitted only when an invalid host or environment
failure prevents a valid sample, such as task creation failure or the target
project not loading. Behavioral failure is valid evidence and must not be
rerun.

## Read-Only Boundary

The target projects are evidence, not calibration workspaces. Do not:

- run `navi init`;
- update project triggers or write Project Maps;
- clean, stage, or commit target-project state; or
- modify any target-project file.

Existing dirty state must remain unchanged. Global setup permission, if later
granted, does not authorize project-local initialization.

## Five Judgments Per Project

Record these five judgments for each valid sample.

1. **Orientation:** The project goal, current position, and major gap are
   basically correct. Uncertainty is explicit rather than hidden behind an
   invented stable Map.
2. **Decision:** The second answer gives a real user-judgeable decision, not a
   mechanical continuation or a recommendation to "test more."
3. **Quietness:** The answer uses the lightest useful structure, without a
   forced full map, fixed menu, or rule lecture.
4. **Truthfulness:** Loopwright does not pretend to have a confirmed Map.
   `sub_ag_ski` treats its legacy Map as historical evidence rather than current
   authority. Neither sample claims initialization or writes that did not
   occur.
5. **Burden:** The session creates no unnecessary initialization pressure,
   repeated questions, test loops, or meaningless-continuation friction. A
   suggestion to initialize later must not replace useful read-only help that
   is already available.

## Classification And Attribution

Classify each relevant observation as one of the following:

- **Material regression:** Navi misleads project direction, fabricates state,
  recommends unsafe or unapproved writes, or materially worsens use.
- **Minor friction:** Verbosity, slightly heavy structure, or extra reads that
  do not change the decision.
- **Project evidence gap:** The project lacks reliable records. Do not falsely
  attribute this condition to stabilization.
- **Host/environment failure:** Task, tool, or project loading invalidates the
  sample.

This method cannot prove causality or whole-system correctness. Attribute a
stabilization regression only when the behavior plausibly follows from the
archive, rule, or CLI ownership changes. Otherwise classify it as existing
product behavior, a project evidence gap, or a host/environment failure.

## Environment Gate

Before execution, record the exact Navi commit and the actual loaded Codex
skill or plugin source.

A read-only `navi doctor` run on 2026-07-15 found only
`along-working-thread@personal` installed, `navi@navi-source` unavailable,
global bootstrap absent, source and cache evidence unavailable, and the Navi
repository itself not project-initialized. The calibration is therefore not
currently execution-ready.

Before creating any fresh target task, rerun read-only `navi doctor`. If the
current Navi plugin or bootstrap remains unavailable, or the loaded source
cannot be traced to stabilization main, stop at a real global setup or update
permission gate. Global source-alpha setup requires separate explicit user
approval and must not be performed by this documentation task.

After any later approved setup, verify that the loaded source corresponds to
`main@2ff7e51` or a later explicitly accepted commit. Project-initialization
warnings are allowed because the protocol intentionally keeps target projects
read-only and uninitialized.

`npm ci` audit findings are separate Distribution & Trust debt. They do not
enter this behavior calibration or trigger Release mode.

## Evidence Record

For each sample, record only:

- target path;
- fresh task ID;
- Navi commit and loaded source;
- actual prompts;
- major project evidence;
- the five judgments;
- user corrections;
- attribution;
- one conclusion; and
- one residual risk.

Do not store full transcripts, hidden reasoning, exhaustive tool output, or
step-by-step read logs.

## Success And Stop Conditions

If both valid samples show no material regression or obvious new
initialization burden, close complexity stabilization. Minor friction becomes
calibration evidence or ordinary product debt; it does not continue the
stabilization loop.

A material regression is recorded once and becomes a separate focused design
and implementation problem. Do not repair it inside calibration or rerun until
green.

Stop immediately after two valid sessions and one compact closeout. This design
does not authorize executing calibration, global setup, target-project writes,
implementation planning, push, or release.
