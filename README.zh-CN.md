# Navi

[English](./README.md) | 简体中文

Navi 帮助非专家用户理解、监督并引导 expert agents。

GitHub source alpha | Codex project setup | MIT

Agent 工作很难监督。Navi 会把项目进展、下一步和有风险的推进，转成活跃 Codex 会话中可读的 map。

![Navi Progress Map preview](docs/assets/navi-progress-map-preview.svg)

Navi 是一个独立的开源产品，也是更大的 Along 愿景中的第一个 V1 产品表面。Along 是长期的 companion-layer 愿景；Navi 是当前可以检查、安装和测试的 alpha 产品。

这个仓库是 Navi canonical 的开源 alpha 主页。Navi 的 V1 alpha 行为集中在活跃 Codex 会话中的 **Progress/Rhythm Maps** 和 **Challenge Layer**：它会解释目标项目现在处于哪里、还缺什么、下一步是什么、用户需要确认什么，以及 expert-agent 的推进什么时候需要轻量挑战。

## 5 分钟试用 Navi Alpha

这个 alpha 是面向 Codex 用户和开发者的 GitHub source package，适合愿意从仓库测试的人。它还不是 npm package、公开 marketplace listing，或一键全局安装器。

```bash
git clone https://github.com/HezLUO/navi.git
cd navi
npm install
npm run verify:plugin-package
```

这会验证仓库内的 Navi plugin source package。

如果要在真实目标项目中试用 Navi，先预览 project-local setup：

```bash
npm run navi -- init --target /path/to/target-project
```

检查预览后，再显式应用 setup：

```bash
npm run navi -- init --target /path/to/target-project --write
```

Project-local setup 是显式的，并且默认 dry-run。`navi init` 会在目标项目中准备 `AGENTS.md`、`docs/along/project-maps/navi-project-map.md` 和 fresh-session validation prompt。它不会安装全局 Codex plugin 或 skill。

更多 setup 细节见：

- `docs/along/project-maps/navi-project-init.md`
- `docs/along/project-maps/navi-project-trigger-template.md`

最低可靠 setup 是：全局 skill/plugin 可用、`AGENTS.md` 中有一个简短的 project-local trigger source，并且目标项目有已确认的 Project Map 或 Rhythm Map。完成 setup 后，普通问题如 `接下来我们应该做什么？`、`现在做到哪了？我看不懂。`，或不清楚边界的 `继续吧。`，应该先产生 Navi map，再给普通任务建议。

## 这个 Alpha 适合谁

如果你想在活跃 Codex 会话中测试 Navi 当前的监督行为、审查 plugin source package，或反馈 Progress/Rhythm Maps 与 Challenge Layer 是否能帮助非专家用户引导 expert-agent 工作，可以使用这个 alpha。

如果你需要 npm distribution、公开 marketplace 安装、全局 Codex plugin 安装、一键 sync、runtime UI、后台 watching、notifications，或 Codex 之外的 agent adapters，请等待后续 release。

## Alpha 状态

`0.1.0-alpha.1` 是当前面向开发者和早期测试者的最新 GitHub source release。

这个 alpha 中稳定的内容：

- Navi Progress Maps：用于 progress、next-step、continue、done、confusion 和 plan-reliability 问题。
- Rhythm Maps：用于有周期循环、等待状态、并行机会和决策门的长期流动项目。
- Challenge Layer：用于 anti-self-certification moment。
- Working Thread continuity：用于需要 durable carry-forward 的项目判断。
- 通过 `navi init`、`AGENTS.md` 和 `docs/along/project-maps/` 做 project-local Navi 初始化。
- 搭配 project-local docs 的 Codex skill/plugin 行为。

当前不包含：

- npm package 发布。
- 公开 Codex marketplace release。
- 全局 Codex plugin 安装或一键 sync。
- 后台 autonomy、notifications 或 always-on presence。
- Runtime UI 或未来 local app surface。
- Hermes、Claude Code 或其他 agent adapters。
- Memory v2、relationship modes、delegation 或 write delegation。

根目录 `package.json` 有意保持 `"private": true`，避免意外发布到 npm。源码以 MIT license 提供，用于 GitHub alpha 使用。

