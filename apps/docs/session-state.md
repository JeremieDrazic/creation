# Session state

Updated October 24, 2026. Read with AGENTS.md and [collaboration](collaboration.md).

## Checkout and publication

The owner requests commits and pull requests for the current work. Main remains at merged intro UI
commit 662624d13ba18301713612d9b637888ce1dab318. Work is organized into four stacked branches:

1. [PR #4](https://github.com/JeremieDrazic/creation/pull/4), feat/veil-shared-foundations —
   numeric/color utilities and reliable browser checks; base main; ready for review.
2. [PR #5](https://github.com/JeremieDrazic/creation/pull/5), feat/persistent-experience-selection —
   independent status store and renderer-preserving selection; base feat/veil-shared-foundations;
   ready for review.
3. [PR #6](https://github.com/JeremieDrazic/creation/pull/6), feat/celestial-veil — extracted data,
   offline asset, static scene and application integration; base
   feat/persistent-experience-selection; draft artistic/code review.
4. [PR #7](https://github.com/JeremieDrazic/creation/pull/7), feat/data-gui — first numeric palette
   adapter; base feat/celestial-veil; draft owner study.

This is the top branch, feat/data-gui. All four branches are pushed. Independent PR CI passed on
each published implementation commit; this final documentation update reruns the top PR check.
Review the stack in the order above. No merge or deployment is authorized. PR CI does not deploy; a
future owner-approved merge into main triggers the existing deployment workflow.

## Current implementation

Shell mounts one persistent ApplicationRendering behind Outlet and selects preparation from the
router pathname: / lazily prepares IntroCreation, while UI-only Fireflies and unknown routes select
null. The home CSS study backdrop is removed. Interface, localization and navigation remain intact.
The graphics layer is decorative and does not intercept input; interaction ownership is future work.

ApplicationRendering receives preparation as a prop and imports no experience/router. It owns the
status-store instance, display-density reader, frame-delta cap and diagnostics. RenderingCanvas has
separate lifetime and selection Effects. The attachment returns selectExperience/detach, keeps the
latest startup request and safely disposes late results. Runtime selection reuses the coordinator
and renderer, retaining the current scene until replacement is ready. Null clears pixels/resources.
Initial preparation still completes before applying newer startup requests; selecting the same
failed callback again does not retry it. Startup status does not describe navigation progress.

stores/status-store exports generic createStatusStore with caller-owned shape/initial value,
publication and read-only subscriptions. Snapshots are copied/shallow-frozen and deduplicated.
packages/utils owns clampUnit, RGB validation and numeric sRGB conversion with colocated tests.

The reference analysis retains 5,676 coordinate candidates and 5,674 representative groups, with
reviewed U2/U4 merges. Counts, labels, colors and depth remain image-derived authoring hypotheses;
no physical depth reconstruction is claimed. All plates/data are preserved for a possible case
study. The owner removed the earlier unused procedural layout. See the moodboard analysis and intro
reference for measurements, uncertainties and artistic requirements.

The browser fetches a generated 622,771-byte asset instead of the 8,542,343-byte annotation.
Regenerate with pnpm --filter @creation/web prepare:veil. Fixed calculations run offline; one
InstancedMesh shares geometry/material. Loading failures use a stable code and original cause;
cancellation keeps the caller reason. Full-source freshness and scene/lifecycle tests are present.

The orthographic camera contains the reference uniformly across aspect ratios. Grains retain round
proportions; the 3:1 reference projection is unchanged. The owner finds containment too compact and
wants the band to enter/leave through top/bottom, appear more distant on compact screens, and later
have subtle parallax. Uniform extent, orientation, placement and independent grain size are the next
controls to explore. Perspective remains pending. Softness 0.8 is a Storybook proposal, not baked
into the application asset. Quiet initial state, local illumination and halos are unimplemented.

packages/data-gui wraps lil-gui 0.21.0 with createDataGui, numeric-property bindings, separate live
and finish callbacks, validated ranges and idempotent disposal. The caller owns settings/container.
The adapter has no React/renderer/experience dependency and is not connected to the intro yet. Next
imports must be lazy and development-guarded so the package stays out of production output.
Watch/metric controls and presets remain later scope; do not rebuild grain buffers on slider ticks.

## Verification and review boundary

Full pnpm check passes: formatting, typed lint, root/workspace TypeScript, all site builds, 357 unit
tests (112 rendering, 59 utils, 178 web, 8 data-gui), 27 Storybook browser tests and 5 production
browser journeys. These cover route/locale behavior, persistent canvas identity, direct Fireflies
entry without a veil request, unknown routes, live resizing and extracted CSS. Native WebGPU/device
performance, resize presentation smoothness and artistic continuity remain unaccepted; browser
graphics tests use software rendering.

A temporary data-gui browser probe verifies real numeric editing, live/committed notifications,
clamping and cleanup without removing its owner container. Its screenshot and all earlier veil
plates/captures remain in moodboard/intro. No owner dev servers were started or stopped.

Component tests now inject styles under Vitest only, preoptimize the injector and run files
sequentially. This avoids racing extracted-CSS refresh and concurrent graphics setup. Short arrow
motion observers start before hover; initial underline style is awaited. Production animations and
normal app/Storybook CSS extraction are unchanged; production journeys validate the extraction path.

The last work is saved for review, not final visual acceptance. Resume owner study of createDataGui,
then add experience-owned composition settings and the development-only palette binding. Continue
file by file: discuss responsibility, implement a bounded increment, then study it together. Earlier
shader/offline calculations still need explanation when encountered. Discuss in French; write code,
comments and docs in English. Session remains active; the dependency counter stays at 2.

## Deferred sound and publication limits

Sound persistence/application integration remains separate. Preserve stash
e8fa33ebc3aac7f9f656e829c939d9daed6d9217 (deferred sound store and persisted story); recover
selected files rather than blindly popping it. No audio is mounted. Publication does not authorize
merging, deployment, VPS mutation or changes to other projects. See delivery.md for the existing
main-only CI/deployment workflow.
