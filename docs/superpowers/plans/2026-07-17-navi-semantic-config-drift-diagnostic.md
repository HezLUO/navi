# Navi Semantic Config Drift Diagnostic Execution Plan

> **For calibration operators:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` in one true Codex-managed worktree task. This is
> one stateful global-state experiment; do not split switch, session, snapshot,
> or restoration ownership across subagents. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Identify the exact redacted `config.toml` key paths changed by one
minimum Codex session under the immutable Git-backed Navi candidate without
rerunning the full onboarding journey or attributing an unexplained host change
to Navi.

**Architecture:** One Calibration Operator captures four private config
snapshots around an official-command Git marketplace switch, runs one minimal
read-only Codex session in an empty temporary root, restores the original local
Navi state immediately after snapshot `C`, and only then performs offline TOML
comparison. Raw config never leaves the private temporary root; a standard
library `tomllib` comparator emits key paths, value types, and conservative
impact classes without values.

**Tech Stack:** Codex CLI 0.144.5, official `codex plugin` and marketplace
commands, POSIX shell tools, Python 3.13 standard-library `tomllib`, SHA-256,
Codex task messaging.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-17-navi-semantic-config-drift-calibration-design.md`.
- This is Calibration mode. It is not Implementation or Release mode.
- The diagnostic reproduces only one minimum session under the exact already
  pushed candidate `358b6b4c9fd95fcfe169a8647238859e363e8fa3`.
- Do not rerun natural onboarding, generate a Project Map, invoke `navi init`,
  inspect `sub_ag_ski` or another real target project, apply a preview, or start
  a second fresh task.
- One stateful Calibration Operator owns preflight, switch, snapshots, the
  minimum session, restoration, offline analysis, and result delivery.
- Global marketplace/plugin mutation requires a separate grouped user
  authorization after preflight proves the exact current state and restoration
  path.
- Use only official Codex plugin and marketplace commands for mutation. Do not
  edit `~/.codex/config.toml`, the managed plugin cache, or another global file.
- Raw config snapshots remain under one private temporary root with directory
  mode `0700` and file mode `0600`. Never print, commit, attach, or send raw
  config text.
- Snapshot `C` is followed immediately by official restoration and snapshot
  `D`. Offline parsing and diagnosis happen only after restoration. This
  safety-first order is an explicitly approved correction to the numbered
  order in the design's Minimum Diagnostic Experiment.
- The redacted report contains only safe key paths, add/remove/modify kind,
  before/after value types, and a conservative impact class. It contains no
  config values, value digests, credentials, tokens, unknown free text, or full
  machine-local paths.
- A dynamic or unsafe TOML key segment is replaced with a stable
  `<redacted-key:XXXXXXXXXXXX>` digest label. The digest identifies the key
  segment only, never its value.
- Automatic classification is conservative: no change becomes `no-change`;
  changed security/product-control paths become `security-or-product-impact`;
  every other changed path becomes `unexplained-change`. The operator must not
  invent `expected-managed-change`; that requires later documented or
  independently verified evidence and a Main Task judgment.
- Missing snapshots, parse failure, unsafe output, or unavailable `tomllib`
  produces `evidence-insufficient` after restoration.
- Restoration is complete only when official plugin/marketplace structure
  matches preflight and the `A -> D` semantic config diff is empty. Byte
  inequality with semantic equality is a formatting observation, not an
  automatic product failure.
- Do not start a local-plugin control, retry the session, or run a second
  reproduction automatically. The Main Task decides whether another control
  is worth its cost.
- Do not modify Navi repository files, `docs/navi/calibration-log.md`, `work/`,
  Historical Along, an external project, package metadata, or dependencies.
- Do not run repository tests, typecheck, plugin verification, release checks,
  tag, push, release, publication, or cleanup of retained failure evidence.
- Do not use a Validation Task. This is one real environment observation, not
  implementation acceptance.
- Use direct task messaging for decisions and the final result. The Source Main
  Task applies Async Event Reconciliation at the next dependent checkpoint if
  direct visibility fails.

## Diagnostic Contract

