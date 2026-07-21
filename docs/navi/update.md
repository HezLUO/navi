# Updating Navi

Navi updates are explicit in the currently inspected Stock Codex App. The
accepted host evidence does not support automatic same-task activation.

## Git-Backed `navi-source`

Finish the current bounded delivery group first. Verify that the configured
source is the Git-backed `navi-source` marketplace and that the installed
plugin is `navi@navi-source`. After direct approval, run:

```bash
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

The first command updates global Codex marketplace/plugin state. The second is
read-only verification. Navi does not run either mutation silently.

The current task may continue using its existing Navi version. Start a new
Codex task after successful verification to use the updated version. This is
the narrowest activation boundary proved for the inspected Stock App.

## Local-Source Marketplace

`codex plugin marketplace upgrade` does not update the source checkout of a
local-source marketplace. Update and verify the trusted checkout through the
source workflow you selected. Navi does not guess a branch, tag, `git pull`,
dependency command, or unpublished release. Start a new Codex task only after
the local source and package verification are complete.

## Public Plugin Directory

Navi is not available in the Public Plugin Directory now, so no Directory
update path is current.

## Existing Projects

A plugin update does not require `navi init`, does not rewrite
`.navi/project-map.md`, and does not rewrite the Navi `AGENTS.md` managed block.
The new task reads the existing project guidance.

## Failure

If update or verification fails, keep the current task and prior verified
version. Do not immediately retry, remove and re-add the marketplace or plugin,
delete cache state, edit Codex configuration, or guess a different source ref.
Use the exact command result to decide the smallest repair.

## Current Capability Boundary

For Stock App 26.715.52143 build 5591 with Codex CLI 0.144.5, forced Skill
discovery is present, but the connected existing-task structured Skill-input
path is absent. Startup scheduling and cache-readiness ordering remain unknown.
A later accepted inspection may supersede this version-scoped result.
