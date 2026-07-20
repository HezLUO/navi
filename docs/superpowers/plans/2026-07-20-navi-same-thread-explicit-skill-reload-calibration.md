# Navi Same-Thread Explicit Skill Reload Calibration Implementation Plan

> **For calibration operators:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` in one true Codex-managed worktree task. Do not
> execute this stateful calibration in the persistent Main Thread, and do not
> split fixture, App Server, credential, process, or cleanup ownership across
> agents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine whether the official Codex App Server explicit Skill-input
path can move one existing task from synthetic Skill A to Skill B, whether B
then persists naturally, and whether an invalid update preserves A.

**Architecture:** One stateful Calibration Operator runs two sequential and
fully isolated cases. Each case uses one private `CODEX_HOME`, one loopback Git
marketplace, one persistent App Server process, and one thread. The positive
case performs explicit A, explicit B, and natural post-B turns; the failure
case performs explicit A and natural preserved-A turns.

**Tech Stack:** Codex CLI and App Server `0.144.5` or the exact version accepted
at preflight, Node.js 22 or newer with built-in modules only, Git dumb HTTP,
JSON-RPC over App Server stdio, POSIX shell tools, and Codex task messaging.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-20-navi-same-thread-explicit-skill-reload-calibration-design.md`.
- The accepted natural-reload result at
  `b740d458a39ac26f6460ebbcc93b9caf461e6b1c` remains `HOST-LIMITED`; this
  calibration tests a different explicit host path.
- This is Calibration mode, not Product Implementation, Release, or
  Publication mode.
- No Navi source, package, lockfile, release metadata, plugin artifact,
  project file, `work/`, or Historical Along path may change during execution.
- Use one stateful Calibration Operator. Do not distribute case or process
  ownership across agents.
- Positive and failure cases use different private roots, `CODEX_HOME` roots,
  Git repositories, loopback services, plugin caches, App Servers, threads,
  session roots, and authentication copies.
- Bind each Git service only to `127.0.0.1` on an ephemeral port.
- Fixture marketplace, plugin, and Skill names are exactly
  `navi-explicit-reload-calibration`.
- Version A is `0.0.0-calibration.1`; version B is
  `0.0.0-calibration.2`.
- Every turn uses `gpt-5.6-sol` with reasoning effort `low`, approval policy
  `never`, and read-only sandboxing.
- The completed run contains exactly five turns: positive explicit A,
  positive explicit B, positive natural post-B, failure explicit A, and
  failure natural preserved A.
- No retry, control model, alternate prompt, alternate profile, fork,
  successor task, or extra diagnostic turn is allowed.
- Positive turns share one App Server process and thread. Failure turns share
  a second App Server process and a different thread.
- Storage, discovery, and turn evidence are separate gates.
- Explicit Skill inputs use the verified installed-cache `SKILL.md`, never the
  marketplace checkout copy.
- `skills/changed` is recorded but is not required for success.
- Copying `/Users/james/.codex/auth.json`, creating isolated Codex state,
  starting loopback services, and running five model turns require one grouped
  user authorization after mutation-free preflight.
- Authentication content is never printed, parsed, quoted, prompted, or
  retained in reduced evidence.
- The real `CODEX_HOME`, installed plugins, marketplaces, configuration, trust
  state, repository, and external projects are read-only protected state.
- Do not run `navi init`, repository tests, typecheck, package verification,
  dependency installation, project commands, or target-project writes.
- Cleanup runs after every outcome and outranks diagnosis.
- No verdict authorizes a retry, Update Host implementation, release, or
  publication.

---

## Calibration Contract

```text
goal: calibrate same-thread explicit Skill reload and failed-update preservation
operator_count: 1 stateful Calibration Operator
case_count: 2 isolated cases
model_route: gpt-5.6-sol + low
turn_budget: exactly 5, no retry
positive: explicit A, explicit B, natural post-B
failure: explicit A, invalid B update, natural preserved A
transport: 127.0.0.1 ephemeral HTTP Git only
real_codex_home: read-only
target_project_access: none
repository_writes: none during calibration
validation: one read-only evidence review, no rerun
result_route: direct structured event to the source Main Thread
```

## Temporary Layout

```text
<calibration-root>/
  evidence/
  harness/
    static-git-http.mjs
    explicit-reload-case.mjs
  positive/{source,http,isolated-codex-home,session-root,evidence}/
  failure/{source,http,isolated-codex-home,session-root,evidence}/
```

Case source, HTTP repository, isolated home, session root, and auth copy are
deleted during unconditional cleanup. Reduced private evidence and harnesses
remain only through independent validation.

---

### Task 1: Preflight, Harnesses, And Grouped Authorization

**Owner:** Calibration Operator

**Files:**
- Read: `docs/superpowers/specs/2026-07-20-navi-same-thread-explicit-skill-reload-calibration-design.md`
- Read: `docs/superpowers/plans/2026-07-20-navi-same-thread-explicit-skill-reload-calibration.md`
- Create temporarily: `<calibration-root>/harness/static-git-http.mjs`
- Create temporarily: `<calibration-root>/harness/explicit-reload-case.mjs`
- Create temporarily: `<calibration-root>/harness/write-fixture.mjs`
- Create temporarily: `<calibration-root>/evidence/preflight.json`

**Interfaces:**
- Consumes: the exact Main Thread repository snapshot and existing private
  Codex authentication file.
- Produces: one mutation-free preflight, two syntax-checked harnesses, and one
  grouped `decision-required` event.

- [ ] **Step 1: Establish the read-only repository baseline**

```bash
NAVI_REPO='/Users/james/Codex Project/General Codex Project/Navi'
NAVI_HEAD="$(git -C "$NAVI_REPO" rev-parse HEAD)"
git -C "$NAVI_REPO" status --short --branch
git -C "$NAVI_REPO" diff --check
git -C "$NAVI_REPO" ls-files --others --exclude-standard
```

Expected: tracked state is clean. Existing untracked `work/` may be present
and remains untouched.

- [ ] **Step 2: Verify host prerequisites without reading auth content**

```bash
CODEX_VERSION="$(codex --version)"
NODE_VERSION="$(node --version)"
GIT_VERSION="$(git --version)"
printf '%s\n%s\n%s\n' "$CODEX_VERSION" "$NODE_VERSION" "$GIT_VERSION"
test "$(stat -f '%Sp' /Users/james/.codex/auth.json)" = '-rw-------'
test -s /Users/james/.codex/auth.json
```

Expected: Codex version is recorded, Node is at least 22, Git is available,
and auth exists with mode `0600`. Do not hash auth before authorization.

- [ ] **Step 3: Verify the installed App Server schema**

```bash
SCHEMA_ROOT="$(mktemp -d /private/tmp/navi-explicit-reload-schema.XXXXXX)"
chmod 700 "$SCHEMA_ROOT"
codex app-server generate-json-schema --out "$SCHEMA_ROOT"
rg -n 'marketplace/upgrade|marketplaceName|skills/list|forceReload|type.*skill|thread/start|turn/start' "$SCHEMA_ROOT"
```

Expected: the installed schema supports `marketplace/upgrade` with optional
`marketplaceName`, `skills/list` with `cwds` and `forceReload`, Skill metadata
with an absolute `path`, and Skill input items with `name` and `path`. A
mismatch is `decision-required` before any isolated state or model turn.

- [ ] **Step 4: Create the private calibration root**

