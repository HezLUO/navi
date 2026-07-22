# Navi Delegation Host Capability Inspection Plan

> **For inspection operators:** Use one fresh formal read-only Inspection Task
> for Tasks 1-3 and one fresh formal read-only Validation Task for Task 4. These
> are visible three-role tasks, not Evidence subagents. Do not execute the
> inspection in the persistent Main Task. Steps use checkbox (`- [ ]`) syntax
> for tracking.

**Goal:** Determine whether the current Codex host can enforce every boundary
required for Navi Delegation Gate V1 automatic Evidence subagents, without
implementing the gate, changing repository or host state, or assuming that a
prompt instruction is a host-enforced capability.

**Architecture:** Inspect the complete callable subagent tool surface first,
then any bounded installed-host schema or documentation needed to resolve an
otherwise unknown field. Classify seven capabilities independently as
`present`, `absent`, or `unknown`. A behavioral subagent probe is permitted only
if static evidence first proves enforceable read-only execution, bounded child
creation, and non-recursive ownership. The Inspection Task returns one
structured result; a fresh Validation Task audits the evidence and
classification without rerunning a probe.

**Tech Stack:** Current Codex callable tool metadata, installed Codex App/CLI
public schemas when needed, shell read-only utilities (`rg`, `find`, `sed`,
`shasum`), Node.js built-ins for bounded evidence reduction, Git read-only
commands, private `/private/tmp` evidence, and Codex direct task messaging.

## Global Constraints

- Approved design:
  `docs/superpowers/specs/2026-07-22-navi-delegation-gate-design.md`.
- This is a host capability inspection, not Delegation Gate implementation,
  natural calibration, release, publication, Runtime Surface, or
  `agent-delegate` integration.
- Use one formal Inspection Task and one fresh formal Validation Task. Do not
  use an Evidence subagent to decide whether Evidence subagents are safe.
- The inspection may read only:
  - the exact Navi repository snapshot, approved design, and this plan;
  - the current task's complete callable `multi_agent_v1__*` tool names,
    descriptions, and argument/result schemas;
  - installed Codex App/CLI public schemas or bundled documentation only when
    the callable metadata leaves a required capability unknown; and
  - temporary evidence created by this inspection.
- Do not call, inspect, package, or integrate `mcp__agent_delegate__*` tools.
  The separate `agent-delegate` project is historical evidence only.
- Do not read conversations, task transcripts, auth content, private project
  content, browser data, credentials, environment secrets, raw Codex
  configuration, `work/`, or another project.
- Do not mutate repository files, plugin or marketplace state, Codex config,
  caches, credentials, target projects, global state, Git state, or external
  services.
- Do not install dependencies, start listeners or background processes, run
  `navi init`, create worktrees, or use external network access.
- A single behavioral subagent probe is conditionally allowed only after the
  static safety gate in Task 2 passes. It must use an explicit model and
  reasoning route, receive no project context, use no tools, and return only
  the exact structured fixture result. If the gate does not pass, model turns
  remain zero.
- Do not attempt a write to prove read-only enforcement. Absence of a write is
  not proof that writes were impossible.
- Do not create a recursive child to prove recursion prohibition. The host
  must expose an enforceable denial or an authoritative capability boundary.
- Temporary evidence lives under one mode-`0700` root in `/private/tmp`; files
  containing local paths or raw tool declarations use mode `0600`. Retain the
  reduced evidence only through independent validation and source-side
  acceptance.
- Every formal task creation and any conditionally permitted probe must pass
  the Navi Route Application Gate with explicit model and reasoning arguments.
  `host-default` is not accepted as applied routing evidence.
- Inspection route: `gpt-5.6-sol` plus `high`, because complete-tool-surface
  negative evidence and host-enforcement distinctions are premise-changing.
- Validation route: `gpt-5.6-terra` plus `high` at Validation Level 2. The
  validator reviews retained evidence and does not repeat the inspection.
- No result authorizes Delegation Gate implementation. The accepted result
  chooses the truthful implementation-plan branch in a separate decision.

## Execution Contract