```text
goal: classify one minimum-session config drift under the exact Git-backed Navi candidate
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
candidate: 358b6b4c9fd95fcfe169a8647238859e363e8fa3
operator: one true Codex-managed worktree task
global_state_scope: official replacement and restoration of only marketplace navi-source and plugin navi@navi-source
target_scope: one empty private temporary session root; no real project
snapshot_scope: private A/B/C/D copies of ~/.codex/config.toml plus hashes and official plugin/marketplace JSON
session_budget: one fresh codex exec command with one no-tool read-only prompt; no resume and no second command
analysis: offline Python tomllib key-path/type diff after restoration
result_route: one direct structured diagnostic result to the Source Main Task
stop_conditions: unexpected initial global state, non-restorable state, missing or unsafe config, unsupported Codex/Python environment, missing authorization, switch/session/snapshot/restore failure, unsafe diff output, or completed result
```

## Planned Artifacts

No repository file is modified by the Calibration Operator.

```text
<private-root>/
  evidence/
    codex-version.txt
    marketplaces-A.json
    plugins-A.json
    config-A.toml
    config-A.sha256
    marketplaces-B.json
    plugins-B.json
    config-B.toml
    config-B.sha256
    switch-stdout.txt
    switch-stderr.txt
    session-events.jsonl
    session-last-message.txt
    session-stderr.txt
    session-exit.txt
    config-C.toml
    config-C.sha256
    restore-stdout.txt
    restore-stderr.txt
    marketplaces-D.json
    plugins-D.json
    config-D.toml
    config-D.sha256
    diff-B-C.redacted.json
    diff-A-D.redacted.json
  session-root/
  restore-navi-source.sh
```

All artifacts use mode `0600` except directories and the restore script. The
private root and directories use `0700`; the restore script uses `0700`.

---

### Task 1: Reconfirm The Immutable Candidate And Create The Operator

**Owner:** Source Main Task

**Produces:** One exact candidate check and one separately authorized
Calibration Operator.

- [ ] **Step 1: Confirm the candidate remains available without touching user work**

Run in the Navi repository:

```bash
git status --short --branch
git cat-file -e 358b6b4c9fd95fcfe169a8647238859e363e8fa3^{commit}
git ls-remote origin refs/heads/main
```

Expected: local user-owned `docs/navi/calibration-log.md` and `work/` remain
untouched; the immutable candidate exists locally and remains reachable from
the repository history. Remote `main` may have advanced beyond the candidate;
the diagnostic uses the full immutable SHA, not floating `main`.

- [ ] **Step 2: Obtain explicit approval to create the Calibration Operator**

The approval covers only:

- one Codex-managed worktree task;
- read-only preflight of current Navi plugin/marketplace state;
- creation of one private temporary root;
- private snapshot `A`;
- preparation, but not execution, of restoration commands; and
- one direct decision-required event requesting the grouped switch/session/
  restore authorization.

It does not yet authorize global mutation or the minimum session.

- [ ] **Step 3: Create the true worktree task**

Create one Navi project worktree task at the exact current committed plan
baseline. Supply this plan path, the approved design, candidate SHA, Source Main
Task ID, and the Diagnostic Contract above.

Expected: one clean isolated task. Do not create a Validation Task.

---

### Task 2: Prove The Private Snapshot And Restoration Boundary

**Owner:** Calibration Operator

**Produces:** Snapshot `A`, exact current-state evidence, a private workspace,
and one grouped mutation decision.

- [ ] **Step 1: Verify the operator baseline and required local tools**

Run:

```bash
git status --short --branch
git rev-parse HEAD
codex --version
python3 -c 'import sys, tomllib; assert sys.version_info >= (3, 11); print(sys.version.split()[0])'
```

Expected: worktree clean; the plan exists at HEAD; Codex version exactly
`codex-cli 0.144.5`; Python is at least 3.11 and `tomllib` imports. A different
Codex version or unavailable parser is premise-changing and stops before
global mutation.

- [ ] **Step 2: Create the private root and safely capture snapshot A**

Run:

```bash
set -euo pipefail
umask 077
CONFIG="$HOME/.codex/config.toml"
test -f "$CONFIG"
test ! -L "$CONFIG"

CAL_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/navi-config-drift.XXXXXX")"
EVIDENCE="$CAL_ROOT/evidence"
SESSION_ROOT="$CAL_ROOT/session-root"
mkdir -m 700 "$EVIDENCE" "$SESSION_ROOT"
chmod 700 "$CAL_ROOT"

codex --version > "$EVIDENCE/codex-version.txt"
codex plugin marketplace list --json > "$EVIDENCE/marketplaces-A.json"
codex plugin list --json > "$EVIDENCE/plugins-A.json"
install -m 600 "$CONFIG" "$EVIDENCE/config-A.toml"
shasum -a 256 "$EVIDENCE/config-A.toml" > "$EVIDENCE/config-A.sha256"
chmod 600 "$EVIDENCE"/*
```

Do not display `config-A.toml` or run a textual diff.

- [ ] **Step 3: Prove the exact restorable local Navi shape**

Run this structural check:

```bash
node --input-type=module - \
  "$EVIDENCE/marketplaces-A.json" \
  "$EVIDENCE/plugins-A.json" \
  '/Users/james/Codex Project/General Codex Project/Navi' <<'NODE'
import fs from "node:fs";
import path from "node:path";

const [marketFile, pluginFile, repo] = process.argv.slice(2);
const markets = JSON.parse(fs.readFileSync(marketFile, "utf8")).marketplaces;
const plugins = JSON.parse(fs.readFileSync(pluginFile, "utf8")).installed;
const selectedMarkets = markets.filter((entry) => entry.name === "navi-source");
const selectedPlugins = plugins.filter((entry) => entry.pluginId === "navi@navi-source");

if (selectedMarkets.length !== 1 || selectedPlugins.length !== 1) {
  throw new Error("expected exactly one navi-source marketplace and plugin");
}

const market = selectedMarkets[0];
const plugin = selectedPlugins[0];
if (
  market.marketplaceSource?.sourceType !== "local" ||
  path.resolve(market.marketplaceSource.source) !== path.resolve(repo) ||
  plugin.installed !== true ||
  plugin.enabled !== true ||
  plugin.version !== "0.1.0" ||
  plugin.source?.source !== "local" ||
  path.resolve(plugin.source.path) !== path.resolve(repo, "plugins/navi")
) {
  throw new Error("current Navi state is not the expected restorable local shape");
}
NODE
```

Expected: exit 0. Any selector ambiguity or different source/version stops
before mutation.

- [ ] **Step 4: Prepare but do not execute the official restoration script**

Create `$CAL_ROOT/restore-navi-source.sh` with mode `0700` and this exact
content:

```bash
#!/bin/zsh
set -euo pipefail
codex plugin remove navi@navi-source --json || true
codex plugin marketplace remove navi-source --json || true
codex plugin marketplace add "/Users/james/Codex Project/General Codex Project/Navi" --json
codex plugin add navi@navi-source --json
```

Do not execute it during preflight. Record its SHA-256 and verify that no
repository file changed.

- [ ] **Step 5: Send one grouped decision-required event**

Send one conformant `NAVI_LANE_HANDOFF_EVENT V1` directly to the Source Main
Task. It must include:

- exact candidate and Codex/Python versions;
- private root path without config contents;
- snapshot `A` hash;
- verified local marketplace/plugin structure;
- restore script path and hash;
- the four switch commands in Task 3;
- the one minimum session command shape;
- the immediate restore-before-analysis rule; and
- one decision requesting the complete switch/session/restore contract.

Stop until the Source Main Task returns the explicit grouped authorization.

---

### Task 3: Switch, Capture B/C, And Restore Before Diagnosis

**Owner:** Calibration Operator after grouped authorization

**Produces:** Private snapshots `B`, `C`, and `D`, one minimum session record,
and restored original local Navi state.

- [ ] **Step 1: Reconfirm A and enter the exact Git-backed state**

Re-run the Task 2 structural check against `marketplaces-A.json` and
`plugins-A.json`, confirm the current config hash still equals
`config-A.sha256`, then execute exactly:

```bash
SWITCH_EXIT=0
{
  codex plugin remove navi@navi-source --json &&
  codex plugin marketplace remove navi-source --json &&
  codex plugin marketplace add HezLUO/navi \
    --ref 358b6b4c9fd95fcfe169a8647238859e363e8fa3 \
    --json &&
  codex plugin add navi@navi-source --json
} > "$EVIDENCE/switch-stdout.txt" \
  2> "$EVIDENCE/switch-stderr.txt" || SWITCH_EXIT=$?
chmod 600 "$EVIDENCE/switch-stdout.txt" "$EVIDENCE/switch-stderr.txt"

if (( SWITCH_EXIT != 0 )); then
  "$CAL_ROOT/restore-navi-source.sh" \
    > "$EVIDENCE/restore-stdout.txt" \
    2> "$EVIDENCE/restore-stderr.txt"
  codex plugin marketplace list --json > "$EVIDENCE/marketplaces-D.json"
  codex plugin list --json > "$EVIDENCE/plugins-D.json"
  install -m 600 "$CONFIG" "$EVIDENCE/config-D.toml"
  shasum -a 256 "$EVIDENCE/config-D.toml" > "$EVIDENCE/config-D.sha256"
  chmod 600 "$EVIDENCE"/*
  exit "$SWITCH_EXIT"
fi
```

The guarded chain stops at the first failed switch command, restores through
official commands, captures `D`, and exits only after restoration evidence.
The operator must run the Task 2 structural check against the failure-path `D`
JSON before delivering the failure event. It must not continue to snapshot
`B` or run the session.

- [ ] **Step 2: Verify the Git identity and capture snapshot B**

Run:

```bash
codex plugin marketplace list --json > "$EVIDENCE/marketplaces-B.json"
codex plugin list --json > "$EVIDENCE/plugins-B.json"
install -m 600 "$CONFIG" "$EVIDENCE/config-B.toml"
shasum -a 256 "$EVIDENCE/config-B.toml" > "$EVIDENCE/config-B.sha256"
chmod 600 "$EVIDENCE"/*
```

Verify from official JSON that exactly one `navi-source` marketplace resolves
from `https://github.com/HezLUO/navi.git`, its checkout HEAD equals the exact
candidate, and exactly one enabled `navi@navi-source` v0.1.0 resolves from that
marketplace. Do not infer identity solely from cache contents.

- [ ] **Step 3: Run the single minimum no-tool session**

Run exactly one fresh command from the empty private session root:

```bash
SESSION_EXIT=0
: > "$EVIDENCE/session-events.jsonl"
: > "$EVIDENCE/session-last-message.txt"
: > "$EVIDENCE/session-stderr.txt"
: > "$EVIDENCE/session-exit.txt"
chmod 600 \
  "$EVIDENCE/session-events.jsonl" \
  "$EVIDENCE/session-last-message.txt" \
  "$EVIDENCE/session-stderr.txt" \
  "$EVIDENCE/session-exit.txt"
codex exec \
  --json \
  --skip-git-repo-check \
  -C "$SESSION_ROOT" \
  -o "$EVIDENCE/session-last-message.txt" \
  'Reply with exactly CONFIG_DIAGNOSTIC_COMPLETE. Do not use tools, inspect projects, or modify files.' \
  > "$EVIDENCE/session-events.jsonl" \
  2> "$EVIDENCE/session-stderr.txt" || SESSION_EXIT=$?
printf '%s\n' "$SESSION_EXIT" > "$EVIDENCE/session-exit.txt"
```

Do not use a model override, profile, alternate `CODEX_HOME`, explicit Navi
prompt, tool request, resume, or second command. The session result is evidence
even if the command exits nonzero or the final text differs; do not retry it.
Capturing `SESSION_EXIT` prevents shell error handling from skipping snapshot
`C` or restoration.

- [ ] **Step 4: Capture C, then restore immediately**

Immediately after the command terminates, run:

```bash
install -m 600 "$CONFIG" "$EVIDENCE/config-C.toml"
shasum -a 256 "$EVIDENCE/config-C.toml" > "$EVIDENCE/config-C.sha256"
chmod 600 "$EVIDENCE"/*

"$CAL_ROOT/restore-navi-source.sh" \
  > "$EVIDENCE/restore-stdout.txt" \
  2> "$EVIDENCE/restore-stderr.txt"
```