```bash
CAL_ROOT="$(mktemp -d /private/tmp/navi-explicit-reload.XXXXXX)"
chmod 700 "$CAL_ROOT"
mkdir -m 700 "$CAL_ROOT/evidence" "$CAL_ROOT/harness"
printf '%s\n' "$NAVI_HEAD" > "$CAL_ROOT/evidence/navi-head.txt"
node --input-type=module - "$CAL_ROOT/evidence/preflight.json" "$CODEX_VERSION" "$NODE_VERSION" "$GIT_VERSION" <<'NODE'
import fs from "node:fs";
const [output, codexVersion, nodeVersion, gitVersion] = process.argv.slice(2);
fs.writeFileSync(output, `${JSON.stringify({ codexVersion, nodeVersion, gitVersion }, null, 2)}\n`, { mode: 0o600 });
NODE
```

- [ ] **Step 5: Create the loopback static Git harness**

Create `$CAL_ROOT/harness/static-git-http.mjs` with:

```javascript
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const [rootArg, portFile] = process.argv.slice(2);
if (!rootArg || !portFile) throw new Error("usage: static-git-http.mjs ROOT PORT_FILE");
const root = fs.realpathSync(rootArg);

const server = http.createServer((request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") return response.writeHead(405).end();
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const resolved = fs.realpathSync(path.join(root, pathname));
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return response.writeHead(403).end();
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return response.writeHead(404).end();
    response.writeHead(200, {
      "content-type": pathname.endsWith("/info/refs") ? "text/plain; charset=utf-8" : "application/octet-stream",
      "content-length": stat.size,
      "cache-control": "no-store",
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(resolved).pipe(response);
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

- [ ] **Step 6: Create the persistent App Server case harness**

Create `$CAL_ROOT/harness/explicit-reload-case.mjs` with:

```javascript
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execFileSync, spawn } from "node:child_process";

const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const env = { ...process.env, CODEX_HOME: config.codexHome };
const events = fs.createWriteStream(config.eventsFile, { mode: 0o600 });
const child = spawn("codex", [
  "app-server", "--stdio",
  "-c", 'model="gpt-5.6-sol"',
  "-c", 'model_reasoning_effort="low"',
], { env, stdio: ["pipe", "pipe", "pipe"] });
child.stderr.pipe(fs.createWriteStream(config.stderrFile, { mode: 0o600 }));

const lines = readline.createInterface({ input: child.stdout });
const pending = new Map();
const completedTurns = new Map();
const turnWaiters = new Map();
const turnTypes = new Map();
const turnMessages = new Map();
let nextId = 1;
let skillsChanged = 0;
let forbiddenServerRequest = null;

