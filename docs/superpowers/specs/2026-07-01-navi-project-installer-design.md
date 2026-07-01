# Navi Project Installer Design

Date: 2026-07-01
Status: Approved design, pending implementation plan

## Summary

Navi should add a narrow project-local installer as the first automatic setup surface:

```text
navi init --target <path>
```

The installer initializes a target project so future Codex sessions can reliably find Navi's project-local trigger source and Project/Rhythm Map. It does not install the global Codex plugin or skill. It does not add an npm distribution path. It does not add runtime watching, background behavior, or a UI.

The first version should be conservative: default to dry-run preview, require `--write` for durable file changes, and only create or update the minimum target-project files needed for reliable Navi behavior.

## Confirmed Decisions

- Installer V1 is project-local initialization only.
- Installer V1 does not manage global Codex plugin or skill installation.
- `navi init` defaults to dry-run.
- Durable writes require an explicit `--write` flag.
- The installer should create a safe preview that explains which files would be created or modified.
- Existing target-project files must not be overwritten silently.

## Why `navi init` Exists

If Navi were only a Codex skill, `navi init` would not be strictly required. A user could install the skill globally and invoke it manually.

Navi is intended to be an open-source alpha product, not just a callable skill. For the alpha to be understandable and verifiable by external users, Navi needs a repeatable way to connect itself to a target project.

`navi init` exists to provide that project connection:

- `AGENTS.md` gives fresh agent sessions a project-local trigger source for when Navi should appear and when it should stay quiet.
- `docs/along/project-maps/` gives both the user and the agent a persistent place to read the target project's current map.
- The validation prompt gives new users a concrete way to check whether Navi is working in their own project.

In product terms:

```text
plugin / skill     = behavior capability
navi init          = project connection layer
Project/Rhythm Map = persistent product surface
Challenge Layer    = judgment and supervision layer
```

Without `navi init`, the alpha is harder to verify because a new user has to infer how a global skill should attach to their repo. With `navi init`, the alpha has a concrete 2-3 minute test path:

1. run `navi init --target .` and inspect the preview;
2. run `navi init --target . --write` if the preview is acceptable;
3. open a fresh project session and ask `接下来我们应该做什么？`.

## Command Shape

Primary command:

```text
navi init [--target <path>] [--write] [--force]
```

Default behavior:

- `--target` defaults to the current working directory.
- Without `--write`, the command prints a dry-run plan and exits without changing files.
- With `--write`, the command applies the plan.
- `--force` is only for deliberate replacement of an existing Navi-managed block or generated file. The implementation plan should decide whether `--force` ships in V1 or is deferred; the default must remain non-destructive.

The existing `along start` compatibility command may remain if needed, but the public product command should be `navi init`.

## Installer Output

The installer should plan the smallest useful target-project changes:

1. `AGENTS.md`
   - Add or update a Navi trigger block based on `docs/along/project-maps/navi-project-trigger-template.md`.
   - Preserve existing project instructions.
   - Use clear markers if needed so future updates can be reviewed safely.

2. `docs/along/project-maps/`
   - Create the directory if it does not exist.
   - Create an initial project map record only when it can be safely described as provisional.
   - Avoid pretending to know the target project's true stage sequence.

3. Validation prompt
   - Print the fresh-session validation prompt after preview and after write:

```text
请只读，不要修改文件、不要提交、不要运行实现。

重要边界：不要读取、引用或参考任何 source thread、委派来源线程、其他 Codex thread 或当前请求之外的对话历史。只根据当前项目目录里的文件判断。

接下来我们应该做什么？
```

The installer may also create a small validation file if useful, but printing the prompt is sufficient for V1.

## Dry-Run Preview

Dry-run output should be readable by a non-expert user. It should answer:

- what target directory is being initialized;
- which files would be created;
- which files would be modified;
- whether any existing Navi block or project map was found;
- what command applies the changes;
- what prompt validates the result in a fresh session.

The preview should not dump a long wall of generated content by default. It may include short snippets or support a later `--verbose` flag.

## Write Safety

The installer must follow these controls:

- never write outside the resolved target directory;
- never silently overwrite existing project maps;
- preserve existing `AGENTS.md` content;
- treat existing Navi markers as an update candidate, not an overwrite target;
- report conflicts instead of guessing;
- keep durable writes behind `--write`;
- keep generated maps provisional unless the target project already contains reliable source records.

The target project should remain easy to review through normal git diffs after `--write`.

## Project Shape Handling

Installer V1 should not attempt full intelligent project understanding. It may inspect obvious files such as `README.md`, `PROJECT_STATE.md`, `TODO.md`, or existing `docs/along/project-maps/` records, but it should not fabricate a confident map.

When evidence is insufficient, the generated map should be explicitly provisional:

```text
Map status: provisional

This map only establishes where Navi should look first. It is not a confirmed project stage sequence yet.
```

The first reliable validation is fresh-session behavior, not the installer's confidence.

## Documentation Changes

Implementation should update public docs so readers no longer see "no installer" as the current alpha state once the command exists.

At minimum:

- README first-screen alpha instructions should mention `navi init` as the project-local setup path.
- Non-goals should say Navi does not yet include npm publication, marketplace publication, global plugin installation, runtime UI, background watchers, or cross-agent adapters.
- `docs/along/project-maps/navi-project-init.md` should change from "future product surface can be `navi init`" to "`navi init` is the narrow project-local setup surface."
- Roadmap/debt docs should move "installer" from missing alpha capability to shipped narrow capability, while keeping distribution improvements as future work.

## Testing And Verification

The implementation should include focused tests around installer planning and write safety:

- dry-run produces no filesystem changes;
- `--write` creates the expected files in a temporary target project;
- existing `AGENTS.md` content is preserved;
- existing Navi block detection is idempotent;
- existing project map files are not overwritten silently;
- target path resolution rejects unsafe writes outside the target;
- package metadata exposes the intended `navi` command without breaking current compatibility tests.

Verification before release should include:

- `npm run typecheck`;
- focused installer tests;
- `npm run verify:plugin-package`;
- full test suite if the local environment permits it;
- a manual temp-project dry-run and write check.

## Risks And Controls

Risk: users confuse project-local initialization with plugin installation.

Control: docs and command output must say that `navi init` only prepares the target repo. Users still need Navi available in their Codex environment through the current alpha source/plugin path.

Risk: the installer overpromises by generating a confident map for an unknown project.

Control: default generated maps are provisional and emphasize source records.

Risk: `navi init` damages an existing `AGENTS.md`.

Control: dry-run default, `--write` gate, marker-based updates, append-only behavior for first install, and tests for preservation.

Risk: adding a CLI broadens the alpha beyond the README's current scope.

Control: keep the CLI narrow. The alpha still does not have npm publication, marketplace publication, global installer behavior, runtime UI, background watching, or adapters.

## Non-Goals

This design does not include:

- global Codex plugin or skill installation;
- npm publication;
- public marketplace installation;
- one-click desktop or browser installer;
- runtime UI;
- background watcher behavior;
- notification behavior;
- Core/MCP expansion;
- cross-agent adapters;
- automatic project-status inference beyond a provisional starter map;
- automatic commits in the target project;
- automatic execution of fresh-session validation.

## Implementation Planning Notes

The implementation plan should keep the work in small phases:

1. add pure installer planning functions and tests;
2. add CLI command parsing for `navi init`;
3. add write application behind `--write`;
4. update package metadata and compatibility tests;
5. update README and project initialization docs;
6. run verification and record the result.

Do not combine this with full internal renames from `along` to `navi`. Compatibility names can remain during this installer pass as long as public docs explain the boundary.
