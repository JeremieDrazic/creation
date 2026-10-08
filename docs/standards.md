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

## Standards baseline

English JSDoc is confirmed for public contracts and meaningful non-obvious behavior. Document units,
coordinate spaces, ownership, cancellation, side effects and cleanup where relevant. Use descriptive
@param, @returns, @throws, @remarks or @example tags when they help explain the contract; do not
duplicate TypeScript type annotations or add comments that merely repeat a symbol's name.

Import ordering is confirmed: Node built-ins, external libraries, workspace packages, then relative
modules. Separate groups with a blank line and sort paths alphabetically within each group. Keep
type imports alongside their source group. Preserve evaluation order for side-effect imports.
Automatic sorting still needs to be configured and reviewed in the formatter increment.

The pnpm catalog is already active: external dependencies use `catalog:`; internal packages use
`workspace:*`. Versions are centralized in `pnpm-workspace.yaml`.

- English code/comments/docs; lowercase creation technical names.
- TypeScript strict, noUncheckedIndexedAccess, noImplicitOverride,
  noPropertyAccessFromIndexSignature, isolatedModules and verbatimModuleSyntax where compatible with
  the pinned toolchain. Separate browser/node profiles and retain an explicit typecheck gate.
- Explicit package subpath exports and acyclic dependencies. Avoid aggregate imports that mix pure,
  DOM and graphics modules or eagerly load all experiences. Organize by feature/responsibility;
  colocate meaningful tests and UI stories.
- PascalCase component files; kebab-case logic/directories; .test.ts/.test.tsx and .stories.tsx
  conventions. Generated route files follow the router's requirements.
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
  responsibility. Avoid flat source folders collecting unrelated modules. Closely related functions
  may share a module.
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
- Define the concrete tree for each package when working on it, through file-by-file dialogue. The
  general principles do not preselect every package's future category folders.

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

## Graphics-specific adaptations

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
journeys. Add meaningful Vitest tests when substantive runtime/math code is introduced. Local hooks
remain deferred; CI is authoritative.

Pin compatible tool versions and update through reviewed changes with appropriate checks, not
unconditional breaking upgrades before every task. No specific Decksmith dependency version is
adopted merely by inspection.

Sources: [Oxlint](https://oxc.rs/docs/guide/usage/linter),
[type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware),
[Oxfmt](https://oxc.rs/docs/guide/usage/formatter). Reviewed 2026-10-07.