function send(method, params) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ method, id, params })}\n`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, 120_000);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
  });
}

function notify(method, params = {}) {
  child.stdin.write(`${JSON.stringify({ method, params })}\n`);
}

function waitForTurn(turnId) {
  if (completedTurns.has(turnId)) return Promise.resolve(completedTurns.get(turnId));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      turnWaiters.delete(turnId);
      reject(new Error(`turn ${turnId} timed out`));
    }, 120_000);
    turnWaiters.set(turnId, {
      resolve: (turn) => { clearTimeout(timer); resolve(turn); },
      reject,
    });
  });
}

lines.on("line", (line) => {
  events.write(`${line}\n`);
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    const failure = new Error(`invalid App Server JSON: ${error.message}`);
    for (const waiter of pending.values()) waiter.reject(failure);
    for (const waiter of turnWaiters.values()) waiter.reject(failure);
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
    forbiddenServerRequest = message.method;
    child.stdin.write(`${JSON.stringify({ id: message.id, error: { code: -32000, message: "calibration rejects server requests" } })}\n`);
    return;
  }
  if (message.method === "skills/changed") skillsChanged += 1;
  if (message.method === "item/completed") {
    const turnId = message.params?.turnId;
    const item = message.params?.item;
    if (turnId && item?.type) {
      const types = turnTypes.get(turnId) ?? [];
      types.push(item.type);
      turnTypes.set(turnId, types);
      if (item.type === "agentMessage") turnMessages.set(turnId, item.text);
    }
  }
  if (message.method === "turn/completed" && message.params?.turn) {
    const turn = message.params.turn;
    completedTurns.set(turn.id, turn);
    const waiter = turnWaiters.get(turn.id);
    if (waiter) {
      turnWaiters.delete(turn.id);
      waiter.resolve(turn);
    }
  }
});

child.on("exit", (code, signal) => {
  const error = new Error(`app-server exited code=${code} signal=${signal}`);
  for (const waiter of pending.values()) waiter.reject(error);
  for (const waiter of turnWaiters.values()) waiter.reject(error);
});

const within = (root, candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);
const cliJson = (args) => JSON.parse(execFileSync("codex", args, { env, encoding: "utf8" }));

function verifyStorage(expected) {
  const marketplaceRows = cliJson(["plugin", "marketplace", "list", "--json"]).marketplaces ?? [];
  const pluginRows = cliJson(["plugin", "list", "--json"]).installed ?? [];
  const marketplace = marketplaceRows.find((row) => row.name === config.marketplaceName);
  const plugin = pluginRows.find((row) => row.pluginId === `${config.pluginName}@${config.marketplaceName}`);
  if (!marketplace || !plugin) throw new Error("marketplace or plugin missing");
  if (marketplace.marketplaceSource?.sourceType !== "git") throw new Error("marketplace is not Git-backed");
  if (marketplace.marketplaceSource?.source !== config.sourceUrl) throw new Error("marketplace source mismatch");
  if (plugin.name !== config.pluginName || plugin.marketplaceName !== config.marketplaceName) throw new Error("plugin identity mismatch");
  if (plugin.installed !== true || plugin.enabled !== true) throw new Error("plugin is not installed and enabled");
  if (plugin.version !== expected.version) throw new Error(`expected ${expected.version}, received ${plugin.version}`);
  if (plugin.source?.source !== "local" || !plugin.source?.path) throw new Error("plugin source path missing");

  const home = fs.realpathSync(config.codexHome);
  const marketplaceStore = fs.realpathSync(path.join(home, ".tmp/marketplaces"));
  const marketplaceRoot = fs.realpathSync(marketplace.root);
  if (!within(home, marketplaceStore) || !within(marketplaceStore, marketplaceRoot)) throw new Error("marketplace containment failure");
  const pluginRoot = fs.realpathSync(plugin.source.path);
  if (!within(marketplaceRoot, pluginRoot)) throw new Error("plugin checkout containment failure");
  const checkoutSkillPath = fs.realpathSync(path.join(pluginRoot, `skills/${config.skillName}/SKILL.md`));
  if (!within(pluginRoot, checkoutSkillPath)) throw new Error("checkout Skill containment failure");

  const cacheRoot = fs.realpathSync(path.join(home, "plugins/cache"));
  if (!within(home, cacheRoot)) throw new Error("cache containment failure");
  const installedRoot = fs.realpathSync(path.join(cacheRoot, config.marketplaceName, config.pluginName, expected.version));
  if (!within(cacheRoot, installedRoot)) throw new Error("installed root containment failure");
  const installedSkillPath = fs.realpathSync(path.join(installedRoot, `skills/${config.skillName}/SKILL.md`));
  if (!within(installedRoot, installedSkillPath)) throw new Error("installed Skill containment failure");

  const revision = execFileSync("git", ["-C", marketplaceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (revision !== expected.revision) throw new Error(`expected revision ${expected.revision}, received ${revision}`);
  const checkoutBytes = fs.readFileSync(checkoutSkillPath);
  const installedBytes = fs.readFileSync(installedSkillPath);
  if (!checkoutBytes.equals(installedBytes)) throw new Error("checkout/cache bytes differ");
  const text = checkoutBytes.toString("utf8");
  for (const marker of expected.requiredMarkers) if (!text.includes(marker)) throw new Error(`missing ${marker}`);
  for (const marker of expected.forbiddenMarkers) if (text.includes(marker)) throw new Error(`forbidden ${marker}`);
  return { revision, version: plugin.version, checkoutSkillPath, installedSkillPath };
}

async function waitForStorage(expected) {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    try { return verifyStorage(expected); }
    catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 250)); }
  }
  throw new Error(`storage readiness timed out: ${lastError?.message}`);
}

async function forceDiscovery(expectedSkillPath) {
  const result = await send("skills/list", { cwds: [config.sessionRoot], forceReload: true });
  const row = (result.data ?? []).find((entry) => path.resolve(entry.cwd) === path.resolve(config.sessionRoot));
  if (!row || (row.errors ?? []).length) throw new Error(`Skill discovery failed: ${JSON.stringify(row?.errors)}`);
  const skill = (row.skills ?? []).find((entry) => entry.name === config.skillName);
  if (!skill || skill.enabled !== true) throw new Error("fixture Skill is not enabled");
  const discoveredPath = fs.realpathSync(skill.path);
  if (discoveredPath !== fs.realpathSync(expectedSkillPath)) throw new Error("forced discovery returned the wrong Skill path");
  return { name: skill.name, enabled: skill.enabled, path: discoveredPath, errors: 0 };
}

async function runTurn(threadId, challenge, skillPath = null) {
  const input = [{ type: "text", text: challenge }];
  if (skillPath) input.push({ type: "skill", name: config.skillName, path: skillPath });
  const started = await send("turn/start", { threadId, input });
  const turn = await waitForTurn(started.turn.id);
  if (turn.status !== "completed") throw new Error(`turn status ${turn.status}`);
  const itemTypes = turnTypes.get(turn.id) ?? [];
  const forbidden = itemTypes.filter((type) => !["userMessage", "agentMessage", "reasoning"].includes(type));
  if (forbidden.length) throw new Error(`forbidden items: ${forbidden.join(",")}`);
  if (forbiddenServerRequest) throw new Error(`forbidden server request: ${forbiddenServerRequest}`);
  return {
    turnId: turn.id,
    marker: turnMessages.get(turn.id) ?? null,
    itemTypes,
    explicitSkill: Boolean(skillPath),
    explicitSkillPath: skillPath,
  };
}

function publish(revision) {
  execFileSync("git", ["-C", config.sourceDir, "push", config.bareDir, `${revision}:refs/heads/calibration`], { stdio: "pipe" });
  execFileSync("git", ["-C", config.bareDir, "update-server-info"], { stdio: "pipe" });
  const remote = execFileSync("git", ["ls-remote", config.sourceUrl, "refs/heads/calibration"], { encoding: "utf8" }).trim().split(/\s+/)[0];
  if (remote !== revision) throw new Error("remote revision mismatch");
}

function hasUpgradeError(result) {
  if (Array.isArray(result?.errors)) return result.errors.length > 0;
  if (result?.errors && typeof result.errors === "object") return Object.keys(result.errors).length > 0;
  return false;
}

let result;
try {
  await send("initialize", { clientInfo: { name: "navi_explicit_reload_calibration", title: "Navi Explicit Reload Calibration", version: "0.1.0" } });
  notify("initialized");
  const aStorage = verifyStorage(config.a);
  const discoveryA = await forceDiscovery(aStorage.installedSkillPath);
  const started = await send("thread/start", { cwd: config.sessionRoot, approvalPolicy: "never", sandbox: "read-only" });
  const threadId = started.thread.id;
  const aTurn = await runTurn(threadId, "EXPLICIT_RELOAD_A_START", aStorage.installedSkillPath);
  if (aTurn.marker !== "NAVI_EXPLICIT_RELOAD_A_START") throw new Error("initial A marker mismatch");

  if (config.caseType === "positive") {
    publish(config.b.revision);
    const upgrade = await send("marketplace/upgrade", { marketplaceName: config.marketplaceName });
    if (hasUpgradeError(upgrade)) throw new Error(`positive upgrade error: ${JSON.stringify(upgrade.errors)}`);
    const bStorage = await waitForStorage(config.b);
    const discoveryB = await forceDiscovery(bStorage.installedSkillPath);
    const bTurn = await runTurn(threadId, "EXPLICIT_RELOAD_B_ACTIVATE", bStorage.installedSkillPath);
    const naturalTurn = await runTurn(threadId, "EXPLICIT_RELOAD_POST_B");
    result = { caseType: config.caseType, threadId, aStorage, bStorage, discoveryA, discoveryB, upgrade, skillsChanged, turns: [aTurn, bTurn, naturalTurn] };
  } else if (config.caseType === "failure") {
    publish(config.invalidBRevision);
    let upgradeResult = null;
    let upgradeError = null;
    try { upgradeResult = await send("marketplace/upgrade", { marketplaceName: config.marketplaceName }); }
    catch (error) { upgradeError = error.message; }
    if (!upgradeError && !hasUpgradeError(upgradeResult)) throw new Error("invalid B did not report update failure");
    const preservedStorage = await waitForStorage(config.a);
    const discoveryPreserved = await forceDiscovery(preservedStorage.installedSkillPath);
    const preservedTurn = await runTurn(threadId, "EXPLICIT_RELOAD_A_AFTER_INVALID");
    result = { caseType: config.caseType, threadId, aStorage, preservedStorage, discoveryA, discoveryPreserved, upgradeResult, upgradeError, skillsChanged, turns: [aTurn, preservedTurn] };
  } else {
    throw new Error(`unsupported case ${config.caseType}`);
  }

  const ids = result.turns.map((turn) => turn.turnId);
  if (new Set(ids).size !== ids.length) throw new Error("turn IDs are not distinct");
  fs.writeFileSync(config.resultFile, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
} finally {
  child.stdin.end();
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  if (child.exitCode === null && child.signalCode === null) await new Promise((resolve) => child.once("exit", resolve));
  await new Promise((resolve) => events.end(resolve));
}
```

- [ ] **Step 7: Extract the canonical fixture writer before authorization**

The canonical fixture writer is the JavaScript body in Task 2 Step 2 that
contains `const [root, mode] = process.argv.slice(2);`. Extract exactly that
one body without interpreting Markdown whitespace:

```bash
PLAN="$NAVI_REPO/docs/superpowers/plans/2026-07-20-navi-same-thread-explicit-skill-reload-calibration.md"
node --input-type=module - "$PLAN" "$CAL_ROOT/harness/write-fixture.mjs" <<'NODE'
import fs from "node:fs";
const [plan, output] = process.argv.slice(2);
const markdown = fs.readFileSync(plan, "utf8");
const blocks = [...markdown.matchAll(/```javascript\n([\s\S]*?)```/g)].map((match) => match[1]);
const matches = blocks.filter((body) => body.includes("const [root, mode] = process.argv.slice(2);"));
if (matches.length !== 1) throw new Error(`expected one fixture writer, found ${matches.length}`);
fs.writeFileSync(output, matches[0], { mode: 0o600 });
NODE
```

- [ ] **Step 8: Syntax and capability audit all harnesses**

```bash
node --check "$CAL_ROOT/harness/static-git-http.mjs"
node --check "$CAL_ROOT/harness/explicit-reload-case.mjs"
node --check "$CAL_ROOT/harness/write-fixture.mjs"
rg -n 'marketplace/upgrade|forceReload|type: "skill"|gpt-5.6-sol|model_reasoning_effort="low"' "$CAL_ROOT/harness"
rg -n 'writeFileSync|execFileSync|spawn' "$CAL_ROOT/harness/explicit-reload-case.mjs"
(cd "$CAL_ROOT" && shasum -a 256 harness/*.mjs > evidence/harness-sha256.txt)
```

