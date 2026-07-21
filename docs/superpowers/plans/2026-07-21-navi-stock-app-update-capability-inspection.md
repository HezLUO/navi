# Navi Stock App Update Capability Inspection Plan

> **For inspection operators:** Use one stateful read-only Inspection Task for
> Tasks 1-3 and one fresh read-only Validation Task for Task 4. Do not execute
> this inspection in the persistent Main Task. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Determine whether the currently installed Stock Codex App can run the
approved Navi same-task update checkpoint natively, on explicit request only,
or not at all, without mutating Codex, plugin, marketplace, repository, or
target-project state.

**Architecture:** Inspect three evidence planes in order: the installed Stock
App client, the installed App Server contract, and the bounded client-to-server
call path. Classify the result only when direct static evidence proves the
required sequence. A missing token in opaque or incomplete artifacts is
`unknown`, not proof of absence. The Inspection Task returns one structured
result; a fresh Validation Task audits the evidence and classification without
rerunning the inspection.

**Tech Stack:** macOS application bundle metadata, Codex CLI and App Server
JSON schemas, shell read-only utilities (`find`, `plutil`, `codesign`, `rg`,
`strings`, `shasum`), Node.js built-ins for evidence reduction, Git read-only
commands, and Codex direct task messaging.

## Global Constraints

- Approved design:
  `docs/superpowers/specs/2026-07-21-navi-explicit-update-checkpoint-design.md`.
- This is a read-only capability inspection, not implementation, calibration,
  release, publication, or Update Host work.
- The inspection may read only:
  - the exact Navi repository snapshot and approved design/plan;
  - the installed Stock Codex App bundle and its public package metadata;
  - the installed `codex` executable, its App Server schemas, and bounded
    static client/server call paths;
  - current-session callable tool names and descriptions; and
  - temporary evidence created by this inspection.
- Do not read user conversations, task transcripts, auth content, private
  project content, browser data, credentials, environment secrets, or raw
  Codex configuration.
- Do not call marketplace add, remove, upgrade, plugin add, plugin remove,
  `skills/list`, `thread/start`, `turn/start`, automation mutation, or any
  other state-changing or model-turn API.
- Do not copy or hash auth content. Auth existence is not required by this
  inspection.
- Do not read or modify `work/`, Historical Along, target projects, `.navi`,
  project `AGENTS.md`, package metadata, plugin artifacts, release metadata, or
  real marketplace/plugin/cache/config state.
- Do not install dependencies. This plan uses only installed host tools and
  Node.js built-ins.
- The one Inspection Task and one Validation Task are the only authorized
  agent tasks. Do not start a listener, App Server process, probe model turn,
  additional thread, timer, automation, watcher, or background process.
- Temporary evidence lives under one mode-`0700` root in `/private/tmp`; files
  containing local paths use mode `0600`. Retain the reduced evidence only
  through independent validation and source-side acceptance.
- Do not delete unrelated matching-prefix temporary directories.
- Every task creation must pass the Navi Route Application Gate with explicit
  model and reasoning arguments. `host-default` is not accepted as applied
  routing evidence.
- Inspection route: `gpt-5.6-sol` plus `high` because client adoption,
  containment, and negative-evidence classification require a complete static
  trace.
- Validation route: `gpt-5.6-terra` plus `high` at Validation Level 2. The
  validator reviews the retained evidence and does not repeat the inspection.
- No inspection outcome authorizes product implementation, repository edits,
  marketplace mutation, release, publication, a custom Update Host, or a
  public automatic-update claim.

## Execution Contract

