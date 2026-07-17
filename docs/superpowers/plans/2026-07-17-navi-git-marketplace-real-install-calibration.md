# Navi Git Marketplace Real-Installation Calibration Execution Plan

> **For calibration operators:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` in one true Codex-managed worktree task. Do not
> execute this stateful calibration in the persistent Main Thread, and do not
> split global plugin mutation across parallel agents. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Determine whether one ordinary Codex user can install the exact Navi
candidate through its Git-backed marketplace, reach package-local onboarding
from a natural progress question, approve one exact temporary-project write,
and use the confirmed Map in a second fresh Codex task.

**Architecture:** One Calibration Operator owns the complete reversible global
state transition and evidence package. It switches the existing local
`navi-source` installation to one immutable Git commit using only official
Codex commands, launches two fresh `codex exec` sessions against a sanitized
copy of the real `sub_ag_ski` project, restores the original local installation
before reporting, and never edits Navi source. The Main Thread owns the push,
the exact preview approval, product-risk decisions, and the final calibration
judgment.

**Tech Stack:** Codex CLI 0.141.0 or the then-current recorded version, official
`codex plugin` and `codex plugin marketplace` commands, Git, `rsync`, Node.js,
POSIX shell tools, Navi's installed package-local ESM init entry, Codex task
messaging.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-17-navi-git-marketplace-real-install-calibration-design.md`.
- This is Calibration mode. It is not Implementation or Release mode.
- The exact candidate must be integrated on `main`, pushed to `origin/main`,
  and selected by its full immutable commit SHA before global plugin mutation.
- The Main Thread must explicitly approve the push, creation of the Calibration
  Operator task, the grouped global-state mutation contract, and the exact init
  preview. None of those approvals is implied by this plan.
- Use one stateful Calibration Operator. Do not run marketplace removal,
  marketplace addition, plugin removal, plugin installation, or restoration in
  parallel agents or fresh tasks.
- Fresh task 1 and fresh task 2 use the real user `CODEX_HOME`; do not use
  `--profile`, `--ignore-user-config`, another `CODEX_HOME`, or an isolated
  CLI-only configuration.
- Use only official Codex plugin lifecycle commands. Do not edit
  `~/.codex/config.toml`, write the managed plugin cache, copy plugin bytes into
  the cache, or infer successful installation solely from cache contents.
- The expected preflight state is exactly one local `navi-source` marketplace
  rooted at the Navi repository and one enabled `navi@navi-source` plugin from
  that local marketplace. If the actual state differs, stop before mutation.
- Prepare restoration commands before the first mutation. After any mutation,
  restoration outranks diagnosis, extra evidence, or a second attempt.
- Use the real `sub_ag_ski` source as read-only evidence. All calibration writes
  are limited to one newly created temporary root.
- Exclude all existing Navi activation evidence from the temporary copy:
  `.navi/`, the `<!-- NAVI:START -->` managed block in `AGENTS.md`, and
  `docs/along/project-maps/navi-current-project.md`.
- Also exclude `.git`, `node_modules`, generated outputs, caches, credentials,
  secrets, and machine-local scratch. Preserve project-owned source, package
  metadata, README, plans, release records, and instructions outside the Navi
  managed block.
- Before exact user approval, the target project must remain byte-for-byte
  equal to its sanitized baseline. A private candidate file outside the target
  is allowed.
- After approval, the only allowed target changes are
  `.navi/project-map.md` and the bounded Navi managed block in `AGENTS.md`.
- Do not use the Navi source checkout, `npm link`, bare `navi`, a hardcoded
  cache path, direct project-file writes, or silent runtime installation to
  make the journey pass.
- Do not run repository tests, typecheck, package verification, release checks,
  update/rollback/uninstall tests, cross-platform tests, or a second green
  calibration run.
- Do not edit or commit `docs/navi/calibration-log.md` during execution. It
  already contains user-owned uncommitted work. Return the evidence to the Main
  Thread first; durable recording is a separate decision.
- Do not touch `work/`, Historical Along, Runtime Surface, UI, MCP,
  background services, other-agent support, package publication, tag, GitHub
  Release, or Public Plugin Directory submission.
