# Architecture

The monorepo responsibility map, shared renderer, lifecycle and resource states are confirmed.
Concrete exports/contracts and budgets are established during implementation.

## Target structure

Internal package folder conventions remain to discuss with the owner. Current flat source folders
are provisional. Stories and tests live beside the component or file they exercise; Storybook hosts
them without owning their source. Placement for future cross-module journeys is discussed
explicitly.

```text
apps/
  web/                  # Routes, shared shell, intro and Fireflies feature modules
  storybook/            # UI, tokens, icons and interaction review
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
docs/
moodboard/
```

Create packages for actual responsibilities, not empty placeholders. Intro and Fireflies initially
live as independent lazy feature modules in web; they do not import one another's implementation.
Packages expose focused entry points and never import application internals. Keep dependencies
acyclic. Extract an experience package only when independent consumption warrants it.

## Ownership

React owns accessible UI and visitor intent. A coordinator manages preparation, navigation, handover
and residency. A persistent host owns one canvas, one renderer/context and one graphics schedule.
Experiences own scenes, cameras, simulation, local effects and artistic behavior. Audio owns
playback/analysis, not experience choreography. See [runtime contracts](runtime-contracts.md).

The host owns viewport, internal resolution and final output conversion. Set render state explicitly
for each pass; retain separate per-experience effect pipelines. Use a linear intermediate convention
and one final display conversion; exact tone mapping remains to validate. Frame-frequency data stays
outside React/Zustand updates.

## Lifecycle

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

utils contains no experience behavior. Separate pure, dom and webgl modules/exports; the pure entry
must not load browser/rendering dependencies. Document side-effect ownership/cleanup in browser
helpers. Add helpers for real needs.

## API scope

No confirmed V1 feature needs a custom API. Words, procedural visuals and audio analysis run in the
browser; assets are files. Revisit for persistence, shared state, privileged services or multiplayer
signaling. Visitor music does not itself imply upload.

References: [render targets](https://threejs.org/manual/pages/rendertargets.html),
[color management](https://threejs.org/manual/pages/color-management.html),
[Turborepo structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository).
