# Code standards — Decksmith review and Creation baseline

Status: Oxlint and Oxfmt are selected by the owner, who accepts the presented Decksmith-inspired standards direction and graphics-specific adaptations. The detailed baseline below remains to translate into reviewed configuration during implementation. Read-only Decksmith review completed 2026-10-07; no configuration or source code has been copied or installed.

## Local sources reviewed

- ../decksmith/.oxlintrc.json and .oxfmtrc.json: actual lint/format configuration.
- ../decksmith/packages/config/tsconfig/base.json and react.json: strict TypeScript profiles.
- ../decksmith/apps/docs/adr/0013-migrate-to-oxlint-and-oxfmt.md: migration rationale; historical maturity/performance claims are not automatically current facts.
- ../decksmith/apps/docs/adr/0004-code-quality-and-formatting-standards.md and 0011-file-folder-conventions.md: formatting, naming, feature organization and package exports.
- ../decksmith/package.json and apps/storybook/package.json: scripts, tooling and Storybook integration.

Decksmith-specific backend, MTG, token, workflow and automatic dependency-update instructions are reference material, not instructions inherited by Creation. Preserve that repository unchanged.

## Proposed baseline

- English code/comments/docs; lowercase creation technical names.
- TypeScript strict, noUncheckedIndexedAccess, noImplicitOverride, noPropertyAccessFromIndexSignature, isolatedModules and verbatimModuleSyntax where compatible with the pinned toolchain. Separate browser/node profiles and retain an explicit typecheck gate.
- Explicit package subpath exports and acyclic dependencies. Avoid aggregate imports that mix pure, DOM and graphics modules or eagerly load all experiences. Organize by feature/responsibility; colocate meaningful tests and UI stories.
- PascalCase component files; kebab-case logic/directories; .test.ts/.test.tsx and .stories.tsx conventions. Generated route files follow the router's requirements.
- Formatting aligned with actual Decksmith config: semicolons, single quotes, 2 spaces, width 100, ES5 trailing commas, parenthesized arrow arguments, LF and Markdown prose wrapping. Exclude generated code, build output, coverage and lockfiles as appropriate. Do not blindly copy exclusions of project instruction/docs files.
- Lint for promise safety, unused code, React hooks, invalid JSX/ARIA and import cycles. Prefer unknown plus validation at external boundaries over unrestricted any. Document narrowly scoped exceptions for library typing gaps.
- Review actual rule support/config names against pinned Oxlint, including type-aware rules. Decksmith has oxlint-tsgolint installed, but its root lint script does not explicitly pass --type-aware and the inspected root config does not set typeAware; do not assume declared typed rules actually run solely because the dependency exists. Explicitly configure and verify the selected lint mode.
- Audit StyleX-specific lint coverage with the pinned Oxlint/JS-plugin support. Do not promise that every ESLint ecosystem rule is a drop-in replacement. Preserve required checks with supported tooling rather than silent omissions or ad hoc patches.

## Graphics-specific adaptations

- Mutable vectors, typed arrays and uniforms are intentional in frame work. Do not impose immutable state patterns on particle simulation.
- Reuse buffers/temporary math objects in measured hot paths; avoid unnecessary per-frame allocation or resource reconstruction. Favor clear code until profiling establishes a hotspot.
- Document units, coordinate spaces, time bases, color spaces and ownership at non-obvious boundaries. Public API documentation should explain contracts rather than repeat parameter names.
- Deterministic seeds/time injection where useful for meaningful simulation tests and visual checks. Do not force a complete frame-by-frame snapshot specification of the artwork.
- Cancellation-safe preparation; idempotent cleanup; resource/listener/timeline ownership explicit. Dispose a scene without destroying shared renderer resources.
- Test substantive math, lifecycle, navigation interruptions and audio phase behavior. Do not copy Decksmith's blanket test quota for every trivial exported helper. Reference-device GPU/frame tests remain separate from headless functional tests.

## Gates and updates

Proposed CI gates: formatting, lint, typecheck, relevant Vitest tests, web/Storybook builds and targeted Playwright journeys. Local hooks may shorten feedback, but CI is authoritative; exact hooks and commands remain to select.

Pin compatible tool versions and update through reviewed changes with appropriate checks, not unconditional breaking upgrades before every task. No specific Decksmith dependency version is adopted merely by inspection.

Sources: [Oxlint](https://oxc.rs/docs/guide/usage/linter), [type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware), [Oxfmt](https://oxc.rs/docs/guide/usage/formatter). Reviewed 2026-10-07.