Expected: only the declared result write, Codex/Git read-or-isolated-update
commands, and one App Server spawn appear. No target-project path is present.

- [ ] **Step 9: Record protected real-state baselines**

```bash
mkdir -m 700 "$CAL_ROOT/evidence/protected-before"
codex plugin marketplace list --json > "$CAL_ROOT/evidence/protected-before/marketplaces.json"
codex plugin list --json > "$CAL_ROOT/evidence/protected-before/plugins.json"
CONFIG_BEFORE="$(shasum -a 256 /Users/james/.codex/config.toml | awk '{print $1}')"
printf 'CONFIG_BEFORE=%s\n' "$CONFIG_BEFORE" > "$CAL_ROOT/evidence/protected-private.env"
chmod 600 "$CAL_ROOT/evidence/protected-private.env"
```

- [ ] **Step 10: Run one aggregate plan satisfiability check**

Confirm all of these before permission is requested:

```text
installed schema matches every JSON-RPC field
fixture markers match every challenge
B persistence response differs from B activation response
positive harness calls runTurn exactly three times
failure harness calls runTurn exactly twice
only explicit A and explicit B calls pass a Skill path
natural post-B and natural preserved-A omit Skill input
all Git refspecs are execFileSync argv values
containment precedes Git and Skill-content reads
checkout and installed-cache bytes must match
forced discovery follows A and post-update storage gates
finally always terminates the App Server and closes evidence
shell cleanup covers HTTP, auth copy, home, source, and session root
```

Correct all mechanical plan-artifact defects together before dispatch. A
semantic, permission, scope, or risk change returns to the Main Thread.

- [ ] **Step 11: Send one grouped authorization event**

```text
decision_needed: authorize two isolated private CODEX_HOME cases, temporary mode-0600 auth copies, two loopback-only Git services, two persistent isolated App Server processes, exactly five gpt-5.6-sol + low turns, isolated marketplace/plugin operations, unconditional cleanup, and read-only protected-state comparison
not_authorized: real marketplace/plugin/config mutation, target-project access, navi init, retry, alternate model, successor task, repository implementation, release, or publication
```

After explicit approval, record its event ID and private source-auth digest:

```bash
test -n "${GROUPED_AUTHORIZATION_EVENT_ID:?exact authorization event required}"
printf '%s\n' "$GROUPED_AUTHORIZATION_EVENT_ID" > "$CAL_ROOT/evidence/grouped-authorization-event-id.txt"
AUTH_BEFORE="$(shasum -a 256 /Users/james/.codex/auth.json | awk '{print $1}')"
printf 'AUTH_BEFORE=%s\n' "$AUTH_BEFORE" >> "$CAL_ROOT/evidence/protected-private.env"
chmod 600 "$CAL_ROOT/evidence/grouped-authorization-event-id.txt" "$CAL_ROOT/evidence/protected-private.env"
```

### Task 2: Positive Explicit A-To-B Same-Thread Case

**Owner:** Calibration Operator

**Files:**
- Consume temporarily: `<calibration-root>/harness/write-fixture.mjs`
- Create temporarily: `<calibration-root>/positive/**`
- Create temporarily: `<calibration-root>/evidence/positive-result.json`

**Interfaces:**
- Consumes: the grouped authorization and Task 1 harnesses.
- Produces: one three-turn result with verified A and B storage, discovery,
  explicit-input, and natural-persistence evidence.

- [ ] **Step 1: Create the positive case and cleanup trap**

```bash
(cd "$CAL_ROOT" && shasum -a 256 -c evidence/harness-sha256.txt)
CASE="$CAL_ROOT/positive"
SOURCE="$CASE/source"
HTTP_ROOT="$CASE/http"
BARE="$HTTP_ROOT/navi-explicit-reload-calibration.git"
ISO_HOME="$CASE/isolated-codex-home"
SESSION_ROOT="$CASE/session-root"
CASE_EVIDENCE="$CASE/evidence"
mkdir -m 700 "$CASE" "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT" "$CASE_EVIDENCE"
install -m 600 /Users/james/.codex/auth.json "$ISO_HOME/auth.json"
HTTP_PID=''
cleanup_positive() {
  if test -n "${HTTP_PID:-}"; then
    kill "$HTTP_PID" 2>/dev/null || true
    wait "$HTTP_PID" 2>/dev/null || true
  fi
  test ! -e "$ISO_HOME/auth.json" || rm "$ISO_HOME/auth.json"
  rm -rf "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT"
}
trap cleanup_positive EXIT HUP INT TERM
```

- [ ] **Step 2: Re-prove the preflighted deterministic fixture writer**

Task 1 extracted and hashed this exact canonical body before grouped
authorization:

```javascript
import fs from "node:fs";
import path from "node:path";

const [root, mode] = process.argv.slice(2);
const marketplacePath = path.join(root, ".agents/plugins/marketplace.json");
const manifestPath = path.join(root, "plugins/navi-explicit-reload-calibration/.codex-plugin/plugin.json");
const skillPath = path.join(root, "plugins/navi-explicit-reload-calibration/skills/navi-explicit-reload-calibration/SKILL.md");

const marketplace = {
  name: "navi-explicit-reload-calibration",
  plugins: [{
    name: "navi-explicit-reload-calibration",
    source: { source: "local", path: "./plugins/navi-explicit-reload-calibration" },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: "Developer Tools",
  }],
};

const aSkill = `---
name: navi-explicit-reload-calibration
description: Use only for the exact explicit reload calibration probes.
---

# Explicit Reload Calibration A

Do not use tools.

When the input is exactly EXPLICIT_RELOAD_A_START, reply exactly:
NAVI_EXPLICIT_RELOAD_A_START

When the input is exactly EXPLICIT_RELOAD_B_ACTIVATE, reply exactly:
NAVI_EXPLICIT_RELOAD_A_RETAINED

When the input is exactly EXPLICIT_RELOAD_POST_B, reply exactly:
NAVI_EXPLICIT_RELOAD_A_STALE

When the input is exactly EXPLICIT_RELOAD_A_AFTER_INVALID, reply exactly:
NAVI_EXPLICIT_RELOAD_A_PRESERVED
`;

const bSkill = `---
name: navi-explicit-reload-calibration
description: Use only for the exact explicit reload calibration probes.
---

# Explicit Reload Calibration B

Do not use tools.

When the input is exactly EXPLICIT_RELOAD_B_ACTIVATE, reply exactly:
NAVI_EXPLICIT_RELOAD_B_ACTIVE

When the input is exactly EXPLICIT_RELOAD_POST_B, reply exactly:
NAVI_EXPLICIT_RELOAD_B_PERSISTED
`;

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

if (mode === "a") {
  write(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
  write(manifestPath, `${JSON.stringify({
    name: "navi-explicit-reload-calibration",
    version: "0.0.0-calibration.1",
    description: "Isolated explicit Skill reload calibration fixture.",
    skills: "./skills/",
  }, null, 2)}\n`);
  write(skillPath, aSkill);
} else if (mode === "b") {
  if (!fs.existsSync(marketplacePath)) throw new Error("B requires valid A marketplace");
  write(manifestPath, `${JSON.stringify({
    name: "navi-explicit-reload-calibration",
    version: "0.0.0-calibration.2",
    description: "Isolated explicit Skill reload calibration fixture.",
    skills: "./skills/",
  }, null, 2)}\n`);
  write(skillPath, bSkill);
} else if (mode === "invalid-b") {
  if (!fs.existsSync(marketplacePath)) throw new Error("invalid B requires valid A marketplace");
  fs.rmSync(marketplacePath);
} else {
  throw new Error(`unsupported fixture mode ${mode}`);
}
```