- No calibration lane may merge, push, tag, release, publish, accept product
  risk, or begin the local-marketplace calibration automatically.

## Calibration Contract

```text
goal: calibrate the minimum real Git-backed Navi installation and activation loop
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
candidate: exact pushed origin/main commit supplied by the Main Thread
operator: one true Codex-managed worktree task at the exact candidate
global_state_scope: official removal/restoration of only navi@navi-source and marketplace navi-source
target_source: /Users/james/Codex Project/General Codex Project/sub_ag_ski (read-only)
target_write_scope: one new temporary root; after approval only .navi/project-map.md and Navi AGENTS.md block inside its sanitized project copy
fresh_task_1: 请帮我看看这个项目现在做到哪了，接下来应该做什么。
fresh_task_2: 这个项目接下来应该做什么？
diagnostic_prompt: explicit Navi prompt only after natural-entry failure; diagnostic evidence cannot convert failure to PASS
validation_budget: one decisive real journey, static inventories and diffs, no repository test suite
cleanup: success may delete only the recorded temporary root after result delivery; failure retains it
stop_conditions: missing authorization, unpushed SHA, non-restorable global state, scope-changing diagnosis, preview/write mismatch, runtime/design dependency, product-risk decision, or completed result
result_route: direct task message to the source Main Thread; the user does not relay transcripts
```

The grouped global-state authorization may cover the exact official remove,
add, install, and restore commands below. It does not cover an unknown existing
selector, a second marketplace, a disabled initial plugin, direct config/cache
editing, credentials, another plugin, or another marketplace.

## Planned Artifacts And Ownership

No repository source file is modified by this calibration.

The Calibration Operator creates one private temporary root with these logical
artifacts:

```text
<calibration-root>/
  evidence/
    codex-version.txt
    marketplaces-before.json
    plugins-before.json
    marketplaces-git.json
    plugins-git.json
    first-events.jsonl
    first-last-message.txt
    first-stderr.txt
    second-events.jsonl
    second-last-message.txt
    second-stderr.txt
    marketplaces-after.json
    plugins-after.json
    source-before.sha256
    source-after.sha256
    target-baseline.sha256
    target-before-apply.sha256
    target-after-apply.sha256
    target-after-second.sha256
  pristine/sub_ag_ski/
  target/sub_ag_ski/
  restore-navi-source.sh
```

- `evidence/` contains only the bounded non-secret evidence named in the
  approved design.
- `pristine/sub_ag_ski/` is the immutable sanitized comparison baseline.
- `target/sub_ag_ski/` is the only project root fresh tasks may inspect or
  modify.
- `restore-navi-source.sh` uses official Codex commands to restore the exact
  known local Navi source. It is prepared before mutation and is not committed.

---

### Task 1: Push One Immutable Candidate And Start The Operator

**Owner:** Main Thread

**Produces:** One pushed immutable SHA and one separate Calibration Operator.

- [ ] **Step 1: Reconfirm the exact Main Thread state without touching user work**

Run in the Navi repository:

```bash
git status --short --branch
git rev-parse HEAD
git log --oneline --decorate -7
git diff -- docs/navi/calibration-log.md
git ls-files --others --exclude-standard
```

Expected: `main` is ahead of `origin/main`; the only pre-existing non-plan
working state is the user-owned `docs/navi/calibration-log.md` modification and
untracked `work/`. Do not stage, restore, remove, or rewrite either path.

- [ ] **Step 2: Obtain the explicit push decision and push `main`**

Only after user approval:

```bash
CANDIDATE_SHA="$(git rev-parse HEAD)"
git push origin main
REMOTE_SHA="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
test "$REMOTE_SHA" = "$CANDIDATE_SHA"
printf '%s\n' "$CANDIDATE_SHA"
```

Expected: push succeeds and the remote `main` SHA exactly equals the local
candidate. This is not a tag, release, or publication.

- [ ] **Step 3: Obtain explicit approval and create one true worktree task**

