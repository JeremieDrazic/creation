# Workspace foundations

The first implementation increment establishes a runnable workspace and verification gates. The web
pages are temporary route placeholders, not the designed intro, Fireflies, mobile invitation or
final typography. Graphics, audio and deployment follow in later increments.

## Local setup

Use Node.js 24.13.0 (`.nvmrc`, `.node-version`) and pnpm 12.10.1 (`packageManager`). With nvm:

```sh
nvm install
nvm use
corepack enable
pnpm --version
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

The version command must report 12.10.1. A separately installed global pnpm may shadow Corepack;
correct its PATH priority before running scripts. `corepack pnpm install --frozen-lockfile` can
bootstrap installation, but subprocesses calling `pnpm` must also resolve the pinned version. The
project does not change machine-wide package managers automatically.

```sh
pnpm dev:web
pnpm dev:storybook
pnpm check
```

Web uses port 5173; Storybook uses 6006. Both bind to localhost and fail on occupied ports. To leave
another project running, use `pnpm --filter @creation/web dev --port 5175`.

`pnpm check` runs formatting, typed lint, TypeScript, both production builds and Chromium tests.
`pnpm test:e2e` alone expects existing builds and starts previews on 4173/6006; stop the Storybook
dev server first. Reports/traces are ignored by Git and uploaded on CI failure. CI installs
Chromium's Linux system dependencies on the pinned Ubuntu 24.04 runner. Source profiles and browser
tests are explicitly typechecked.

## Boundaries and resolution

Stories and tests are colocated with the component/file they exercise. Storybook discovers stories
in their owning package rather than storing them in the host app. Playwright discovers colocated
`.spec.ts` browser checks; the root Node profile typechecks them, separately from browser
application profiles. The router excludes test/story files from generation. Named module folders and
shallow nesting follow [the standards](standards.md).

```text
apps/web/src/
  localization/i18n.ts
  shell/Shell.tsx, Shell.spec.ts
  routes/                 # Router-required route files
  main.tsx, routeTree.gen.ts
packages/ui/src/
  button/Button.tsx, Button.stories.tsx, Button.spec.ts
  styles/global.css
packages/design-tokens/src/theme/theme.stylex.ts
packages/config/
  tsconfig/               # Named browser/Node profiles
  vite/stylex/stylex.ts