Do not recreate or edit it. Re-prove the complete preauthorized harness set:

```bash
node --check "$CAL_ROOT/harness/write-fixture.mjs"
(cd "$CAL_ROOT" && shasum -a 256 -c evidence/harness-sha256.txt)
```

- [ ] **Step 3: Create exact A and B commits**

```bash
node "$CAL_ROOT/harness/write-fixture.mjs" "$SOURCE" a
git -C "$SOURCE" init -b calibration
git -C "$SOURCE" config user.name 'Navi Calibration'
git -C "$SOURCE" config user.email 'navi-calibration@invalid.example'
git -C "$SOURCE" add .
git -C "$SOURCE" commit -m 'fixture: explicit reload version a'
A_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
A_SKILL_SHA="$(shasum -a 256 "$SOURCE/plugins/navi-explicit-reload-calibration/skills/navi-explicit-reload-calibration/SKILL.md" | awk '{print $1}')"
printf '%s\n' "$A_SKILL_SHA" > "$CAL_ROOT/evidence/a-skill-sha.txt"

node "$CAL_ROOT/harness/write-fixture.mjs" "$SOURCE" b
git -C "$SOURCE" add .
git -C "$SOURCE" commit -m 'fixture: explicit reload version b'
B_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
```

Expected: B is a valid descendant of A; identities are unchanged; version and
Skill instructions differ.

- [ ] **Step 4: Publish only A and start the loopback service**

```bash
git clone --bare "$SOURCE" "$BARE"
git -C "$BARE" update-ref refs/heads/calibration "$A_SHA"
git -C "$BARE" symbolic-ref HEAD refs/heads/calibration
git -C "$BARE" update-server-info
PORT_FILE="$CASE_EVIDENCE/http-port.txt"
node "$CAL_ROOT/harness/static-git-http.mjs" "$HTTP_ROOT" "$PORT_FILE" > "$CASE_EVIDENCE/http-stdout.txt" 2> "$CASE_EVIDENCE/http-stderr.txt" &
HTTP_PID=$!
printf '%s\n' "$HTTP_PID" > "$CASE_EVIDENCE/http-pid.txt"
for _ in $(seq 1 100); do test -s "$PORT_FILE" && break; sleep 0.05; done
test -s "$PORT_FILE"
SOURCE_URL="http://127.0.0.1:$(cat "$PORT_FILE")/navi-explicit-reload-calibration.git"
test "$(git ls-remote "$SOURCE_URL" refs/heads/calibration | awk '{print $1}')" = "$A_SHA"
```

- [ ] **Step 5: Install A only inside the isolated home**

```bash
CODEX_HOME="$ISO_HOME" codex plugin marketplace add "$SOURCE_URL" --ref calibration --json > "$CASE_EVIDENCE/marketplace-add-a.json"
CODEX_HOME="$ISO_HOME" codex plugin add navi-explicit-reload-calibration@navi-explicit-reload-calibration --json > "$CASE_EVIDENCE/plugin-add-a.json"
```

- [ ] **Step 6: Write the positive case contract**

```bash
node --input-type=module - "$CASE_EVIDENCE/case.json" "$ISO_HOME" "$SESSION_ROOT" "$SOURCE" "$BARE" "$SOURCE_URL" "$A_SHA" "$B_SHA" "$CASE_EVIDENCE" <<'NODE'
import fs from "node:fs";
const [output, codexHome, sessionRoot, sourceDir, bareDir, sourceUrl, aRevision, bRevision, evidenceDir] = process.argv.slice(2);
const aMarkers = ["NAVI_EXPLICIT_RELOAD_A_START", "NAVI_EXPLICIT_RELOAD_A_RETAINED", "NAVI_EXPLICIT_RELOAD_A_STALE", "NAVI_EXPLICIT_RELOAD_A_PRESERVED"];
const bMarkers = ["NAVI_EXPLICIT_RELOAD_B_ACTIVE", "NAVI_EXPLICIT_RELOAD_B_PERSISTED"];
const contract = {
  caseType: "positive",
  codexHome,
  sessionRoot,
  sourceDir,
  bareDir,
  sourceUrl,
  marketplaceName: "navi-explicit-reload-calibration",
  pluginName: "navi-explicit-reload-calibration",
  skillName: "navi-explicit-reload-calibration",
  a: { version: "0.0.0-calibration.1", revision: aRevision, requiredMarkers: aMarkers, forbiddenMarkers: bMarkers },
  b: { version: "0.0.0-calibration.2", revision: bRevision, requiredMarkers: bMarkers, forbiddenMarkers: aMarkers },
  eventsFile: `${evidenceDir}/events.jsonl`,
  stderrFile: `${evidenceDir}/app-server-stderr.txt`,
  resultFile: `${evidenceDir}/result.json`,
};
fs.writeFileSync(output, `${JSON.stringify(contract, null, 2)}\n`, { mode: 0o600 });
NODE
```

- [ ] **Step 7: Execute the positive case once**

```bash
node "$CAL_ROOT/harness/explicit-reload-case.mjs" "$CASE_EVIDENCE/case.json"
cp "$CASE_EVIDENCE/result.json" "$CAL_ROOT/evidence/positive-result.json"
chmod 600 "$CAL_ROOT/evidence/positive-result.json"
node --input-type=module - "$CAL_ROOT/evidence/positive-result.json" <<'NODE'
import fs from "node:fs";
const result = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (result.turns.length !== 3) throw new Error("positive turn count mismatch");
if (new Set(result.turns.map((turn) => turn.turnId)).size !== 3) throw new Error("positive turn IDs are not distinct");
if (!result.turns[0].explicitSkill || !result.turns[1].explicitSkill || result.turns[2].explicitSkill) throw new Error("positive explicit/natural boundary mismatch");
if (result.turns[0].marker !== "NAVI_EXPLICIT_RELOAD_A_START") throw new Error("positive A marker mismatch");
NODE
```

Do not classify B behavior yet. The exact explicit-B and natural-post-B
markers are retained for aggregate classification after the failure case.

- [ ] **Step 8: Clean the positive case**

```bash
cleanup_positive
trap - EXIT HUP INT TERM
test ! -e "$ISO_HOME/auth.json"
test ! -d "$SOURCE"
test ! -d "$HTTP_ROOT"
test ! -d "$ISO_HOME"
test ! -d "$SESSION_ROOT"
```

If cleanup fails, stop before the failure case and route `HARNESS-INVALID`.

### Task 3: Invalid-B Preservation Case

**Owner:** Calibration Operator

**Files:**
- Consume temporarily: `<calibration-root>/harness/write-fixture.mjs`
- Create temporarily: `<calibration-root>/failure/**`
- Create temporarily: `<calibration-root>/evidence/failure-result.json`

**Interfaces:**
- Consumes: the cleaned positive result and deterministic fixture writer.
- Produces: one two-turn failed-update preservation result.

- [ ] **Step 1: Create the failure case and cleanup trap**

```bash
(cd "$CAL_ROOT" && shasum -a 256 -c evidence/harness-sha256.txt)
CASE="$CAL_ROOT/failure"
SOURCE="$CASE/source"
HTTP_ROOT="$CASE/http"
BARE="$HTTP_ROOT/navi-explicit-reload-calibration.git"
ISO_HOME="$CASE/isolated-codex-home"
SESSION_ROOT="$CASE/session-root"
CASE_EVIDENCE="$CASE/evidence"
mkdir -m 700 "$CASE" "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT" "$CASE_EVIDENCE"
install -m 600 /Users/james/.codex/auth.json "$ISO_HOME/auth.json"
HTTP_PID=''
cleanup_failure() {
  if test -n "${HTTP_PID:-}"; then
    kill "$HTTP_PID" 2>/dev/null || true
    wait "$HTTP_PID" 2>/dev/null || true
  fi
  test ! -e "$ISO_HOME/auth.json" || rm "$ISO_HOME/auth.json"
  rm -rf "$SOURCE" "$HTTP_ROOT" "$ISO_HOME" "$SESSION_ROOT"
}
trap cleanup_failure EXIT HUP INT TERM
```

