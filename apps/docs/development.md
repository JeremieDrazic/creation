# Workspace foundations

October 20 rendering-foundations PR validation: full pnpm check passes, including formatting, typed
lint, workspace types, all three builds, 221 unit tests, 5 Chromium Storybook tests and 4 production
browser journeys. Test previews use ports 4173/4174/4175 to preserve development servers. Generated
VitePress caches and Storybook debug logs are ignored. The runtime contracts, implementation
sequence and concise session handoff reflect the current reviewed work; this PR does not implement
intro artwork or complete recovery/performance acceptance.

The first implementation increment establishes a runnable workspace and verification gates. The web
pages are temporary route placeholders, not the designed intro, Fireflies, mobile invitation or
final typography. Initial deployment is complete; renderer foundations and the development-only POC
are implemented on the current feature branch. Production graphics/audio follow separately.

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

Local repair verified October 13: the Homebrew pnpm 10.19.0 launcher attempted to switch to the
pinned 12.10.1 but its cached executable was still a shebang-less placeholder, causing macOS
ENOEXEC. The native 12.10.1 ARM64 binary was already present. With owner approval, running that
cached pnpm package's official install.js replaced the placeholder launchers with the installed
binary. pnpm --version now reports 12.10.1 and pnpm --filter @creation/web exec vite --version
succeeds. No global Homebrew version, project dependency or lockfile changed. If the symptom recurs,
inspect the cached executable before reinstalling; do not change project versions to bypass it.
corepack pnpm --version also worked during diagnosis. corepack pnpm --filter @creation/web dev can
start web directly when a global pnpm launcher shadows Corepack.

```sh
pnpm dev:web
pnpm dev:storybook
pnpm dev:docs
pnpm test:unit
pnpm test:components
pnpm check
```

Web uses port 5173; Storybook uses 6006; docs uses 5174 with the /docs/ base. All bind to localhost
and fail on occupied ports. To leave another project running, use
`pnpm --filter @creation/web dev --port 5175`.

`pnpm check` runs formatting, typed lint, TypeScript, three production builds, runtime unit tests,
Storybook component tests and Chromium integration tests. `pnpm test:e2e` alone expects existing
builds and starts previews on 4173 (web), 4174 (docs) and 4175 (Storybook), leaving development
servers running on their separate ports. Reports/traces are ignored by Git and uploaded on CI
failure. CI installs Chromium's Linux system dependencies on the pinned Ubuntu 24.04 runner. Source
profiles and browser tests are explicitly typechecked.

## Boundaries and resolution

Stories and tests are colocated with the component/file they exercise. Storybook discovers stories
in packages/ui/src and apps/web/src rather than storing them in the host app. Its React framework
enables root StrictMode, matching web development. Playwright discovers colocated `.test.ts` browser
checks; the root Node profile typechecks them, separately from browser application profiles. The
router excludes test/story files from generation. Named module folders and shallow nesting follow
[the standards](standards.md).

```text
apps/web/src/
  utils/localization/i18n.ts
  shell/shell.tsx, shell.test.ts
  routes/                 # Router-required route files
  main.tsx, routeTree.gen.ts
packages/ui/src/
  button/button.tsx, button.stories.tsx, button.test.ts
  styles/global.css
packages/design-tokens/src/colors.stylex.ts, controls.stylex.ts
packages/config/
  tsconfig/               # Named browser/Node profiles
  vite/stylex/stylex.ts
```

Token exports are split by family: colors.stylex and controls.stylex. Add typography, layout or
motion files when actual values are needed; do not create empty categories.

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
with an actual responsibility are created. Rendering now owns the initialized renderer; utils
contains generic coded errors. No empty API or generic runtime package is created.

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

## Component tests and documentation

The web Vitest project currently owns src/rendering-probe/**/*.test.ts. Playwright explicitly
selects the shared shell's integration test file, so it does not execute these unit tests. Register
future suites with their intended runner; both keep the .test filename convention and colocation.