Restoration runs regardless of session success, output, or observed hash.
Do not parse or compare the config before restoration.

- [ ] **Step 5: Capture D and prove official structural restoration**

Run:

```bash
codex plugin marketplace list --json > "$EVIDENCE/marketplaces-D.json"
codex plugin list --json > "$EVIDENCE/plugins-D.json"
install -m 600 "$CONFIG" "$EVIDENCE/config-D.toml"
shasum -a 256 "$EVIDENCE/config-D.toml" > "$EVIDENCE/config-D.sha256"
chmod 600 "$EVIDENCE"/*
```

Run the Task 2 structural check against the `D` JSON files. If restoration
structure fails, report that material failure before any attribution work.

---

### Task 4: Produce The Offline Redacted Semantic Result

**Owner:** Calibration Operator after confirmed structural restoration

**Produces:** Two private redacted semantic diffs and one direct diagnostic
result.

- [ ] **Step 1: Create the value-free TOML comparator in the private root**

Run the following command twice, first for `B/C`, then for `A/D`:

```bash
python3 - "$BEFORE" "$AFTER" "$OUTPUT" <<'PY'
import hashlib
import json
import re
import sys
import tomllib
from pathlib import Path

before_path, after_path, output_path = map(Path, sys.argv[1:4])

with before_path.open("rb") as handle:
    before = tomllib.load(handle)
with after_path.open("rb") as handle:
    after = tomllib.load(handle)

MISSING = object()
EMPTY_TABLE = object()
SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
IMPACT_TERMS = {
    "approval", "auth", "credential", "feature", "hook", "marketplace",
    "mcp", "model", "permission", "plugin", "profile", "provider",
    "sandbox", "shell_environment", "token", "trust",
}

def flatten(value, prefix=()):
    if isinstance(value, dict):
        if not value:
            return {prefix: EMPTY_TABLE}
        result = {}
        for key, child in value.items():
            result.update(flatten(child, prefix + (str(key),)))
        return result
    return {prefix: value}

def value_type(value):
    if value is MISSING:
        return "missing"
    if value is EMPTY_TABLE:
        return "table"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, str):
        return "string"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "float"
    if isinstance(value, list):
        return "array"
    return type(value).__name__

def safe_segment(segment):
    if SAFE_SEGMENT.fullmatch(segment):
        return segment
    digest = hashlib.sha256(segment.encode("utf-8")).hexdigest()[:12]
    return f"<redacted-key:{digest}>"

def impact(path):
    normalized = "_".join(path).lower()
    if any(term in normalized for term in IMPACT_TERMS):
        return "security-or-product-impact"
    return "unexplained-change"

before_flat = flatten(before)
after_flat = flatten(after)
changes = []
for path in sorted(set(before_flat) | set(after_flat)):
    old = before_flat.get(path, MISSING)
    new = after_flat.get(path, MISSING)
    if old == new:
        continue
    kind = "added" if old is MISSING else "removed" if new is MISSING else "modified"
    changes.append({
        "path": ".".join(safe_segment(segment) for segment in path),
        "kind": kind,
        "beforeType": value_type(old),
        "afterType": value_type(new),
        "impact": impact(path),
    })

classification = "no-change"
if any(change["impact"] == "security-or-product-impact" for change in changes):
    classification = "security-or-product-impact"
elif changes:
    classification = "unexplained-change"

report = {
    "schemaVersion": 1,
    "classification": classification,
    "changeCount": len(changes),
    "changes": changes,
}
output_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
output_path.chmod(0o600)
PY
```

Set and run:

```bash
BEFORE="$EVIDENCE/config-B.toml"
AFTER="$EVIDENCE/config-C.toml"
OUTPUT="$EVIDENCE/diff-B-C.redacted.json"
# run the comparator command above

BEFORE="$EVIDENCE/config-A.toml"
AFTER="$EVIDENCE/config-D.toml"
OUTPUT="$EVIDENCE/diff-A-D.redacted.json"
# run the comparator command above
```

