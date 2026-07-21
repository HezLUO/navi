# Navi Manual Update Fallback V1

This reference is the sole detailed owner for explicit Navi update requests on
the accepted Stock App Native Absent branch. It is prompt/docs-backed guidance,
not an updater, scheduler, watcher, database, queue, daemon, or Runtime Surface.

## Capability Basis

The accepted Stock App inspection is version-scoped host evidence. For Stock
App 26.715.52143 build 5591 with Codex CLI 0.144.5, C1 scheduling remains
unknown, C2 upgrade and cache-readiness ordering remains unknown, C3 forced
discovery is present, and C4 existing-task structured Skill input is absent.
The accepted classification is Native Absent. A later accepted inspection may
supersede this host boundary; model memory or a newer version number alone may
not.

## Trigger And Stable Checkpoint

Use this owner only after an explicit user request to check or update Navi. Do
not automatically check the network on every prompt, at startup, or on a timer.
The request may proceed only at a stable checkpoint after the current response
and approved actions finish. If an active delivery group can still return a
premise-, scope-, acceptance-, risk-, or integration-changing result, defer the
update until that group closes.

The global marketplace update is a user-owned mutation. Show the exact
channel-specific action and require direct user approval before it runs. A
recommendation is not approval.

## Channel Classification

Classify the installed source from bounded official marketplace and plugin
evidence before giving a command.

- Git-backed `navi-source`: the configured marketplace is Git-backed and the
  installed plugin identity is `navi@navi-source`. Use the Git-backed flow.
- local-source marketplace: `navi-source` resolves to a local checkout. The
  marketplace upgrade command does not update the source checkout. The user
  keeps control of the trusted source workflow; Navi must not invent a branch,
  tag, `git pull`, dependency command, or release.
- Public Plugin Directory: Navi is not available there now. Do not present a
  Directory update action as current behavior.
- unknown channel: stop with one focused clarification. Navi must not guess a
  marketplace name, source, ref, selector, or update command.

## Git-Backed Update Flow

After channel verification, present these exact official commands:

```text
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

The first command is the direct user-approved global mutation. The second is a
read-only verification step. Do not use the nonexistent `codex plugin
marketplace update` command. Do not remove and re-add the marketplace or
plugin, edit Codex config, delete cache directories, or change a pinned source
ref as an implicit repair.

Successful command completion proves only the official manual update action.
It does not prove Stock App automatic scheduling, same-task activation, or a
release channel that has not been activated.

## Existing Task Boundary

The current task may continue using its existing Navi version after the global
installation changes. The current Stock App does not expose the proved
structured Skill-input path required to activate the discovery-returned
installed-cache Skill in that existing task.

The narrowest proved updated-version activation boundary is a genuinely new
Codex task created after successful official update verification. Do not claim
that restarting Codex reloads the updated Skill into the same task. Do not
treat plain text, an `@` mention, or a natural-language request as equivalent
to a structured Skill input.

Starting a new task is a host continuity fallback, not project
reinitialization. Preserve the user's project, Outcome Boundary, Project Map,
and accepted delivery evidence. Carry forward only the bounded context needed
for the next task; do not rewrite historical old-version evidence.

## Failure Preservation

If the update or verification fails, keep the prior verified version and the
current task. There is no immediate retry. One failure does not authorize
marketplace removal/re-add, plugin removal, cache deletion, config edits,
source-ref changes, or another mutation. Report the exact failed command and
the smallest user decision needed.

## Project Guidance Boundary

A plugin update does not require `navi init`, does not rewrite
`.navi/project-map.md`, and does not rewrite the Navi `AGENTS.md` managed block.
A later explicit Map contract migration remains previewed, fingerprint-bound,
and separately approved.

## Hard Boundaries

This fallback does not authorize background checks, automatic update claims,
same-task reload claims, an Update Host, a panel, a Runtime Surface, new
permissions, source migration, release, publication, Public Plugin Directory
submission, or target-project writes.