```text
goal: classify current Codex host support for Navi Delegation Gate V1 automatic Evidence subagents
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit containing the approved design and this plan
operator_count: 1 fresh formal read-only Inspection Task
operator_route: gpt-5.6-sol + high, application_state applied
validator_count: 1 fresh formal read-only Validation Task
validator_route: gpt-5.6-terra + high, application_state applied
validation_level: 2
allowed_reads: approved repository records, complete current multi_agent_v1 callable metadata, bounded installed Codex public schemas or bundled docs, retained private evidence
allowed_writes: one private /private/tmp evidence root only
conditional_probe_count: 0 unless the static safety gate passes, otherwise exactly 1
conditional_probe_route: explicit host-supported model and reasoning, application_state applied
forbidden_scope: repository edits, work/, conversations, transcripts, auth, raw config, private projects, target access, agent-delegate, dependencies, network, listeners, host mutation, Runtime Surface, release, publication
result_route: direct NAVI_DELEGATION_HOST_CAPABILITY_RESULT V1 to Source Main Task
stop_conditions: authorization missing, baseline mismatch, callable surface incomplete, protected-read boundary unclear, static safety gate fails, result delivered
```

## Capability Definitions

The Inspection Task records every capability as `present`, `absent`, or
`unknown`. `present` requires an enforceable host contract, not merely a prompt
instruction or observed model compliance. `absent` requires inspection of the
complete owning callable surface. Incomplete or ambiguous evidence is
`unknown`.

| ID | Capability | Required proof |
| --- | --- | --- |
| C1 | Role-local subagent creation | A callable host operation creates one child owned by the current parent and returns a stable child identity. |
| C2 | Explicit model application | The creation request accepts a concrete model override and the host reports or otherwise contractually binds that value. Inheritance alone is insufficient. |
| C3 | Explicit reasoning application | The creation request accepts a concrete reasoning-effort override and the host reports or otherwise contractually binds that value. Inheritance alone is insufficient. |
| C4 | Enforceable read-only execution | The parent can create the child with a host-enforced read-only sandbox/tool boundary. A brief saying `do not write` and a child that happens not to write are insufficient. |
| C5 | Bounded child count | The host or an authoritative parent-owned call boundary can enforce the approved maximum for the wave without relying only on the child's voluntary compliance. |
| C6 | Non-recursive ownership | The child is denied child-creation capability, or the host exposes an enforceable per-child tool/capability boundary that prohibits recursion. A prompt prohibition is insufficient. |
| C7 | Structured completion and result delivery | The host returns machine-distinguishable completion, failure, and interruption states plus the child's result to the owning parent; the result can carry the required `NAVI_EVIDENCE_RESULT V1` fields without transcript scraping. |

For C2 and C3, accepting request arguments is direct support. Actual route
application remains subject to the existing Navi Route Application Gate during
later natural calibration.

For C5, a parent-side maximum can count as `present` only if the complete
callable owner prevents the child from bypassing that parent and C6 is also
`present`. A prose rule that the parent should call at most twice is not a host
capability.

## Static Safety Gate

The conditional behavioral probe may run only when all of these are already
`present` from static authoritative evidence:

```text
C1 role-local creation
C2 explicit model
C3 explicit reasoning
C4 enforceable read-only
C5 bounded child count
C6 non-recursive ownership
```

If any is `absent`, do not probe. If any is `unknown`, do not probe. The probe
is allowed to confirm only C7 result delivery; it may not be used to discover
whether an unsafe child can write or recurse.

## Classification Rules

Apply these rules exactly:

```text
if C1-C7 are all present:
    automatic_evidence_delegation = supported
else if any of C1, C2, or C3 is absent:
    automatic_evidence_delegation = unsupported
else if any of C4, C5, C6, or C7 is absent:
    automatic_evidence_delegation = unsupported
    suggestion_only_contract = eligible
else:
    automatic_evidence_delegation = unable-to-classify
```

`suggestion_only_contract: eligible` means Navi may later implement truthful
delegation judgment and explain that the current host cannot safely auto-create
the worker. It does not mean automatic delegation is partially implemented.

An `unknown` essential capability prevents an automatic-delegation claim. It
returns to the Main Task for a narrower host-evidence decision; it does not
authorize a broader or riskier probe.

## Result Schema

```text
NAVI_DELEGATION_HOST_CAPABILITY_RESULT
version: 1
inspection_id: <stable event id>
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
repository_snapshot: <exact commit>
codex_app_identity: <version or not-inspected>
codex_cli_identity: <version or not-inspected>
callable_surface_identity: <bounded tool names and declaration digests>
C1_role_local_creation: present | absent | unknown
C2_explicit_model: present | absent | unknown
C3_explicit_reasoning: present | absent | unknown
C4_enforceable_read_only: present | absent | unknown
C5_bounded_child_count: present | absent | unknown
C6_non_recursive_ownership: present | absent | unknown
C7_structured_completion: present | absent | unknown
static_safety_gate: pass | fail
probe_turns: 0 | 1
automatic_evidence_delegation: supported | unsupported | unable-to-classify
suggestion_only_contract: eligible | not-needed | undecided
evidence: <bounded declaration, schema, and call-boundary references>
evidence_gaps: <none or bounded list>
protected_state_unchanged: yes | no | unable-to-prove
repository_unchanged: yes | no
recommendation: <one branch-specific next decision>
```

