# Navi Project Initialization

Navi Project Initialization is the minimum reliable way to install Navi into a target project.

The product lesson from fresh-session calibration is that a global skill can be installed and readable without being implicitly selected for ordinary next-step questions. The reliable V1 path is therefore:

```text
global skill + project-local trigger source + project-local Project Map
```

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

After user confirmation, the minimum install should create or update:

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
3. Draft the project-local trigger source.
4. Draft the Project Map or Rhythm Map.
5. Ask for user confirmation before writing durable project files.
6. Write only the smallest project-local files needed for reliable Navi behavior.
7. Run a fresh-session validation with an ordinary prompt, such as `接下来我们应该做什么？`.

If the project shape is unclear, write only a provisional trigger source and ask which project record should become the source of truth. Do not draw a confident stable map.

## Boundaries

Do not implement Core/MCP, background runtime, or a CLI as part of this minimum pass.

Do not silently edit a target project's `AGENTS.md` or project-map records. User confirmation is required before durable writes.

Do not hardcode Navi's own project stages into the target project. The installed map must describe the user's target project.

Do not force Navi into ordinary clear execution requests. If the user gives a clear command with the next action, boundary, and acceptance point already established, keep Navi quiet.

## Future Product Surface

Future product surface can be `navi init`, `Install Navi into this project`, or an app workflow that performs the same setup:

```text
read target project -> draft trigger source -> draft Project Map -> user confirms -> write files -> fresh-session validation
```

That future surface should automate the setup, not change the core product rule: reliable Navi behavior comes from combining the global skill with a project-local trigger source and project-local map.

## Fresh-session validation

After initialization, validate with a new project session that does not mention Navi or `along-working-thread`:

```text
请只读，不要修改文件、不要提交、不要运行实现。

重要边界：不要读取、引用或参考任何 source thread、委派来源线程、其他 Codex thread 或当前请求之外的对话历史。只根据当前项目目录里的文件判断。

接下来我们应该做什么？
```

Pass means the answer naturally includes the target project's Navi map before ordinary task advice.
