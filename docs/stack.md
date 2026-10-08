# Selected stack

All entries below are selected. Exact compatible versions, Node.js/pnpm versions and implementation configuration must be verified and pinned before installing dependencies. Product scaffolding has not started.

| Technology | Responsibility |
| --- | --- |
| TypeScript | Application/runtime code and shader graph authoring. |
| pnpm workspaces + Turborepo | Workspace dependencies, task graph and caching. |
| React + Vite | Accessible DOM interface, development and production bundling. |
| TanStack Router | Typed, thin file-based routes and lazy route composition. |
| Three.js + TSL + WebGPURenderer | Directly owned graphics runtime and programmable GPU materials. |
| StyleX | Component styles, shared semantic tokens and experience themes. |
| GSAP | Finite DOM/SVG/runtime transitions. |
| Native Web Audio | Playback, isolated analysis and audio-clock scheduling. |
| Zustand | Shared low-frequency preferences and runtime-status projections. |
| i18next + react-i18next | FR/EN UI localization. |
| lil-gui | Adapter behind the development-only data-gui package. |
| Storybook, React/Vite | apps/storybook; UI/tokens/icons and interaction review. |
| Vitest + Playwright | Meaningful math/runtime tests and browser journeys. |
| Oxlint + Oxfmt | Linting and formatting, with explicit TypeScript checking. |

## Graphics and React boundary

React owns the UI and visitor intent; direct Three.js owns initialization, particles, resources and frame updates. This fits retained scenes, one renderer and freely staged transitions. React Three Fiber is not selected. This is an ownership choice, not a claim of superior visuals or FPS. See [architecture](architecture.md) and [runtime contracts](runtime-contracts.md).

TSL builds GPU operation graphs from TypeScript; ordinary TypeScript does not run on the GPU. WebGPURenderer offers a WebGL2 fallback, but compute/effect parity must be validated. Do not assume legacy GLSL ShaderMaterial or EffectComposer works unchanged in the node-based pipeline. Pin compatible rendering/effect APIs and validate on real browsers.

## Routing and metadata

Use TanStack Router standalone, without TanStack Start or initial SSR. Keep the canvas/host above route-specific UI. Thin routes describe intent; experience modules own artwork and lifecycle. Inspect imports so heavy graphics are not eagerly loaded through critical route configuration.

Preloading must not activate scenes, attach inputs or play audio. Router cache and GPU residency are separate. Respect back/forward semantics; route selection does not mean visible handover is complete. [Build-time metadata](sharing.md) handles initial-response social previews. No TanStack Query or custom API is justified by current V1 features.

## Styles and motion

Use StyleX with a small global reset/font CSS entry. Compile shared package styles in both web and Storybook; verify HMR, production extraction, static variable imports and themes with the pinned compiler. No ad hoc resolver patches.

design-tokens exposes semantic UI values and StyleX definitions without React/Three.js dependencies. CSS variable references are not shader color/numeric values. Local simulation/palettes remain experience-owned; any shared graphics value needs explicit unit/color conversion.

GSAP owns designated finite transition values. React, CSS and simulation must not compete for the same animated property. Integrate graphics motion with one rendering schedule; use the audio clock for precise sound scheduling. Live music choreography stays generative, not a track-authored timeline.

## Audio and state

Use native Web Audio, without Howler initially, for explicit per-source routing. Isolate the music analysis tap from ambient/UI sounds and output gain policy. FFT alone does not identify beats; smoothing and beat extraction require musical validation. Streaming versus decoded buffers remains a measured memory/latency choice.

Use a scoped vanilla Zustand store with narrow React selectors. Route identity belongs to Router, locale to i18next and typing drafts to local UI. Runtime phase/residency facts remain authoritative in their owner; store snapshots only project them. No particles, FFT arrays, frame pointer samples, GPU objects or import-time renderer/AudioContext singleton in the store. Cross-visit persistence is unselected.

## Tooling integration

Storybook consumes the same UI/tokens/StyleX build conventions as web and is excluded from the public bundle. It complements browser journeys and real-device performance checks.

Verify actual type-aware Oxlint activation and StyleX rule support; an installed dependency does not prove checks run. Use explicit package exports and meaningful tasks. See [standards](standards.md).

## Official references

- [WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer.html), [TSL](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language), [node postprocessing](https://threejs.org/manual/pages/webgpu-postprocessing.html).
- [TanStack Router](https://tanstack.com/router/latest/docs/overview), [splitting](https://tanstack.com/router/latest/docs/guide/code-splitting), [preloading](https://tanstack.com/router/latest/docs/guide/preloading).
- [StyleX Vite](https://stylexjs.com/docs/learn/installation/vite/), [themes](https://stylexjs.com/docs/learn/theming/creating-themes/), [authoring constraints](https://stylexjs.com/docs/learn/styling-ui/defining-styles/).
- [GSAP](https://gsap.com/docs/v3/GSAP/), [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Zustand](https://github.com/pmndrs/zustand).
- [pnpm](https://pnpm.io/workspaces), [Turborepo](https://turborepo.dev/docs/crafting-your-repository/running-tasks), [lil-gui](https://lil-gui.georgealways.com/), [i18next React](https://react.i18next.com/).
- [Storybook React/Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro), [Oxlint](https://oxc.rs/docs/guide/usage/linter), [Oxfmt](https://oxc.rs/docs/guide/usage/formatter).

Research reviewed October 7, 2026; consult version-specific documentation again when pinning dependencies.