Angle-bracket fields are populated from observed evidence. They are not
permission to guess values.

## Preconditions

Before creating the Inspection Task, the Main Task must:

- record a `NAVI_ROUTE_DECISION V2` for `gpt-5.6-sol + high`;
- pass explicit `model` and reasoning arguments to the task API;
- record `NAVI_ROUTE_APPLICATION V1` with `application_state: applied`;
- receive one explicit user authorization covering this exact read-only plan,
  the installed public host paths if needed, one private evidence root, and the
  conditional one-turn probe only when the Static Safety Gate passes; and
- preauthorize one fresh Level 2 Validation Task at result-ready.

No generic `continue` satisfies this authorization gate. The authorization
must name this plan or its exact event id.

---

### Task 1: Establish Identity, Scope, And A Mutation-Free Baseline

**Owner:** Inspection Task

**Files:**
- Read: `docs/superpowers/specs/2026-07-22-navi-delegation-gate-design.md`
- Read: `docs/superpowers/plans/2026-07-22-navi-delegation-host-capability-inspection.md`
- Create temporarily: `/private/tmp/navi-delegation-host-inspection.XXXXXX/evidence/*`

**Produces:** one exact repository baseline, one bounded callable-surface
inventory, and one private evidence root before capability classification.

- [ ] **Step 1: Confirm the repository snapshot without touching `work/`**

```bash
REPO='/Users/james/Codex Project/General Codex Project/Navi'
EXPECTED_BASELINE="${NAVI_INSPECTION_BASELINE:?Main Task must supply the exact baseline}"
test "$(git -C "$REPO" rev-parse HEAD)" = "$EXPECTED_BASELINE"
git -C "$REPO" status --short --branch
git -C "$REPO" diff --check
```

Expected: HEAD equals the supplied baseline; tracked state is clean; only a
known pre-existing untracked `work/` may appear. Do not enumerate or read it.

- [ ] **Step 2: Create the private evidence root**

```bash
INSPECTION_ROOT="$(mktemp -d /private/tmp/navi-delegation-host-inspection.XXXXXX)"
chmod 700 "$INSPECTION_ROOT"
mkdir -m 700 "$INSPECTION_ROOT/evidence"
printf '%s\n' "$EXPECTED_BASELINE" > "$INSPECTION_ROOT/evidence/repository-head.txt"
chmod 600 "$INSPECTION_ROOT/evidence/repository-head.txt"
```

Expected: one new private root and no other write.

- [ ] **Step 3: Record public host identities without reading config or auth**

```bash
{
  command -v codex
  codex --version
  node --version
  git --version
} > "$INSPECTION_ROOT/evidence/public-host-identities.txt"
chmod 600 "$INSPECTION_ROOT/evidence/public-host-identities.txt"
```

If the Stock App bundle is inspected later, record only bundle id, version,
build version, and the bounded public file path used. Do not read user data.

- [ ] **Step 4: Capture the complete relevant callable metadata**

Use the Inspection Task's current callable tool inventory to select every tool
whose name starts with `multi_agent_v1__`. Record, without paraphrase:

- exact tool name;
- complete description;
- complete argument schema;
- complete return schema; and
- whether the tool is callable by the parent Inspection Task.

Store the mechanically serialized declarations in:

```text
/private/tmp/navi-delegation-host-inspection.XXXXXX/evidence/multi-agent-tools.json
```

Set mode `0600`. Record a SHA-256 digest in
`multi-agent-tools.sha256`. Do not include unrelated tools or invoke any
`mcp__agent_delegate__*` tool.

- [ ] **Step 5: Audit the baseline and stop on ambiguity**

Required preflight assertions:

```text
repository snapshot exact
tracked state unchanged
relevant callable declarations complete
no subagent spawned
no model turn run
no protected state read
no network or background process used
```

If completeness of the callable metadata cannot be established, return
`unable-to-classify` rather than widening access.

### Task 2: Classify Static Host Enforcement

**Owner:** Inspection Task