```text
goal: classify current Stock Codex App support for Navi Explicit Update Checkpoint
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit containing the approved design and this plan
operator_count: 1 stateful read-only Inspection Task
operator_route: gpt-5.6-sol + high, application_state applied
validator_count: 1 fresh read-only Validation Task
validator_route: gpt-5.6-terra + high, application_state applied
validation_level: 2
allowed_reads: approved repository records, installed Stock App bundle, installed Codex executable and generated App Server schemas, current callable tool metadata, retained inspection evidence
allowed_writes: one private /private/tmp evidence root only
forbidden_scope: conversations, task transcripts, auth content, raw config, private project content, real plugin/marketplace/cache mutation, App Server probe model turns, target access, repository edits, dependencies, runtime, Update Host, release, publication
inspection_external_network_access: none; ordinary Codex task transport is outside the inspected product path
result_route: direct NAVI_STOCK_APP_UPDATE_CAPABILITY_RESULT V1 to Source Main Task
stop_conditions: authorization missing, app identity ambiguous, protected-read boundary unclear, concrete capability uncertainty requiring broader access, result delivered
```

## Capability Definitions

The Inspection Task records each capability as `present`, `absent`, or
`unknown` and attaches direct file/call-path evidence.

| ID | Capability | Required proof |
| --- | --- | --- |
| C1 | Startup or interval scheduling | A Stock App client call path triggers update eligibility or marketplace checking from startup or a bounded interval without a user update request. |
| C2 | Official upgrade and cache readiness | A Stock App on-demand or scheduled path invokes official `marketplace/upgrade` and waits for or verifies the resulting versioned plugin cache before activation. |
| C3 | Forced Skill discovery | The same path invokes `skills/list` with `forceReload: true`, or handles `skills/changed` by performing equivalent forced discovery after installed state changes. |
| C4 | Existing-task Skill input | The same path can send one `turn/start` Skill input to an existing thread using the discovery-returned Skill name and canonical installed-cache `SKILL.md` path. |

Token presence alone is not proof. `present` requires a bounded callsite and
data-flow trace. `absent` requires an inspectable complete owner surface plus a
negative trace showing the required path is not implemented. Obfuscated,
encrypted, truncated, dynamically downloaded, or otherwise incomplete client
artifacts produce `unknown`.

## Classification Rules

Apply these rules exactly:

```text
if C1=present and C2=present and C3=present and C4=present
  and the four capabilities form one reachable Stock App flow:
    Native Complete
else if C1=absent and C2=present and C3=present and C4=present
  and C2-C4 form one reachable explicit-request flow:
    Native Partial
else if any of C2, C3, or C4 is absent:
    Native Absent
else:
    unable-to-classify
```

`unable-to-classify` is a truthful inspection outcome, not a fourth product
branch. It returns to the Main Task for a narrower evidence decision and does
not authorize implementation.

## Result Schema

```text
NAVI_STOCK_APP_UPDATE_CAPABILITY_RESULT
version: 1
inspection_id: <stable event id>
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
repository_snapshot: <exact commit>
stock_app_identity: <bundle id, short version, build version, executable digest>
codex_cli_version: <exact version>
C1_scheduling: present | absent | unknown
C2_upgrade_cache: present | absent | unknown
C3_forced_discovery: present | absent | unknown
C4_existing_task_skill_input: present | absent | unknown
on_demand_chain: complete | incomplete | unknown
classification: Native Complete | Native Partial | Native Absent | unable-to-classify
evidence: <bounded file, symbol, and call-path references>
evidence_gaps: <none or bounded list>
protected_state_unchanged: yes | no | unable-to-prove
repository_unchanged: yes | no
inspection_external_network_used: no
host_probe_model_turns: 0
recommendation: <branch-specific next decision>
```

The angle-bracket values above are result fields populated from observed
evidence; they are not permission to invent or guess values.

## Preconditions

Before creating the Inspection Task, the Main Task must:

- record a `NAVI_ROUTE_DECISION V2` for `gpt-5.6-sol + high`;
- pass explicit `model` and reasoning arguments to the task API;
- record `NAVI_ROUTE_APPLICATION V1` with `application_state: applied`;
- receive one explicit user authorization covering the read-only host paths
  and `/private/tmp` evidence root in this plan; and