- [ ] **Step 2: Create byte-identical A and invalid B commits**

```bash
node "$CAL_ROOT/harness/write-fixture.mjs" "$SOURCE" a
git -C "$SOURCE" init -b calibration
git -C "$SOURCE" config user.name 'Navi Calibration'
git -C "$SOURCE" config user.email 'navi-calibration@invalid.example'
git -C "$SOURCE" add .
git -C "$SOURCE" commit -m 'fixture: explicit reload version a'
A_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
test "$(shasum -a 256 "$SOURCE/plugins/navi-explicit-reload-calibration/skills/navi-explicit-reload-calibration/SKILL.md" | awk '{print $1}')" = "$(cat "$CAL_ROOT/evidence/a-skill-sha.txt")"

node "$CAL_ROOT/harness/write-fixture.mjs" "$SOURCE" invalid-b
git -C "$SOURCE" add -u
git -C "$SOURCE" commit -m 'fixture: invalid explicit reload version b'
INVALID_B_SHA="$(git -C "$SOURCE" rev-parse HEAD)"
```

- [ ] **Step 3: Publish A, start loopback service, and install A**

```bash
git clone --bare "$SOURCE" "$BARE"
git -C "$BARE" update-ref refs/heads/calibration "$A_SHA"
git -C "$BARE" symbolic-ref HEAD refs/heads/calibration
git -C "$BARE" update-server-info
PORT_FILE="$CASE_EVIDENCE/http-port.txt"
node "$CAL_ROOT/harness/static-git-http.mjs" "$HTTP_ROOT" "$PORT_FILE" > "$CASE_EVIDENCE/http-stdout.txt" 2> "$CASE_EVIDENCE/http-stderr.txt" &
HTTP_PID=$!
printf '%s\n' "$HTTP_PID" > "$CASE_EVIDENCE/http-pid.txt"
for _ in $(seq 1 100); do test -s "$PORT_FILE" && break; sleep 0.05; done
test -s "$PORT_FILE"
SOURCE_URL="http://127.0.0.1:$(cat "$PORT_FILE")/navi-explicit-reload-calibration.git"
test "$(git ls-remote "$SOURCE_URL" refs/heads/calibration | awk '{print $1}')" = "$A_SHA"
CODEX_HOME="$ISO_HOME" codex plugin marketplace add "$SOURCE_URL" --ref calibration --json > "$CASE_EVIDENCE/marketplace-add-a.json"
CODEX_HOME="$ISO_HOME" codex plugin add navi-explicit-reload-calibration@navi-explicit-reload-calibration --json > "$CASE_EVIDENCE/plugin-add-a.json"
```

- [ ] **Step 4: Write the failure case contract**

```bash
node --input-type=module - "$CASE_EVIDENCE/case.json" "$ISO_HOME" "$SESSION_ROOT" "$SOURCE" "$BARE" "$SOURCE_URL" "$A_SHA" "$INVALID_B_SHA" "$CASE_EVIDENCE" <<'NODE'
import fs from "node:fs";
const [output, codexHome, sessionRoot, sourceDir, bareDir, sourceUrl, aRevision, invalidBRevision, evidenceDir] = process.argv.slice(2);
const contract = {
  caseType: "failure",
  codexHome,
  sessionRoot,
  sourceDir,
  bareDir,
  sourceUrl,
  marketplaceName: "navi-explicit-reload-calibration",
  pluginName: "navi-explicit-reload-calibration",
  skillName: "navi-explicit-reload-calibration",
  a: {
    version: "0.0.0-calibration.1",
    revision: aRevision,
    requiredMarkers: ["NAVI_EXPLICIT_RELOAD_A_START", "NAVI_EXPLICIT_RELOAD_A_RETAINED", "NAVI_EXPLICIT_RELOAD_A_STALE", "NAVI_EXPLICIT_RELOAD_A_PRESERVED"],
    forbiddenMarkers: ["NAVI_EXPLICIT_RELOAD_B_ACTIVE", "NAVI_EXPLICIT_RELOAD_B_PERSISTED"],
  },
  invalidBRevision,
  eventsFile: `${evidenceDir}/events.jsonl`,
  stderrFile: `${evidenceDir}/app-server-stderr.txt`,
  resultFile: `${evidenceDir}/result.json`,
};
fs.writeFileSync(output, `${JSON.stringify(contract, null, 2)}\n`, { mode: 0o600 });
NODE
```

- [ ] **Step 5: Execute the failure case once**

```bash
node "$CAL_ROOT/harness/explicit-reload-case.mjs" "$CASE_EVIDENCE/case.json"
cp "$CASE_EVIDENCE/result.json" "$CAL_ROOT/evidence/failure-result.json"
chmod 600 "$CAL_ROOT/evidence/failure-result.json"
node --input-type=module - "$CAL_ROOT/evidence/failure-result.json" <<'NODE'
import fs from "node:fs";
const result = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (result.turns.length !== 2) throw new Error("failure turn count mismatch");
if (new Set(result.turns.map((turn) => turn.turnId)).size !== 2) throw new Error("failure turn IDs are not distinct");
if (!result.turns[0].explicitSkill || result.turns[1].explicitSkill) throw new Error("failure explicit/natural boundary mismatch");
if (result.turns[0].marker !== "NAVI_EXPLICIT_RELOAD_A_START") throw new Error("failure A marker mismatch");
if (result.aStorage.revision !== result.preservedStorage.revision) throw new Error("invalid update changed active revision");
NODE
```

- [ ] **Step 6: Clean the failure case**

```bash
cleanup_failure
trap - EXIT HUP INT TERM
test ! -e "$ISO_HOME/auth.json"
test ! -d "$SOURCE"
test ! -d "$HTTP_ROOT"
test ! -d "$ISO_HOME"
test ! -d "$SESSION_ROOT"
```

Do not repair B, retry, or run a third case.

### Task 4: Protected-State Audit, Classification, And Validation

**Owner:** Calibration Operator, then one read-only Validation Task

**Files:**
- Create temporarily: `<calibration-root>/evidence/final-result.json`
- Create temporarily: `<calibration-root>/evidence/validation-package.md`
- Repository files modified by this task: none

**Interfaces:**
- Consumes: positive and failure reduced evidence.
- Produces: one structured calibration result and one independent read-only
  validation result.

- [ ] **Step 1: Re-prove protected real state**

```bash
mkdir -m 700 "$CAL_ROOT/evidence/protected-after"
codex plugin marketplace list --json > "$CAL_ROOT/evidence/protected-after/marketplaces.json"
codex plugin list --json > "$CAL_ROOT/evidence/protected-after/plugins.json"
cmp -s "$CAL_ROOT/evidence/protected-before/marketplaces.json" "$CAL_ROOT/evidence/protected-after/marketplaces.json"
cmp -s "$CAL_ROOT/evidence/protected-before/plugins.json" "$CAL_ROOT/evidence/protected-after/plugins.json"
. "$CAL_ROOT/evidence/protected-private.env"
test "$(shasum -a 256 /Users/james/.codex/config.toml | awk '{print $1}')" = "$CONFIG_BEFORE"
test "$(shasum -a 256 /Users/james/.codex/auth.json | awk '{print $1}')" = "$AUTH_BEFORE"
test "$(git -C "$NAVI_REPO" rev-parse HEAD)" = "$(cat "$CAL_ROOT/evidence/navi-head.txt")"
git -C "$NAVI_REPO" diff --check
git -C "$NAVI_REPO" status --short --branch
```

