# Navi

[English](./README.md) | 简体中文

Navi 帮助非专家用户理解、监督并引导 expert agents。

GitHub source alpha | Codex project setup | MIT

Agent 工作很难监督。Navi 会把项目进展、下一步和有风险的推进，转成活跃 Codex 会话中可读的 map。

![Navi Progress Map preview](docs/assets/navi-progress-map-preview.svg)

Navi 是一个独立的开源产品，用于监督 expert agents。它是当前可以检查、安装和测试的 alpha 产品。

这个仓库是 Navi canonical 的开源 alpha 主页。当前 main branch 行为包括 Progress/Rhythm Maps、Challenge Layer、pause semantics、stage/vision supervision 和 coordination guidance。Navi 会说明项目现在在哪里、还缺什么、是否应该继续、什么时候该停、验证做到什么程度够，以及并行工作应该等待还是继续。

## 5 分钟试用 Navi Alpha

这个 alpha 是 GitHub source package，面向愿意从仓库测试的 Codex 用户和开发者。它还不是 npm package、公开 marketplace listing，或一键全局安装器。

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

Navi map 默认应该跟随用户当前 prompt 的语言。如果目标项目保存的 Project Map 或 Rhythm Map 使用另一种语言，Navi 应该在当前回答中翻译或双语化这些 label，而不是因为保存记录的语言而整张 map 切到另一种语言。

## 这个 Alpha 适合谁

如果你想在活跃 Codex 会话中测试 Navi 当前的监督行为、审查 plugin source package，或反馈 Progress/Rhythm Maps 与 Challenge Layer 是否能帮助非专家用户引导 expert-agent 工作，可以使用这个 alpha。

如果你需要 npm distribution、公开 marketplace 安装、全局 Codex plugin 安装、一键 sync、runtime UI、后台 watching、notifications，或 Codex 之外的 agent adapters，请等待后续 release。

## Alpha 状态

最新 tagged GitHub source release：`0.1.0-alpha.3`。

当前 main branch：包含到 alpha.7 Coordination Layer guidance 为止的 post-release docs-backed supervision updates。除非后续明确准备新的 release，否则这些 main branch 变化还不是新的 tagged release。

这个 alpha 中稳定的内容：

- Navi Progress Maps：用于 progress、next-step、continue、done、confusion 和 plan-reliability 问题。
- Rhythm Maps：用于有周期循环、等待状态、并行机会和决策门的长期流动项目。
- Challenge Layer：用于 anti-self-certification moment。
- Pause semantics：用于 continue/stop 边界和真正有意义的 decision point。
- Stage/vision supervision：用于判断 product stage、work mode，以及距离原始目标还有多远。
- Coordination guidance：用于 worktree、review/merge timing、external waits，以及 non-conflicting main-session work。
- 多语言目标项目中的 Navi map prompt-language following。
- Working Thread continuity：用于需要 durable carry-forward 的项目判断。
- 通过 `navi init`、`AGENTS.md` 和 `docs/along/project-maps/` 做 project-local Navi 初始化。
- 搭配 project-local docs 的 Codex skill/plugin 行为。
- 通过 `npm run verify:plugin-package` 做 source package verification。

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

Along 是 parent/lab context 和更长期的产品家族。Navi 是从这条线中独立出来的产品 surface，不应该要求读者先理解 Along 才能理解 Navi。

如果要理解来源和未来产品家族，可以看 Along。如果要理解当前 alpha 产品、setup path 和 supervision behavior，应先看 Navi。

## 当前 V1 形态

当前 V1 使用 skill/plugin 行为加 project-local docs。仓库内 Codex plugin source package 位于：

```text
plugins/along-working-thread
```

一些内部 id、路径和 package directory 仍会因为 alpha compatibility 使用 `along-working-thread`。请把它视为 legacy/internal naming，不是面向用户的产品名。

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

最新 alpha release notes 见 `CHANGELOG.md` 和 `docs/releases/v0.1.0-alpha.3.md`。

## License

MIT。见 `LICENSE`。