## Navi 和 Along 的关系

Along 是更大的长期产品愿景：一个 local-first、open-source 的 existing agents companion layer。

Navi 是这个愿景中的第一个独立 V1 产品表面。它不是完整的 Along roadmap。当前 Navi alpha 关注通过 Progress/Rhythm Maps、Challenge Layer 行为和 Working Thread continuity 来帮助非专家监督 agent 工作。

内部 package id 仍保留为 `along-working-thread`，用于 alpha compatibility。请把它视为 implementation 和 migration 名称，而不是面向用户的产品名。

## 当前 V1 形态

当前 V1 使用 skill/plugin 行为加 project-local docs。仓库内 Codex plugin source package 位于：

```text
plugins/along-working-thread
```

内部 package id 仍是 `along-working-thread`，以兼容现有 skill paths、local installs 和 tests。面向用户的产品名是 Navi。

Navi V1 是 docs-backed 且 turn-bound 的。它在活跃 agent session 中工作；它不会 watch files、发送 notifications，也不会在 Codex 关闭后继续行动。

## Navi 做什么

Navi Progress Maps 用于这样的提问：

```text
接下来我们应该做什么？
现在做到哪了？我看不懂。
继续吧。
这个方案可以吗？我不懂技术。
```

对于 bounded project，Navi 应该使用紧凑的 project map：

```text
[需求] -> [设计] -> [执行] -> [验证] -> [交付]
                         ^
                      当前位置
```

对于 flowing long-running project，Navi 应该使用 Rhythm Map，而不是强行套用完成进度条：

```text
[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]
                                      ^
                                   当前焦点
```

当 map 暴露 drift、weak assumptions、premature execution 或 self-certifying momentum 时，Challenge Layer 行为会出现。它的作用是把可疑的推进转成轻量验证，而不是批评每个决定。

## 验证 Source Package

安装 dependencies：

```bash
npm install
```

验证仓库内的 Navi plugin source package：

```bash
npm run verify:plugin-package
```

运行完整本地检查：

```bash
npm test
npm run typecheck
```

如果要做本地 Codex plugin experimentation，使用这个 package source directory：

```text
plugins/along-working-thread
```

这个 alpha 包含一个 narrow project-local initializer：

```bash
npm run navi -- init --target /path/to/target-project
```

Initializer 默认 dry-run，只有加 `--write` 才会写入。它会为目标项目准备 Navi 行为；它不会安装或同步全局 Codex plugin 或 skill。

## 我们希望收到的 Alpha 反馈

最有用的 alpha 反馈来自真实或接近真实的目标项目：

- 普通 progress、next-step、confusion、continue 和 plan-reliability 问题是否触发了有用的 Navi map？
- Flowing projects 是否使用 Rhythm Maps，而不是误导性的 completion bars？
- Challenge Layer 行为是否能捕捉 weak assumptions 或 self-certifying momentum，同时不变成持续打断？
- 窄的 factual checks 和明确 execution requests 是否保持 quiet？
- `along-working-thread` compatibility name 是否让安装或审查变得困惑？

## Project-Local Setup

要让 Navi 在目标项目中可靠工作，需要：

- `AGENTS.md` 中的 project-local trigger source；
- `docs/along/project-maps/` 下已确认的 Project Map 或 Rhythm Map；
- 目标项目的 source records，例如 state files、TODO files、trackers、workflow records 和 handoffs。

可复用 setup docs：

- `docs/along/project-maps/navi-project-init.md`
- `docs/along/project-maps/navi-project-trigger-template.md`
- `docs/along/project-maps/README.md`

## Architecture Boundary

MCP、runtime、local app、background presence、companion memory 和 adapter surfaces 都是 experimental 或 later layers，除非为某个 focused validation pass 明确说明。

仓库里仍包含较早的 Along companion ideas，包括 local memory、Shared Desk、soundscape 和 `.along/` runtime concepts。请把这些当作 historical 或 future-facing context，而不是当前推荐的 Navi 安装路径。

## Release Notes

最新 alpha release notes 见 `CHANGELOG.md`。

## License

MIT。见 `LICENSE`。
