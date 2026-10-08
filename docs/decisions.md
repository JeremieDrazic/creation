# Current decisions

Updated October 8, 2026. Detailed requirements live in the linked documents. Rejected design studies
and superseded framework proposals have been removed from the working documentation.

## Confirmed

| Area          | Decision                                                                                                                            | Reference                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Identity      | Creation honors the Creator; technical identifiers use lowercase creation.                                                          | [Brief](project-brief.md)                 |
| Scope         | Intro homepage and Fireflies; future experiences designed later.                                                                    | [Brief](project-brief.md)                 |
| Devices       | Desktop V1; designed mobile invitation.                                                                                             | [Performance](performance-and-quality.md) |
| Languages     | FR/EN site; French discussion; English code/docs.                                                                                   | [Collaboration](collaboration.md)         |
| Visuals       | Intro study 07; Fireflies atmosphere 09, input direction 11 and states 13.                                                          | [Moodboard](../moodboard/README.md)       |
| Working brand | Cormorant Garamond Light 300 and its plain C; final logo and loader deferred.                                                       | [Branding](branding.md)                   |
| UI            | One recognizable shared identity adapting to each experience; authored SVG icons.                                                   | [Interface](interface-direction.md)       |
| Fireflies     | Single-word formation/editing, interactive reverie, voluntary generative musical passage and gentle return.                         | [Fireflies](experiences/fireflies.md)     |
| Audio         | Voluntary activation; separate music, ambient and UI sounds. Mute during music returns to reverie.                                  | [Sound](sound-design.md)                  |
| Runtime       | One shared renderer/canvas and graphics schedule; experience-owned scenes/effects.                                                  | [Architecture](architecture.md)           |
| Lifecycle     | prepare, activate, update, resize, suspend, resume, dispose.                                                                        | [Architecture](architecture.md)           |
| Residency     | Active, Standby, Released; bounded retention separate from lightweight visitor state.                                               | [Architecture](architecture.md)           |
| Transitions   | Artistic freedom; preparation cancellation and continuous visible handovers.                                                        | [Runtime](runtime-contracts.md)           |
| Visibility    | Pause scene/audio when hidden; gently resume preserved passage; focus loss alone does not pause.                                    | [Runtime](runtime-contracts.md)           |
| Recovery      | Preserve word/phase/playback position; reconstruct rendering, reveal softly, retry on failure.                                      | [Runtime](runtime-contracts.md)           |
| Stack         | React, direct Three.js/TSL/WebGPURenderer, Vite, TanStack Router, StyleX, GSAP, Web Audio, Zustand.                                 | [Stack](stack.md)                         |
| Tooling       | pnpm, Turborepo, lil-gui, i18next/react-i18next, Vitest, Playwright, Storybook, Oxlint/Oxfmt.                                       | [Stack](stack.md)                         |
| Quality       | Lighter rendering/assets, informed recommendation, user choice and targeted preparation workers.                                    | [Performance](performance-and-quality.md) |
| Sharing       | Build-time route-specific HTML metadata and authored preview images; no initial SSR runtime.                                        | [Sharing](sharing.md)                     |
| Delivery      | Stable main, short-lived branches, PRs, checks, previews, reproducible releases and rollback.                                       | [Delivery](delivery.md)                   |
| Learning      | Assistant writes code; owner and assistant study and refine it together.                                                            | [Collaboration](collaboration.md)         |
| Publication   | Owner authorizes committing and publishing the cleaned conception work; previous no-commit instruction is superseded for this work. | [Collaboration](collaboration.md)         |

## Open or deferred

The first workspace PR is authorized. Installed toolchain versions and integration evidence are
recorded in [development](development.md); implementation remains incrementally reviewed.

- Remaining graphics/audio/runtime dependency versions: verify before installing those increments.
- Concrete runtime signatures, clock adapter and numerical simulation choices: establish in bounded
  implementation increments.
- Precise quality profiles, resource/asset budgets, device specifications and performance acceptance
  thresholds.
- English Bible translation, edition attribution and publication permissions; music/ambient/SFX
  assets and licenses.
- Word limits, accepted scripts/accents, validation copy, music restart semantics and detailed
  gesture/keyboard behavior.
- Final control layouts, FR/EN copy, reduced-motion treatment, mobile invitation and tablet
  classification.
- Loader artwork/motion and definitive logo; current C is provisional.
- Domain, locale URL conventions, preview infrastructure, registry, hosting image and production
  deployment procedure.

An open implementation detail does not automatically block earlier increments. A scope, artistic or
architectural change still requires dialogue; production deployment remains separately authorized.
