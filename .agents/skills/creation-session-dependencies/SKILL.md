---
name: creation-session-dependencies
description:
  Review and update Creation dependencies in a focused maintenance session. Use for
  session.dependencies or an explicit dependency-maintenance request.
---

# Maintain Creation dependencies

Read AGENTS.md, apps/docs/session-state.md, apps/docs/standards.md and the dependency-maintenance
protocol in apps/docs/collaboration.md. Verify Git state and existing toolchain before changes.

Inspect pnpm-workspace.yaml catalogs, package manifests, packageManager, lockfile and
version-sensitive configuration. Run pnpm outdated recursively; inspect the installed pnpm help for
catalog-specific options when necessary. An outdated result is not proof of compatibility, and a
failed registry request is not proof that packages are current. Check official release/migration
notes and existing supply-chain policies for candidate versions.

Present coherent update groups and meaningful migrations before applying them. An explicit request
to update authorizes routine compatible tooling changes. Preserve file-by-file dialogue for changes
to runtime/experience behavior and discuss architectural changes before implementing them. Do not
mix unrelated feature work or overwrite the dirty checkout's existing changes.

Update shared versions in catalogs, not duplicated package ranges. Keep coupled packages compatible,
including Three.js and its types. Regenerate the lockfile using the project's pinned toolchain and
run pnpm check plus targeted browser/visual checks when relevant dependencies affect rendering.

Record before/after versions, migrations, checks, deliberately deferred updates and reasons in the
owning stack/development documents. Update the dependency-review date/counter in session-state.md;
distinguish a completed review from incomplete checks or migrations. End with a French report of
results and remaining work. This skill does not authorize commits or deployment.