The execution prompt must embed the comparator body both times or save it as a
mode `0600` private-root script and invoke it twice. It must not abbreviate the
second invocation as an unreviewed different implementation.

- [ ] **Step 2: Audit the redacted output before delivery**

Run:

```bash
chmod 600 "$EVIDENCE/diff-B-C.redacted.json" "$EVIDENCE/diff-A-D.redacted.json"
if rg -n '/Users/|/private/|/var/|BEGIN .*PRIVATE|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|github_pat_|bearer [A-Za-z0-9]' \
  "$EVIDENCE/diff-B-C.redacted.json" \
  "$EVIDENCE/diff-A-D.redacted.json"; then
  echo "unsafe redacted output" >&2
  exit 1
fi
node -e 'for (const file of process.argv.slice(1)) JSON.parse(require("fs").readFileSync(file, "utf8"))' \
  "$EVIDENCE/diff-B-C.redacted.json" \
  "$EVIDENCE/diff-A-D.redacted.json"
```

Expected: no unsafe match; both reports parse as JSON. Do not print either
report until this audit passes.

- [ ] **Step 3: Classify restoration and session drift**

Use these exact rules:

- `A/D` structural state fails: `security-or-product-impact`, restoration
  failure, stop.
- `A/D` semantic classification is not `no-change`: restoration incomplete,
  report its highest impact; do not accept the session result.
- `A/D` semantic equality with different hashes: restoration PASS with one
  formatting-only observation.
- `B/C` `no-change`: config-stability PASS.
- `B/C` `security-or-product-impact`: material calibration failure; do not
  attribute it to Navi without additional causal evidence.
- `B/C` `unexplained-change`: global config stability remains inconclusive and
  another control requires a new Main Task decision.
- Missing/unsafe/unparseable evidence: `evidence-insufficient`.

Never automatically assign `expected-managed-change`.

- [ ] **Step 4: Send one direct decision event with the diagnostic result**

Send one conformant bare event directly to the Source Main Task:

```text
NAVI_LANE_HANDOFF_EVENT
version: 1
event_id: one unique stable identifier
kind: decision-required
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
source_lane: exact Calibration Operator task identifier
goal: classify one minimum-session config drift under the exact Git-backed Navi candidate
summary: one factual classification and restoration summary
evidence: candidate SHA; Codex version; A/B/C/D hashes; session status; B/C classification and redacted changed key paths or none; restoration structure and A/D semantics; raw_config_disclosed=no; target_project_accessed=no; additional_control_run=no; retained private evidence root
worktree_state: clean
declared_impact: premise-changing
decision_needed: choose the next product or diagnostic action supported by this classification
recommendation: one bounded recommendation derived from the exact verdict rules
continuation: this Calibration Operator remains closed; no retry, control, cleanup, or product action starts automatically
```

Keep `evidence` compact. If the changed-path list is too long for one safe
field, include its count, highest impact, and the retained private redacted
report path; the Main Task may read that already-audited report only if the
decision requires more detail. Do not include raw config values or raw private
snapshots in task messaging.

- [ ] **Step 5: Close without retry or cleanup**

Verify:

- operator worktree remains clean;
- Navi repository and external projects were not modified;
- current official plugin/marketplace structure is restored;
- raw snapshots remain mode `0600` under the private root; and
- no second session or local-plugin control occurred.

Stop after direct result delivery. Retain the private root until the Main Task
decides whether the evidence can be deleted. Do not poll the Main Task.

## Main-Task Decision After Result

The Main Task uses the result only to choose among:

- accept `no-change` for this minimum session and decide whether the unfinished
  Distribution journey is still worth completing;
- investigate documented Codex-managed behavior before assigning
  `expected-managed-change`;
- report a bounded Codex host/CLI issue for a security/product-impacting or
  unexplained change;
- authorize one separate local-plugin or resume-specific control; or
- retain an explicit environment limitation and stop further calibration.

No result automatically starts another experiment, changes Navi product code,
publishes a release, or upgrades the previous incomplete Distribution journey
to PASS.
