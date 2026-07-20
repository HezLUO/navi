# Navi Native Plugin Update Calibration Implementation Plan

> **For calibration operators:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` in one true Codex-managed worktree task. Do not
> execute this stateful calibration in the persistent Main Thread, and do not
> split fixture, App Server, credential, or cleanup ownership across agents.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine whether Codex's native configured-Git-marketplace startup
update can move one installed plugin from A to B, reload B in the same existing
task, and preserve A when a later marketplace revision is invalid.

**Architecture:** One Calibration Operator creates two private and independent
temporary Codex homes, serves a minimal A/B marketplace through loopback HTTP,
and drives Codex App Server over stdio. The positive case proves storage and
same-thread activation; the failure case proves old-version preservation. The
operator copies authentication only after one grouped authorization, performs
exactly four model turns with no retries, cleans every temporary process and
credential copy, and returns a bounded result directly to the Main Thread.

**Tech Stack:** Codex CLI and App Server `0.144.5` or the exact version recorded
at execution, Node.js 22 or newer using built-in modules only, Git dumb HTTP,
POSIX shell tools, JSON-RPC over App Server stdio, Codex task messaging.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-19-navi-native-plugin-update-calibration-design.md`.
- This is Calibration mode. It is not Implementation, Release, or Publication
  mode.
- No Navi product source, package, lockfile, release metadata, plugin artifact,
  project file, `work/`, or Historical Along path may change.
- Do not create or move `stable`, `preview`, a tag, a GitHub branch, or any
  remote Git ref.
- Use one stateful Calibration Operator. Do not run either scenario in the Main
  Thread or distribute scenario ownership across parallel agents.
- Use two fresh private temporary case roots. Positive and failed-update state
  must not share a `CODEX_HOME`, marketplace checkout, plugin cache, thread, or
  HTTP Git repository.
- Bind each Git service only to `127.0.0.1` on an ephemeral port.
- `file://` is forbidden because Codex rejects it as a configured Git
  marketplace source.
- The fixture is synthetic and contains no Navi product logic. Marketplace,
  plugin, and Skill identity remain `navi-update-calibration` in A and B.
- Version A is exactly `0.0.0-calibration.1` with marker
  `NAVI_UPDATE_CALIBRATION_A`.
- Version B is exactly `0.0.0-calibration.2` with marker
  `NAVI_UPDATE_CALIBRATION_B`.
- Every model turn uses `gpt-5.6-sol` with reasoning effort `low`, the exact
  input `NAVI_UPDATE_PROBE`, approval policy `never`, and read-only sandbox.
- There are exactly four model turns: positive A, positive B, failure A, and
  failure preserved A. No retry, control model, alternate prompt, alternate
  profile, or successor thread is allowed.
- Copying `/Users/james/.codex/auth.json`, starting real model turns, and using
  the temporary authentication copies require one explicit grouped user
  authorization after preflight.
- Authentication source and copies are never parsed, printed, quoted, included
  in prompts, or retained in the bounded result. The result records only
  source non-change and cleanup booleans.
- The user's real `CODEX_HOME` is read only. No real marketplace, plugin,
  config, trust entry, cache, or authentication mutation is allowed.
- Do not run `navi init`, repository tests, typecheck, plugin verification,
  dependency installation, a project command, or any target-project write.
- A storage-plane check must pass before every task-plane check. A model marker
  cannot compensate for an unresolved checkout or plugin-cache mismatch.
- After a valid B storage state is observed, resume the exact positive A thread
  ID. Do not create a replacement thread.
- In the failure case, invalid B must fail marketplace-root validation. Do not
  use a merely unreachable server as the required preservation case.
- Cleanup runs after success, expected failure, unexpected failure, timeout, or
  interruption. Cleanup outranks diagnosis and extra evidence.
- Any cleanup failure, protected-state mismatch, authorization gap, unexpected
  model turn, or harness inconsistency is terminal and routes
  `decision-required` to the Main Thread.
- No Calibration Operator may accept product risk, integrate, merge, push,
  release, publish, delete retained failure evidence, or begin a real GitHub
  moving-ref smoke test.

---

## Calibration Contract

```text
goal: calibrate native configured-Git-marketplace update and same-thread Skill reload
design: docs/superpowers/specs/2026-07-19-navi-native-plugin-update-calibration-design.md
plan: docs/superpowers/plans/2026-07-19-navi-native-plugin-update-calibration.md
operator_count: 1 stateful Calibration Operator
case_count: 2 independent isolated CODEX_HOME roots
model_route: gpt-5.6-sol + low
turn_budget: exactly 4 completed model turns, no retry
fixture_transport: 127.0.0.1 ephemeral HTTP Git only
positive: A turn, valid A-to-B native startup update, same-thread B turn
failure: A turn, invalid marketplace B startup attempt, same-thread preserved-A turn
real_codex_home: read-only
target_project_writes: none
repository_writes: none during calibration
credential_scope: private temporary 0600 copies after grouped user authorization
validation: one read-only evidence review, no rerun
cleanup: stop both App Servers and HTTP services; remove both isolated homes and auth copies
stop_conditions: missing authorization, host mismatch, source-state mismatch, extra turn, storage-plane mismatch, task-plane mismatch, cleanup failure, or completed result
result_route: direct structured event to the source Main Thread
```

## Planned Temporary Artifacts

No repository source file is modified by the Calibration Operator. It creates
one private root with mode `0700`:

```text
<calibration-root>/
  evidence/
    preflight.json
    protected-before.json
    positive-result.json
    failure-result.json
    final-result.json
    validation-package.md
  harness/
    static-git-http.mjs
    app-server-turn.mjs
    verify-storage.mjs
  positive/
    source/
    http/navi-update-calibration.git/
    isolated-codex-home/
    session-root/
    evidence/
  failure/
    source/
    http/navi-update-calibration.git/
    isolated-codex-home/
    session-root/
    evidence/
```

The operator deletes each case's source repository, HTTP repository, isolated
Codex home, session root, and authentication copy during unconditional
cleanup. It retains the private case evidence and harness only through the
read-only evidence review. Their deletion follows the Main Thread's acceptance
or a separate retained-evidence decision; they are never published.

---

### Task 1: Preflight, Harness, And Grouped Authorization

**Owner:** Calibration Operator

**Files:**
- Read: `docs/superpowers/specs/2026-07-19-navi-native-plugin-update-calibration-design.md`
- Read: `docs/superpowers/plans/2026-07-19-navi-native-plugin-update-calibration.md`
- Create temporarily: `<calibration-root>/harness/static-git-http.mjs`
- Create temporarily: `<calibration-root>/harness/app-server-turn.mjs`
- Create temporarily: `<calibration-root>/harness/verify-storage.mjs`
- Create temporarily: `<calibration-root>/evidence/preflight.json`

**Interfaces:**
- Consumes: the exact repository snapshot selected by the Main Thread and the
  existing private Codex authentication file.
- Produces: one mutation-free preflight, three bounded harness files, and one
  `decision-required` grouped authorization event.

- [ ] **Step 1: Establish a clean read-only repository baseline**

Run:

```bash
NAVI_REPO='/Users/james/Codex Project/General Codex Project/Navi'
git -C "$NAVI_REPO" status --short --branch
git -C "$NAVI_REPO" rev-parse HEAD
git -C "$NAVI_REPO" diff --check
git -C "$NAVI_REPO" ls-files --others --exclude-standard
```

Expected: tracked state is clean; existing untracked `work/` may be present and
must remain untouched. Record the exact HEAD. Any other tracked change is
`decision-required` before temporary setup.

- [ ] **Step 2: Verify host and credential prerequisites without reading the credential**

Run:

```bash
CODEX_VERSION="$(codex --version)"
NODE_VERSION="$(node --version)"
GIT_VERSION="$(git --version)"
printf '%s\n%s\n%s\n' "$CODEX_VERSION" "$NODE_VERSION" "$GIT_VERSION"
stat -f '%Sp %z' /Users/james/.codex/auth.json
test "$(stat -f '%Sp' /Users/james/.codex/auth.json)" = '-rw-------'
test -s /Users/james/.codex/auth.json
```

Expected: Codex version is recorded, Node is at least 22, Git is available,
and authentication exists with mode `0600`. Do not run `cat`, `jq`, `shasum`,
or another content operation on `auth.json` before grouped authorization.

- [ ] **Step 3: Create the private calibration root**

Run:

```bash
CAL_ROOT="$(mktemp -d /private/tmp/navi-native-update.XXXXXX)"
chmod 700 "$CAL_ROOT"
mkdir -m 700 "$CAL_ROOT/evidence" "$CAL_ROOT/harness"
git -C '/Users/james/Codex Project/General Codex Project/Navi' rev-parse HEAD > "$CAL_ROOT/evidence/navi-head.txt"
node --input-type=module - "$CAL_ROOT/evidence/preflight.json" "$CODEX_VERSION" "$NODE_VERSION" "$GIT_VERSION" <<'NODE'
import fs from "node:fs";
const [output, codexVersion, nodeVersion, gitVersion] = process.argv.slice(2);
fs.writeFileSync(output, `${JSON.stringify({ codexVersion, nodeVersion, gitVersion }, null, 2)}\n`, { mode: 0o600 });
NODE
printf '%s\n' "$CAL_ROOT"
```

Expected: one private root under `/private/tmp`; record the path in the direct
handoff only, not in a public release artifact.

- [ ] **Step 4: Create the loopback static Git HTTP server harness**

Use `apply_patch` to create `$CAL_ROOT/harness/static-git-http.mjs` with this
exact content:

```javascript
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const [rootArg, portFile] = process.argv.slice(2);
if (!rootArg || !portFile) throw new Error("usage: static-git-http.mjs ROOT PORT_FILE");
const root = fs.realpathSync(rootArg);

function contentType(file) {
  if (file.endsWith("/info/refs") || file.endsWith("/objects/info/packs")) {
    return "text/plain; charset=utf-8";
  }
  return "application/octet-stream";
}

const server = http.createServer((request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const candidate = path.join(root, pathname);
    const resolved = fs.realpathSync(candidate);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "content-type": contentType(pathname),
      "content-length": stat.size,
      "cache-control": "no-store",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    fs.createReadStream(resolved).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing TCP address");
  fs.writeFileSync(portFile, `${address.port}\n`, { mode: 0o600 });
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
```

Expected: the harness serves only regular files below the supplied root, binds
only to loopback, disables caching, and writes its ephemeral port to a private
file.

- [ ] **Step 5: Create the App Server single-turn harness**

Use `apply_patch` to create `$CAL_ROOT/harness/app-server-turn.mjs` with this
exact content:

```javascript
import fs from "node:fs";
import readline from "node:readline";
import { execFileSync, spawn } from "node:child_process";

const options = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const events = fs.createWriteStream(options.eventsFile, { mode: 0o600 });
const child = spawn(
  "codex",
  [
    "app-server",
    "--stdio",
    "-c",
    'model="gpt-5.6-sol"',
    "-c",
    'model_reasoning_effort="low"',
  ],
  {
    env: { ...process.env, CODEX_HOME: options.codexHome },
    stdio: ["pipe", "pipe", "pipe"],
  },
);

child.stderr.pipe(fs.createWriteStream(options.stderrFile, { mode: 0o600 }));
const lines = readline.createInterface({ input: child.stdout });
const pending = new Map();
let nextId = 1;
let completedResolve;
let completedReject;
const completed = new Promise((resolve, reject) => {
  completedResolve = resolve;
  completedReject = reject;
});
let finalMessage = null;
let unexpectedToolItem = null;
const skillLoadCommands = [];

function send(method, params) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ method, id, params })}\n`);
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function notify(method, params = {}) {
  child.stdin.write(`${JSON.stringify({ method, params })}\n`);
}

lines.on("line", (line) => {
  events.write(`${line}\n`);
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    completedReject(new Error(`invalid app-server JSON: ${error.message}`));
    return;
  }
  if (message.id !== undefined && !message.method) {
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    }
    return;
  }
  if (message.id !== undefined && message.method) {
    unexpectedToolItem = `server request ${message.method}`;
    child.stdin.write(`${JSON.stringify({ id: message.id, error: { code: -32000, message: "calibration forbids server requests" } })}\n`);
    return;
  }
  if (message.method === "item/completed") {
    const item = message.params?.item;
    if (item?.type === "agentMessage") finalMessage = item.text;
    if (item?.type === "commandExecution") {
      skillLoadCommands.push(item);
    } else if (item?.type && !["userMessage", "agentMessage", "reasoning"].includes(item.type)) {
      unexpectedToolItem = item.type;
    }
  }
  if (message.method === "turn/completed") completedResolve(message.params?.turn);
});

child.on("exit", (code, signal) => {
  if (code !== 0) completedReject(new Error(`app-server exited code=${code} signal=${signal}`));
});

async function waitForExpectedSkill() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const text = fs.readFileSync(options.expectedSkillPath, "utf8");
      if (text.includes(options.expectedMarker)) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`timed out waiting for ${options.expectedMarker}`);
}

async function waitForExpectedStderr() {
  if (!options.expectedStderrPattern) return;
  const pattern = new RegExp(options.expectedStderrPattern, "i");
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const text = fs.readFileSync(options.stderrFile, "utf8");
      if (pattern.test(text)) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`timed out waiting for stderr pattern ${options.expectedStderrPattern}`);
}

async function waitForStorageReady() {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      execFileSync(process.execPath, [options.storageVerifierPath, options.storageInputFile], {
        env: { ...process.env, CODEX_HOME: options.codexHome },
        stdio: "pipe",
      });
      return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`timed out waiting for checkout/cache storage readiness: ${lastError?.message ?? "unknown verifier failure"}`);
}

const timeout = setTimeout(() => completedReject(new Error("turn timed out")), 120_000);