- preauthorize one fresh Level 2 Validation Task at result-ready.

No generic `continue` satisfies this authorization gate. The authorization
must name this inspection plan or its exact event id.

---

### Task 1: Establish Identity, Boundaries, And A Mutation-Free Baseline

**Owner:** Inspection Task

**Files:**
- Read: `docs/superpowers/specs/2026-07-21-navi-explicit-update-checkpoint-design.md`
- Read: `docs/superpowers/plans/2026-07-21-navi-stock-app-update-capability-inspection.md`
- Create temporarily: `/private/tmp/navi-stock-update-inspection.XXXXXX/evidence/*`

**Produces:** one exact repository baseline, one unambiguous Stock App identity,
one Codex CLI identity, and one bounded evidence inventory before capability
tracing.

- [ ] **Step 1: Confirm the exact repository snapshot without touching `work/`**

```bash
REPO='/Users/james/Codex Project/General Codex Project/Navi'
EXPECTED_BASELINE="${NAVI_INSPECTION_BASELINE:?Main Task must supply the exact baseline}"
test "$(git -C "$REPO" rev-parse HEAD)" = "$EXPECTED_BASELINE"
git -C "$REPO" status --short --branch
git -C "$REPO" diff --check
```

Expected: HEAD equals the supplied baseline; tracked state is clean; only the
known pre-existing untracked `work/` may appear. Do not enumerate or read
inside `work/`.

- [ ] **Step 2: Create the private evidence root**

```bash
INSPECTION_ROOT="$(mktemp -d /private/tmp/navi-stock-update-inspection.XXXXXX)"
chmod 700 "$INSPECTION_ROOT"
mkdir -m 700 "$INSPECTION_ROOT/evidence" "$INSPECTION_ROOT/schema" \
  "$INSPECTION_ROOT/isolated-codex-home"
printf '%s\n' "$EXPECTED_BASELINE" > "$INSPECTION_ROOT/evidence/repository-head.txt"
chmod 600 "$INSPECTION_ROOT/evidence/repository-head.txt"
```

Expected: one new private root and no other write.

- [ ] **Step 3: Record installed tool identities**

```bash
{
  command -v codex
  CODEX_HOME="$INSPECTION_ROOT/isolated-codex-home" codex --version
  node --version
  git --version
  rg --version | sed -n '1p'
  /usr/bin/strings --version 2>&1 | sed -n '1p' || true
} > "$INSPECTION_ROOT/evidence/tool-identities.txt"
chmod 600 "$INSPECTION_ROOT/evidence/tool-identities.txt"
```

Expected: Codex, Node, Git, ripgrep, and the system strings utility are
available. Missing `codex`, `node`, `rg`, `plutil`, or `codesign` stops the
inspection as `unable-to-classify`; do not install a replacement.

- [ ] **Step 4: Resolve the installed Stock App bundle without guessing**

```bash
{
  find /Applications "$HOME/Applications" -maxdepth 2 -type d -name 'Codex.app' -print 2>/dev/null
  mdfind 'kMDItemContentType == "com.apple.application-bundle" && kMDItemFSName == "Codex.app"' 2>/dev/null
} | while IFS= read -r candidate; do
  test -d "$candidate/Contents" || continue
  node -e 'console.log(require("node:fs").realpathSync(process.argv[1]))' "$candidate"
done | LC_ALL=C sort -u > "$INSPECTION_ROOT/evidence/app-candidates.txt"
chmod 600 "$INSPECTION_ROOT/evidence/app-candidates.txt"
```