Expected: real Codex state and repository tracked state are unchanged.

- [ ] **Step 2: Prove process, credential, and case cleanup**

```bash
for CASE_NAME in positive failure; do
  test ! -e "$CAL_ROOT/$CASE_NAME/isolated-codex-home/auth.json"
  test ! -d "$CAL_ROOT/$CASE_NAME/source"
  test ! -d "$CAL_ROOT/$CASE_NAME/http"
  test ! -d "$CAL_ROOT/$CASE_NAME/isolated-codex-home"
  test ! -d "$CAL_ROOT/$CASE_NAME/session-root"
  PID_FILE="$CAL_ROOT/$CASE_NAME/evidence/http-pid.txt"
  if test -e "$PID_FILE"; then ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; fi
done
```

The case harness waits for its App Server child to exit before returning. Do
not scan or terminate unrelated machine processes.

- [ ] **Step 3: Classify completed behavioral evidence**

Run only when both case result files exist and protected-state/cleanup checks
pass:

```bash
node --input-type=module - "$CAL_ROOT/evidence/positive-result.json" "$CAL_ROOT/evidence/failure-result.json" "$CAL_ROOT/evidence/final-result.json" <<'NODE'
import fs from "node:fs";
const [positiveFile, failureFile, output] = process.argv.slice(2);
const positive = JSON.parse(fs.readFileSync(positiveFile, "utf8"));
const failure = JSON.parse(fs.readFileSync(failureFile, "utf8"));

if (positive.turns.length !== 3 || failure.turns.length !== 2) throw new Error("turn budget mismatch");
if (positive.threadId === failure.threadId) throw new Error("cases reused one thread");
if (positive.turns[0].marker !== "NAVI_EXPLICIT_RELOAD_A_START") throw new Error("positive A marker mismatch");
if (failure.turns[0].marker !== "NAVI_EXPLICIT_RELOAD_A_START") throw new Error("failure A marker mismatch");
if (!positive.turns[0].explicitSkill || !positive.turns[1].explicitSkill || positive.turns[2].explicitSkill) throw new Error("positive input boundary mismatch");
if (!failure.turns[0].explicitSkill || failure.turns[1].explicitSkill) throw new Error("failure input boundary mismatch");

const explicitB = positive.turns[1].marker === "NAVI_EXPLICIT_RELOAD_B_ACTIVE";
const naturalB = positive.turns[2].marker === "NAVI_EXPLICIT_RELOAD_B_PERSISTED";
const preservedA = failure.turns[1].marker === "NAVI_EXPLICIT_RELOAD_A_PRESERVED";
if (!["NAVI_EXPLICIT_RELOAD_B_ACTIVE", "NAVI_EXPLICIT_RELOAD_A_RETAINED"].includes(positive.turns[1].marker)) {
  throw new Error("explicit B marker is outside the designed evidence domain");
}
if (!["NAVI_EXPLICIT_RELOAD_B_PERSISTED", "NAVI_EXPLICIT_RELOAD_A_STALE"].includes(positive.turns[2].marker)) {
  throw new Error("natural post-B marker is outside the designed evidence domain");
}

let verdict;
if (!preservedA) verdict = "UPDATE-UNSAFE";
else if (!explicitB) verdict = "SUCCESSOR-REQUIRED";
else if (!naturalB) verdict = "PER-TURN-INJECTION";
else verdict = "FULL-SAME-THREAD";

const result = {
  calibration: "same-thread-explicit-skill-reload",
  verdict,
  explicitB: explicitB ? "pass" : "fail",
  naturalBPersistence: naturalB ? "pass" : "fail",
  failedUpdatePreservation: preservedA ? "pass" : "fail",
  positiveMarkers: positive.turns.map((turn) => turn.marker),
  failureMarkers: failure.turns.map((turn) => turn.marker),
  skillsChangedObserved: positive.skillsChanged > 0 || failure.skillsChanged > 0,
  realCodexStateUnchanged: true,
  repositoryUnchanged: true,
  authSourceUnchanged: true,
  credentialCopiesRemoved: true,
  processCleanup: "pass",
  model: "gpt-5.6-sol",
  reasoningEffort: "low",
  modelTurns: 5,
  retryAuthorized: false,
};
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
NODE
```

Safety has priority: `UPDATE-UNSAFE` outranks a successful explicit or natural
B result. `SUCCESSOR-REQUIRED` outranks `PER-TURN-INJECTION` because per-turn
injection is meaningful only after explicit B succeeds.

If schema, fixture, identity, containment, API, authorization, process,
turn-count, protected-state, cleanup, or evidence validity fails, generate a
terminal `HARNESS-INVALID` result after cleanup:

```bash
test -n "${FAILED_BOUNDARY:?exact failed boundary required}"
case "${COMPLETED_MODEL_TURNS:?completed turn count required}" in 0|1|2|3|4|5) ;; *) exit 1 ;; esac
node --input-type=module - "$CAL_ROOT/evidence/final-result.json" "$FAILED_BOUNDARY" "$COMPLETED_MODEL_TURNS" <<'NODE'
import fs from "node:fs";
const [output, failedBoundary, modelTurns] = process.argv.slice(2);
fs.writeFileSync(output, `${JSON.stringify({
  calibration: "same-thread-explicit-skill-reload",
  verdict: "HARNESS-INVALID",
  failureBoundary: failedBoundary,
  acceptanceBlocked: true,
  retryAuthorized: false,
  realCodexStateUnchanged: true,
  repositoryUnchanged: true,
  authSourceUnchanged: true,
  credentialCopiesRemoved: true,
  processCleanup: "pass",
  model: "gpt-5.6-sol",
  reasoningEffort: "low",
  modelTurns: Number(modelTurns),
}, null, 2)}\n`, { mode: 0o600 });
NODE
```

Do not convert an unknown marker, missing result, or cleanup gap into a product
verdict.

- [ ] **Step 4: Build the reduced validation package**

