# Navi

[English](./README.md) | 简体中文

Navi 帮助非专家用户理解、监督并引导 expert agents。

GitHub source alpha | Codex project setup | MIT

Agent 工作很难监督。Navi 会把项目进展、下一步和有风险的推进，转成活跃 Codex 会话中可读的 map。

![Navi Progress Map preview](docs/assets/navi-progress-map-preview.svg)

Navi 是一个独立的开源产品，用于监督 expert agents。它是当前可以检查、安装和测试的 alpha 产品。

这个仓库是 Navi canonical 的开源 alpha 主页。当前 main branch 行为包括 Progress/Rhythm Maps、Challenge Layer、pause semantics、stage/vision supervision 和 coordination guidance。Navi 会说明项目现在在哪里、还缺什么、是否应该继续、什么时候该停、验证做到什么程度够，以及并行工作应该等待还是继续。

## 当前 main 的 Distribution feasibility

最新 tagged GitHub source release：`0.1.0-alpha.3`。当前 main 包含一个尚未发布的 Distribution feasibility candidate；它还不是已激活的公开 release entry。

受控的主设计是 Git-backed `navi-source` marketplace。仓库内 catalog 仍是 local source/calibration catalog；staging tool 会从同一份 plugin bytes 生成 immutable remote catalog 和 local-marketplace bundle。

安装后的 onboarding 从实际加载的 Navi skill 解析 package-local init entry，先给出 read-only preview，只有在明确 approval 后才执行 fingerprint-bound write。它不要求 source checkout、硬编码 Codex cache path 或裸 `navi` 命令。如果 Node 或 package entry 不可用，Navi 会拒绝直接写项目，而不会静默安装 runtime。

Public Plugin Directory 是可选渠道，不是 release 前提；Navi 目前并未在其中上架。GitHub Release local-marketplace ZIP、checksum、update、rollback 和 uninstall 承诺属于后续明确批准的 Release plan。裸 `navi`、npm publication、Bootstrap Installer、Runtime Surface、UI、MCP、后台更新和其他 agent 支持，都不是这个 candidate 的普通用户前提。本实现 lane 尚未执行真实 marketplace 安装或跨环境 calibration。

## 更新 Navi

对于已验证的 Git-backed `navi-source` 安装，请先结束当前限界 delivery
group，并在直接批准后运行：