Runtime unit tests run with `pnpm test:unit` through package-owned Vitest configurations in Node.
They remain colocated with their module and are distinct from Storybook component tests and
Playwright integration checks. The root Node TypeScript profile checks these tests and their Vitest
configuration; its ES2024 library matches the pinned Node 24 environment and its DOM types describe
browser-boundary inputs. This does not change the ES2022 browser source target. Rendering tests mock
only the Three.js boundary using [Vitest module mocks](https://vitest.dev/guide/mocking/modules);
they do not validate a GPU backend. The root check command includes these tests, so CI runs them.

Use pnpm test:components to run the Storybook Vitest browser project. Component assertions live in
play functions in their existing stories; do not duplicate these in isolated React unit files.
Playwright .test.ts checks retain integration responsibility, including extracted CSS across builds.
The addon automatically provides preview annotations; no redundant global setup is needed.

The Storybook browser project runs files sequentially. Under Vitest only, createStylexPlugin uses
runtime style injection so assertions do not race asynchronous extracted-CSS refresh; the injector
is explicitly preoptimized to avoid test reloads. Normal app/Storybook development and production
builds retain extracted CSS. Production Playwright checks remain responsible for that extraction
path. Short-motion tests must start observing before awaiting the triggering interaction and wait
for initial styles instead of assuming immediate development stylesheet readiness.

RenderingCanvas has two browsable stories under Runtime/RenderingCanvas: StaticTriangle uses the
temporary static probe with the actual runtime/store, and PreparationFailure rejects preparation
deliberately. Their play functions inspect state without clicking controls. LifecycleChecks keeps
resize/rerender/unmount interactions in the automated suite with !dev/!autodocs tags, hidden from
the sidebar. This prevents test actions from resizing/remounting the preview on opening/reload. Play
tests verify readiness, stable canvas identity across interface rerenders/resize, buffer width after
resize, two unmount/remount cycles, and error propagation. All 5 Storybook tests (including the
existing Button stories) pass in Chromium with root StrictMode. These are browser
component/integration tests, not unit tests of GPU implementation, visual pixel approval or
performance acceptance. The 90 web unit tests remain separate. Storybook/web builds and targeted
type/lint/format checks pass. Web declares its own Storybook development dependencies through the
existing catalog; no dependency versions changed. The stories are absent from the production web
entry. No owner development server was started; the automated test server ended normally.

Documentation lives in apps/docs and builds with VitePress to apps/docs/dist at /docs/. Storybook
production preview mounts at /design-system/ with relative assets. The preview tests check these
subpaths, not DNS, TLS or live Traefik configuration. See [delivery](delivery.md).

## Pinned versions

| Tool                                    | Version                    |
| --------------------------------------- | -------------------------- |
| React / React DOM                       | 19.3.0                     |
| TypeScript                              | 7.0.2                      |
| Vite / React plugin                     | 8.3.3 / 6.1.2              |
| TanStack Router / plugin                | 1.170.41 / 1.168.42        |
| StyleX runtime / compiler / lint plugin | 0.19.1                     |
| Storybook                               | 10.6.1                     |
| Vitest / browser adapters               | 5.0.3                      |
| VitePress                               | 1.6.4                      |
| Turbo                                   | 2.11.7                     |
| Oxlint / tsgolint / Oxfmt               | 1.87.0 / 7.0.2003 / 0.72.0 |
| Playwright                              | 1.63.0                     |
| Three.js / types                        | 0.186.1 / 0.186.0          |
| i18next / react-i18next                 | 26.4.2 / 17.0.16           |
| GSAP                                    | 3.15.0                     |
| Zustand                                 | 5.0.15                     |
| lil-gui                                 | 0.21.0                     |
| Base UI                                 | 1.9.0                      |

The catalog is authoritative. Three.js is installed for the rendering host and POC. Zustand powers
runtime status; sound persistence is deferred to a dedicated PR. GSAP 3.15.0 was checked against npm
and installed for the intro link animation, with the workspace's release-age policy unchanged. Web
declares it at runtime; Storybook declares it for previews and prebundles it before tests. Its
bundled types are used. lil-gui 0.21.0 now backs the first numeric-control adapter in
packages/data-gui. The version/integrity and October 12, 2025 publication were verified against npm;
the release-age policy remains unchanged. Installation added that dependency only and reused
existing workspace versions. The package has colocated unit tests and was exercised in a temporary
browser probe. The application now lazy-loads the floating control workbench in development and
binds the active intro composition controls. E2E starts an isolated Vite development server on port
4176 for its colocated development-panel browser tests; production previews retain ports
4173/4174/4175. The web workspace declares data-gui as a development dependency. No library versions
changed. data-gui additionally declares the already catalog-pinned Vite as a devDependency for its
separate Node-only preset-file plugin. Its browser and Node typechecks remain separate. Development
presets live at the repository root; E2E supplies CREATION_GUI_TEST_PRESETS=1 and uses an isolated
per-server cache directory instead of owner files.

Vitest and browser adapters use 5.0.3, supported by Storybook 10.6.1. The addon’s declared
@vitest/runner peer uses published 4.1.11 types; its range permits this. Vitest 5 no longer declares
runner as a runtime dependency. Browser execution, typechecks and strict peer resolution are
verified.

Base UI 1.9.0 is explicitly selected by the owner for the developer preset controls. npm metadata
was verified October 25: published October 9, React/React DOM peer ranges include 19, and date-fns
peers are optional. The exact version is catalog-pinned with the existing release-age policy. The
package declares the existing catalog React/React DOM versions as peers/devDependencies and adds
Base UI's seven previously absent dependency packages; no existing versions were upgraded. Browser
imports remain inside the development-only panel graph. Official guidance:
[Select](https://base-ui.com/react/components/select),
[setup and portal isolation](https://base-ui.com/react/overview/quick-start).

## Review and evidence

Browser tests cover navigation/back, direct Fireflies entry, language switching/document language,
unknown-route UI, production CSS/tokens in both apps and docs under /docs/. Storybook tests cover
keyboard activation/focus, disabled behavior and accessibility in the real browser. Preview fallback
is not production HTTP 404 or per-route social metadata. Headless checks do not prove GPU
performance or final artwork. Storybook includes the accessibility review addon; this is not a
complete accessibility audit of the future site.

Local probes also confirmed shared-token hot reload in both apps and actual rejection of an
unhandled promise, invalid StyleX property and explicit private-source import by lint. Import-order
probes verified grouping and preserved side-effect order. Token hot reload was rechecked after
moving the modules into folders. Declaration-order and effect-import probes also fail lint as
intended. Temporary probes were removed. Storybook reports large development-tool chunks; its output
is separate from the public web bundle.

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

## Focused React verification — October 19, 2026

Checked the catalog, installed packages, official React API docs/release notes and npm dist-tags.
React/react-dom 19.3.0 were one patch behind npm latest 19.3.1 (published October 14). Both catalog
entries and the lockfile were updated together to 19.3.1; installed types remain 19.3.0. The
official patch release concerns the React Server Components transport, not a new client API. No
other catalog versions were changed by this update. Peer snapshot identifiers in the lockfile change
accordingly. The existing rendering/Three.js workspace changes predate this focused dependency
check.

Registry reads and installation required network execution outside the sandbox after DNS failures.
The pnpm 48-hour release-age policy was retained. No global tooling was updated and no development
server was started. This is a focused React check, not a complete scheduled dependency session. The
dependency-review checkpoint counter is unchanged.

Pinned Oxlint was verified with three temporary API examples: valid useEffectEvent usage passes;
including its function in Effect dependencies and invoking it from a button handler both fail.
Temporary files were removed. No extra lint plugin was installed. Current effect/StrictMode usage
and proposed production API choices are documented in [standards](standards.md).

Full post-update pnpm check passed: formatting, typed lint, workspace types/builds, 195 unit tests,
2 component tests and 4 Chromium journeys. Sources:
[npm React latest](https://registry.npmjs.org/react/latest),
[React 19.3.1 release](https://github.com/react/react/releases/tag/v19.3.1),
[React 19.3 APIs](https://react.dev/blog/2026/09/09/react-19-3).

October 19 runtime-status increment: added catalog-pinned Zustand 5.0.15 to web, the npm stable
version verified on this date. Its React peer range supports React 19.3.1. No middleware or
additional state library was added. The vanilla store exposes a read-only API compatible with
Zustand useStore; React wiring remains separate. All 68 web tests, web TypeScript and targeted typed
lint/formatting pass. Sources: [Zustand releases](https://github.com/pmndrs/zustand/releases),
[vanilla store implementation](https://github.com/pmndrs/zustand/blob/main/src/vanilla.ts),
[React subscription implementation](https://github.com/pmndrs/zustand/blob/main/src/react.ts).