```

Public package subpaths stay stable as implementations move into these folders.

| Layer         | Current responsibility                                                  |
| ------------- | ----------------------------------------------------------------------- |
| Root          | Exact catalog, one lockfile, lint/format policy, CI and browser tests.  |
| config        | Strict browser/Node TypeScript profiles and common StyleX Vite adapter. |
| design-tokens | Initial semantic UI variables; no React or graphics dependency.         |
| ui            | Native button and layered global reset.                                 |
| web           | Persistent DOM shell, thin file routes and scoped FR/EN localization.   |
| storybook     | The same UI package, tokens and compiler for component review.          |

Use `workspace:*` internally and `catalog:` for centrally pinned external versions. All packages are
private. Explicit source exports let Vite and TypeScript consume internal packages without an
intermediate library build. Publication would require its own output/export strategy. Only packages
with an actual responsibility are created; API/runtime/utils placeholders are absent.

pnpm uses isolated linking without hoisting, strict peer checks and one workspace lockfile. Only
esbuild's dependency build script is allowed. New resolutions must be at least 48 hours old; strict
enforcement avoids automatic release-age exceptions. This delay is a resolution policy, not a safety
guarantee. Update the catalog and lockfile together through reviewed changes.

Turbo follows declared dependencies. Builds declare output directories; typechecks cache no
generated files; dev tasks are persistent and uncached. Do not introduce phantom imports from root
dependencies to make a package work.

## Compiler and lint

The official StyleX unplugin runs before React with the same resolver and CSS layer order in both
applications: reset, base, then StyleX. `.stylex.ts` variables resolve through package exports; each
consumer compiles source styles. CSS variables are UI values, not shader data.

Storybook resolves framework/addon paths using its documented monorepo pattern, preserving pnpm
isolation. The universal StyleX adapter's untyped Vite return is narrowed once to `PluginOption`;
dependencies are not patched.

Oxlint explicitly enables typed lint and loads StyleX's JS plugin. Correctness, promise safety,
React hooks, cycles and selected accessibility rules are errors. JS plugins remain upstream alpha;
retain compiler/build checks. The native Button forwards React's constrained type with one explained
rule suppression instead of duplicating the check at runtime.

Oxfmt sorts Node, external, workspace and relative imports, keeping types with their source group;
side-effect ordering is preserved. It also formats JSDoc. Oxlint rejects explicit workspace-source
shortcuts; public export resolution is checked by TypeScript. Named constants, meaningful JSDoc,
units, ownership and settings policy additionally require code review.

TanStack generates `apps/web/src/routeTree.gen.ts`. Commit it so fresh checkouts can typecheck
before Vite; never edit it manually. It is excluded from lint/format, not TypeScript checking. Run
web build/dev after route changes and commit regeneration. Automatic route splitting is enabled.
Runtime preparation/residency and artistic handovers belong to the next increment.

## Pinned versions

| Tool                                    | Version                    |
| --------------------------------------- | -------------------------- |
| React / React DOM                       | 19.3.0                     |
| TypeScript                              | 7.0.2                      |
| Vite / React plugin                     | 8.3.3 / 6.1.2              |
| TanStack Router / plugin                | 1.170.41 / 1.168.42        |
| StyleX runtime / compiler / lint plugin | 0.19.1                     |
| Storybook                               | 10.6.1                     |
| Turbo                                   | 2.11.7                     |
| Oxlint / tsgolint / Oxfmt               | 1.87.0 / 7.0.2003 / 0.72.0 |
| Playwright                              | 1.63.0                     |
| i18next / react-i18next                 | 26.4.2 / 17.0.16           |

The catalog is authoritative. Three.js, GSAP, Zustand, lil-gui and Vitest remain selected; install
them when a relevant increment uses them rather than adding unused dependencies or placeholder unit
tests.

## Review and evidence

Browser tests cover navigation/back, direct Fireflies entry, language switching/document language,
unknown-route UI, production CSS/tokens in both apps, focus and disabled state. Preview fallback is
not production HTTP 404 or per-route social metadata. Headless checks do not prove GPU performance
or final artwork. Storybook includes the accessibility review addon; this is not a complete
accessibility audit of the future site.

Local probes also confirmed shared-token hot reload in both apps and actual rejection of an
unhandled promise, invalid StyleX property and explicit private-source import by lint. Import-order
probes verified grouping and preserved side-effect order. Token hot reload was rechecked after
moving the modules into folders. Temporary probes were removed. Storybook reports large
development-tool chunks; its output is separate from the public web bundle.

The owner authorizes finishing this scaffolding as a batch. Subsequent increments resume study one
file at a time, with dialogue before the next. The topics are catalog/linking, exports and
TypeScript, Turbo, StyleX, routes/localization, then tests/CI; they are not a bulk reading
assignment. The next increment introduces the experience host while keeping frame work outside React
state.

## Sources

- [pnpm settings](https://pnpm.io/settings) and [catalogs](https://pnpm.io/catalogs).
- [Turbo task graph](https://turborepo.dev/docs/crafting-your-repository/running-tasks).
- [StyleX Vite](https://stylexjs.com/docs/learn/installation/vite/).
- [Storybook monorepo resolution](https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments).
- [Oxlint typed lint](https://oxc.rs/docs/guide/usage/linter/type-aware) and
  [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins).
- [TanStack splitting](https://tanstack.com/router/latest/docs/guide/automatic-code-splitting).

Reviewed October 8, 2026. Decksmith was inspected read-only for catalogs, source boundaries, strict
TypeScript and formatting; its domain-specific instructions were not adopted.