Create a Codex-managed Navi worktree task at the exact pushed `main`. Its prompt
must include the Calibration Contract above, this plan path, the candidate SHA,
the source Main Thread ID, the requirement to use
`superpowers:executing-plans`, and the requirement to deliver decisions/results
directly to the Main Thread.

Expected: one clean operator worktree at the candidate SHA. Do not create a
Validation Thread: this is a real product observation, not implementation
acceptance.

### Task 2: Prove Restoration And Build The Sanitized Target

**Owner:** Calibration Operator

**Produces:** A reversible preflight record and one clean mature-project copy.

- [ ] **Step 1: Record exact repository and global state**

Set these values exactly:

```bash
NAVI_REPO='/Users/james/Codex Project/General Codex Project/Navi'
SOURCE='/Users/james/Codex Project/General Codex Project/sub_ag_ski'
CANDIDATE_SHA='<exact SHA supplied by Main Thread>'
CAL_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/navi-git-calibration.XXXXXX")"
EVIDENCE="$CAL_ROOT/evidence"
PRISTINE="$CAL_ROOT/pristine/sub_ag_ski"
TARGET="$CAL_ROOT/target/sub_ag_ski"
mkdir -p "$EVIDENCE" "$PRISTINE" "$TARGET"

codex --version > "$EVIDENCE/codex-version.txt"
codex plugin marketplace list --json > "$EVIDENCE/marketplaces-before.json"
codex plugin list --json > "$EVIDENCE/plugins-before.json"
git -C "$NAVI_REPO" rev-parse HEAD > "$EVIDENCE/navi-head.txt"
git -C "$SOURCE" status --short --branch > "$EVIDENCE/source-status-before.txt"
```

Replace only the angle-bracketed SHA before running. Expected: Navi HEAD equals
the supplied pushed SHA.

- [ ] **Step 2: Enforce the exact restorable preflight shape**

Run:

```bash
node --input-type=module - \
  "$EVIDENCE/marketplaces-before.json" \
  "$EVIDENCE/plugins-before.json" \
  "$NAVI_REPO" <<'NODE'
import fs from "node:fs";
import path from "node:path";

const [marketFile, pluginFile, repo] = process.argv.slice(2);
const markets = JSON.parse(fs.readFileSync(marketFile, "utf8")).marketplaces;
const plugins = JSON.parse(fs.readFileSync(pluginFile, "utf8")).installed;
const naviMarkets = markets.filter((entry) => entry.name === "navi-source");
const naviPlugins = plugins.filter((entry) => entry.pluginId === "navi@navi-source");

if (naviMarkets.length !== 1 || naviPlugins.length !== 1) {
  throw new Error("expected exactly one navi-source marketplace and plugin");
}

const market = naviMarkets[0];
const plugin = naviPlugins[0];
const expectedPluginPath = path.join(repo, "plugins/navi");
if (
  market.marketplaceSource?.sourceType !== "local" ||
  path.resolve(market.marketplaceSource.source) !== path.resolve(repo) ||
  plugin.installed !== true ||
  plugin.enabled !== true ||
  plugin.version !== "0.1.0" ||
  plugin.source?.source !== "local" ||
  path.resolve(plugin.source.path) !== path.resolve(expectedPluginPath)
) {
  throw new Error("current Navi state is not the approved restorable local shape");
}
NODE
```

Expected: exit 0. Any failure is `decision-required` before mutation; do not
guess a restore path.

- [ ] **Step 3: Prepare the official-command restoration script**

Create `$CAL_ROOT/restore-navi-source.sh` with this exact content, substituting
the recorded absolute `NAVI_REPO` path safely:

```bash
#!/bin/sh
set -eu
NAVI_REPO='/Users/james/Codex Project/General Codex Project/Navi'
codex plugin remove navi@navi-source --json || true
codex plugin marketplace remove navi-source --json || true
codex plugin marketplace add "$NAVI_REPO" --json
codex plugin add navi@navi-source --json
codex plugin marketplace list --json
codex plugin list --json
```

Set mode `0700`. Expected: the script contains no config/cache write, another
plugin selector, or another marketplace selector. Do not run it yet.

