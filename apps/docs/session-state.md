# Session state

Updated October 20, 2026. Read with AGENTS.md and [collaboration](collaboration.md).

## Objective, checkout and publication

Current branch: feat/rendering-host, based on the merged workspace foundations at 08f232a. Verify
Git state before resuming; this document is a handoff, not proof of remote state.

The owner requested committing/publishing the rendering work as a PR before intro visual work. That
authorization covers this branch and its PR, not merging or deploying it. The prior workspace PR is
merged/deployed. Main-branch CI automatically deploys; do not merge implicitly.

Current review boundary: rendering foundations PR before intro implementation. Generated artifacts
are excluded and current docs refreshed. Verify the live GitHub PR and CI status before resuming
subsequent work; the local handoff does not authorize a merge.

## Implemented foundation

- packages/rendering: initialized WebGPURenderer host, direct Three.js setAnimationLoop integration,
  frame clock, coalesced frame-time viewport application and rendering-session assembly. Visibility
  stops application frames and suspends the experience; resume excludes hidden time and remeasures
  dimensions before drawing. Disposal/cancellation preserve diagnostic failures.
- packages/utils: CodedError, getElementWindow, page visibility observer, async task queue and
  request tracker. Async primitives remain independently available; the simplified loop does not use
  them.
- App root types define the prepared experience lifecycle. ExperienceCoordinator owns the active
  instance, keeps it usable while preparing a replacement, cancels superseded preparation and waits
  for all pending work during disposal. Transition choreography/residency remain future work.
- createRenderingRuntime connects the session/coordinator, reports initial preparation/readiness/
  failure and caches ordered disposal. Callers create their scoped Zustand status store before
  starting and pass only publishStatus. Preparing progress is 0–1 or null when unmeasurable; no real
  asset progress source exists yet. Ready wording belongs to localized UI.
- RenderingCanvas owns canvas DOM and attaches the runtime through the adjacent
  attachRenderingRuntime function. Attachment handles cancellation, late successful results and
  cleanup errors. useEffectEvent reports to the latest error handler without renderer recreation.
  Stable startup inputs are distinct from navigation; changing them recreates the runtime.
- Shell owns one status store and mounts a development-only temporary validation panel above Outlet.
  Both the canvas component and static probe are lazy-loaded and absent from the production web
  bundle. The panel's 40svh layout, pixel cap 2 and delta cap 0.05 seconds are test settings.
- The standalone /rendering-probe.html harness and triangle experience remain temporary. They are
  not intro artwork or a production organization template. Intro/Fireflies production classes and
  artistic implementation have not begun.

## Verification and limits

Full local pnpm check passed October 20 before publication: formatting, typed lint, workspace
TypeScript, web/docs/Storybook builds, 221 unit tests (112 rendering, 19 utils, 90 web), 5 Chromium
Storybook component tests and 4 production browser journeys. Automated previews ended normally; the
owner's development servers were untouched. Check the remote CI result separately.

RenderingCanvas stories use the real runtime/store and static probe with root StrictMode. The
visible static/failure stories only inspect state. LifecycleChecks (!dev/!autodocs) retains
resize/rerender/unmount actions for automated tests; those actions previously ran on every opening
and caused the apparent wide-to-narrow flash. Five component tests pass after separating them.

Manual Chrome: visible triangle, one original canvas DOM node retained across Home → Fireflies →
Home and French → English → French, ready status and no captured warning/error logs. Both routes
still draw the triangle; this is persistent attachment evidence, not artistic experience switching.
Earlier checks covered controlled visibility suspension/resume and repeated POC mounting. Diagnostic
references/instrumentation and temporary viewport/focus overrides were removed. French was restored.
The owner manages development servers; an outdated Vite Zustand cache required their attention
before the successful check. Do not start/stop those servers.

Continuous native-window resize still briefly hides the triangle, with left-edge latency reported in
both loop comparisons. The owner explicitly deferred investigation to real experience work.
Frame-coherent buffer/camera/draw updates and functional size tests do not establish smooth browser
presentation. Native WebGPU/device-matrix acceptance, 60 fps, memory budgets, graphics recovery and
animated/audio continuity remain unvalidated. Preparation/handover tests do not establish artistic
transitions or standby residency.

## Collaboration and next increment

Continue in French; code/comments/docs in English. Use small additions within a file, explain and
study them before moving on. The owner understands individual functions better than their assembly;
use concrete responsibilities and ASCII diagrams. Prefer descriptive names, explicit if guards
instead of ??=, pure module helpers and clear closure/resource ownership. Runtime-specific helpers
are not generic utils; rendering utils must not import feature implementation/error files. Shared
types belong in src/types.ts, module-specific options stay local. Errors use domain codes/causes.

After the rendering PR review, agree the first visible static intro tableau using the approved
celestial-veil reference before coding. Real experiences live in apps/web/src/experiences with
IntroCreation/FirefliesCreation implementing the shared contract, no base class. Use intro-ui and
fireflies-ui names. Each asset's masters and delivered exports share one asset folder with a README.
See [architecture](architecture.md), [implementation plan](implementation-plan.md) and
[research references](research/references.md). Symphony of Vines informs intro, abstract nature,
interaction, coherent DA/UI and sound; Creation selects scenes rather than chaining chapters.
Theatre.js remains research only; GSAP is selected.

## Toolchain checkpoint

Node 24.13+, pnpm 12.10.1. React/react-dom were explicitly audited and updated to 19.3.1; types stay
19.3.0. Three.js 0.186.1/types 0.186.0 and Zustand 5.0.15 are catalog-pinned. This was focused
integration/version work, not a full periodic dependency review. Checkpoint: 1 completed session
since setup; default dedicated review every five completed sessions or before a relevant milestone.
No additional session closure has been requested. Session skills live in .agents/skills; discovery
may require refreshing the workspace. Do not silently update dependencies on resume.

Automated previews use 4173 (web), 4174 (docs) and 4175 (Storybook); Storybook development stays on
6006 so checks do not require stopping the owner's server. Generated VitePress caches and Storybook
debug logs are ignored, not source artifacts.