For every candidate, read only `Contents/Info.plist` with `plutil` and record
`CFBundleIdentifier`, `CFBundleDisplayName`, `CFBundleShortVersionString`,
`CFBundleVersion`, and `CFBundleExecutable`. If exactly one candidate is a
signed Codex application, select it. If zero or multiple viable candidates
remain, use a bounded process-name lookup only to disambiguate the running
Codex executable; record only the matched PID and executable bundle path, not
full process arguments. If identity remains ambiguous, stop
`unable-to-classify`. Write the selected real bundle path as one line to
`$INSPECTION_ROOT/evidence/selected-app-root.txt`.

- [ ] **Step 5: Record the selected app identity and integrity**

```bash
APP_ROOT="$(sed -n '1p' "$INSPECTION_ROOT/evidence/selected-app-root.txt")"
INFO_PLIST="$APP_ROOT/Contents/Info.plist"
APP_EXECUTABLE_NAME="$(plutil -extract CFBundleExecutable raw "$INFO_PLIST")"
APP_EXECUTABLE="$APP_ROOT/Contents/MacOS/$APP_EXECUTABLE_NAME"
test -f "$APP_EXECUTABLE"
plutil -p "$INFO_PLIST" > "$INSPECTION_ROOT/evidence/app-info.plist.txt"
codesign -dvv "$APP_ROOT" > "$INSPECTION_ROOT/evidence/app-codesign.txt" 2>&1
shasum -a 256 "$APP_EXECUTABLE" > "$INSPECTION_ROOT/evidence/app-executable.sha256"
chmod 600 "$INSPECTION_ROOT/evidence/app-"*
```

Expected: bundle identity, version, signature metadata, and executable digest
are recorded. Do not copy the executable or app bundle.

- [ ] **Step 6: Prove the pre-inspection write boundary**

```bash
git -C "$REPO" status --short > "$INSPECTION_ROOT/evidence/repository-status-before.txt"
find "$INSPECTION_ROOT" -type f -exec chmod 600 {} +
find "$INSPECTION_ROOT" -type d -exec chmod 700 {} +
```

Expected: no repository tracked change and no write outside the private root.

---

### Task 2: Collect Bounded Static Capability Evidence

**Owner:** same Inspection Task

**Files:**
- Read: selected Stock App bundle under `APP_ROOT`
- Read: installed Codex CLI package rooted at the real `codex` executable
- Create temporarily: generated schemas and reduced evidence under
  `INSPECTION_ROOT`

**Produces:** separate client, schema, and callable-surface evidence without
invoking any update or task API.

- [ ] **Step 1: Generate and inspect the installed App Server schema**

```bash
CODEX_HOME="$INSPECTION_ROOT/isolated-codex-home" \
  codex app-server generate-json-schema --out "$INSPECTION_ROOT/schema"
rg -n --no-heading \
  'marketplace/upgrade|marketplaceName|skills/list|forceReload|skills/changed|turn/start|type[^\n]*skill|name[^\n]*path' \
  "$INSPECTION_ROOT/schema" \
  > "$INSPECTION_ROOT/evidence/app-server-schema-hits.txt"
```

Expected: schema evidence is recorded for the low-level operations. Schema
presence proves only App Server capability; it does not prove Stock App
adoption and cannot by itself make C1-C4 `present`.

- [ ] **Step 2: Create a bounded Stock App resource inventory**

```bash
find "$APP_ROOT/Contents" -xdev -type f \
  -exec stat -f '%z\t%N' {} \; \
  | LC_ALL=C sort -k2 \
  > "$INSPECTION_ROOT/evidence/app-resource-inventory.tsv"
RESOURCE_COUNT="$(wc -l < "$INSPECTION_ROOT/evidence/app-resource-inventory.tsv" | tr -d ' ')"
RESOURCE_BYTES="$(awk -F '\t' '{sum += $1} END {print sum + 0}' "$INSPECTION_ROOT/evidence/app-resource-inventory.tsv")"
printf 'count=%s\nbytes=%s\n' "$RESOURCE_COUNT" "$RESOURCE_BYTES" \
  > "$INSPECTION_ROOT/evidence/app-resource-summary.txt"
```

