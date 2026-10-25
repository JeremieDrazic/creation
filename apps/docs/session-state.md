# Session state

Updated October 25, 2026. Read with AGENTS.md and [collaboration](collaboration.md).

## Checkout and publication

The owner requests committing and opening one PR for the current work, then returning to image
analysis. Current branch: feat/veil-composition. The PR targets main directly and consolidates the
previously reviewed persistent-selection, static veil and initial GUI work with the current
composition controls, reusable preset workbench and preserved framing studies.

Remote verification: origin/main remains e600d1e (PR #4). PR #5 targeted
feat/veil-shared-foundations, #6 targeted feat/persistent-experience-selection, and #7 targeted
feat/celestial-veil; their merges into intermediate branches did not propagate into main. This PR
deliberately carries those missing changes, rather than opening another stacked PR. Its body
explains that scope and review order.

Commit/push/PR publication is authorized; merging/deployment is not requested. PR CI never deploys.
The source and visual artifacts were backed up before publication. Preserve the deferred sound
stash. The PR URL and final remote checks will be recorded after creation. Code and static framing
remain working increments; publication does not accept final artwork.

## Current implementation

Shell mounts one persistent ApplicationRendering behind Outlet and selects preparation from the
router pathname: / lazily prepares IntroCreation, while UI-only Fireflies and unknown routes select
null. The home CSS study backdrop is removed. Interface, localization and navigation remain intact.
The graphics layer is decorative and does not intercept input; interaction ownership is future work.

ApplicationRendering receives preparation as a prop and imports no experience/router. It owns the
status-store instance, display-density reader, frame-delta cap and diagnostics. RenderingCanvas has
separate lifetime and selection Effects. The attachment returns selectExperience/dispose, keeps the
latest startup request and safely disposes late results. Runtime selection reuses the coordinator
and renderer, retaining the current scene until replacement is ready. Null clears pixels/resources.
removeActiveExperience cancels preparation and releases the active scene while keeping its
coordinator reusable; clear is reserved here for canvas pixels. Attachment dispose starts runtime
cleanup and reports failures through onError; it remains synchronous. Initial preparation still
completes before applying newer startup requests; selecting the same failed callback again does not
retry it. Startup status does not describe navigation progress.

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
controls to explore. celestial-veil-composition.ts now defines mutable per-instance settings and a
fresh neutral-value factory: rotationDegrees, scale, offsetXViewportRatio, offsetYViewportRatio and
grainScale. CelestialVeil.setComposition now copies/applies the settings and resize reapplies
viewport-relative placement. Rotation and uniform scale use the reference center; grain size changes
only the shared quad and bounds, preserving instance buffers and depth order. The development GUI
now applies live edits; default rendering retains neutral settings. Perspective remains pending.
Softness 0.8 is a Storybook proposal, not baked into the application asset. Quiet initial state,
local illumination and halos are unimplemented.

packages/data-gui now owns the complete reusable workbench. createSettingsControls accepts numeric
defaults/field definitions and one application callback, owns values/reset/schema validation and
notifications, and exposes copied snapshots. createWorkbench owns fields, actions, preset UI and
floating surface. The owner explicitly requests an existing library for dropdown behavior: the
preset view now uses Base UI 1.9.0 Select, Collapsible, Input and Button. The native select is gone;
Base UI owns keyboard/focus/positioning and the package owns styling. A small owned React-root
adapter connects that presentation to the unchanged preset manager; root unmount is deferred to a
microtask to avoid reentrancy during a React host commit. Models/storage and low-level DOM surface
remain framework-independent. The app mount bridge supplies only i18n/storage/source
selection/disposal; the intro instantiates the source with five fields and binds
veil.setComposition. No DOM/preset/reset/ copy behavior remains in the experience.
Runtime/coordinator stay unaware of GUI.

The title is now Réglages/Controls in restrained utility type; experience name uses the display
face. Authored SVG strokes replace the minus/plus glyph. The surface minimizes to an 88px draggable
handle and sliders are more visible. Labels/settings/position/selection survive locale changes. The
package owns save/update, selection, rename, delete, modification state, portable import/export and
current-settings copy. Reset restores defaults without deleting presets. Files use version 1, scope
and named numeric snapshots. Validation precedes application/writes; failed persistence retains the
previous saved data. Unsaved changes remain instance-local.

A separate data-gui Vite entry provides a serve-only file endpoint. The application configures root
development-presets/, with intro.json created on first save. This makes owner presets visible to
both owner and agent through the filesystem, not only a browser profile. Writes are atomic and
serialized. Browser tests use an isolated per-server node_modules cache; never inspect those test
presets as owner artwork. The endpoint/authoring files do not ship in builds/previews. The browser
package graph remains dev-guarded. Vite's existing catalog version was reused as a data-gui dev
dependency. Base UI is pinned at 1.9.0; existing React/React DOM versions are package peers, with
seven new dependency packages and no existing-version upgrades. Watch/metric controls and production
Easter egg remain future scope. The framing simulation images remain pending owner review; no
artistic defaults or prepared data changed during this GUI increment.

## Verification and review boundary

Full pnpm check passes: formatting, typed lint, root/workspace TypeScript, all site builds, 396 unit
tests (112 rendering, 59 utils, 191 web, 34 data-gui), 27 Storybook browser tests and 10 browser
journeys. These include five development-panel journeys and five production journeys. The new
coverage checks center-based composition/resize, settings-copy ownership, reversible grain sizing
without instance-buffer writes, stale registration cleanup, actual canvas-image changes on live
edits, pointer/keyboard movement, collapse/expand, retained panel and canvas across routes,
current-experience controls, viewport containment after dragging and resizing, actual clipboard
JSON, restoration of default values and live translation without losing edited values or position.
Preset tests cover persistence across reload, A/B selection, rename/delete/import/export, invalid
imports without data loss, failed-write rollback and actual atomic authoring files through Vite.
Base UI browser coverage additionally verifies the rendered trigger is a button, keyboard
selection/typeahead, Escape cancellation, outside-click dismissal and constrained popup placement.
Tests never write root owner presets. No owner presets exist yet; intro.json is created on first
save. The new minimal/expanded captures are moodboard/intro/07-development-panel-minimized.png and
07-development-panel-presets.png. Current Base UI captures are 07-development-panel-base-ui.png and
07-development-panel-base-ui-popup.png; all use test snapshots, not accepted artwork.

A subpixel measurement issue found by the bounds journey was corrected by measuring the panel's
actual rectangle and rounding its dimensions up before containment. Production tests assert that the
development panel is absent; a built-asset scan finds no GUI panel, library or development-binding
markers. Browser graphics use software rendering. Native WebGPU/device performance, presented resize
smoothness, touch interaction and artistic continuity remain unaccepted. Test-owned servers were
started/stopped; owner development servers were untouched. The preset/workbench increment passes the
complete check; simulation images and metadata are preserved separately from production data.

Component tests now inject styles under Vitest only, preoptimize the injector and run files
sequentially. This avoids racing extracted-CSS refresh and concurrent graphics setup. Short arrow
motion observers start before hover; initial underline style is awaited. Production animations and
normal app/Storybook CSS extraction are unchanged; production journeys validate the extraction path.

A temporary extended-field study now lives in moodboard/intro/07-framing-study: four screen sizes,
current/wide/1.22× comparisons, full PNGs, overview, construction notes and measurements. All 5,674
source grains remain; 8,000 synthetic grains extend/blend tails only in the study. The production
asset is unchanged. Anchor candidates are bottom X=43%, top X=91%, center X=67%, with 1,000 world
units visible vertically at baseline and grain multiplier 0.85. All eight proposed views contain
particles near both top/bottom edges; appearance is not accepted. The temporary runner remains
outside production source. This validates static composition feasibility, not animated bounded zoom.

Next: after PR publication, resume analysis of the preserved framing images with the owner. Choose
visual presence and anchors/zoom range before any new graphics implementation, then prepare an
offline extension and production framing as separate reviewed graphics increments. The current
neutral containment remains compact; the GUI is a working tool, not artistic acceptance. Resume
file-by-file study for graphics changes; no GUI lesson is required unless requested. Earlier
shader/offline calculations still need explanation when encountered. Discuss in French; write
code/comments/docs in English. Session remains active; the dependency counter stays at 2.

## Deferred sound and publication limits

Sound persistence/application integration remains separate. Preserve stash
e8fa33ebc3aac7f9f656e829c939d9daed6d9217 (deferred sound store and persisted story); recover
selected files rather than blindly popping it. No audio is mounted. Publication does not authorize
merging, deployment, VPS mutation or changes to other projects. See delivery.md for the existing
main-only CI/deployment workflow.
