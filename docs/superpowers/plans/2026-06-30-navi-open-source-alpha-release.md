# Navi Open-Source Alpha Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prepare Navi for a GitHub open-source alpha release without expanding runtime, npm publishing, or marketplace scope.

**Architecture:** This is a documentation and metadata release-readiness pass. The repo remains a docs-backed Codex plugin source package, with `.agents/skills/along-working-thread` as canonical skill source and `plugins/along-working-thread` as the distribution copy. The pass makes the public entrypoint clear, adds legal/release metadata, and records the release boundary.

**Tech Stack:** Markdown, JSON package metadata, existing npm verification scripts, Vitest, TypeScript.

**Execution status:** Completed in the 2026-06-30 release-preparation session.

---

### Task 1: Public Release Metadata

**Files:**
- Create: `LICENSE`
- Modify: `package.json`
- Create: `CHANGELOG.md`

- [x] **Step 1: Add MIT license text**

Create `LICENSE` with MIT text and copyright holder `Navi Contributors`.

- [x] **Step 2: Update root package metadata**

In `package.json`, keep `"private": true` to prevent accidental npm publishing, and add public source metadata:

```json
{
  "description": "Navi helps non-expert users understand, supervise, and steer expert agents with Progress Maps and Challenge Layer behavior.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/HezLUO/along.git"
  },
  "bugs": {
    "url": "https://github.com/HezLUO/along/issues"
  },
  "homepage": "https://github.com/HezLUO/along#readme"
}
```

- [x] **Step 3: Add alpha changelog**

Create `CHANGELOG.md` with an `0.1.0-alpha` entry describing Navi Progress Maps, Rhythm Maps, Challenge Layer, quietness, package verification, and non-goals.

### Task 2: Public README

**Files:**
- Modify: `README.md`

- [x] **Step 1: Replace old Along-first entrypoint**

Rewrite the root README so the first screen introduces Navi as the alpha product surface, not the older Shared Desk demo.

- [x] **Step 2: Add quick start and install-from-source guidance**

Document the repo-contained Codex plugin source path:

```text
plugins/along-working-thread
```

State that there is no npm package, marketplace listing, automatic install script, or background runtime in this alpha.

- [x] **Step 3: Preserve boundaries**

Keep the public README honest: Navi V1 is stable docs-backed skill behavior, not proof of every future UI/runtime surface or long-term product feeling.

### Task 3: Plugin Alpha Notes

**Files:**
- Modify: `plugins/along-working-thread/README.md`
- Modify: `plugins/along-working-thread/VERSION.md`

- [x] **Step 1: Mark the package as GitHub alpha source package**

Update the package README current stage and VERSION notes to say `0.1.0-alpha` is ready for GitHub source release.

- [x] **Step 2: Keep marketplace release deferred**

Keep public marketplace release explicitly deferred so alpha does not overclaim distribution readiness.

### Task 4: Working Thread Record

**Files:**
- Modify: `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`

- [x] **Step 1: Record the release-readiness decision**

Add a brief current-judgment paragraph: Navi can move into GitHub alpha release preparation, scoped to source-package documentation and metadata.

- [x] **Step 2: Preserve release boundary**

State that npm publishing, marketplace publishing, runtime/UI, adapters, and background behavior remain separate approved scopes.

### Task 5: Verification, Commit, Push

**Files:**
- No new source files beyond Tasks 1-4.

- [x] **Step 1: Run release verification**

Run:

```bash
npm run verify:plugin-package
npm test
npm run typecheck
git diff --check
```

- [x] **Step 2: Commit**

Commit the release prep changes:

```bash
git add LICENSE CHANGELOG.md README.md package.json plugins/along-working-thread/README.md plugins/along-working-thread/VERSION.md docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md docs/superpowers/plans/2026-06-30-navi-open-source-alpha-release.md
git commit -m "docs: prepare navi open-source alpha release"
```

- [x] **Step 3: Push**

Push to `origin/main`.

```bash
git push origin main
```

- [x] **Step 4: Final report**

Report the alpha readiness scope, verification results, commit SHA, and any remaining manual GitHub Release/tag step.
