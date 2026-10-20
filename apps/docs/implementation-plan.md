# Implementation sequence

The assistant prepares code; the owner and assistant study and refine it together. The owner has
authorized the first workspace PR. Its [development guide](development.md) records scope and review
evidence. Subsequent lots remain bounded by dialogue and acceptance evidence.

## Lots

1. **Workspace and verification foundations.** Verify/pin compatible versions; configure
   pnpm/Turborepo and shared TypeScript/Oxlint/Oxfmt; establish web/Storybook shells and useful CI
   gates. Create packages when their first real responsibility appears. Reserve apps/api until there
   is a server requirement.
2. **Minimal experience host.** One renderer/canvas/schedule, viewport/input ownership, lifecycle
   and status boundary. Verify preparation, interrupted navigation, residency, visibility pause and
   rendering recovery with minimal scenes. Preserve artistic transition freedom without building a
   generic engine.
3. **Intro.** Develop the approved interactive celestial veil, typography/full scripture entrance,
   shared controls and voluntary ambience. Review visual fidelity and measured performance together.
4. **Fireflies word and reverie.** Natural motion, depth/light hierarchy, typography-to-particle
   formation, gentle interaction and same-position editing. Validate actual font targets and
   reference-device behavior.
5. **Music and delivery polish.** Isolated frequency/amplitude/beat analysis and generative
   responses, audio/visual transitions, sound design, quality settings, accessibility, mobile
   invitation, social cards and deployment preparation.

Performance and accessibility belong in every lot, not only the last. Each lot includes relevant
tests, visual/motion evidence, explanation and documentation updates. No fixed schedule or
production deployment is implied.

## Current rendering milestone

The minimal rendering foundation is implemented and reviewed incrementally with the owner:

- packages/rendering owns renderer initialization, the Three.js animation callback, frame time,
  coalesced viewport changes and browser visibility subscriptions.
- packages/utils supplies coded errors, DOM visibility/window helpers and independently tested async
  primitives. The rendering loop needs no task queue or request tracker.
- apps/web/src/runtime coordinates prepared experience instances, cancels obsolete preparation,
  projects lifecycle status through a scoped Zustand store and attaches rendering to React.
- RenderingCanvas creates a distinct canvas for each Effect setup, while normal route/locale changes
  retain the shared Shell canvas. Startup cancellation and late-result disposal live in
  attachRenderingRuntime, separate from the React component.
- The static triangle remains temporary. It appears in development-only Shell validation, the
  standalone rendering-probe page and Storybook, not the production web entry.

Unit tests cover resource lifetime, time/viewport calculations, failures and interrupted
preparation. Chromium Storybook tests cover the actual component/runtime with root StrictMode,
resize and unmount/remount. Manual Chrome checks confirm one canvas DOM node survives route and
locale changes. See [runtime contracts](runtime-contracts.md) and [session state](session-state.md)
for current verification and limitations.

## Next bounded objective

The owner requested a PR for this work before intro implementation. Publication of this branch/PR is
authorized; merging and deploying it require a separate instruction.

After PR review, return to the approved intro reference and agree a first visible static celestial
veil increment before coding. Implement the experience through IntroCreation with small reviewed
additions; then develop motion and interactions. Future real scenes must establish artistic
handover, residency, GPU recovery, audio behavior and measured quality budgets. Do not extend a
generic runtime speculatively before a concrete need.

Continuous native-window resize flashing/left-edge latency remains deferred by owner agreement.
Functional resize tests do not prove smooth presented frames. Native WebGPU/device-matrix support,
performance, memory and animated/audio continuity are not accepted yet.

Resolve artistic details in the lot that needs them: English scripture, audio licenses, gesture/text
rules, budgets and deferred loader design. See [current decisions](decisions.md) for unresolved
topics and [collaboration](collaboration.md) for the file-by-file review boundary.