- [ ] **Step 4: Capture an original-project content manifest**

Run:

```bash
(
  cd "$SOURCE"
  find . -type f \
    ! -path './.git/*' \
    ! -path './node_modules/*' \
    -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/source-before.sha256"
```

Expected: a stable read-only manifest of source and untracked project evidence,
excluding only Git internals and dependencies.

- [ ] **Step 5: Create and sanitize the mature-project copy**

Run:

```bash
rsync -a \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.navi/' \
  --exclude 'dist/' \
  --exclude 'build/' \
  --exclude 'coverage/' \
  --exclude '.cache/' \
  --exclude '.codex/' \
  --exclude '.superpowers/' \
  --exclude '.env*' \
  --exclude '*.pem' \
  --exclude '*.key' \
  --exclude '.npmrc' \
  --exclude '.DS_Store' \
  --exclude 'docs/along/project-maps/navi-current-project.md' \
  "$SOURCE/" "$TARGET/"

test "$(rg -c '^<!-- NAVI:START -->$' "$TARGET/AGENTS.md")" = 1
test "$(rg -c '^<!-- NAVI:END -->$' "$TARGET/AGENTS.md")" = 1
awk '
  /^<!-- NAVI:START -->$/ { skip = 1; next }
  /^<!-- NAVI:END -->$/ { skip = 0; next }
  !skip { print }
' "$TARGET/AGENTS.md" > "$CAL_ROOT/AGENTS.sanitized"
mv "$CAL_ROOT/AGENTS.sanitized" "$TARGET/AGENTS.md"

test ! -e "$TARGET/.git"
test ! -e "$TARGET/node_modules"
test ! -e "$TARGET/.navi"
test ! -e "$TARGET/docs/along/project-maps/navi-current-project.md"
if rg -n 'NAVI:START|NAVI:END|Navi Current Project Map' "$TARGET"; then
  exit 1
fi
```

Expected: the real source, package metadata, README, plans, and release evidence
remain, while all prior Navi activation state is absent.

- [ ] **Step 6: Freeze the sanitized comparison baseline**

Run:

```bash
rsync -a "$TARGET/" "$PRISTINE/"
(
  cd "$TARGET"
  find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/target-baseline.sha256"
```

Expected: `diff -qr "$PRISTINE" "$TARGET"` prints nothing.

### Task 3: Switch To The Immutable Git Marketplace

**Owner:** Calibration Operator

**Produces:** One installed and enabled `navi@navi-source` from the exact Git
candidate, with the original local state still recoverable.

- [ ] **Step 1: Obtain grouped global-state authorization**

Send one `decision-required` event directly to the Main Thread. It must identify
the exact candidate SHA, the current local source, the four official switching
commands, the official restoration sequence, the prepared restore script, and
the temporary target root.

Expected: the user either authorizes the complete bounded switch/restore
contract or the operator stops without mutation. Do not ask again between the
individual official commands once the grouped contract is approved.

- [ ] **Step 2: Replace only the local Navi selector with the pinned Git source**

After authorization, run sequentially:

```bash
codex plugin remove navi@navi-source --json \
  > "$EVIDENCE/remove-local-plugin.json"
codex plugin marketplace remove navi-source --json \
  > "$EVIDENCE/remove-local-marketplace.json"
codex plugin marketplace add HezLUO/navi --ref "$CANDIDATE_SHA" --json \
  > "$EVIDENCE/add-git-marketplace.json"
codex plugin list --marketplace navi-source --available --json \
  > "$EVIDENCE/git-marketplace-available.json"
codex plugin add navi@navi-source --json \
  > "$EVIDENCE/add-git-plugin.json"
codex plugin marketplace list --json > "$EVIDENCE/marketplaces-git.json"
codex plugin list --json > "$EVIDENCE/plugins-git.json"
```

If any command fails after the first successful mutation, immediately run
`$CAL_ROOT/restore-navi-source.sh`, verify restoration, and stop. Do not diagnose
inside a partially switched global state.

- [ ] **Step 3: Prove installed identity and package-local entry origin**