```bash
node --input-type=module - "$CAL_ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const evidence = path.join(root, "evidence");
const readJson = (name) => {
  const file = path.join(evidence, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const final = readJson("final-result.json");
const positive = readJson("positive-result.json");
const failure = readJson("failure-result.json");
const preflight = readJson("preflight.json");
const head = fs.readFileSync(path.join(evidence, "navi-head.txt"), "utf8").trim();
const authorization = fs.readFileSync(path.join(evidence, "grouped-authorization-event-id.txt"), "utf8").trim();

const positiveTurns = positive?.turns?.map((turn) => ({
  turnId: turn.turnId,
  marker: turn.marker,
  itemTypes: turn.itemTypes,
  explicitSkill: turn.explicitSkill,
  explicitSkillPath: turn.explicitSkillPath,
})) ?? [];
const failureTurns = failure?.turns?.map((turn) => ({
  turnId: turn.turnId,
  marker: turn.marker,
  itemTypes: turn.itemTypes,
  explicitSkill: turn.explicitSkill,
  explicitSkillPath: turn.explicitSkillPath,
})) ?? [];

const packageData = {
  repositorySnapshot: head,
  design: "docs/superpowers/specs/2026-07-20-navi-same-thread-explicit-skill-reload-calibration-design.md",
  plan: "docs/superpowers/plans/2026-07-20-navi-same-thread-explicit-skill-reload-calibration.md",
  groupedAuthorizationEvent: authorization,
  host: preflight,
  verdict: final.verdict,
  failureBoundary: final.failureBoundary ?? null,
  model: final.model,
  reasoningEffort: final.reasoningEffort,
  modelTurns: final.modelTurns,
  positiveThreadId: positive?.threadId ?? null,
  failureThreadId: failure?.threadId ?? null,
  positiveTurns,
  failureTurns,
  positiveStorage: positive ? { a: positive.aStorage, b: positive.bStorage } : null,
  failureStorage: failure ? { a: failure.aStorage, preserved: failure.preservedStorage } : null,
  positiveDiscovery: positive ? { a: positive.discoveryA, b: positive.discoveryB } : null,
  failureDiscovery: failure ? { a: failure.discoveryA, preserved: failure.discoveryPreserved } : null,
  skillsChangedObserved: final.skillsChangedObserved ?? null,
  realCodexStateUnchanged: final.realCodexStateUnchanged,
  repositoryUnchanged: final.repositoryUnchanged,
  authSourceUnchanged: final.authSourceUnchanged,
  credentialCopiesRemoved: final.credentialCopiesRemoved,
  processCleanup: final.processCleanup,
  retryAuthorized: false,
};

fs.writeFileSync(path.join(evidence, "validation-package.json"), `${JSON.stringify(packageData, null, 2)}\n`, { mode: 0o600 });
fs.writeFileSync(path.join(evidence, "validation-package.md"), `# Navi Same-Thread Explicit Skill Reload Validation Package

- repository snapshot: ${head}
- grouped authorization: ${authorization}
- verdict: ${final.verdict}
- failure boundary: ${final.failureBoundary ?? "none"}
- model route: ${final.model} + ${final.reasoningEffort}
- model turns: ${final.modelTurns}
- positive thread: ${positive?.threadId ?? "not-completed"}
- failure thread: ${failure?.threadId ?? "not-completed"}
- positive markers: ${positiveTurns.map((turn) => turn.marker).join(", ") || "not-completed"}
- failure markers: ${failureTurns.map((turn) => turn.marker).join(", ") || "not-completed"}
- skills/changed observed: ${final.skillsChangedObserved ?? "not-established"}
- real Codex state unchanged: ${final.realCodexStateUnchanged}
- repository unchanged: ${final.repositoryUnchanged}
- auth source unchanged: ${final.authSourceUnchanged}
- credential copies removed: ${final.credentialCopiesRemoved}
- process cleanup: ${final.processCleanup}

Structured bounded evidence: ${path.join(evidence, "validation-package.json")}
`, { mode: 0o600 });
NODE
rm "$CAL_ROOT/evidence/protected-private.env"
test ! -e "$CAL_ROOT/evidence/protected-private.env"
```

The reduced package contains no auth content or digest, raw real config, model
reasoning, unrelated event text, or fixture bytes.

- [ ] **Step 5: Send one direct calibration result**

```text
NAVI_CALIBRATION_RESULT
version: 1
calibration: same-thread-explicit-skill-reload
authorization_id: <exact grouped authorization event>
repository_snapshot: <exact HEAD>
explicit_b: pass|fail|not-tested
natural_b_persistence: pass|fail|not-tested
failed_update_preservation: pass|fail|not-tested
skills_changed_observed: yes|no|not-established
real_codex_state_unchanged: yes
repository_unchanged: yes
auth_source_unchanged: yes
credential_copies_removed: yes
process_cleanup: pass
model: gpt-5.6-sol
reasoning_effort: low
model_turns: <0..5>
verdict: FULL-SAME-THREAD|PER-TURN-INJECTION|SUCCESSOR-REQUIRED|UPDATE-UNSAFE|HARNESS-INVALID
failure_boundary: <none or exact earliest boundary>
retry_authorized: no
evidence: <absolute private validation-package path>
recommendation: <design-owned routing for the exact verdict>
```

Do not ask the user to relay the event and do not end with a generic
`continue` request.

- [ ] **Step 6: Dispatch one read-only Validation Task**

The Main Thread creates one fresh Validation Task at the exact repository
snapshot. It reads the accepted design, this plan, the direct result, and the
bounded non-secret package. It verifies:

```text
authorization identity
harness bytes against the plan
case isolation
one persistent App Server per case
one thread per case and distinct turn IDs
storage before discovery before turns
explicit Skill inputs use verified cache paths
natural turns contain no Skill input
B activation and persistence challenges have distinct responses
invalid B reports failure and active A survives
reported model-turn count
absence of unexpected tools, server requests, successor tasks, and target access
protected-state equality and cleanup
verdict priority and earliest failure boundary
```

Validation does not rerun the calibration, copy credentials, start services,
perform model turns, install dependencies, or mutate files.

- [ ] **Step 7: Stop at the Main Thread product decision**

An accepted result may justify a separate documentation or product-design
decision. It does not authorize automatic update code, Update Host or panel
implementation, Stock App claims, release-channel creation, release, or
publication.

## Final Bounded Verification

Before execution dispatch, run:

```bash
BASELINE='b740d458a39ac26f6460ebbcc93b9caf461e6b1c'
git diff --check "$BASELINE"..HEAD
printf '%s\n' \
  docs/navi/design-history.md \
  docs/superpowers/plans/2026-07-20-navi-same-thread-explicit-skill-reload-calibration.md \
  docs/superpowers/specs/2026-07-20-navi-same-thread-explicit-skill-reload-calibration-design.md \
  > /private/tmp/navi-explicit-reload-expected-paths.txt
git diff --name-only "$BASELINE"..HEAD | sort > /private/tmp/navi-explicit-reload-actual-paths.txt
diff -u /private/tmp/navi-explicit-reload-expected-paths.txt /private/tmp/navi-explicit-reload-actual-paths.txt
rg -n '[T]BD|[T]ODO|implement[[:space:]]+later|fill[[:space:]]+in[[:space:]]+details' docs/superpowers/plans/2026-07-20-navi-same-thread-explicit-skill-reload-calibration.md
```

Expected: the complete approved documentation delta contains exactly the
design, plan, and active-authority index; diff check passes; the placeholder
scan is empty.

Before emitting the calibration result, confirm:

```text
[ ] grouped authorization exists
[ ] two cases use different homes, repositories, services, and threads
[ ] both HTTP services bind only to 127.0.0.1
[ ] positive case keeps one App Server for three turns
[ ] failure case keeps one App Server for two turns
[ ] storage and forced discovery move positive A to B
[ ] explicit B uses the verified installed-cache B path
[ ] natural post-B contains text only
[ ] invalid B is structurally invalid and active A survives
[ ] failure natural turn contains text only
[ ] exactly five completed turns exist
[ ] no retry, fork, successor, target access, or unexpected tool exists
[ ] real Codex state and repository tracked state are unchanged
[ ] auth copies, homes, fixtures, App Servers, and HTTP services are gone
[ ] reduced evidence contains no auth or raw real-config material
[ ] verdict matches the priority order
```

## Plan Satisfiability Self-Review

Before committing this plan, the Main Thread must:

1. map every design requirement to a named task and step;
2. run the placeholder scan and resolve every real omission;
3. extract and syntax-check all prescribed JavaScript bodies;
4. compare prescribed App Server methods and fields with the current generated
   schema or preserve Task 1 Step 3 as the explicit host-version gate;
5. compare every fixture challenge and marker after Markdown whitespace
   normalization;
6. count the prescribed positive and failure turns;
7. verify explicit and natural input arrays from the actual harness calls;
8. verify every Git refspec is an argv value rather than shell expansion;
9. trace `finally` and shell traps from every post-authorization failure; and
10. correct all mechanical plan-artifact defects together before dispatch.