Expected: paths and sizes only. Do not copy resource contents. If inventory
exceeds 50,000 files or 4 GiB, stop and return the exact bound as an evidence
gap rather than widening the scan.

- [ ] **Step 3: Search inspectable text resources for exact capability tokens**

```bash
find "$APP_ROOT/Contents" -xdev -type f \
  \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.json' \
     -o -name '*.map' -o -name '*.html' -o -name '*.plist' -o -name '*.toml' \) \
  -size -64M -print0 \
  | xargs -0 rg -n --no-heading --text \
    'marketplace/upgrade|skills/list|forceReload|skills/changed|turn/start|setInterval|startup|marketplace|plugin|skill' \
  > "$INSPECTION_ROOT/evidence/app-text-token-hits.txt" || true
```

Expected: bounded direct hits with file and line context available for tracing.
No hit is not yet proof of absence.

- [ ] **Step 4: Search bounded packaged and native artifacts**

Identify only the selected app executable and package artifacts named
`*.asar`, `*.pak`, or `*.bin` that are at most 512 MiB. Run `/usr/bin/strings
-a` on each candidate and retain only lines matching:

```text
marketplace/upgrade
skills/list
forceReload
skills/changed
turn/start
setInterval
startup
marketplace
plugin
skill
```

Write one evidence file per artifact containing its SHA-256, size, and matched
strings. Do not retain unrelated strings. If the artifact cannot be inspected
or source mapping is unavailable, record that limitation explicitly.

- [ ] **Step 5: Resolve the installed Codex CLI package boundary**

```bash
CODEX_COMMAND="$(command -v codex)"
CODEX_REAL="$(node -e 'console.log(require("node:fs").realpathSync(process.argv[1]))' "$CODEX_COMMAND")"
printf '%s\n%s\n' "$CODEX_COMMAND" "$CODEX_REAL" \
  > "$INSPECTION_ROOT/evidence/codex-cli-paths.txt"
shasum -a 256 "$CODEX_REAL" > "$INSPECTION_ROOT/evidence/codex-cli.sha256"
```

Trace only files that are ancestors, siblings, or package metadata owners of
`CODEX_REAL`. Do not traverse `$HOME`, `.codex`, plugin caches, task state, or
configuration. Record low-level App Server ownership separately from Stock App
client ownership.

- [ ] **Step 6: Record callable capability metadata without invoking tools**

Use one `functions.exec` metadata-only script:

```javascript
const pattern = /automation|marketplace|plugin|skill|thread|turn|update/i;
const relevant = ALL_TOOLS
  .filter(({ name, description }) => pattern.test(`${name} ${description}`))
  .map(({ name, description }) => ({ name, description }));
text(JSON.stringify(relevant, null, 2));
```

Reduce the returned names and descriptions into
`evidence/callable-capability-metadata.json`. Do not invoke any listed tool.
Tool availability in the current agent surface is supporting evidence only;
it is not proof that the Stock App automatically calls the tool.

- [ ] **Step 7: Audit the collected evidence boundary**

```bash
find "$INSPECTION_ROOT" -type f -exec chmod 600 {} +
find "$INSPECTION_ROOT" -type d -exec chmod 700 {} +
git -C "$REPO" status --short > "$INSPECTION_ROOT/evidence/repository-status-after-collection.txt"
cmp "$INSPECTION_ROOT/evidence/repository-status-before.txt" \
    "$INSPECTION_ROOT/evidence/repository-status-after-collection.txt"
```

Expected: repository status is byte-identical and no prohibited read or API
invocation occurred.

---

### Task 3: Trace The Stock App Flow And Classify Truthfully

**Owner:** same Inspection Task

**Files:**
- Read: reduced evidence under `INSPECTION_ROOT/evidence`
- Create temporarily: `capability-matrix.md`, `inspection-result.json`, and
  `validation-package.md`

