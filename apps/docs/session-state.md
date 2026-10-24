# Session state

Updated October 24, 2026. Read with AGENTS.md and [collaboration](collaboration.md).

## Checkout and publication

Main remains at merged intro UI commit 662624d. The owner now authorizes commits and pull requests
for the current work, not merging or deployment. Publication is organized as a stack:

1. feat/veil-shared-foundations — numeric/color utilities and reliable browser checks.
2. feat/persistent-experience-selection — independent status store and renderer-preserving
   selection.
3. feat/celestial-veil — extracted data, offline asset, static scene and application integration.
4. A separate data-gui adapter follows this branch; it is not part of this veil increment.

This checkout is on feat/celestial-veil. Final PR URLs and the complete stack handoff follow on the
top branch. No publication scope includes sound or changes to other projects on the VPS.

## Current implementation

Shell mounts one persistent ApplicationRendering behind Outlet. It derives a preparation function
from the route pathname: / selects the lazy intro loader; UI-only Fireflies and unknown routes
select null. App/renderer lifetime is separate from scene selection. The home CSS study backdrop is
removed. Intro UI, language preference and navigation remain connected.

The independent stores/status-store keeps caller-owned flat status snapshots. Runtime/attachment
selection keeps the same renderer, cancels obsolete work and disposes late results. Initial startup
continues to completion before applying a newer selection; retrying the exact same failed callback
is not yet supported. Startup status does not describe navigation progress.

Reference 07 analysis retains 5,676 coordinate candidates and 5,674 representative groups. All
analysis plates and data are preserved for a possible future case study; no physical depth or
particle count is claimed. Depth is authored with low confidence. The owner removed the unused
procedural layout. Method and uncertainty live in moodboard/intro/07-celestial-veil-analysis.md.

The browser loads a generated 622,771-byte asset rather than the 8,542,343-byte annotation.
Regenerate with pnpm --filter @creation/web prepare:veil. Preparation runs offline; one shared
material/geometry and an InstancedMesh draw the grains. Asset loading uses coded errors with the
original cause; cancellation preserves the caller's reason.

The orthographic camera now contains the reference uniformly, keeping grains round at any viewport
aspect. Projection tests cover six aspect ratios. This is a working correction, not final artistic
framing: the owner wants the band to enter and leave through the top/bottom and appear more distant
on compact screens. Perspective/parallax, quiet initial state, local illumination and halos remain
pending. Softness 0.8 is a Storybook proposal; the app still uses the prepared values unchanged.

## Validation and review

The complete working-copy check, including the following GUI adapter, passed 357 unit tests, 27
Storybook component tests, 5 production browser journeys, formatting, lint, types and all builds.
The GUI's eight unit tests belong to that following increment. Isolated branch/remote checks are
reported in the PRs. Production journeys verify persistent canvas identity, direct Fireflies entry
without a veil asset request, language persistence, unknown routes and resizing. Software graphics
checks do not establish native WebGPU support or performance acceptance.

Preserved application captures include the original integration and corrected 1024×768, 1440×900 and
2560×1080 framing. The first-tableau and prepared-data images remain comparison artifacts, not final
visual approval. Owner dev servers were not started/stopped.

Continue file by file with the owner: discuss responsibilities, implement a bounded change, then
study it before advancing. French discussion; English code/comments/docs. Current next work is our
development-only numeric palette, then experience-owned composition controls. Earlier shader and
offline functions still need study as encountered. Session remains active; dependency counter is
unchanged at 2 completed sessions since setup.

## Deferred sound

Sound persistence/application integration remains a separate PR. Preserve stash
e8fa33ebc3aac7f9f656e829c939d9daed6d9217 (deferred sound preference store and persisted story).
Recover selected files rather than blindly popping it over current code. No audio is mounted.

No new merge or deployment is authorized. Main CI still triggers the approved automatic deployment
when the owner chooses to merge. Do not mutate the VPS or other projects as part of PR publication.
