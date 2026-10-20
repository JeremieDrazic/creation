# Architecture

The monorepo responsibility map, shared renderer, lifecycle and resource states are confirmed.
Concrete exports/contracts and budgets are established during implementation.

## Target structure

Each coherent module has a named folder with shallow nesting, following the confirmed
[organization standards](standards.md#internal-organization--confirmed-principles). Stories and
tests live beside their module; Storybook hosts them without owning their source. Required tool
entry files retain their conventional locations. Establish each future package's concrete
organization when its responsibilities become real. Token families are an explicit exception: use
flat descriptive .stylex.ts files without a folder per family.

```text
apps/
  web/                  # Routes, shared shell, intro and Fireflies feature modules
  storybook/            # UI, tokens, icons and interaction review
  docs/                 # VitePress Markdown reference and technical explanations
  api/                  # Reserved; create only for a confirmed server requirement
packages/
  experience-core/      # Small framework-independent lifecycle/input/capability contracts
  rendering/            # Host, renderer, composition and GPU resource ownership
  audio/                # Playback, buses, scheduling and feature extraction
  ui/                   # Accessible controls and explicit icons exports
  design-tokens/        # Shared semantic values and StyleX definitions
  data-gui/             # Development watch/tweak palette and metric adapters
  utils/                # Experience-independent pure, DOM and WebGL helpers
  config/               # Shared tooling configuration
moodboard/
```

Create packages for actual responsibilities, not empty placeholders. Intro and Fireflies initially
live as independent lazy feature modules in web; they do not import one another's implementation.
Packages expose focused entry points and never import application internals. Keep dependencies
acyclic. Extract an experience package only when independent consumption warrants it.

### Experience folder organization — confirmed

The owner accepts intro and Fireflies as independently lazy-loaded feature modules in apps/web, with
shared technical services in packages. Experience packages become useful when a real independent
consumer or separate delivery boundary exists; source folder separation alone does not require
another workspace package.

Agreed organization, created only as each responsibility is implemented; effect/component names
below illustrate possible responsibilities:

```text
apps/web/src/
  types.ts
  routes/
  shell/
  runtime/
    experience-coordinator/
      experience-coordinator.ts
      experience-coordinator.test.ts
  experiences/
    intro/
      intro-creation.ts
      intro-creation.test.ts
      celestial-veil/
        celestial-veil.ts
        celestial-veil.test.ts
      intro-ui/
        intro-ui.tsx
        intro-ui.stories.tsx
    fireflies/
      fireflies-creation.ts
      fireflies-creation.test.ts
      firefly-simulation/
        firefly-simulation.ts
        firefly-simulation.test.ts
      fireflies-ui/
        fireflies-ui.tsx
        fireflies-ui.stories.tsx
```

These effect/UI filenames describe possible responsibilities, not approved implementations. Each
experience owns its class, local effects/simulation, artistic configuration, UI and resources.
Routes request entry/navigation; the application coordinator manages preparation, selection and
handover using shared services. Shared app vocabulary stays in src/types.ts as agreed; local types
stay with their owning module. Rendering/audio/utils packages import no application implementation.
Experiences use shared services without importing another experience's implementation. Coordinator
code loads the selected experience through its specific entry, avoiding eager aggregate imports.
Experience-specific components live inside intro-ui or fireflies-ui, each in its own named folder
with colocated stories/tests. Shared controls remain in packages/ui. Move a concrete effect to a
shared package when actual consumers justify that boundary. Do not create placeholder
folders/packages before their first authorized implementation.

### Experience assets — confirmed organization

The owner expects jointly authored graphics, mapping images, Blender models and textures. Keep one
folder per asset inside its experience: `apps/web/src/experiences/<name>/assets/<asset-name>`.
Editable sources, browser exports and authoring notes stay together so they are easy to find and
revise. Create folders only when an actual asset is introduced. The approved moodboard remains the
visual research reference.

```text
apps/web/src/experiences/
  intro/
    assets/
      veil-density/
        veil-density-original.png
        veil-density.png
        README.md
  fireflies/
    assets/
      firefly/
        firefly.blend
        firefly.glb
        README.md
```

Names/formats are illustrative, not committed V1 asset choices. Authoring notes record source or
generation method, useful prompt/settings, transformations and export steps. Preserve editable
masters when exporting optimized delivery files. Code references only delivery files; editable
sources are not imported, copied by a build plugin or included through broad asset globs.
Experience-local imports, including explicit ?url imports for model/texture files, let Vite emit
versioned asset URLs. Importing a URL does not replace asynchronous loading/decoding/GPU preparation
or guarantee that the asset is fetched lazily; verify loading behavior and size as assets are
introduced. Use public only for concrete requirements such as stable filenames; files there are
copied unchanged. See [Vite asset handling](https://vite.dev/guide/assets.html).

Choose export formats according to usage: mappings/masks may encode numerical data and need
different precision/color/compression handling than displayed images. Compression/quality settings,
large binary versioning and any future storage service remain to agree with actual assets; no Git
LFS, asset hosting or new asset pipeline is selected by this folder convention.

## Ownership

React owns accessible UI and visitor intent. A coordinator manages preparation, navigation, handover
and residency. A persistent host owns one canvas, one renderer/context and one graphics schedule.
Experiences own scenes, cameras, simulation, local effects and artistic behavior. Audio owns
playback/analysis, not experience choreography. See [runtime contracts](runtime-contracts.md).

The host owns viewport, internal resolution and final output conversion. Set render state explicitly
for each pass; retain separate per-experience effect pipelines. Use a linear intermediate convention
and one final display conversion; exact tone mapping remains to validate. Frame-frequency data stays
outside React/Zustand updates.

The rendering-viewport module tracks pending measurements through createRenderingViewport.
requestViewportMeasurement marks layout/resolution for checking; readViewportForFrame reads the
caller-supplied synchronous measurement only when requested, including the first frame. It reports
dimensions, whether they changed from the last drawable viewport, and whether a physical drawing
area exists. Host resize and experience camera/effect changes remain their respective owners' work
and must happen before drawing in that same frame. The module owns no DOM subscriptions or graphics
resources. See the concrete viewport contract in [runtime contracts](runtime-contracts.md).

At the owner's request, standalone rendering helpers live in src/utils with one folder per function,
using the function's kebab-case name for both folder and source file. hasDrawableArea and
hasViewportChanged live in has-drawable-area and has-viewport-changed with colocated tests. Shared
rendering contracts (viewport, frame time, host, loop, viewport controller, session and resize
observer) live with JSDoc in src/types.ts, exported through @creation/rendering/types. This file has
no runtime imports or dependencies on implementation modules. Existing module type exports remain
compatible. Module-specific options and preparation inputs stay with their owning module.

Production rendering helpers may import other utilities, shared root types and external packages;
they must not import implementation modules or their error constants. Callers supply their domain
error codes explicitly. This keeps dependencies directed from the owning modules toward utilities.
Keep utils grouped by actual rendering responsibility rather than collecting unrelated helpers in a
flat folder.

Helpers with explicit side-effect dependencies also belong in src/utils by responsibility.
reportRenderingFrameFailure receives shutdown, error handlers and the reported code explicitly.
Utils does not mean that every helper is pure; document effects and ownership.

## Lifecycle

Confirmed implementation direction: concrete IntroCreation and FirefliesCreation classes implement a
common CreationExperience interface. No shared Creation base class is planned initially. Classes own
coherent experience state and behavior; pure calculations remain ordinary functions, and reusable
effects/systems are composed as separate objects. Small resource/state owners may still use
closures. Async preparation precedes activation. Activation enables designated work/inputs; artistic
appearance and transition choreography are separate responsibilities. The owner accepts static async
preparation, such as IntroCreation.prepare(...), with a private constructor to return only a
prepared instance. Preparation releases partially acquired resources on failure/cancellation. The
first common contract is implemented in apps/web/src/types.ts, following the owner's root-file
convention for shared vocabulary. CreationExperience and CreationExperiencePreparationOptions import
only graphics types; rendering does not import web contracts. No new experience-core package is
created while the experiences have only this application as a consumer. Interface signatures await
owner review; concrete experience classes and preparation/rendering integration remain later
increments.

| Operation | Responsibility                                                      |
| --------- | ------------------------------------------------------------------- |
| prepare   | Load source assets, prepare CPU data and required render resources. |
| activate  | Enter the experience and attach designated inputs.                  |
| update    | Advance active/transitioning work within the shared schedule.       |
| resize    | Apply current composition/render dimensions.                        |
| suspend   | Stop work/input while retaining owned resources/state.              |
| resume    | Reapply viewport and continue without hidden elapsed-time catch-up. |
| dispose   | Release owned resources, listeners, timelines and subscriptions.    |

These are conceptual responsibilities, not final TypeScript signatures. Outgoing resources remain
usable through handover; route component unmount does not dispose the retained scene. A scene must
not dispose shared renderer/resources still used by another consumer.

## Resource residency

| State    | Behavior                                                                                                                               | Return                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Active   | Update/render when scheduled; only the designated experience receives gestures. Two scenes may render during a transition.             | Already active.                                   |
| Standby  | No updates, rendering or gesture handling. Retain resources within budget; detach active observers/watches and suspend local playback. | Resume with current viewport/profile.             |
| Released | Dispose scene-owned GPU resources and runtime subscriptions. Separately owned lightweight state/source assets may remain.              | Prepare again, restore supported state, activate. |

Active → Standby after handover; Standby → Released on eviction. Residency is distinct from artistic
phase and temporary hidden-page suspension. GPU loss invalidates retained resources, including
Standby scenes. Keep visitor word/phase/playback state separate from GPU objects; exact particle
positions need not survive reconstruction.

Bounded retention is confirmed; retaining intro plus the recent experience is the proposed V1
policy, subject to measurement. Do not retain every future scene or quality variant.

## Artistic transitions

Composition is an extension point, not a mandatory crossfade. Support masks, camera/scene movement,
reveals and UI/audio staging as each journey needs them. Orchestration coordinates readiness,
continuity, input ownership and cleanup without prescribing artwork.

Two live effect pipelines plus transition buffers cost GPU work/memory; one renderer does not remove
that cost. Single-scene fade sequences or a frozen outgoing image are fallback possibilities,
reviewed for artistic impact rather than silently imposed. See
[performance](performance-and-quality.md).

## Developer palette and utilities

data-gui uses the selected lil-gui adapter and supports direct object/property tweak bindings,
property/getter watches and bounded metrics. Values work without the palette. Avoid buffer rebuilds
on every slider tick; costly settings may require explicit apply. Preset import/export/reset is
proposed; defaults remain experience-owned.

Metrics use bounded samples and slower UI refresh, with detachable adapters. Counters are not exact
GPU-memory measurements; unavailable GPU timings must be labeled as such. Exclude data-gui from
production bundles, not just from visible UI.

utils contains no experience behavior. Group modules by responsibility: src/errors groups
error-related utilities, with each coherent module in its own folder, such as errors/coded-errors.
There is no pure directory. Each focused export must avoid loading unrelated browser/rendering
dependencies. Future helpers that depend on DOM or WebGL must indicate that environment in their
folder/export. Document side-effect ownership/cleanup in browser helpers. Add helpers for real
needs.

The environment-independent async task queue lives in utils/src/async/task-queue and is exported as
@creation/utils/async/task-queue. createAsyncTaskQueue().enqueueTask(task) executes tasks in
submission order, preserves each result or failure, and continues after a failed task. Reuse this
utility when sequential asynchronous execution is needed instead of duplicating promise chains. The
owner explicitly requested shared placement for discoverability. It does not own cancellation,
resource cleanup or domain error codes. Do not await another task on the same queue from inside a
running task; it would wait for its own completion.

Request tracking lives in utils/src/async/request-tracker, exported through
@creation/utils/async/request-tracker. createRequestTracker().registerRequest() returns a request
with isLatestRequest(): it remains current until another request is registered on that tracker.
Register on receipt, before queuing/awaiting work, then check before applying results that could
override newer intent. Reuse this utility for that specific need. It does not schedule or cancel
work and does not select domain failure policies. Both async utilities remain available for future
concrete needs; the initialized-renderer loop does not use them.

The browser-bound page visibility observer lives in utils/src/dom/page-visibility and is exported
through @creation/utils/dom/page-visibility. createPageVisibilityObserver receives a document and a
synchronous onVisibilityChange callback, reports initial visibility, then listens to
visibilitychange only. dispose removes its listener once. The caller owns scene/audio/clock
suspension. Utils keeps its environment-independent TypeScript profile and adds tsconfig.dom.json
for DOM helpers; its typecheck script verifies both profiles without introducing browser globals
into async/error modules.

## API scope

No confirmed V1 feature needs a custom API. Words, procedural visuals and audio analysis run in the
browser; assets are files. Revisit for persistence, shared state, privileged services or multiplayer
signaling. Visitor music does not itself imply upload.

References: [render targets](https://threejs.org/manual/pages/rendertargets.html),
[color management](https://threejs.org/manual/pages/color-management.html),
[Turborepo structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository).