try {
  await send("initialize", {
    clientInfo: {
      name: "navi_update_calibration",
      title: "Navi Update Calibration",
      version: "0.1.0",
    },
  });
  notify("initialized");
  await waitForExpectedSkill();
  await waitForExpectedStderr();
  await waitForStorageReady();
  execFileSync(process.execPath, [options.storageVerifierPath, options.storageInputFile], {
    env: { ...process.env, CODEX_HOME: options.codexHome },
    stdio: "pipe",
  });
  const storageInput = JSON.parse(fs.readFileSync(options.storageInputFile, "utf8"));
  const storageResult = JSON.parse(fs.readFileSync(storageInput.outputFile, "utf8"));
  const expectedLoadedSkillPath = fs.realpathSync(storageResult.installedSkillPath);
  const expectedLoadedSkillBytes = fs.readFileSync(expectedLoadedSkillPath, "utf8");

  let thread;
  if (options.mode === "start") {
    const result = await send("thread/start", {
      cwd: options.sessionRoot,
      approvalPolicy: "never",
      sandbox: "read-only",
    });
    thread = result.thread;
    fs.writeFileSync(options.threadFile, `${thread.id}\n`, { mode: 0o600 });
  } else if (options.mode === "resume") {
    const threadId = fs.readFileSync(options.threadFile, "utf8").trim();
    const result = await send("thread/resume", {
      threadId,
      cwd: options.sessionRoot,
      approvalPolicy: "never",
      sandbox: "read-only",
    });
    thread = result.thread;
    if (thread.id !== threadId) throw new Error("thread/resume changed the thread id");
  } else {
    throw new Error(`unsupported mode ${options.mode}`);
  }

  await send("turn/start", {
    threadId: thread.id,
    input: [{ type: "text", text: "NAVI_UPDATE_PROBE" }],
  });
  const turn = await completed;
  if (turn?.status !== "completed") throw new Error(`unexpected turn status ${turn?.status}`);
  if (unexpectedToolItem) throw new Error(`forbidden tool activity: ${unexpectedToolItem}`);
  if (skillLoadCommands.length > 1) throw new Error("more than one Skill-load commandExecution occurred");
  if (skillLoadCommands.length === 1) {
    const item = skillLoadCommands[0];
    const actions = item.commandActions ?? [];
    if (item.status !== "completed" || item.exitCode !== 0) throw new Error("Skill-load command did not complete successfully");
    if (fs.realpathSync(item.cwd) !== fs.realpathSync(options.sessionRoot)) throw new Error("Skill-load command escaped the isolated session root");
    if (actions.length !== 1 || actions[0]?.type !== "read" || !actions[0]?.path) {
      throw new Error("Skill-load command was not one structured read action");
    }
    if (fs.realpathSync(actions[0].path) !== expectedLoadedSkillPath) throw new Error("Skill-load read did not target the verified plugin-cache Skill");
    if (item.aggregatedOutput !== expectedLoadedSkillBytes) throw new Error("Skill-load output differed from verified plugin-cache Skill bytes");
  }
  if (finalMessage !== options.expectedMarker) {
    throw new Error(`expected ${options.expectedMarker}, received ${JSON.stringify(finalMessage)}`);
  }
  fs.writeFileSync(options.lastMessageFile, `${finalMessage}\n`, { mode: 0o600 });
  fs.writeFileSync(
    options.resultFile,
    `${JSON.stringify({
      threadId: thread.id,
      turnId: turn.id,
      marker: finalMessage,
      boundedSkillLoadReads: skillLoadCommands.length,
    }, null, 2)}\n`,
    { mode: 0o600 },
  );
} finally {
  clearTimeout(timeout);
  if (child.exitCode === null && child.signalCode === null) {
    child.stdin.end();
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }
  await new Promise((resolve) => events.end(resolve));
}
```

Expected: one process performs exactly one turn, rejects server requests and
all tool activity except zero or one exact storage-verified plugin-cache Skill
read, requires the exact marker, waits boundedly for both checkout and cache
storage readiness, performs one fresh authoritative verifier pass before
starting or resuming the thread, records the thread and turn IDs plus bounded
read count, and always terminates its App Server child.

- [ ] **Step 6: Create the storage verifier harness**

Use `apply_patch` to create `$CAL_ROOT/harness/verify-storage.mjs` with this
exact content:

```javascript
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const expected = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const env = { ...process.env, CODEX_HOME: expected.codexHome };
const marketplaceJson = JSON.parse(execFileSync("codex", ["plugin", "marketplace", "list", "--json"], { env, encoding: "utf8" }));
const pluginJson = JSON.parse(execFileSync("codex", ["plugin", "list", "--json"], { env, encoding: "utf8" }));
const marketplaces = marketplaceJson.marketplaces ?? [];
const plugins = pluginJson.installed ?? [];
const marketplace = marketplaces.find((entry) => entry.name === "navi-update-calibration");
const plugin = plugins.find((entry) => entry.pluginId === "navi-update-calibration@navi-update-calibration");
if (!marketplace || !plugin) throw new Error("calibration marketplace or plugin missing");
if (marketplace.marketplaceSource?.sourceType !== "git") throw new Error("marketplace is not Git-backed");
if (marketplace.marketplaceSource?.source !== expected.sourceUrl) throw new Error("marketplace source URL mismatch");
if (plugin.installed !== true || plugin.enabled !== true) throw new Error("plugin is not installed and enabled");
if (plugin.version !== expected.version) throw new Error(`expected plugin version ${expected.version}, received ${plugin.version}`);
if (plugin.source?.source !== "local" || !plugin.source?.path) throw new Error("plugin source is not a resolved local path");
if (plugin.name !== "navi-update-calibration") throw new Error("plugin name mismatch");
if (plugin.marketplaceName !== marketplace.name) throw new Error("plugin marketplace association mismatch");
const within = (root, candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);
const resolvedHome = fs.realpathSync(expected.codexHome);
const marketplacesRoot = fs.realpathSync(path.join(resolvedHome, ".tmp/marketplaces"));
const marketplaceRoot = fs.realpathSync(marketplace.root);
if (!within(resolvedHome, marketplacesRoot)) throw new Error("marketplace storage escaped isolated CODEX_HOME");
if (!within(marketplacesRoot, marketplaceRoot)) throw new Error("marketplace root escaped isolated marketplace storage");
const pluginRoot = fs.realpathSync(plugin.source.path);
if (!within(marketplaceRoot, pluginRoot)) throw new Error("plugin source escaped the verified marketplace checkout");
const checkoutSkillPath = fs.realpathSync(path.join(pluginRoot, "skills/navi-update-calibration/SKILL.md"));
if (!within(pluginRoot, checkoutSkillPath)) throw new Error("checkout Skill escaped the verified plugin source");
const cacheRoot = fs.realpathSync(path.join(resolvedHome, "plugins/cache"));
if (!within(resolvedHome, cacheRoot)) throw new Error("plugin cache escaped isolated CODEX_HOME");
const installedPluginRoot = fs.realpathSync(path.join(cacheRoot, marketplace.name, plugin.name, plugin.version));
if (!within(cacheRoot, installedPluginRoot)) throw new Error("installed plugin escaped the isolated cache");
const installedSkillPath = fs.realpathSync(path.join(installedPluginRoot, "skills/navi-update-calibration/SKILL.md"));
if (!within(installedPluginRoot, installedSkillPath)) throw new Error("plugin-cache Skill escaped the exact version root");
const checkoutHead = execFileSync("git", ["-C", marketplaceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (checkoutHead !== expected.revision) throw new Error("marketplace checkout revision mismatch");
const checkoutSkillText = fs.readFileSync(checkoutSkillPath, "utf8");
const installedSkillText = fs.readFileSync(installedSkillPath, "utf8");
if (checkoutSkillText !== installedSkillText) throw new Error("marketplace checkout and plugin-cache Skill bytes differ");
if (!checkoutSkillText.includes(expected.marker)) throw new Error("checkout Skill marker mismatch");
if (checkoutSkillText.includes(expected.forbiddenMarker)) throw new Error("checkout Skill contains mixed A/B markers");
if (!installedSkillText.includes(expected.marker)) throw new Error("plugin-cache Skill marker mismatch");
if (installedSkillText.includes(expected.forbiddenMarker)) throw new Error("plugin-cache Skill contains mixed A/B markers");
fs.writeFileSync(
  expected.outputFile,
  `${JSON.stringify({
    marketplace: marketplace.name,
    sourceType: marketplace.marketplaceSource.sourceType,
    sourceUrl: marketplace.marketplaceSource.source,
    checkoutHead,
    pluginId: plugin.pluginId,
    pluginVersion: plugin.version,
    installed: plugin.installed,
    enabled: plugin.enabled,
    marker: expected.marker,
    checkoutSkillPath,
    installedPluginRoot,
    installedSkillPath,
  }, null, 2)}\n`,
  { mode: 0o600 },
);
```

Expected: storage evidence fails closed on source type, URL, revision, version,
marker, mixed bytes, enabled state, official plugin-path association, or path
containment.

- [ ] **Step 7: Record protected real-state baselines without exposing secrets**

Run:

```bash
codex plugin marketplace list --json > "$CAL_ROOT/evidence/real-marketplaces-before.json"
codex plugin list --json > "$CAL_ROOT/evidence/real-plugins-before.json"
CONFIG_BEFORE="$(shasum -a 256 /Users/james/.codex/config.toml | awk '{print $1}')"
printf 'CONFIG_BEFORE=%s\n' "$CONFIG_BEFORE" > "$CAL_ROOT/evidence/protected-private.env"
chmod 600 "$CAL_ROOT/evidence/protected-private.env"
```

Expected: all files are private. Authentication content and its digest have
not been read before grouped authorization.

- [ ] **Step 8: Run a plan satisfiability check before asking permission**

Inspect the three harness files and confirm:

```bash
node --check "$CAL_ROOT/harness/static-git-http.mjs"
node --check "$CAL_ROOT/harness/app-server-turn.mjs"
node --check "$CAL_ROOT/harness/verify-storage.mjs"
rg -n "NAVI_UPDATE_CALIBRATION_A|NAVI_UPDATE_CALIBRATION_B|gpt-5.6-sol|model_reasoning_effort" "$CAL_ROOT/harness"
```

Expected: syntax checks pass. The only model route is `gpt-5.6-sol` plus `low`.
No fixture, Codex home, HTTP server, or model turn exists yet.

- [ ] **Step 9: Send one direct grouped authorization event**

Send `decision-required` directly to the Main Thread. It must state:

```text
decision_needed: authorize two private isolated CODEX_HOME cases; temporary 0600 copies of the existing Codex auth file; two loopback-only HTTP Git services; exactly four gpt-5.6-sol + low turns; unconditional credential/process/temp cleanup; read-only real Codex and repository state checks
not_authorized: real plugin or marketplace mutation, target-project access, navi init, retry, alternate model, remote Git mutation, release, publication, or Update Host implementation
```

Stop until the user explicitly approves the complete group. A generic
`continue` is not authorization.

After direct approval, record only its event ID:

```bash
test -n "${GROUPED_AUTHORIZATION_EVENT_ID:?set this variable to the exact direct approval event id}"
printf '%s\n' "$GROUPED_AUTHORIZATION_EVENT_ID" > "$CAL_ROOT/evidence/grouped-authorization-event-id.txt"
chmod 600 "$CAL_ROOT/evidence/grouped-authorization-event-id.txt"
AUTH_BEFORE="$(shasum -a 256 /Users/james/.codex/auth.json | awk '{print $1}')"
printf 'AUTH_BEFORE=%s\n' "$AUTH_BEFORE" >> "$CAL_ROOT/evidence/protected-private.env"
```

Expected: the source-auth digest is computed only after direct approval,
remains in the private comparison file, and is never written to a result.

### Task 2: Execute The Positive A-To-B Same-Thread Scenario

**Owner:** Calibration Operator

**Files:**
- Create temporarily: `<calibration-root>/positive/**`
- Create temporarily: `<calibration-root>/evidence/positive-result.json`

**Interfaces:**
- Consumes: grouped authorization and the three preflighted harnesses.
- Produces: one valid A storage/turn checkpoint and one valid B storage/turn
  checkpoint sharing the exact same thread ID.

- [ ] **Step 1: Create the positive private roots and auth copy**

Run only after grouped authorization:

```bash
CASE="$CAL_ROOT/positive"
SOURCE="$CASE/source"
HTTP_ROOT="$CASE/http"
BARE="$HTTP_ROOT/navi-update-calibration.git"
ISO_HOME="$CASE/isolated-codex-home"
SESSION_ROOT="$CASE/session-root"
CASE_EVIDENCE="$CASE/evidence"
mkdir -m 700 "$CASE" "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT" "$CASE_EVIDENCE"
install -m 600 /Users/james/.codex/auth.json "$ISO_HOME/auth.json"
HTTP_PID=""
cleanup_case() {
  if test -n "${HTTP_PID:-}"; then
    kill "$HTTP_PID" 2>/dev/null || true
    wait "$HTTP_PID" 2>/dev/null || true
  fi
  test ! -e "$ISO_HOME/auth.json" || rm "$ISO_HOME/auth.json"
  rm -rf "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT"
}
trap cleanup_case EXIT HUP INT TERM
```

Expected: the source auth file remains read only; the copy is private.

- [ ] **Step 2: Create and commit fixture A**

Run this Node program to write the exact fixture:

```bash
node --input-type=module - "$SOURCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const files = {
  ".agents/plugins/marketplace.json": JSON.stringify({
    name: "navi-update-calibration",
    plugins: [{
      name: "navi-update-calibration",
      source: { source: "local", path: "./plugins/navi-update-calibration" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: "Developer Tools",
    }],
  }, null, 2) + "\n",
  "plugins/navi-update-calibration/.codex-plugin/plugin.json": JSON.stringify({
    name: "navi-update-calibration",
    version: "0.0.0-calibration.1",
    description: "Isolated native plugin update calibration fixture.",
    skills: "./skills/",
  }, null, 2) + "\n",
  "plugins/navi-update-calibration/skills/navi-update-calibration/SKILL.md": `---\nname: navi-update-calibration\ndescription: Use when the user input is exactly NAVI_UPDATE_PROBE.\n---\n\n# Navi Update Calibration A\n\nWhen the user input is exactly \`NAVI_UPDATE_PROBE\`, do not use tools and reply with exactly:\n\nNAVI_UPDATE_CALIBRATION_A\n`,
};
for (const [relative, contents] of Object.entries(files)) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}
NODE
git -C "$SOURCE" init -b calibration
git -C "$SOURCE" config user.name 'Navi Calibration'
git -C "$SOURCE" config user.email 'navi-calibration@invalid.example'
git -C "$SOURCE" add .
git -C "$SOURCE" commit -m 'fixture: calibration version a'
A_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
git clone --bare "$SOURCE" "$BARE"
git -C "$BARE" update-server-info
printf '%s\n' "$A_SHA" > "$CASE_EVIDENCE/a-sha.txt"
```

Expected: A is one valid marketplace commit; the bare `calibration` ref points
to A and dumb-HTTP metadata is current.

- [ ] **Step 3: Start the positive loopback HTTP Git service**

Run:

```bash
PORT_FILE="$CASE_EVIDENCE/http-port.txt"
node "$CAL_ROOT/harness/static-git-http.mjs" "$HTTP_ROOT" "$PORT_FILE" > "$CASE_EVIDENCE/http-stdout.txt" 2> "$CASE_EVIDENCE/http-stderr.txt" &
HTTP_PID=$!
printf '%s\n' "$HTTP_PID" > "$CASE_EVIDENCE/http-pid.txt"
for _ in $(seq 1 100); do test -s "$PORT_FILE" && break; sleep 0.05; done
test -s "$PORT_FILE"
PORT="$(cat "$PORT_FILE")"
SOURCE_URL="http://127.0.0.1:$PORT/navi-update-calibration.git"
git ls-remote "$SOURCE_URL" refs/heads/calibration > "$CASE_EVIDENCE/ls-remote-a.txt"
test "$(awk '{print $1}' "$CASE_EVIDENCE/ls-remote-a.txt")" = "$A_SHA"
```

Expected: one loopback process and exact A remote revision. Record `HTTP_PID`
for unconditional cleanup.

- [ ] **Step 4: Add and install A only inside the isolated home**

Run:

```bash
CODEX_HOME="$ISO_HOME" codex plugin marketplace add "$SOURCE_URL" --ref calibration --json > "$CASE_EVIDENCE/marketplace-add-a.json"
CODEX_HOME="$ISO_HOME" codex plugin add navi-update-calibration@navi-update-calibration --json > "$CASE_EVIDENCE/plugin-add-a.json"
CODEX_HOME="$ISO_HOME" codex plugin marketplace list --json > "$CASE_EVIDENCE/marketplaces-a.json"
CODEX_HOME="$ISO_HOME" codex plugin list --json > "$CASE_EVIDENCE/plugins-a.json"
```

Expected: exactly one configured Git marketplace and one installed/enabled
calibration plugin in the isolated home. Official plugin JSON identifies the
checkout source; the storage verifier separately resolves the versioned runtime
cache from the isolated home, marketplace name, plugin name, and plugin version.

- [ ] **Step 5: Verify A storage before the first turn**

Resolve these paths from the isolated official JSON and filesystem:

```bash
MARKETPLACE_ROOT="$(node --input-type=module - "$CASE_EVIDENCE/marketplaces-a.json" <<'NODE'
import fs from "node:fs";
const marketplaces = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).marketplaces ?? [];
const marketplace = marketplaces.find((entry) => entry.name === "navi-update-calibration");
if (!marketplace?.root) throw new Error("official marketplace root is unavailable");
console.log(marketplace.root);
NODE
)"
PLUGIN_ROOT="$(node --input-type=module - "$CASE_EVIDENCE/plugins-a.json" <<'NODE'
import fs from "node:fs";
const plugins = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).installed ?? [];
const plugin = plugins.find((entry) => entry.pluginId === "navi-update-calibration@navi-update-calibration");
if (plugin?.source?.source !== "local" || !plugin.source.path) throw new Error("official plugin root is unavailable");
console.log(plugin.source.path);
NODE
)"
A_CHECKOUT_SKILL="$PLUGIN_ROOT/skills/navi-update-calibration/SKILL.md"
```

Generate the verifier input mechanically from the recorded variables, then run
it:

```bash
node --input-type=module - "$ISO_HOME" "$SOURCE_URL" "$A_SHA" "$CASE_EVIDENCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sourceUrl, revision, evidence] = process.argv.slice(2);
const input = {
  codexHome,
  sourceUrl,
  version: "0.0.0-calibration.1",
  revision,
  marker: "NAVI_UPDATE_CALIBRATION_A",
  forbiddenMarker: "NAVI_UPDATE_CALIBRATION_B",
  outputFile: path.join(evidence, "storage-a.json"),
};
fs.writeFileSync(path.join(evidence, "verify-a-input.json"), `${JSON.stringify(input, null, 2)}\n`, { mode: 0o600 });
NODE
node "$CAL_ROOT/harness/verify-storage.mjs" "$CASE_EVIDENCE/verify-a-input.json"
```

Expected: storage A verifier exits 0.

- [ ] **Step 6: Run exactly one positive A turn**

Generate the exact A options and run:

```bash
node --input-type=module - "$ISO_HOME" "$SESSION_ROOT" "$A_CHECKOUT_SKILL" "$CASE_EVIDENCE" "$CAL_ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sessionRoot, expectedSkillPath, evidence, calibrationRoot] = process.argv.slice(2);
const options = {
  mode: "start",
  codexHome,
  sessionRoot,
  expectedSkillPath,
  expectedMarker: "NAVI_UPDATE_CALIBRATION_A",
  threadFile: path.join(evidence, "thread-id.txt"),
  eventsFile: path.join(evidence, "turn-a-events.jsonl"),
  stderrFile: path.join(evidence, "turn-a-stderr.txt"),
  lastMessageFile: path.join(evidence, "turn-a-last-message.txt"),
  resultFile: path.join(evidence, "turn-a-result.json"),
  storageVerifierPath: path.join(calibrationRoot, "harness/verify-storage.mjs"),
  storageInputFile: path.join(evidence, "verify-a-input.json"),
};
fs.writeFileSync(path.join(evidence, "turn-a-options.json"), `${JSON.stringify(options, null, 2)}\n`, { mode: 0o600 });
NODE
node "$CAL_ROOT/harness/app-server-turn.mjs" "$CASE_EVIDENCE/turn-a-options.json"
```

Expected: one completed turn, exact A marker, no server request, at most one
validated read of the versioned plugin-cache Skill recorded by the storage
verifier, no other tool item, and one durable thread ID.

- [ ] **Step 7: Commit fixture B and advance the same ref**

Run:

```bash
node --input-type=module - "$SOURCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const manifest = path.join(root, "plugins/navi-update-calibration/.codex-plugin/plugin.json");
const skill = path.join(root, "plugins/navi-update-calibration/skills/navi-update-calibration/SKILL.md");
const parsed = JSON.parse(fs.readFileSync(manifest, "utf8"));
parsed.version = "0.0.0-calibration.2";
fs.writeFileSync(manifest, `${JSON.stringify(parsed, null, 2)}\n`);
fs.writeFileSync(skill, `---\nname: navi-update-calibration\ndescription: Use when the user input is exactly NAVI_UPDATE_PROBE.\n---\n\n# Navi Update Calibration B\n\nWhen the user input is exactly \`NAVI_UPDATE_PROBE\`, do not use tools and reply with exactly:\n\nNAVI_UPDATE_CALIBRATION_B\n`);
NODE
git -C "$SOURCE" add .
git -C "$SOURCE" commit -m 'fixture: calibration version b'
B_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
git -C "$SOURCE" push "$BARE" "${B_SHA}:refs/heads/calibration"
git -C "$BARE" update-server-info
git ls-remote "$SOURCE_URL" refs/heads/calibration > "$CASE_EVIDENCE/ls-remote-b.txt"
test "$(awk '{print $1}' "$CASE_EVIDENCE/ls-remote-b.txt")" = "$B_SHA"
printf '%s\n' "$B_SHA" > "$CASE_EVIDENCE/b-sha.txt"
```

Expected: B is a fast-forward child of A and the same remote ref now reports B.

- [ ] **Step 8: Start a new App Server and resume the exact A thread after B activation**

Set the checkout Skill path used only as the startup-update readiness signal:

```bash
B_CHECKOUT_SKILL="$MARKETPLACE_ROOT/plugins/navi-update-calibration/skills/navi-update-calibration/SKILL.md"
node --input-type=module - "$ISO_HOME" "$SOURCE_URL" "$B_SHA" "$CASE_EVIDENCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sourceUrl, revision, evidence] = process.argv.slice(2);
const input = {
  codexHome,
  sourceUrl,
  version: "0.0.0-calibration.2",
  revision,
  marker: "NAVI_UPDATE_CALIBRATION_B",
  forbiddenMarker: "NAVI_UPDATE_CALIBRATION_A",
  outputFile: path.join(evidence, "storage-b.json"),
};
fs.writeFileSync(path.join(evidence, "verify-b-input.json"), `${JSON.stringify(input, null, 2)}\n`, { mode: 0o600 });
NODE
```

Generate the B options from the same `codexHome`, `sessionRoot`, and
`threadFile`, then run:

```bash
node --input-type=module - "$ISO_HOME" "$SESSION_ROOT" "$B_CHECKOUT_SKILL" "$CASE_EVIDENCE" "$CAL_ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sessionRoot, expectedSkillPath, evidence, calibrationRoot] = process.argv.slice(2);
const options = {
  mode: "resume",
  codexHome,
  sessionRoot,
  expectedSkillPath,
  expectedMarker: "NAVI_UPDATE_CALIBRATION_B",
  threadFile: path.join(evidence, "thread-id.txt"),
  eventsFile: path.join(evidence, "turn-b-events.jsonl"),
  stderrFile: path.join(evidence, "turn-b-stderr.txt"),
  lastMessageFile: path.join(evidence, "turn-b-last-message.txt"),
  resultFile: path.join(evidence, "turn-b-result.json"),
  storageVerifierPath: path.join(calibrationRoot, "harness/verify-storage.mjs"),
  storageInputFile: path.join(evidence, "verify-b-input.json"),
};
fs.writeFileSync(path.join(evidence, "turn-b-options.json"), `${JSON.stringify(options, null, 2)}\n`, { mode: 0o600 });
NODE
node "$CAL_ROOT/harness/app-server-turn.mjs" "$CASE_EVIDENCE/turn-b-options.json"
```

Expected: the harness starts a distinct App Server process, waits for B's
checkout marker and byte-identical versioned cache Skill, performs one fresh
authoritative storage verification, resumes the exact stored thread, and
returns exactly B.

- [ ] **Step 9: Verify B storage and same-thread identity**

Capture the post-update official state, rerun the same B storage verifier, and
check same-thread identity:

```bash
CODEX_HOME="$ISO_HOME" codex plugin marketplace list --json > "$CASE_EVIDENCE/marketplaces-b.json"
CODEX_HOME="$ISO_HOME" codex plugin list --json > "$CASE_EVIDENCE/plugins-b.json"
node "$CAL_ROOT/harness/verify-storage.mjs" "$CASE_EVIDENCE/verify-b-input.json"
node --input-type=module - "$CASE_EVIDENCE/turn-a-result.json" "$CASE_EVIDENCE/turn-b-result.json" <<'NODE'
import fs from "node:fs";
const [aFile, bFile] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync(aFile, "utf8"));
const b = JSON.parse(fs.readFileSync(bFile, "utf8"));
if (a.threadId !== b.threadId) throw new Error("positive turns do not share one thread");
if (a.turnId === b.turnId) throw new Error("positive turns reused one turn id");
if (a.marker !== "NAVI_UPDATE_CALIBRATION_A") throw new Error("A marker mismatch");
if (b.marker !== "NAVI_UPDATE_CALIBRATION_B") throw new Error("B marker mismatch");
NODE
test -z "$(find "$SESSION_ROOT" -mindepth 1 -print -quit)"
```

Expected: both storage and task planes pass, and the read-only session root is
empty.

- [ ] **Step 10: Reduce positive evidence and clean the positive case**

Run cleanup first, then reduce the checked evidence to
`$CAL_ROOT/evidence/positive-result.json`:

```bash
cleanup_case
trap - EXIT HUP INT TERM
test ! -e "$CASE/source"
test ! -e "$CASE/isolated-codex-home"
node --input-type=module - "$CASE_EVIDENCE" "$CAL_ROOT/evidence/positive-result.json" "$SOURCE_URL" "$A_SHA" "$B_SHA" <<'NODE'
import fs from "node:fs";
const [evidence, output, sourceUrl, aRevision, bRevision] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync(`${evidence}/turn-a-result.json`, "utf8"));
const b = JSON.parse(fs.readFileSync(`${evidence}/turn-b-result.json`, "utf8"));
const result = {
  status: "pass",
  sourceUrl,
  aRevision,
  bRevision,
  aVersion: "0.0.0-calibration.1",
  bVersion: "0.0.0-calibration.2",
  a,
  b,
  sameThread: a.threadId === b.threadId,
  noTargetWrites: true,
  credentialCopyRemoved: true,
  fixtureRemoved: true,
  processStopped: true,
};
if (!result.sameThread) throw new Error("cannot record positive PASS with different threads");
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
NODE
```

Expected: only bounded positive evidence remains under the private calibration
root. Any process or credential cleanup failure is terminal.

### Task 3: Execute The Invalid-B Preservation Scenario

**Owner:** Calibration Operator

**Files:**
- Create temporarily: `<calibration-root>/failure/**`
- Create temporarily: `<calibration-root>/evidence/failure-result.json`

**Interfaces:**
- Consumes: the grouped authorization and preflighted harnesses.
- Produces: one valid A checkpoint, one failed invalid-B startup update, and one
  same-thread preserved-A checkpoint.

- [ ] **Step 1: Create a fresh failure case and install A**

Run this complete fresh setup; do not copy the positive Git repository, Codex
home, plugin cache, thread, or port:

```bash
CASE="$CAL_ROOT/failure"
SOURCE="$CASE/source"
HTTP_ROOT="$CASE/http"
BARE="$HTTP_ROOT/navi-update-calibration.git"
ISO_HOME="$CASE/isolated-codex-home"
SESSION_ROOT="$CASE/session-root"
CASE_EVIDENCE="$CASE/evidence"
mkdir -m 700 "$CASE" "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT" "$CASE_EVIDENCE"
install -m 600 /Users/james/.codex/auth.json "$ISO_HOME/auth.json"
HTTP_PID=""
cleanup_case() {
  if test -n "${HTTP_PID:-}"; then
    kill "$HTTP_PID" 2>/dev/null || true
    wait "$HTTP_PID" 2>/dev/null || true
  fi
  test ! -e "$ISO_HOME/auth.json" || rm "$ISO_HOME/auth.json"
  rm -rf "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT"
}
trap cleanup_case EXIT HUP INT TERM
node --input-type=module - "$SOURCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const files = {
  ".agents/plugins/marketplace.json": JSON.stringify({
    name: "navi-update-calibration",
    plugins: [{
      name: "navi-update-calibration",
      source: { source: "local", path: "./plugins/navi-update-calibration" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: "Developer Tools",
    }],
  }, null, 2) + "\n",
  "plugins/navi-update-calibration/.codex-plugin/plugin.json": JSON.stringify({
    name: "navi-update-calibration",
    version: "0.0.0-calibration.1",
    description: "Isolated native plugin update calibration fixture.",
    skills: "./skills/",
  }, null, 2) + "\n",
  "plugins/navi-update-calibration/skills/navi-update-calibration/SKILL.md": `---\nname: navi-update-calibration\ndescription: Use when the user input is exactly NAVI_UPDATE_PROBE.\n---\n\n# Navi Update Calibration A\n\nWhen the user input is exactly \`NAVI_UPDATE_PROBE\`, do not use tools and reply with exactly:\n\nNAVI_UPDATE_CALIBRATION_A\n`,
};
for (const [relative, contents] of Object.entries(files)) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}
NODE
git -C "$SOURCE" init -b calibration
git -C "$SOURCE" config user.name 'Navi Calibration'
git -C "$SOURCE" config user.email 'navi-calibration@invalid.example'
git -C "$SOURCE" add .
git -C "$SOURCE" commit -m 'fixture: calibration version a'
A_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
git clone --bare "$SOURCE" "$BARE"
git -C "$BARE" update-server-info
PORT_FILE="$CASE_EVIDENCE/http-port.txt"
node "$CAL_ROOT/harness/static-git-http.mjs" "$HTTP_ROOT" "$PORT_FILE" > "$CASE_EVIDENCE/http-stdout.txt" 2> "$CASE_EVIDENCE/http-stderr.txt" &
HTTP_PID=$!
printf '%s\n' "$HTTP_PID" > "$CASE_EVIDENCE/http-pid.txt"
for _ in $(seq 1 100); do test -s "$PORT_FILE" && break; sleep 0.05; done
test -s "$PORT_FILE"
PORT="$(cat "$PORT_FILE")"
SOURCE_URL="http://127.0.0.1:$PORT/navi-update-calibration.git"
test "$(git ls-remote "$SOURCE_URL" refs/heads/calibration | awk '{print $1}')" = "$A_SHA"
CODEX_HOME="$ISO_HOME" codex plugin marketplace add "$SOURCE_URL" --ref calibration --json > "$CASE_EVIDENCE/marketplace-add-a.json"
CODEX_HOME="$ISO_HOME" codex plugin add navi-update-calibration@navi-update-calibration --json > "$CASE_EVIDENCE/plugin-add-a.json"
CODEX_HOME="$ISO_HOME" codex plugin marketplace list --json > "$CASE_EVIDENCE/marketplaces-a.json"
CODEX_HOME="$ISO_HOME" codex plugin list --json > "$CASE_EVIDENCE/plugins-a.json"
MARKETPLACE_ROOT="$(node --input-type=module - "$CASE_EVIDENCE/marketplaces-a.json" <<'NODE'
import fs from "node:fs";
const marketplaces = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).marketplaces ?? [];
const marketplace = marketplaces.find((entry) => entry.name === "navi-update-calibration");
if (!marketplace?.root) throw new Error("official marketplace root is unavailable");
console.log(marketplace.root);
NODE
)"
PLUGIN_ROOT="$(node --input-type=module - "$CASE_EVIDENCE/plugins-a.json" <<'NODE'
import fs from "node:fs";
const plugins = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).installed ?? [];
const plugin = plugins.find((entry) => entry.pluginId === "navi-update-calibration@navi-update-calibration");
if (plugin?.source?.source !== "local" || !plugin.source.path) throw new Error("official plugin root is unavailable");
console.log(plugin.source.path);
NODE
)"
A_CHECKOUT_SKILL="$PLUGIN_ROOT/skills/navi-update-calibration/SKILL.md"
node --input-type=module - "$ISO_HOME" "$SOURCE_URL" "$A_SHA" "$CASE_EVIDENCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sourceUrl, revision, evidence] = process.argv.slice(2);
const input = {
  codexHome,
  sourceUrl,
  version: "0.0.0-calibration.1",
  revision,
  marker: "NAVI_UPDATE_CALIBRATION_A",
  forbiddenMarker: "NAVI_UPDATE_CALIBRATION_B",
  outputFile: path.join(evidence, "storage-a.json"),
};
fs.writeFileSync(path.join(evidence, "verify-a-input.json"), `${JSON.stringify(input, null, 2)}\n`, { mode: 0o600 });
NODE
node "$CAL_ROOT/harness/verify-storage.mjs" "$CASE_EVIDENCE/verify-a-input.json"
```

Expected: a second isolated configured Git marketplace and A plugin are valid,
and the new thread has not yet been created.

- [ ] **Step 2: Run exactly one failure-case A turn**

Generate a fresh A-turn contract and run it:

```bash
node --input-type=module - "$ISO_HOME" "$SESSION_ROOT" "$A_CHECKOUT_SKILL" "$CASE_EVIDENCE" "$CAL_ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sessionRoot, expectedSkillPath, evidence, calibrationRoot] = process.argv.slice(2);
const options = {
  mode: "start",
  codexHome,
  sessionRoot,
  expectedSkillPath,
  expectedMarker: "NAVI_UPDATE_CALIBRATION_A",
  threadFile: path.join(evidence, "thread-id.txt"),
  eventsFile: path.join(evidence, "turn-a-events.jsonl"),
  stderrFile: path.join(evidence, "turn-a-stderr.txt"),
  lastMessageFile: path.join(evidence, "turn-a-last-message.txt"),
  resultFile: path.join(evidence, "turn-a-result.json"),
  storageVerifierPath: path.join(calibrationRoot, "harness/verify-storage.mjs"),
  storageInputFile: path.join(evidence, "verify-a-input.json"),
};
fs.writeFileSync(path.join(evidence, "turn-a-options.json"), `${JSON.stringify(options, null, 2)}\n`, { mode: 0o600 });
NODE
node "$CAL_ROOT/harness/app-server-turn.mjs" "$CASE_EVIDENCE/turn-a-options.json"
node --input-type=module - "$CASE_EVIDENCE/turn-a-result.json" "$CAL_ROOT/evidence/positive-result.json" <<'NODE'
import fs from "node:fs";
const failureA = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const positive = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
if (failureA.threadId === positive.a.threadId) throw new Error("failure case reused positive thread");
NODE
```

Expected: exact A marker and one new failure-case thread ID distinct from the
positive thread ID.

- [ ] **Step 3: Create an invalid marketplace B revision**

Run:

```bash
rm "$SOURCE/.agents/plugins/marketplace.json"
git -C "$SOURCE" add -u
git -C "$SOURCE" commit -m 'fixture: invalid marketplace version b'
INVALID_B_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
git -C "$SOURCE" push "$BARE" "${INVALID_B_SHA}:refs/heads/calibration"
git -C "$BARE" update-server-info
git ls-remote "$SOURCE_URL" refs/heads/calibration > "$CASE_EVIDENCE/ls-remote-invalid-b.txt"
test "$(awk '{print $1}' "$CASE_EVIDENCE/ls-remote-invalid-b.txt")" = "$INVALID_B_SHA"
```

Expected: the remote revision advances, but the checked-out root can no longer
validate as a marketplace.

- [ ] **Step 4: Start one replacement App Server and allow the failed update to finish**

Generate resume options that still expect installed A, then start the App
Server harness once:

```bash
node --input-type=module - "$ISO_HOME" "$SOURCE_URL" "$A_SHA" "$CASE_EVIDENCE" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sourceUrl, revision, evidence] = process.argv.slice(2);
const input = {
  codexHome,
  sourceUrl,
  version: "0.0.0-calibration.1",
  revision,
  marker: "NAVI_UPDATE_CALIBRATION_A",
  forbiddenMarker: "NAVI_UPDATE_CALIBRATION_B",
  outputFile: path.join(evidence, "storage-preserved-a.json"),
};
fs.writeFileSync(path.join(evidence, "verify-preserved-a-input.json"), `${JSON.stringify(input, null, 2)}\n`, { mode: 0o600 });
NODE
node --input-type=module - "$ISO_HOME" "$SESSION_ROOT" "$A_CHECKOUT_SKILL" "$CASE_EVIDENCE" "$CAL_ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const [codexHome, sessionRoot, expectedSkillPath, evidence, calibrationRoot] = process.argv.slice(2);
const options = {
  mode: "resume",
  codexHome,
  sessionRoot,
  expectedSkillPath,
  expectedMarker: "NAVI_UPDATE_CALIBRATION_A",
  threadFile: path.join(evidence, "thread-id.txt"),
  eventsFile: path.join(evidence, "turn-invalid-b-events.jsonl"),
  stderrFile: path.join(evidence, "turn-invalid-b-stderr.txt"),
  lastMessageFile: path.join(evidence, "turn-invalid-b-last-message.txt"),
  resultFile: path.join(evidence, "turn-invalid-b-result.json"),
  expectedStderrPattern: "failed to auto-upgrade configured marketplaces|failed to validate upgraded marketplace root",
  storageVerifierPath: path.join(calibrationRoot, "harness/verify-storage.mjs"),
  storageInputFile: path.join(evidence, "verify-preserved-a-input.json"),
};
fs.writeFileSync(path.join(evidence, "turn-invalid-b-options.json"), `${JSON.stringify(options, null, 2)}\n`, { mode: 0o600 });
NODE
node "$CAL_ROOT/harness/app-server-turn.mjs" "$CASE_EVIDENCE/turn-invalid-b-options.json"
```

Expected: App Server stderr contains the configured marketplace auto-upgrade
failure; the turn still completes with A. If the host activates invalid B,
removes A, or cannot resume, classify HOST-LIMITED and continue only to
cleanup.

- [ ] **Step 5: Prove storage remains A while the remote is invalid B**

Rerun the pre-turn A storage verifier and separately assert the invalid remote
revision and same-thread behavior:

```bash
node "$CAL_ROOT/harness/verify-storage.mjs" "$CASE_EVIDENCE/verify-preserved-a-input.json"
test "$(git ls-remote "$SOURCE_URL" refs/heads/calibration | awk '{print $1}')" = "$INVALID_B_SHA"
test "$(git -C "$MARKETPLACE_ROOT" rev-parse HEAD)" = "$A_SHA"
rg -n "failed to auto-upgrade configured marketplaces|failed to validate upgraded marketplace root" "$CASE_EVIDENCE/turn-invalid-b-stderr.txt"
node --input-type=module - "$CASE_EVIDENCE/turn-a-result.json" "$CASE_EVIDENCE/turn-invalid-b-result.json" <<'NODE'
import fs from "node:fs";
const [beforeFile, afterFile] = process.argv.slice(2);
const before = JSON.parse(fs.readFileSync(beforeFile, "utf8"));
const after = JSON.parse(fs.readFileSync(afterFile, "utf8"));
if (before.threadId !== after.threadId) throw new Error("failure preservation used a successor thread");
if (before.turnId === after.turnId) throw new Error("failure preservation reused one turn");
if (before.marker !== "NAVI_UPDATE_CALIBRATION_A" || after.marker !== "NAVI_UPDATE_CALIBRATION_A") {
  throw new Error("failure preservation marker mismatch");
}
NODE
test -z "$(find "$SESSION_ROOT" -mindepth 1 -print -quit)"
```

Expected: remote invalid B is observable, active storage remains A, the exact
failure is observable, and the same thread returns A.

- [ ] **Step 6: Reduce failure evidence and clean the failure case**

Stop the HTTP process, delete the auth copy, remove the failure fixture and
isolated state, then generate the bounded result:

```bash
cleanup_case
trap - EXIT HUP INT TERM
test ! -e "$CASE/source"
test ! -e "$CASE/isolated-codex-home"
node --input-type=module - "$CASE_EVIDENCE" "$CAL_ROOT/evidence/failure-result.json" "$SOURCE_URL" "$A_SHA" "$INVALID_B_SHA" <<'NODE'
import fs from "node:fs";
const [evidence, output, sourceUrl, aRevision, invalidBRevision] = process.argv.slice(2);
const before = JSON.parse(fs.readFileSync(`${evidence}/turn-a-result.json`, "utf8"));
const after = JSON.parse(fs.readFileSync(`${evidence}/turn-invalid-b-result.json`, "utf8"));
const result = {
  status: "pass",
  sourceUrl,
  aRevision,
  invalidBRevision,
  activeRevision: aRevision,
  activeVersion: "0.0.0-calibration.1",
  before,
  after,
  sameThread: before.threadId === after.threadId,
  oldVersionPreserved: before.marker === "NAVI_UPDATE_CALIBRATION_A" && after.marker === "NAVI_UPDATE_CALIBRATION_A",
  invalidUpdateObserved: true,
  noTargetWrites: true,
  credentialCopyRemoved: true,
  fixtureRemoved: true,
  processStopped: true,
};
if (!result.sameThread || !result.oldVersionPreserved) throw new Error("cannot record preservation PASS");
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
NODE
```

Do not repair B or retry the failed update.

### Task 4: Protected-State Audit, Verdict, And Independent Review

**Owner:** Calibration Operator, then one read-only Validation Task

**Files:**
- Create temporarily: `<calibration-root>/evidence/final-result.json`
- Create temporarily: `<calibration-root>/evidence/validation-package.md`
- Repository files modified by this task: none

**Interfaces:**
- Consumes: positive and failure bounded evidence.
- Produces: one direct calibration result, one read-only validation result, and
  no automatic repository recording.

- [ ] **Step 1: Re-prove real Codex and repository non-change**

Run:

```bash
codex plugin marketplace list --json > "$CAL_ROOT/evidence/real-marketplaces-after.json"
codex plugin list --json > "$CAL_ROOT/evidence/real-plugins-after.json"
cmp -s "$CAL_ROOT/evidence/real-marketplaces-before.json" "$CAL_ROOT/evidence/real-marketplaces-after.json"
cmp -s "$CAL_ROOT/evidence/real-plugins-before.json" "$CAL_ROOT/evidence/real-plugins-after.json"
. "$CAL_ROOT/evidence/protected-private.env"
CONFIG_AFTER="$(shasum -a 256 /Users/james/.codex/config.toml | awk '{print $1}')"
test "$CONFIG_AFTER" = "$CONFIG_BEFORE"
AUTH_AFTER="$(shasum -a 256 /Users/james/.codex/auth.json | awk '{print $1}')"
test "$AUTH_AFTER" = "$AUTH_BEFORE"
test "$(git -C "$NAVI_REPO" rev-parse HEAD)" = "$(cat "$CAL_ROOT/evidence/navi-head.txt")"
git -C "$NAVI_REPO" diff --check
git -C "$NAVI_REPO" status --short --branch
```

Expected: real Codex state and repository tracked state are unchanged. Record
only `auth_source_unchanged: true`, never either auth digest.

- [ ] **Step 2: Prove process and private-data cleanup**

Run bounded checks against recorded PIDs and case paths:

```bash
test ! -e "$CAL_ROOT/positive/isolated-codex-home/auth.json"
test ! -e "$CAL_ROOT/failure/isolated-codex-home/auth.json"
test ! -d "$CAL_ROOT/positive/source"
test ! -d "$CAL_ROOT/failure/source"
test ! -d "$CAL_ROOT/positive/http"
test ! -d "$CAL_ROOT/failure/http"
for PID_FILE in "$CAL_ROOT/positive/evidence/http-pid.txt" "$CAL_ROOT/failure/evidence/http-pid.txt"; do
  if test -e "$PID_FILE"; then
    RECORDED_PID="$(cat "$PID_FILE")"
    ! kill -0 "$RECORDED_PID" 2>/dev/null
  fi
done
```

The App Server harness waits for every child to exit before it returns. Do not
scan or terminate unrelated machine processes.

- [ ] **Step 3: Classify the exact verdict**

When every preceding assertion passes, generate the exact PASS result:

```bash
node --input-type=module - "$CAL_ROOT/evidence/positive-result.json" "$CAL_ROOT/evidence/failure-result.json" "$CAL_ROOT/evidence/final-result.json" <<'NODE'
import fs from "node:fs";
const [positiveFile, failureFile, output] = process.argv.slice(2);
const positive = JSON.parse(fs.readFileSync(positiveFile, "utf8"));
const failure = JSON.parse(fs.readFileSync(failureFile, "utf8"));
if (positive.status !== "pass" || failure.status !== "pass") throw new Error("case result is not pass");
const result = {
  calibration: "native-plugin-update",
  verdict: "PASS",
  positiveUpdate: "pass",
  sameThreadReload: positive.sameThread ? "pass" : "fail",
  failedUpdatePreservation: failure.oldVersionPreserved ? "pass" : "fail",
  realCodexStateUnchanged: true,
  repositoryUnchanged: true,
  authSourceUnchanged: true,
  credentialCopiesRemoved: true,
  processCleanup: "pass",
  model: "gpt-5.6-sol",
  reasoningEffort: "low",
  modelTurns: 4,
};
if (result.sameThreadReload !== "pass" || result.failedUpdatePreservation !== "pass") {
  throw new Error("cannot emit PASS for a failed acceptance boundary");
}
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
NODE
```

If a valid harness instead exposes a native behavior failure, do not run the
PASS generator; write `HOST-LIMITED` with the exact failed plane. If fixture,
authentication, transport, protocol, prompt, thread, or evidence validity
fails, write `HARNESS-INVALID`. Neither non-PASS verdict authorizes a retry.

For either non-PASS verdict, set `VERDICT` and `FAILED_PLANE` to the exact
classification, set `COMPLETED_MODEL_TURNS` from completed turn evidence, and
run this bounded generator only after the protected-state and cleanup audits
pass:

```bash
test "$VERDICT" = 'HOST-LIMITED' || test "$VERDICT" = 'HARNESS-INVALID'
test -n "$FAILED_PLANE"
case "$COMPLETED_MODEL_TURNS" in 0|1|2|3|4) ;; *) exit 1 ;; esac
node --input-type=module - "$CAL_ROOT/evidence/final-result.json" "$VERDICT" "$FAILED_PLANE" "$COMPLETED_MODEL_TURNS" <<'NODE'
import fs from "node:fs";
const [output, verdict, failedPlane, completedTurns] = process.argv.slice(2);
const result = {
  calibration: "native-plugin-update",
  verdict,
  failedPlane,
  acceptanceBlocked: true,
  retryAuthorized: false,
  realCodexStateUnchanged: true,
  repositoryUnchanged: true,
  authSourceUnchanged: true,
  credentialCopiesRemoved: true,
  processCleanup: "pass",
  model: "gpt-5.6-sol",
  reasoningEffort: "low",
  modelTurns: Number(completedTurns),
};
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
NODE
```

- [ ] **Step 4: Build the read-only validation package**

Generate `validation-package.md` from the bounded results:

```bash
node --input-type=module - "$CAL_ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const evidence = path.join(root, "evidence");
const final = JSON.parse(fs.readFileSync(path.join(evidence, "final-result.json"), "utf8"));
const readOptionalJson = (name) => {
  const file = path.join(evidence, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const positive = readOptionalJson("positive-result.json");
const failure = readOptionalJson("failure-result.json");
const preflight = JSON.parse(fs.readFileSync(path.join(evidence, "preflight.json"), "utf8"));
const head = fs.readFileSync(path.join(evidence, "navi-head.txt"), "utf8").trim();
const authorization = fs.readFileSync(path.join(evidence, "grouped-authorization-event-id.txt"), "utf8").trim();
const markdown = `# Navi Native Plugin Update Calibration Validation Package

- repository snapshot: ${head}
- design: docs/superpowers/specs/2026-07-19-navi-native-plugin-update-calibration-design.md
- plan: docs/superpowers/plans/2026-07-19-navi-native-plugin-update-calibration.md
- grouped authorization event: ${authorization}
- operator verdict: ${final.verdict}
- Codex version: ${preflight.codexVersion}
- Node version: ${preflight.nodeVersion}
- Git version: ${preflight.gitVersion}
- model route: ${final.model} + ${final.reasoningEffort}
- model turns: ${final.modelTurns ?? "stopped-before-budget-completion"}
- failed plane: ${final.failedPlane ?? "none"}
- positive revisions: ${positive ? `${positive.aRevision} -> ${positive.bRevision}` : "not-completed"}
- positive thread: ${positive?.a?.threadId ?? "not-completed"}
- positive turn ids: ${positive ? `${positive.a.turnId}, ${positive.b.turnId}` : "not-completed"}
- positive markers: ${positive ? `${positive.a.marker}, ${positive.b.marker}` : "not-completed"}
- invalid remote revision: ${failure?.invalidBRevision ?? "not-completed"}
- preserved active revision: ${failure?.activeRevision ?? "not-completed"}
- failure thread: ${failure?.before?.threadId ?? "not-completed"}
- failure turn ids: ${failure ? `${failure.before.turnId}, ${failure.after.turnId}` : "not-completed"}
- failure markers: ${failure ? `${failure.before.marker}, ${failure.after.marker}` : "not-completed"}
- real Codex state unchanged: ${final.realCodexStateUnchanged ?? "must-use-protected-state-audit"}
- repository unchanged: ${final.repositoryUnchanged ?? "must-use-protected-state-audit"}
- auth source unchanged: ${final.authSourceUnchanged ?? "must-use-protected-state-audit"}
- credential copies removed: ${final.credentialCopiesRemoved ?? "must-use-cleanup-audit"}
- process cleanup: ${final.processCleanup ?? "must-use-cleanup-audit"}

Detailed private evidence remains under:

- ${path.join(root, "positive/evidence")}
- ${path.join(root, "failure/evidence")}
`;
fs.writeFileSync(path.join(evidence, "validation-package.md"), markdown, { mode: 0o600 });
NODE
rm "$CAL_ROOT/evidence/protected-private.env"
test ! -e "$CAL_ROOT/evidence/protected-private.env"
```

Do not include authentication content, auth digests, raw user config, or
unrelated event history.

- [ ] **Step 5: Send the operator result directly to the Main Thread**

Use one structured direct event. For PASS, use:

```text
NAVI_CALIBRATION_RESULT
version: 1
calibration: native-plugin-update
positive_update: pass
same_thread_reload: pass
failed_update_preservation: pass
real_codex_state_unchanged: yes
repository_unchanged: yes
credential_copies_removed: yes
process_cleanup: pass
model_turns: 4
verdict: PASS
evidence: resolved absolute path from $CAL_ROOT/evidence/validation-package.md
recommendation: accept Codex-native App Server startup update as the Git-backed Navi V1 direction; keep Update Host deferred; do not infer Release authorization
```

For HOST-LIMITED or HARNESS-INVALID, use the same fields with the exact failed
boundary and recommendation to stop. Do not ask the user to relay evidence and
do not finish with a generic request for `continue`.

- [ ] **Step 6: Dispatch one read-only evidence Validation Task**

The Main Thread creates one Validation Task at the exact repository snapshot.
It reads only `validation-package.md` and its referenced bounded non-secret
evidence, does not copy auth, does not start Codex, does not rerun either
scenario, and does not modify files.

Validation checks:

```text
exactly two isolated cases
exactly four turns
positive A and B storage agree with markers
positive A and B share one thread ID
invalid B remote revision differs from preserved active A
failure task remains on A
real Codex and repository comparisons pass
credential and process cleanup pass
verdict matches the evidence
```

It sends `NAVI_VALIDATION_RESULT` directly to the Main Thread with verdict
`accept` or `remediation-required`. Evidence review does not authorize a rerun.

- [ ] **Step 7: Stop at the Main Thread's product decision**

After accepted PASS, the next decision is whether to record the result in
`docs/navi/calibration-log.md` and revise Distribution Ready documentation.
Those writes require a separate bounded documentation task.

Do not create `stable`, `preview`, a Release plan, an Update Host plan, or a
real GitHub moving-ref smoke test automatically.

## Final Verification Checklist

Before emitting the operator result, all of these must be explicit:

```text
[ ] approved grouped credential/model authorization exists
[ ] positive and failure cases used different CODEX_HOME roots
[ ] both Git services bound only to 127.0.0.1
[ ] file:// was not used
[ ] configured sources were classified as Git
[ ] positive remote and active storage moved A -> B
[ ] B resume waited for both checkout activation and versioned cache materialization
[ ] positive turns share one thread ID and return A then B
[ ] failure remote moved A -> invalid B
[ ] failure active storage and same thread remained A
[ ] exactly four turns completed
[ ] checkout and versioned plugin-cache Skill bytes matched at every storage checkpoint
[ ] each turn used at most one validated exact plugin-cache Skill read and no other tool
[ ] no writes, navi init, retries, target-project access, or successor threads occurred
[ ] real Codex marketplace, plugin, config, and auth source are unchanged
[ ] Navi repository tracked state is unchanged
[ ] auth copies, App Servers, HTTP services, fixtures, and isolated homes are removed
[ ] retained evidence contains no credential or raw config content
[ ] verdict is PASS, HOST-LIMITED, or HARNESS-INVALID
```

## Plan Satisfiability Check

Before dispatch, the Main Thread must verify:

- every prescribed fixture marker matches the prescribed assertion;
- every JSON field used by the harness matches the installed Codex version's
  generated App Server schema and plugin CLI JSON;
- the storage verifier separately resolves checkout and versioned plugin-cache
  Skill paths, requires byte equality, and records both paths;
- every resolved checkout/cache root and Skill leaf is proven inside its exact
  parent before Git inspection or content reads;
- the B turn waits boundedly for both checkout and cache readiness, then runs a
  fresh authoritative storage verifier before `thread/resume`;
- the bounded Skill-load exception checks structured `commandActions`, exact
  storage-verifier `installedSkillPath`, isolated `cwd`, exit status, and exact
  bytes;
- Markdown or line wrapping cannot affect any semantic assertion;
- shell variables adjacent to refspec colons use braced expansion and a
  shell-specific expansion probe preserves the literal colon;
- all temporary write paths are under the one private calibration root;
- the App Server harness performs one turn per process;
- the B turn uses `thread/resume`, not `thread/start`;
- the grouped authorization accurately states four turns and credential copies;
- failure cleanup does not depend on a successful product assertion; and
- no plan command addresses the user's real plugin or marketplace state.

Pure plan-artifact corrections that preserve semantics, permissions, file
scope, turn count, model route, and cleanup may be batched once before the
operator starts. Any change to those boundaries is `decision-required`.
