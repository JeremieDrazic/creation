# Code standards — Decksmith review and Creation baseline

Status: the owner accepts the Decksmith-inspired standards and graphics-specific adaptations. The
first workspace PR implements strict TypeScript, typed Oxlint, selected StyleX rules and Oxfmt; see
[development](development.md) for configuration, evidence and limitations. Decksmith remains a
read-only reference; graphics-specific standards apply as runtime code is introduced.

## Local sources reviewed

- ../decksmith/.oxlintrc.json and .oxfmtrc.json: actual lint/format configuration.
- ../decksmith/packages/config/tsconfig/base.json and react.json: strict TypeScript profiles.
- ../decksmith/apps/docs/adr/0013-migrate-to-oxlint-and-oxfmt.md: migration rationale; historical
  maturity/performance claims are not automatically current facts.
- ../decksmith/apps/docs/adr/0004-code-quality-and-formatting-standards.md and
  0011-file-folder-conventions.md: formatting, naming, feature organization and package exports.
- ../decksmith/package.json and apps/storybook/package.json: scripts, tooling and Storybook
  integration.

Decksmith-specific backend, MTG, token, workflow and automatic dependency-update instructions are
reference material, not instructions inherited by Creation. Preserve that repository unchanged.

## React and declaration discipline

Declare values and functions before their first use, enforced by no-use-before-define. Same-file
StyleX declarations precede components. TypeScript also rejects unresolved identifiers; declared
package dependencies and exports define module boundaries.

Effects synchronize external systems only: DOM, event subscriptions, rendering/audio adapters. Never
use effects for derived values, event-specific actions or chains of state updates. Prefer
render-time calculation and event handlers; useSyncExternalStore is appropriate for external stores.
Do not replace a valid effect with ref callbacks or manual subscriptions solely to lower the count.

Direct useEffect/useLayoutEffect imports require an explained, narrowly scoped lint exception
identifying the external system. exhaustive-deps stays enabled; exceptions never excuse omitted
dependencies. Effect owners must define cleanup when acquiring resources. Reassess every effect in
review; no arbitrary numerical quota or blanket ban.

The correctness category already activates a family of rules. Additional explicit rules cover
TypeScript promise/type safety, declaration order, React component stability, hook dependencies,
ARIA and keyboard interactions. Decksmith is a reference; avoid its blanket restrictions on reduce,
forEach or allocation patterns when they do not improve measured graphics code.

## Standards baseline

English JSDoc is confirmed for public contracts and meaningful non-obvious behavior. Document units,
coordinate spaces, ownership, cancellation, side effects and cleanup where relevant. Use descriptive
@param, @returns, @throws, @remarks or @example tags when they help explain the contract; do not
duplicate TypeScript type annotations or add comments that merely repeat a symbol's name.

Import ordering is confirmed: Node built-ins, external libraries, workspace packages, then relative
modules. Separate groups with a blank line and sort paths alphabetically within each group. Keep
type imports alongside their source group. Preserve evaluation order for side-effect imports. Oxfmt
enforces this ordering and formats JSDoc. Side-effect imports remain in evaluation order and can
partition sorted groups. JSDoc completeness and usefulness remain review responsibilities.

The pnpm catalog is already active: external dependencies use `catalog:`; internal packages use
`workspace:*`. Versions are centralized in `pnpm-workspace.yaml`.

- English code/comments/docs; lowercase creation technical names.
- TypeScript strict, noUncheckedIndexedAccess, noImplicitOverride,
  noPropertyAccessFromIndexSignature, isolatedModules and verbatimModuleSyntax where compatible with
  the pinned toolchain. Separate browser/node profiles and retain an explicit typecheck gate.
- Explicit package subpath exports and acyclic dependencies. Avoid aggregate imports that mix pure,
  DOM and graphics modules or eagerly load all experiences. Organize by feature/responsibility;
  colocate meaningful tests and UI stories.
- Kebab-case source filenames and directories, including components; .test.ts/.test.tsx and
  .stories.tsx suffixes. React component identifiers remain PascalCase. Oxlint enforces source
  filename casing; generated/framework files retain tool-required conventions.
- Formatting aligned with actual Decksmith config: semicolons, single quotes, 2 spaces, width 100,
  ES5 trailing commas, parenthesized arrow arguments, LF and Markdown prose wrapping. Exclude
  generated code, build output, coverage and lockfiles as appropriate. Do not blindly copy
  exclusions of project instruction/docs files.
- Lint for promise safety, unused code, React hooks, invalid JSX/ARIA and import cycles. Prefer
  unknown plus validation at external boundaries over unrestricted any. Document narrowly scoped
  exceptions for library typing gaps.
- Review actual rule support/config names against pinned Oxlint, including type-aware rules.
  Decksmith has oxlint-tsgolint installed, but its root lint script does not explicitly pass
  --type-aware and the inspected root config does not set typeAware; do not assume declared typed
  rules actually run solely because the dependency exists. Explicitly configure and verify the
  selected lint mode.
- Audit StyleX-specific lint coverage with the pinned Oxlint/JS-plugin support. Do not promise that
  every ESLint ecosystem rule is a drop-in replacement. Preserve required checks with supported
  tooling rather than silent omissions or ad hoc patches.

## Internal organization — confirmed principles

- Give each coherent module its own named folder: component, hook, utility or runtime
  responsibility. Token families are flat named files, an explicit owner-approved exception. Avoid
  flat source folders collecting unrelated modules. Closely related functions may share a module.
- Keep implementation, tests, stories, local styles and local types together in that folder. Extract
  shared code only when it has actual consumers outside its original module.
