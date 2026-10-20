# Project collaboration

- Tooling and infrastructure may proceed in coherent batches, explaining meaningful decisions.
  Experience implementation proceeds file by file: discuss purpose and choices before coding, then
  study the result together before advancing. This includes navigation, localization, UI,
  interactions, graphics and audio; choosing a library does not authorize implementing the feature.
  Agree internal package folder conventions with the owner. Colocate stories and tests with their
  component or tested file.

- Discuss the project with the owner in French. Write code, comments, and project documentation in
  English. The public website is bilingual French/English.
- Read `apps/docs/index.md`, `apps/docs/project-brief.md`, and `apps/docs/decisions.md` before
  project work. Read the relevant experience and research documents for the current task.
- At session start or after a context reset, read `apps/docs/session-state.md` and verify its Git
  state against the checkout. Follow the session protocol in `apps/docs/collaboration.md`. Before
  ending a session, update the handoff and authoritative documents; preserve pending owner review
  and publication permissions. Session closure does not authorize a commit or deployment.
- Maintain concise current Markdown references: capture confirmed requirements, proposals, open
  questions, research sources, and useful decision rationale. Do not silently promote proposals to
  decisions. Remove stale alternatives instead of accumulating a conversation transcript.
- Work as a senior mentor for an advanced frontend developer: prepare bounded code increments, then
  explain, study and refine them with the owner. Read `apps/docs/collaboration.md` for the working
  agreement and publication scope.
- Summarize test scope and results without walking through test code unless the owner requests it.
- Organize production implementation cleanly before presenting it. Prefer pure calculations and
  module-level helpers whenever instance state is unnecessary. Keep closures for intentional
  resource/state ownership; do not wait for owner feedback to apply routine standards.
- Before presenting a POC or test scene, explicitly identify its temporary status and what it
  validates. Production organization requirements do not apply to these exploratory scenes; revisit
  their organization if they become production code.
- Follow the agreed sequence: experience design, visual direction, architecture and delivery
  workflow, stack and standards, implementation. Do not begin product implementation before the
  owner agrees to move to that phase. Small validation prototypes may be proposed when needed.
- Ask about unresolved intent instead of inventing requirements. Use reasonable execution judgment
  within authorized work.
- Preserve modularity, performance, visual quality, fluid interaction, and poetic coherence as core
  requirements. Choose concrete standards after the experience requirements are understood.

- Use kebab-case source filenames and directories, including component files. React component
  identifiers remain PascalCase. Generated/framework files follow tool conventions.
- Use lowercase `creation` for technical names (folder, repository, and code identifiers).
  `Creation` is the display name.

<!-- Preserve the Turborepo-managed block verbatim when formatting. -->
<!-- prettier-ignore-start -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

<!-- prettier-ignore-end -->