**Files:**
- Read: retained `multi-agent-tools.json`
- Read conditionally: installed Codex public schema or bundled documentation
- Create temporarily: `evidence/capability-matrix.md`
- Create temporarily: `evidence/static-safety-gate.json`

**Produces:** one direct-evidence classification for C1-C6 and a pass/fail
decision for the conditional probe.

- [ ] **Step 1: Trace each capability to its complete owner declaration**

For C1-C6, record:

```text
capability id
owning tool or host surface
request fields
return fields
relevant normative description
enforcement location: host | parent-call-boundary | prompt-only | unproved
classification: present | absent | unknown
reason
```

Do not infer C4 from a task being described as read-only. Do not infer C5 from
the parent's intention to call no more than twice. Do not infer C6 from the
Evidence Brief's `recursion_permission: none` text.

- [ ] **Step 2: Resolve only genuine unknowns through bounded public host evidence**

Use `rg` or installed schema-generation commands only when the callable
declaration explicitly points to an installed public schema or bundled owner
surface. Search for the exact owning operation and field names. Example
bounded search shape:

```bash
SCHEMA_ROOT="${NAVI_APPROVED_PUBLIC_SCHEMA_ROOT:?Main Task must supply the approved installed public schema root}"
rg -n --hidden --glob '!**/auth*' --glob '!**/config*' \
  'spawn_agent|reasoning_effort|sandbox|read.only|tool.*allow|child|descendant' \
  "$SCHEMA_ROOT" \
  > "$INSPECTION_ROOT/evidence/bounded-host-schema-hits.txt"
chmod 600 "$INSPECTION_ROOT/evidence/bounded-host-schema-hits.txt"
```

The Main Task may set `NAVI_APPROVED_PUBLIC_SCHEMA_ROOT` only to a path named
in the grouped authorization. If no complete owner surface is available,
retain `unknown`; do not search user data or the whole filesystem.

- [ ] **Step 3: Apply negative-evidence discipline**

Use these rules:

```text
complete owner schema lacks a required enforceable field or boundary -> absent
owner schema is incomplete, opaque, or version-ambiguous -> unknown
prompt text asks the child to comply -> not host proof
observed no-write behavior -> not host proof
parent can choose not to call again but child still owns spawn -> not count/non-recursion proof
```

- [ ] **Step 4: Evaluate the Static Safety Gate mechanically**

Write `static-safety-gate.json` with C1-C6 and:

```text
pass only when C1=C2=C3=C4=C5=C6=present
fail otherwise
```

If the result is `fail`, set `probe_turns: 0` and proceed directly to Task 3
classification. Do not ask to run an unsafe probe merely to remove `unknown`.

- [ ] **Step 5: Self-review capability consistency**

Check that every `present` claim cites a host enforcement point, every
`absent` claim cites a complete owner surface, and every unresolved field is
`unknown`. Scan for unsupported words such as `probably`, `should inherit`, or
`the model will obey` and remove them from the evidence conclusion.

### Task 3: Confirm Result Delivery If Safe And Produce The Result

**Owner:** Inspection Task

**Files:**
- Read: retained capability and gate evidence
- Create temporarily: `evidence/probe-request.json` only if gate passes
- Create temporarily: `evidence/probe-result.json` only if gate passes
- Create temporarily: `evidence/final-result.json`

**Produces:** C7 classification, the overall product-support classification,
and one direct structured handoff to the Source Main Task.

- [ ] **Step 1: Stop without a probe when the Static Safety Gate fails**

When `static_safety_gate: fail`:

- set `C7_structured_completion` from static tool result schemas when the
  evidence is complete, otherwise `unknown`;
- set `probe_turns: 0`;
- apply the Classification Rules; and
- do not call `spawn_agent`, `wait_agent`, `send_input`, `resume_agent`, or
  `close_agent`.

- [ ] **Step 2: If and only if the gate passes, run one exact result probe**

Create one child with explicit model and reasoning arguments accepted by the
current host. Do not fork conversation context and do not pass project paths.
The complete child input is:

```text
Return exactly this result and do nothing else:

NAVI_EVIDENCE_RESULT
version: 1
delegation_id: host-capability-probe
brief_id: completion-envelope
status: done
answer: HOST_COMPLETION_OK
evidence: host result envelope only
uncertainties: none
scope_deviations: none
open_questions: none
recommended_parent_action: classify result delivery
write_state: unchanged

Do not use tools, read files, inspect projects, create children, or modify state.
```

