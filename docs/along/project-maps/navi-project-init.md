# Navi Project Initialization

Navi Project Initialization is the minimum reliable way to connect Navi to a target project.

Navi is installed globally once. navi init initializes a target project for reliable fresh-session behavior and does not install Navi again.

Global-only Navi can provide best-effort supervision, but project-local initialization is the reliable path for project evidence, trigger behavior, and starter maps.

In product terms:

```text
global install = enables the Navi skill/plugin capability
navi init      = adds project-local guidance and a starter map for this project
```

The product lesson from fresh-session calibration is that a global skill can be installed and readable without being implicitly selected for ordinary next-step questions. The reliable V1 path is therefore:

```text
global skill + project-local trigger source + project-local Project Map
```

For alpha.4, the project-local trigger source also carries Navi supervision rules: phase supervision, verification budget, stop criteria, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment. This lets fresh sessions help the user decide whether to continue, stop, wait, approve, or move to the next phase without depending only on global skill auto-routing.

`navi init` is the narrow project-local setup surface for this pattern. It automates the preview and optional write of target-project files; it does not install the global Codex plugin or skill.

This is not a new runtime. It is a project setup pattern that makes Navi discoverable from the target project itself.

## When To Use

Use this when a user wants Navi to supervise an existing project, especially when they ask:

- what should happen next;
- where the project stands;
- whether to continue;
- whether a plan is trustworthy;
- what they need to confirm.

It is most useful for non-expert supervision, long-running work, flowing projects, or projects where fresh sessions repeatedly lose the user's current map.

## Minimum install output

When applied with `--write`, the minimum project-local setup creates or updates:

1. `AGENTS.md`
   Add a short project-local Navi trigger source. Start from `docs/along/project-maps/navi-project-trigger-template.md`.

2. `docs/along/project-maps/`
   Add a target-project Project Map or Rhythm Map record when the project has a stable enough shape.

3. Project source references
   Name the project-local records Navi should read first, such as `PROJECT_STATE.md`, TODO files, trackers, workflow records, or handoffs.

4. Validation prompt
   Save or state the fresh-session validation prompt that should be used to check whether ordinary next-step questions now produce a map.

## Initialization Flow

1. Inspect the target project records before inventing a map.
2. Classify the project shape: linear, flowing, mixed, or unclear.
3. Draft the project-local trigger source, including the alpha.4 supervision rules for phase, validation budget, stop/wait/approval gates, worktree waiting, and vision-distance judgment.
4. Draft the Project Map or Rhythm Map.
5. Show the preview and have the user choose whether to apply it with `--write`.
6. Write only the smallest project-local files needed for reliable Navi behavior.
7. Run a fresh-session validation with an ordinary prompt, such as `what's next`, `where are we`, `continue`, or `接下来我们应该做什么？`.

If the project shape is unclear, write only a provisional trigger source and ask which project record should become the source of truth. Do not draw a confident stable map.

## Suggested Map Preview

`navi init --suggest-map` performs read-only evidence discovery and prints a suggested Project Map or Rhythm Map preview.

It does not write the suggestion to disk, does not mark the map as confirmed, does not call a model, and does not read other Codex threads or source-thread history.

`--suggest-map` and `--write` may be combined. In that case, `--write` applies only the standard project-local initialization files, while the suggested map remains terminal output only.

## Boundaries

Do not use `navi init` as a global Codex plugin or skill installer. Do not implement Core/MCP, background runtime, npm publication, marketplace publication, or one-click sync as part of this project-local setup surface.

Do not silently edit a target project's `AGENTS.md` or project-map records. `navi init` previews by default; durable writes require the explicit `--write` flag.

Do not hardcode Navi's own project stages into the target project. The installed map must describe the user's target project.

Do not force Navi into ordinary clear execution requests. If the user gives a clear command with the next action, boundary, and acceptance point already established, keep Navi quiet.

Read-only checks of task files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks. They should answer directly and should not produce a Progress Map or Rhythm Map unless the user also asks what those facts mean for overall progress, next steps, confusion, or plan reliability.

## Product Surface

`navi init` performs this setup flow:

```text
read target project -> draft trigger source -> draft provisional Project Map -> preview -> user applies with --write -> fresh-session validation
```

The command should automate the setup, not change the core product rule: reliable Navi behavior comes from combining the global skill with a project-local trigger source and project-local map.

## Fresh-session validation

After initialization, validate with a new project session that does not mention Navi or `along-working-thread`. Use both English and Chinese ordinary prompts when the target project has multilingual records, because Navi maps should follow the current prompt language rather than the saved record language.

English example:

```text
Read only. Do not modify files, commit, or run implementation.

Important boundary: do not read, quote, or rely on any source thread, delegation source thread, other Codex thread, or conversation history outside the current request. Judge only from files inside the current project directory.

what's next
```

Chinese example:

```text
请只读，不要修改文件、不要提交、不要运行实现。

重要边界：不要读取、引用或参考任何 source thread、委派来源线程、其他 Codex thread 或当前请求之外的对话历史。只根据当前项目目录里的文件判断。

接下来我们应该做什么？
```

Pass means the answer naturally includes the target project's Navi map before ordinary task advice.