- Keep nesting shallow. Prefer one or two meaningful organizational levels beneath src; add another
  only when it clarifies a real responsibility. This is a guideline, not a rigid depth limit.
- Use descriptive kebab-case folder names. Retain descriptive filenames; avoid making every file
  index.ts or splitting a readable module into many tiny files.
- Each directory must group real code or communicate a responsibility. Do not create empty
  categories or redundant directory layers solely to fill an architectural template.
- Keep required package/tool entry files at their expected locations. Generated/framework files
  follow their tool conventions.
- The current scaffolding is organized as an authorized batch. Define future package trees during
  their implementation, with file-by-file dialogue. The principles do not preselect future folders.

## Named constants — confirmed

- Replace unexplained literals encoding configuration, thresholds, timing or behavior with named
  constants in SCREAMING_SNAKE_CASE. Names explain their purpose; include units where helpful, such
  as MUSIC_FADE_DURATION_SECONDS or MAX_RENDER_PIXEL_RATIO.
- Keep constants in the owning module when only that module needs them. Introduce a constants.ts
  file inside its responsibility folder when multiple local files need them or a coherent set
  deserves its own file. Extract to a shared owner only for genuinely shared meaning.
- Do not collect unrelated values in a global constants file or reuse a constant solely because two
  values happen to be numerically equal. Shared UI values remain owned by design-tokens.
- Uppercase names apply to semantic constants, not every const declaration. Instances, working
  variables and runtime state keep descriptive camelCase names.
- Adjustable settings have named immutable defaults and explicit runtime configuration fields. The
  development palette changes runtime settings, not exported constants; avoid duplicate values with
  competing owners.
- Give structural literals and mathematical identities their natural representation when their
  meaning is self-evident. The goal is to eliminate unexplained behavior, not name every zero or
  create aliases for standard constants such as Math.PI.

## Contracts and configuration

- Prefer named exports for project modules. Default exports remain appropriate for tool-required
  configuration, route conventions and Storybook metadata. Export intentional entry points through
  package.json; no catch-all barrel eagerly importing experiences.
- Import another package through its declared exports, never a relative path into its source.
  Packages must not depend on application implementation. Oxlint blocks source-path shortcuts and
  relative imports through workspace apps/packages folders; TypeScript resolves declared exports.
  These checks complement dependency review rather than proving the entire architectural graph.
- Use seconds for runtime time/durations and radians for angles. Browser APIs with milliseconds
  convert at their boundary. Name dimensional values explicitly and document coordinate/color spaces
  at conversions; avoid mixing CSS pixels, physical render pixels and normalized positions.
- Assign one owner to each listener, timeline, subscription and disposable resource. Acquisition
  must have a matching release path; cleanup must tolerate repeated calls. Borrowed shared renderer
  resources remain owned by the host. React effects clean up their own subscriptions.
- Treat cancellation as expected control flow, separately from failures. Propagate operational
  failures to the owning boundary for recovery and useful visitor feedback; do not silently swallow
  errors. A void promise is appropriate only when its failure handling is explicit or guaranteed by
  a documented local contract. Preserve the original error cause without logging visitor input.
- Separate immutable defaults, validated runtime settings and visitor preferences. The developer
  palette updates settings through their owner, not exported constants or React state per frame.
  Store only deliberately persistent preferences; define migration when storage is introduced.
- In review, require accessible names, keyboard/focus behavior and reduced-motion consideration for
  new controls. Async scene work must define behavior for stale results and interrupted navigation.

Semantic constants use SCREAMING_SNAKE_CASE; CSS token keys and runtime setting fields retain
descriptive camelCase APIs. Numerical thresholds, naming and JSDoc coverage remain reviewed rules,
not blanket lint rules that flag ordinary CSS declarations, mathematical identities or assertions.

## Runtime verification

- Mutable vectors, typed arrays and uniforms are intentional in frame work. Do not impose immutable
  state patterns on particle simulation.
- Reuse buffers/temporary math objects in measured hot paths; avoid unnecessary per-frame allocation
  or resource reconstruction. Favor clear code until profiling establishes a hotspot.
- Document units, coordinate spaces, time bases, color spaces and ownership at non-obvious
  boundaries. Public API documentation should explain contracts rather than repeat parameter names.
- Deterministic seeds/time injection where useful for meaningful simulation tests and visual checks.
  Do not force a complete frame-by-frame snapshot specification of the artwork.
- Cancellation-safe preparation; idempotent cleanup; resource/listener/timeline ownership explicit.
  Dispose a scene without destroying shared renderer resources.
- Test substantive math, lifecycle, navigation interruptions and audio phase behavior. Do not copy
  Decksmith's blanket test quota for every trivial exported helper. Reference-device GPU/frame tests
  remain separate from headless functional tests.

## Gates and updates

CI gates now cover formatting, typed lint, typecheck, web/Storybook builds and targeted Playwright
journeys. Component tests live in colocated stories and run through Storybook’s Vitest addon in
Chromium, including play assertions and accessibility checks. Colocated .test.ts/.test.tsx files
cover non-component units and integration journeys. Add meaningful standalone Vitest projects when
substantive runtime/math code is introduced. Local hooks remain deferred; CI is authoritative.

Pin compatible tool versions and update through reviewed changes with appropriate checks, not
unconditional breaking upgrades before every task. No specific Decksmith dependency version is
adopted merely by inspection.

Sources: [Oxlint](https://oxc.rs/docs/guide/usage/linter),
[type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware),
[Oxfmt](https://oxc.rs/docs/guide/usage/formatter). Reviewed 2026-10-07.

React reference:
[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).