Inspect the two Git-state JSON files and require:

- exactly one marketplace named `navi-source`;
- a Git marketplace source pinned to the exact candidate SHA;
- exactly one installed and enabled `navi@navi-source` at version `0.1.0`;
- an installed plugin root outside the Navi source checkout; and
- an executable
  `skills/navi/scripts/navi-project-init.mjs` below that installed root.

Record the installed root from official `codex plugin list --json` output, then
run:

```bash
PLUGIN_ROOT='<installed source.path from plugins-git.json>'
ENTRY="$PLUGIN_ROOT/skills/navi/scripts/navi-project-init.mjs"
test -f "$ENTRY"
test -x "$ENTRY"
test "$(shasum -a 256 "$ENTRY" | awk '{print $1}')" = \
  "$(shasum -a 256 "$NAVI_REPO/plugins/navi/skills/navi/scripts/navi-project-init.mjs" | awk '{print $1}')"
```

Replace only the angle-bracketed path with the exact official output. A source
checkout path, unknown source, wrong version, floating ref, or non-executable
entry is a calibration failure; restore before reporting.

### Task 4: Run Natural Entry And Stop At The Exact Preview Decision

**Owner:** Calibration Operator, with one real approval owned by the user.

**Produces:** One natural fresh-task transcript and one read-only exact init
preview without target mutation.

- [ ] **Step 1: Record the target immediately before the first fresh task**

Run:

```bash
(
  cd "$TARGET"
  find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/target-before-first.sha256"
cmp "$EVIDENCE/target-baseline.sha256" "$EVIDENCE/target-before-first.sha256"
```

Expected: exact match.

- [ ] **Step 2: Start one fresh Codex process with only the natural prompt**

Run with the real global user state and no profile override:

```bash
codex exec --json --skip-git-repo-check \
  -C "$TARGET" \
  -o "$EVIDENCE/first-last-message.txt" \
  '请帮我看看这个项目现在做到哪了，接下来应该做什么。' \
  > "$EVIDENCE/first-events.jsonl" \
  2> "$EVIDENCE/first-stderr.txt"
```

Do not append a calibration contract, `Please use Navi`, `navi init`, Project
Map wording, cache path, or source checkout hint to this prompt.

Expected natural behavior:

1. installed Navi activates without being named;
2. it inspects bounded real project evidence;
3. it gives no falsely confirmed stable Map before project initialization;
4. it either enters the read-only preview directly or offers Navi project
   initialization as the next bounded action; and
5. it does not modify the target.

If the natural response offers Navi initialization but stops before preview,
that is successful natural activation, not a failure. Continue the same fresh
task once under the already approved read-only calibration boundary:

```bash
FIRST_SESSION_ID="$(node --input-type=module - \
  "$EVIDENCE/first-events.jsonl" <<'NODE'
import fs from "node:fs";

const file = process.argv[2];
for (const line of fs.readFileSync(file, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const event = JSON.parse(line);
  if (event.type === "thread.started" && event.thread_id) {
    process.stdout.write(event.thread_id);
    process.exit(0);
  }
}
process.exit(1);
NODE
)"

(
  cd "$TARGET"
  codex exec resume --json \
    -o "$EVIDENCE/first-preview-last-message.txt" \
    "$FIRST_SESSION_ID" \
    '请继续生成只读初始化预览；不要写入目标项目。' \
    > "$EVIDENCE/first-preview-events.jsonl" \
    2> "$EVIDENCE/first-preview-stderr.txt"
)
```

This follow-up is not a second fresh task and not a diagnostic prompt. It is
allowed only when the natural response itself identified Navi initialization
as the next action. It must produce a plausible candidate Map, invoke the
installed package-local entry for read-only preview, identify the target,
declared Map/trigger effects, and fingerprint, then stop at exact write
approval.

If the original natural response does not activate Navi or offer its onboarding
path, classify natural entry as failure. One explicit Navi prompt may then be
run only if diagnosis is read-only and already inside scope. Mark it
`diagnostic-only`; it cannot change Distribution to PASS.