```bash
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

当前任务可以继续使用原有 Navi 版本。验证更新成功后，新建一个 Codex
任务来使用更新后的版本。local-source marketplace 的 upgrade 不会更新
source checkout。Navi 目前未进入 Public Plugin Directory。插件更新不需要
重新运行 `navi init`，也不会重写 Project Map 或 managed trigger。完整边界见
[更新指南](docs/navi/update.md)。

## Source-alpha setup

这个 alpha 是 GitHub source package，面向愿意从仓库测试的 Codex 用户和开发者。公开 npm/marketplace/一键安装仍不在范围内；当前 main 的 marketplace candidate 已可 staging，但尚未激活或发布。

请先验证 checkout 的 source，再从仓库根目录运行这一完整顺序：

```bash
npm install
npm run verify:plugin-package
codex plugin marketplace add "$PWD"
codex plugin add navi@navi-source
npm link
navi doctor
navi setup
navi setup --write
```

如果当前 Codex 环境在 `npm link` 后仍无法解析裸命令 `navi`，请从仓库根目录运行 `npm run navi -- doctor` 开始诊断。Doctor 会报告 PATH 路径限制，并在后续 setup 或 init 指引中继续提供一个已验证的备用调用方式。该备用方式不会编辑 PATH 或 shell 配置。将 linked npm bin 目录加入 Codex 继承的 PATH 并重启 Codex 只是一项可选便利；只要该备用方式有效，就不是前提条件。

这些都是用户明确执行的 source-alpha 操作，会修改全局 Codex/plugin/npm 状态（包括 Codex configuration 或 cache，以及 npm 的全局 link state）；`navi setup` 不会替你安装 plugin 或执行这些操作。`navi doctor` 用于 troubleshooting，不是日常步骤；它会检查 source-alpha 前提条件并指出缺失时的修复方向。

### Setup transaction 安全边界

全局 setup 使用可恢复的 transaction directory 和 cooperative same-user lock。它会验证已批准的字节、发布时不替换已有 target，并保留已检测到的 third-party content 供人工处理。这是 cooperative-concurrency 安全边界，不声称能够对抗同一用户的并发原子性；不要删除 lock 或强制执行处于 conflict 的 setup。

全局 setup 一次 -> 每个项目批准 init 一次 -> 之后使用自然语言。

Journey contract：global source setup once -> adaptive project evidence judgment -> user-confirmed Desired Outcome plus Outcome Boundary -> one v2 Map and managed-trigger preview -> one fingerprint-bound approved write -> fresh-session supervision -> material boundary revision only with user confirmation。

Compatibility shorthand for the same path：global setup once -> guided confirmed baseline -> one trigger + `.navi/project-map.md` preview -> one approved project init write -> fresh-session natural-language supervision。

当前 source 使用一个用户可见的项目入口，由 prompt/docs-backed 行为完成分流。证据连贯时才会形成 evidence-first candidate，项目是否成熟本身不决定分流；成熟项目也可能具有连贯、冲突、不足或过时的证据，并按对应 profile 处理。方向冲突交给用户确认；证据不足时进入 Guided Baseline Formation。两条路径共用同一个 confirmed Map preview 和 fingerprint-bound write。这不是 runtime classifier，也不是后台仓库扫描器。

`navi setup` 只配置全局 discovery，不会初始化目标项目。在未配置项目中的第一次 broad supervision request，Navi 会先判断 Desired Outcome、Outcome Boundary、Route To Outcome、Current Position、Current Boundary 和 Next Decision 是否可确认；baseline 只有同时包含 Current Boundary 和 Next Decision 才可确认。如果还不够，就一次只问一个 focused question，并且不写文件。形成 guided confirmed baseline 后，Navi 会一次预览 confirmed Map 和 managed `AGENTS.md` trigger。一次批准只覆盖这次 bounded project write：先写 Map，最后写 trigger。`navi init` 不会重新安装 plugin。

当前 main 使用 Project Map contract version 2 写入经过用户确认的 Outcome Boundary。现有 version-1 Map 仍然可读，不需要立即重新初始化。version-1 Map 只能通过一次经过预览、指纹绑定和用户批准的 Outcome Boundary 补充升级；Navi 不会自动迁移或重写它。该 current-main 行为仍未发布，只有后续 tag 明确包含时才属于已发布版本。

每次新写入或升级写入都必须使用 version 2；上述精确补充是 `navi init` 接受的唯一 Map migration。

Existing confirmed Map trigger path（已有 valid confirmed Map，但缺少 trigger 或使用 recognized legacy trigger）：

```text
navi init
navi init --expect-plan <fingerprint> --write
```

第一条命令会预览精确的 trigger action 并输出 plan fingerprint。只有该预览获批后，才运行第二条命令。

Fresh confirmed Map candidate path（advanced/internal integration detail）：

```text
navi init --map-file <confirmed-map-candidate>
navi init --map-file <confirmed-map-candidate> --expect-plan <fingerprint> --write
```

这是 Codex-guided candidate flow：Codex 先帮助用户形成并确认 baseline，再由 adapter 把 confirmed candidate 传给 preview 和获批的 write。它不是让用户手工形成 baseline 的命令行流程。

### Legacy migration 和 removal

如果 `navi doctor` 报告 legacy-only installation，先保留 doctor 报告的精确 legacy selector，再安装 `navi@navi-source`。在短暂 dual-install 过渡中，doctor 仍把安装状态视为不健康，但会只读检查权威 Current Navi selector、source path 和 manifest。检查通过后，运行 `codex plugin remove <doctor 报告的精确 legacy selector>`，重新运行 `navi doctor`，再预览并明确批准 `navi setup --write`。不要把两个 plugin 长期并存当作兼容模式。

这次全局切换不会扫描或初始化目标项目。之后第一次进入带有 recognized legacy trigger 的项目时，Current Navi 可以提供现有的 fingerprint-bound `navi init` 升级。拒绝项目级升级不会撤销全局激活，也不应在同一会话中反复提醒。

如需自行移除这个 source-alpha setup：

```bash
navi setup --remove
navi setup --remove --write
codex plugin remove navi@navi-source
codex plugin marketplace remove navi-source
npm unlink -g navi
```

更多 setup 细节见：

- `docs/navi/project-init.md`
- `docs/navi/project-trigger-template.md`

最低可靠的 project configuration 是已确认的 `.navi/project-map.md`，以及 `AGENTS.md` 中的简短 managed trigger。完成 setup 后，普通问题如 `接下来我们应该做什么？`、`现在做到哪了？我看不懂。`，或不清楚边界的 `继续吧。`，应该先得到 Navi supervision，再给普通任务建议。

Navi map 默认应该跟随用户当前 prompt 的语言。如果目标项目保存的 Project Map 或 Rhythm Map 使用另一种语言，Navi 应该在当前回答中翻译或双语化这些 label，而不是因为保存记录的语言而整张 map 切到另一种语言。

## 这个 Alpha 适合谁

如果你想在活跃 Codex 会话中测试 Navi 当前的监督行为、审查 plugin source package，或反馈 Progress/Rhythm Maps 与 Challenge Layer 是否能帮助非专家用户引导 expert-agent 工作，可以使用这个 alpha。

如果你需要 npm distribution、已激活的公开 marketplace release、Public Plugin Directory listing、一键 sync、runtime UI、后台 watching、操作系统或后台 notifications，或 Codex 之外的 agent adapters，请等待后续 release。

## Alpha 状态

最新 tagged GitHub source release：`0.1.0-alpha.3`。

当前 main branch：包含 `0.1.0-alpha.3` 之后尚未发布的工作，包括下文描述的 Lane Handoff 和 Supervised Delivery Loop 行为；除非后续 tag 明确包含它们，否则 Lane Handoff 仍是未发布的 current source behavior，Supervised Delivery Loop 也是如此。

这个 alpha 中稳定的内容：

- Navi Progress Maps：用于 progress、next-step、continue、done、confusion 和 plan-reliability 问题。
- Rhythm Maps：用于有周期循环、等待状态、并行机会和决策门的长期流动项目。
- Challenge Layer：用于 anti-self-certification moment。
- Pause semantics：用于 continue/stop 边界和真正有意义的 decision point。
- Stage/vision supervision：用于判断 product stage、work mode，以及距离原始目标还有多远。
- Coordination guidance：用于 worktree、review/merge timing、external waits，以及 non-conflicting main-session work。
- 多语言目标项目中的 Navi map prompt-language following。
- Working Thread continuity：用于需要 durable carry-forward 的项目判断。
- 通过 `navi init`、`AGENTS.md` 和 `.navi/project-map.md` 做 project-local Navi 初始化。
- 搭配 project-local docs 的 Codex skill/plugin 行为。
- 通过 `npm run verify:plugin-package` 做 source package verification。

当前不包含：

- npm package 发布。
- 已激活的 Git-backed marketplace release 或 Public Plugin Directory listing。
- 真实 installed-marketplace calibration 或一键 sync。
- 不包含后台 watcher、操作系统通知服务或 always-on presence；bounded Lane Handoff 只在 Codex 活跃时使用可用的任务消息能力。
- Runtime UI 或未来 local app surface。
- Hermes、Claude Code 或其他 agent adapters。
- Memory v2、relationship modes、automatic Evidence delegation、recursive
  delegation 或 write delegation。

根目录 `package.json` 有意保持 `"private": true`，避免意外发布到 npm。源码以 MIT license 提供，用于 GitHub alpha 使用。

## Navi 和 Along 的关系

Along 是 parent/lab context 和更长期的产品家族。Navi 是从这条线中独立出来的产品 surface，不应该要求读者先理解 Along 才能理解 Navi。

如果要理解来源和未来产品家族，可以看 Along。如果要理解当前 alpha 产品、setup path 和 supervision behavior，应先看 Navi。

## 当前 V1 形态

当前 V1 使用 skill/plugin 行为加 project-local docs。仓库内 Codex plugin source package 位于：

```text
plugins/navi
```

当前 installation、discovery 和 project triggers 只使用 Navi identifiers。`along-working-thread` 是 legacy installation identifier：只用于明确的 doctor-guided migration，不用于新安装。

Navi V1 是 docs-backed 且 turn-bound 的。它在活跃 agent session 中工作；它不会 watch files、发送操作系统或后台 notifications，也不会在 Codex 关闭后继续行动。

当一个有明确边界的 Codex worktree 带有 source-task metadata 且 host 提供任务消息能力时，Navi 可以把一次 `decision-required`、`blocked` 或 `review-ready` 转换直接交给来源主任务。这是活跃会话中 Codex 任务之间的协调，不是后台 watcher、用户通知服务、持久队列，也不会自动授权恢复执行、merge、push 或 release。

### Codex-first Supervised Delivery Loop

当前 main 包含一个尚未发布、由 prompt/docs 支撑的 Supervised Delivery Loop，用于已批准且边界明确的实现工作。持续存在的主线程负责目标和决策，worktree 执行线程负责修改文件并返回证据，一个新建的只读验证线程在接受结果前独立审查精确 snapshot。

该闭环使用 Codex host 的任务创建和任务间消息能力，并且只在来源任务仍活跃的活跃会话中工作。它不是调度器，也不是后台服务；也不是持久队列或 watcher，并且不会自动 merge、push、tag 或 release。权限、范围、架构、已知风险、集成和发布决策仍需明确处理。

### 当前 main 的任务模型路由

当前 main 包含尚未发布的、由 prompt/docs 支撑的 Task Routing Foundation；它只对具有用户明确授权路由策略的 Supervised Delivery 工作生效。当 Codex 创建有界的 Execution 和 Validation 任务时，它可以解析并应用模型与 reasoning 选择。Validation 根据 Validation Level 独立推导路由，而不是继承执行者的路由。

这还不是完整的三角色自动路由。Main Turn Host Adapter 尚未实现，活跃 turn 不能切换模型，Navi 不控制 Fast mode，也不提供 runtime scheduler、database、queue、daemon 或后台服务。真实 host 行为仍需在集成后进行自然校准。

### 当前 main 的委派建议

当前 main 包含尚未发布、由 prompt/docs 支撑的 Delegation Suggestion Gate，适用于 Main 和 Execution。获得 task-local 用户授权后，Navi 可以判断多个
可分离的只读证据问题是否具有足够委派净收益，并且只在能改善真实用户决策
时准备有界 Evidence Brief。

已接受的当前 host 没有为角色内 subagent 暴露可强制的只读、数量上限和
禁止递归控制。因此 Navi 不会调用 `spawn_agent`，不会自动创建 Evidence
subagent，也不会让 Validation 继承 delegation lease。普通情况继续由当前
角色处理；自动激活需要新的、已接受的 host capability gate。

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

如果要做本地 Codex plugin experimentation，请使用上面的 source marketplace commands 中的 `plugins/navi`。

这个 alpha 包含一个 narrow project-local initializer。如果还没有 confirmed Map，直接运行 `navi init` 会说明需要先在 Codex 中形成 baseline，并且不会修改文件。Guided confirmation flow 提供已批准的 Map 后，init 会预览精确的 Map-and-trigger action，并把批准的 write 绑定到该 plan fingerprint。它只为一个目标项目准备 Navi 行为；不会安装或同步全局 Codex plugin 或 skill。请使用上面两个带上下文的 command path，不要把 write flag 当成独立初始化命令。

## 我们希望收到的 Alpha 反馈

最有用的 alpha 反馈来自真实或接近真实的目标项目：

- 普通 progress、next-step、confusion、continue 和 plan-reliability 问题是否触发了有用的 Navi map？
- Flowing projects 是否使用 Rhythm Maps，而不是误导性的 completion bars？
- Challenge Layer 行为是否能捕捉 weak assumptions 或 self-certifying momentum，同时不变成持续打断？
- 窄的 factual checks 和明确 execution requests 是否保持 quiet？
- `navi doctor` 是否能清楚解释 legacy-only 或 dual-install diagnostic，同时不自动修改全局状态？

## Project-Local Setup

要让 Navi 在目标项目中可靠工作，需要：

- `AGENTS.md` 中的 project-local trigger source；
- 已确认的 `.navi/project-map.md`；
- 目标项目的 source records，例如 state files、TODO files、trackers、workflow records 和 handoffs。

可复用 setup docs：

- `docs/navi/project-init.md`
- `docs/navi/project-trigger-template.md`

## Architecture Boundary

MCP、runtime、local app、background presence、companion memory 和 adapter surfaces 都是 experimental 或 later layers，除非为某个 focused validation pass 明确说明。

仓库里仍包含较早的 Along companion ideas，包括 local memory、Shared Desk、soundscape 和 `.along/` runtime concepts。请把这些当作 historical 或 future-facing context，而不是当前推荐的 Navi 安装路径。

`archive/along/src/web` 不是 Navi alpha UI。

## Release Notes

最新 alpha release notes 见 `CHANGELOG.md` 和 `docs/releases/v0.1.0-alpha.3.md`。

## License

MIT。见 `LICENSE`。