**Produces:** one evidence-backed classification or one bounded
`unable-to-classify` result.

- [ ] **Step 1: Build the four-capability matrix**

For each C1-C4, record:

```text
status: present | absent | unknown
stock_app_owner_file: exact path or none
stock_app_symbol_or_callsite: exact symbol/offset/line or none
server_method_or_item: exact method/item or none
upstream_trigger: exact caller or none
downstream_consumer: exact callee or none
data_carried: exact relevant fields
negative_search_boundary: exact complete owner surface, or none
evidence_gap: none or concise reason
```

Do not cite generated schemas as the Stock App owner. Do not use a search hit
without caller/callee context as `present`. Do not mark `absent` unless the
relevant Stock App owner surface is complete and inspectable.

- [ ] **Step 2: Trace the on-demand chain as one tuple**

Require one ordered path:

```text
explicit update request or host checkpoint
-> marketplace/upgrade
-> versioned-cache readiness or verification
-> skills/list(forceReload=true) or equivalent skills/changed refresh
-> discovery-returned Skill name and installed-cache path
-> turn/start skill item on an existing thread
```

Record `on_demand_chain: complete` only when every arrow is supported by a
direct caller/callee or data-flow reference. Independent token hits scattered
across unrelated modules produce `unknown`, not `complete`.

- [ ] **Step 3: Trace automatic scheduling separately**

Require a startup or interval owner that reaches the update eligibility or
upgrade path without a user update request. A general automation facility,
application updater, plugin UI, timer primitive, or background task framework
does not satisfy C1 unless its call path reaches the Navi-relevant marketplace
update chain.

- [ ] **Step 4: Apply the exact classification truth table**

Run a local Node.js truth-table check before classifying observed evidence:

```bash
node --input-type=module <<'NODE'
const classify = ({ c1, c2, c3, c4, flow, onDemand }) => {
  if ([c1, c2, c3, c4].every((value) => value === "present") && flow === "complete") return "Native Complete";
  if (c1 === "absent" && [c2, c3, c4].every((value) => value === "present") && onDemand === "complete") return "Native Partial";
  if ([c2, c3, c4].includes("absent")) return "Native Absent";
  return "unable-to-classify";
};
const fixtures = [
  [{ c1: "present", c2: "present", c3: "present", c4: "present", flow: "complete", onDemand: "complete" }, "Native Complete"],
  [{ c1: "absent", c2: "present", c3: "present", c4: "present", flow: "incomplete", onDemand: "complete" }, "Native Partial"],
  [{ c1: "unknown", c2: "present", c3: "present", c4: "present", flow: "unknown", onDemand: "complete" }, "unable-to-classify"],
  [{ c1: "absent", c2: "present", c3: "absent", c4: "present", flow: "incomplete", onDemand: "incomplete" }, "Native Absent"],
  [{ c1: "absent", c2: "present", c3: "unknown", c4: "present", flow: "unknown", onDemand: "unknown" }, "unable-to-classify"],
];
for (const [input, expected] of fixtures) {
  const actual = classify(input);
  if (actual !== expected) throw new Error(`${JSON.stringify(input)} => ${actual}, expected ${expected}`);
}
console.log("classification fixtures: 5/5 pass");
NODE
```

Expected: `classification fixtures: 5/5 pass`.

- [ ] **Step 5: Produce the reduced result and validation package**

Create `inspection-result.json` matching the Result Schema and
`validation-package.md` containing:

- exact repository and app identities;
- the four capability statuses;
- the ordered on-demand trace;
- the automatic scheduling trace;
- direct evidence references;
- evidence gaps and scan bounds;
- prohibited-read/API audit;
- before/after repository status comparison;
- classification and branch-specific recommendation; and
- confirmation that host probe model turns, inspection-initiated external
  network requests, plugin/marketplace calls, and target-project accesses
  equal zero.

Recommendations are fixed:

```text
Native Complete -> plan only Navi contract, diagnostics, and documentation adoption
Native Partial -> plan the natural-language explicit check fallback over the proved on-demand chain
Native Absent -> plan truthful manual official update plus the narrowest proved restart/reload instruction
unable-to-classify -> request one narrower evidence decision; do not plan implementation
```

- [ ] **Step 6: Deliver the direct result and stop**

Send one `NAVI_STOCK_APP_UPDATE_CAPABILITY_RESULT V1` directly to the Source
Main Task. Include `INSPECTION_ROOT` for the designated validator. Enter
Awaiting Direct Event. Do not poll the Main Task, create the validator, delete
evidence, or start implementation.

---

### Task 4: Independently Validate The Evidence And Classification

**Owner:** one fresh Validation Task created by the Source Main Task

**Route:** explicit `gpt-5.6-terra + high`, Validation Level 2,
`application_state: applied`

**Files:**
- Read: approved design and this plan at the exact repository snapshot
- Read: reduced evidence under the exact `INSPECTION_ROOT`
- Write: none

**Produces:** one `NAVI_VALIDATION_RESULT` for the exact inspection result.

- [ ] **Step 1: Verify result identity and protected boundaries**

Confirm the result event id, repository snapshot, app identity, Codex CLI
version, evidence-root mode, file modes, zero inspection-initiated external
network requests, zero host probe model turns, zero API mutations, zero target
access, and byte-identical before/after repository status evidence. The zero
counts do not describe the already-authorized Inspection or Validation Task
transport.

- [ ] **Step 2: Review all four capability traces**

For each C1-C4, inspect the cited owner file and bounded call context. Reject:

- schema-only adoption claims;
- token-presence-only claims;
- disconnected callsites presented as one flow;
- `absent` based on incomplete or opaque artifacts;
- generic timers or application self-update paths presented as plugin-update
  scheduling; and
- a Skill input that does not use discovery-returned name plus canonical
  installed-cache path on an existing thread.

- [ ] **Step 3: Reapply the classification rules**

Derive the classification independently from the accepted C1-C4 statuses and
flow evidence. The validator may return:

```text
accept
remediation-required
unable-to-verify
```

`accept` means the bounded classification is supported. It does not mean Navi
automatic updates are implemented or released.

- [ ] **Step 4: Deliver validation directly**

Send one structured `NAVI_VALIDATION_RESULT` directly to the Source Main Task,
naming the reviewed inspection event and exact repository snapshot. Do not
rerun the inspection, invoke Stock App APIs, mutate host state, delete retained
evidence, or propose implementation outside the accepted branch.

## Final Bounded Verification

The Source Main Task accepts the inspection only when:

- the Inspection and Validation routes were explicitly applied;
- the exact app and repository identities are stable;
- every C1-C4 status has direct or explicitly bounded negative evidence;
- Native Complete or Partial includes a connected call path, not scattered
  capability tokens;
- Native Absent relies on at least one proven absent essential C2-C4
  capability;
- incomplete static visibility returns `unable-to-classify`;
- protected real state and repository tracked state remain unchanged;
- no inspection-initiated external network request, host probe model turn,
  task transcript, auth, config, target-project, marketplace/plugin mutation,
  implementation, release, or publication scope occurred; and
- the fresh validator accepts the exact result.

## Next Decision After Acceptance

- `Native Complete`: write a bounded implementation plan for Navi contract,
  diagnostics, and documentation adoption only.
- `Native Partial`: write a bounded implementation plan for an explicit
  natural-language update request using the proved host chain.
- `Native Absent`: write a bounded manual-update and truthful reload guidance
  plan; keep Update Host deferred.
- `unable-to-classify`: stop and decide whether one narrower authorized host
  observation is worth its cost. Do not infer absence or begin implementation.

No branch automatically authorizes execution, merge, push, release,
publication, marketplace mutation, or deletion of retained private evidence.