- [ ] **Step 3: Complete the read-only preview inside the first fresh task**

Expected: the direct response or one authorized same-session follow-up produces
the candidate Map, installed package entry invocation, target, exact declared
writes, and fingerprint without target mutation. More than one follow-up,
another fresh task, a hidden calibration prompt, or a manually supplied plugin
path is outside the accepted journey.

- [ ] **Step 4: Prove the pre-approval target is unchanged**

Run:

```bash
(
  cd "$TARGET"
  find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/target-before-apply.sha256"
cmp "$EVIDENCE/target-baseline.sha256" "$EVIDENCE/target-before-apply.sha256"
diff -qr "$PRISTINE" "$TARGET"
```

Expected: both comparisons are empty/successful. If any target byte changed,
restore global state, retain the temporary root, and report failure. Do not
approve or continue.

- [ ] **Step 5: Route one exact preview decision to the Main Thread**

Send one bare `NAVI_LANE_HANDOFF_EVENT` V1 `decision-required` message with:

- the installed package entry path;
- the candidate Map path outside the target;
- the full plan fingerprint;
- declared writes limited to `.navi/project-map.md` and the Navi managed
  `AGENTS.md` block;
- confirmation that the pre-approval target is unchanged; and
- the recommendation to approve only if the candidate boundary and next
  decision are truthful enough to store.

The operator pauses here. The Main Thread presents the actual candidate Map and
one real approval question to the user. A generic `continue` is not approval.

### Task 5: Apply The Approved Preview And Run The Second Fresh Task

**Owner:** Calibration Operator

**Produces:** One exact approved temporary-project activation and one fresh
confirmed-Map response.

- [ ] **Step 1: Apply only the exact approved fingerprint**

After the Main Thread sends the user's explicit approval back to the operator,
run the exact installed-package command derived from the preview:

```bash
node "$ENTRY" \
  --target "$TARGET" \
  --map-file '<exact private candidate path from preview>' \
  --expect-plan '<exact approved 64-character fingerprint>' \
  --write \
  > "$EVIDENCE/apply-stdout.txt" \
  2> "$EVIDENCE/apply-stderr.txt"
```

Replace only the two angle-bracketed values with the preview values. Do not
regenerate the Map, recompute approval from a new preview, or bypass a freshness
failure.

- [ ] **Step 2: Audit the exact target delta**

Run:

```bash
(
  cd "$TARGET"
  find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/target-after-apply.sha256"
rsync -ainc --delete "$PRISTINE/" "$TARGET/" \
  > "$EVIDENCE/target-after-apply.rsync.txt"
test -f "$TARGET/.navi/project-map.md"
rg -n '^<!-- NAVI:START -->$|^<!-- NAVI:END -->$' "$TARGET/AGENTS.md"
```

Expected: the dry-run delta names only `AGENTS.md` and
`.navi/project-map.md`; the Map exists; exactly one complete managed block
exists. Any other path or a fingerprint/freshness refusal is failure. Do not
repair manually.

- [ ] **Step 3: Start a second genuinely fresh Codex process**

Run:

```bash
codex exec --json --skip-git-repo-check \
  -C "$TARGET" \
  -o "$EVIDENCE/second-last-message.txt" \
  '这个项目接下来应该做什么？' \
  > "$EVIDENCE/second-events.jsonl" \
  2> "$EVIDENCE/second-stderr.txt"
```

Expected: this is a new session, uses the confirmed Project Map, answers in
Chinese, gives a useful next decision, and does not propose installation or
initialization again.

- [ ] **Step 4: Confirm the second task performed no extra project write**

Run:

```bash
(
  cd "$TARGET"
  find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/target-after-second.sha256"
cmp "$EVIDENCE/target-after-apply.sha256" "$EVIDENCE/target-after-second.sha256"
```

Expected: exact match. An unapproved Map rewrite, trigger rewrite, source edit,
or new artifact is failure.

### Task 6: Restore First, Then Classify And Report

**Owner:** Calibration Operator and Main Thread

**Produces:** Restored global state, unchanged original project, and one bounded
calibration result delivered directly to the Main Thread.