Run exactly one creation attempt and one bounded completion wait. No retry,
follow-up, resume, or replacement child is allowed. Close the completed child
only if the host contract requires explicit resource release.

- [ ] **Step 3: Classify C7 from the authoritative envelope**

`C7_structured_completion: present` requires all of:

- stable child identity returned at creation;
- machine-distinguishable completed, errored, interrupted, and not-found
  states in the owning API;
- exact child result delivered to the parent without transcript scraping; and
- the returned body can preserve every required Evidence Result field.

A natural-language final message without a machine-distinguishable host status
is insufficient.

- [ ] **Step 4: Apply the overall Classification Rules**

Populate `final-result.json` and render the exact
`NAVI_DELEGATION_HOST_CAPABILITY_RESULT V1`. The recommendation must be one of:

```text
supported -> write the automatic Evidence Delegation Gate implementation plan
unsupported with suggestion eligible -> write a truthful suggestion-only/fail-closed implementation plan
unsupported without creation/routing -> keep delegation unavailable and document the host gap
unable-to-classify -> request only the narrow missing authoritative host evidence
```

- [ ] **Step 5: Re-prove protected state and deliver directly**

```bash
test "$(git -C "$REPO" rev-parse HEAD)" = "$EXPECTED_BASELINE"
git -C "$REPO" diff --check
git -C "$REPO" status --short --branch
```

Expected: repository tracked state unchanged and no new path outside the
private evidence root. Send the structured result directly to the Source Main
Task. Do not ask the user to relay it.

### Task 4: Independently Validate The Evidence And Classification

**Owner:** fresh Validation Task

**Files:**
- Read: approved design and this plan at the exact snapshot
- Read: retained reduced evidence under the private inspection root
- Write: none

**Produces:** one `NAVI_VALIDATION_RESULT` for the exact inspection result.

- [ ] **Step 1: Verify identity, scope, and read-only state**

Confirm:

- reviewed event id and repository snapshot match;
- Inspection and Validation routes were explicitly applied;
- evidence root/file modes satisfy `0700`/`0600`;
- repository tracked state remains unchanged;
- no `work/`, private project, auth, config, agent-delegate, network, listener,
  dependency, target, release, or publication access occurred; and
- `probe_turns` is `0` unless the Static Safety Gate passed.

- [ ] **Step 2: Reclassify C1-C7 from retained evidence**

Read the complete retained callable declarations, capability matrix, bounded
public-schema evidence if any, and conditional probe envelope if any. Reapply
the definitions independently. A validator disagreement is a finding, not a
reason to silently change the operator result.

- [ ] **Step 3: Check the circularity and enforcement boundaries**

Explicitly verify that:

- no Evidence subagent was used to establish the Static Safety Gate;
- no probe attempted a write or recursive spawn;
- prompt compliance was not counted as host enforcement;
- missing fields in an incomplete owner surface became `unknown`, not
  `absent`; and
- the overall classification follows the exact rule table.

- [ ] **Step 4: Return the verdict directly**

Return `accept`, `remediation-required`, or `unable-to-verify` with findings
and evidence gaps. Acceptance covers only the capability classification and
cleanup. It does not authorize implementation or natural calibration.

## Final Bounded Verification

Before the Inspection Task emits result-ready and before Validation accepts,
confirm:

```text
approved design and exact plan read
exact repository snapshot retained
complete multi_agent_v1 callable surface captured
C1-C7 each classified with direct evidence
Static Safety Gate applied before any probe
probe count is 0 or exactly 1
no unsafe write or recursion probe
no agent-delegate use
no repository or protected-state mutation
no target-project or external-state access
result schema complete
classification rule applied exactly
direct Source Main Task delivery
```

The operator must not claim success merely because the currently exposed
`spawn_agent` call accepts model and reasoning arguments. Automatic Evidence
delegation is supported only when every required enforcement capability is
proved.

## Next Decision After Acceptance

- If `supported`, write the full Delegation Gate V1 implementation plan with
  contracts, focused tests, routing adoption, documentation, and later natural
  positive/negative calibration.
- If `unsupported` and suggestion-only is eligible, write a bounded
  suggestion-only/fail-closed plan that preserves the approved judgment model
  without claiming automatic worker creation.
- If `unsupported` because creation or explicit routing is absent, keep the
  feature inactive and record only the exact host gap.
- If `unable-to-classify`, investigate only the named missing authoritative
  surface under a separately approved plan.

No branch automatically authorizes a Runtime Surface, MCP server, panel,
background scheduler, host modification, release, or publication.
