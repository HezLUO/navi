# Navi Project Trigger Template

Paste this into the target project's `AGENTS.md` when Navi should be reliable in fresh sessions without depending only on global skill auto-routing.

````markdown
## Navi Progress Map Rules

When the user asks about project progress, next steps, whether to continue, or says they do not understand the current state, first give a compact Navi map before ordinary task advice. Trigger examples include:

- `接下来我们应该做什么？`
- `现在做到哪了？我看不懂。`
- `继续吧。`
- `这个方案可以吗？我不懂技术。`
- `what's next`
- `where are we`
- `continue`

Match the Navi map response language to the user's current prompt by default. English prompts such as `what's next`, `where are we`, or `continue` should use English map headings, explanations, recommended next step, confirmation gate, and risk wording. Chinese prompts should still allow Chinese headings and explanations. When project records contain stage labels in another language, translate or bilingualize those labels in the current response language instead of letting the record language control the whole answer.

Use the target project's own records to choose the map shape:

- If the work has a stable one-way delivery path, use a compact horizontal progress strip.
- If the work is a long-running flow with repeated cycles, parallel tracks, waiting states, or external feedback, use a Rhythm Map.

For flowing projects, prefer this English structure for English prompts and replace the labels with project-specific terms:

```text
Project rhythm
[Cycle/direction] + [Object/opportunity screening] + [Material/execution prep] + [Submit/follow up/feedback]
                              ▲
                         Current focus

Current track
[Read status] -> [Judge priority] -> [Execute smallest loop] -> [Record/wait for feedback]
                         ▲
                    Current action
```

For Chinese prompts, this Chinese structure is also valid:

```text
项目节奏
[周期/方向] + [对象/机会筛选] + [材料/执行准备] + [提交/跟进/反馈]
                              ▲
                           当前焦点

当前主线
[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]
                         ▲
                      当前动作
```

After the map, explain the marked position in plain language: what is happening now, why it matters, what should happen next, what the user needs to confirm, and the main risk if blindly continuing would be costly.

Use project-local records such as `PROJECT_STATE.md`, `TODO` files, trackers, workflow records, and the latest project-local handoff to place the current marker and choose the next small loop. Do not treat project-local handoff files as forbidden thread history.

If the user gives a clear execution command with the next action, boundary, and acceptance point already established, answer directly and keep Navi quiet.

Read-only checks of task files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks. For these tasks, report the requested facts directly; do not output a Progress Map or Rhythm Map unless the user also asks what those facts mean for overall progress, next steps, confusion, or plan reliability.
````

Keep this trigger source short. It should make Navi discoverable in the target project; detailed product behavior still belongs in the Along Working Thread skill and reference docs.