- [ ] **Step 1: Restore the original local Navi state unconditionally**

Run:

```bash
"$CAL_ROOT/restore-navi-source.sh" \
  > "$EVIDENCE/restore-stdout.txt" \
  2> "$EVIDENCE/restore-stderr.txt"
codex plugin marketplace list --json > "$EVIDENCE/marketplaces-after.json"
codex plugin list --json > "$EVIDENCE/plugins-after.json"
```

Expected: exactly one local `navi-source` rooted at `$NAVI_REPO` and one
installed/enabled local `navi@navi-source` version `0.1.0`. Re-run the exact
structural preflight check from Task 2 against the `after` files. Restoration
failure is a real decision-required result; do not delete evidence or attempt
unapproved config repair.

- [ ] **Step 2: Prove the original target was untouched**

Run:

```bash
(
  cd "$SOURCE"
  find . -type f \
    ! -path './.git/*' \
    ! -path './node_modules/*' \
    -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256
) > "$EVIDENCE/source-after.sha256"
cmp "$EVIDENCE/source-before.sha256" "$EVIDENCE/source-after.sha256"
git -C "$SOURCE" status --short --branch \
  > "$EVIDENCE/source-status-after.txt"
cmp "$EVIDENCE/source-status-before.txt" "$EVIDENCE/source-status-after.txt"
```

Expected: exact content and status match.

- [ ] **Step 3: Classify Distribution and Guidance separately**

Set `Distribution: PASS` only if all nine approved conditions hold:

1. exact pushed Git SHA resolved;
2. expected marketplace/plugin identity installed;
3. installed package worked without source checkout or manual cache hint;
4. the natural first prompt activated Navi;
5. package-local preview was read-only;
6. no target write preceded approval;
7. approved writes were exactly Map plus managed trigger;
8. the second fresh task used the confirmed Map without reinitialization; and
9. global state restored exactly.

Classify Guidance as `acceptable`, `needs-improvement`, or `unsafe`. Only
materially false or unsafe guidance makes the whole calibration fail when the
distribution journey otherwise passes.

- [ ] **Step 4: Deliver one direct bounded result**

Send the Main Thread a concise structured message containing:

```text
NAVI_CALIBRATION_RESULT
version: 1
candidate_sha: <exact SHA>
target: sanitized temporary sub_ag_ski copy
distribution: PASS | FAIL
guidance_quality: acceptable | needs-improvement | unsafe
natural_entry: pass | fail
preview_read_only: pass | fail
approved_write_scope: pass | fail | not-run
second_fresh_task: pass | fail | not-run
global_state_restored: yes | no
original_project_unchanged: yes | no
evidence: minimal paths and factual summaries
failure_boundary: none | git-marketplace | plugin-install | installed-activation | package-entry | init-safety | guidance
temporary_root: delete-authorized-after-delivery | retained-at-<absolute-path>
recommendation: one smallest next product decision
```

Do not paste complete global config, secrets, raw unrelated project contents,
or the entire JSONL transcript. The Main Thread assesses the result directly;
the user does not relay it.

- [ ] **Step 5: Apply the approved cleanup rule**

On success, after confirmed result delivery and only if restoration and original
project checks passed, delete exactly `$CAL_ROOT`. On any failure, retain the
entire root and report its exact path; deletion becomes a separate decision.

Do not write `docs/navi/calibration-log.md`, commit, push, tag, release, or start
the local-marketplace calibration.

## Final Acceptance Point

The Calibration Operator stops after result delivery and permitted cleanup.
The Main Thread then makes one explicit product judgment:

- PASS: accept Git-backed Distribution feasibility and decide whether to design
  the local-marketplace calibration;
- Distribution PASS plus guidance debt: record the product observation and
  decide whether the guidance issue deserves a bounded Design task; or
- FAIL: return to Design mode at the smallest classified boundary before any
  implementation.

No independent Validation Thread is required for this journey. Repeating the
executor's real installation merely to obtain a second green transcript would
be over-validation; the evidence package and Main Thread product judgment are
the calibration acceptance mechanism.
