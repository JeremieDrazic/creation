# Runtime contracts

The shared ownership direction is established; exact command types, results, clock integration and
backend implementation remain to define in bounded increments.

## Authoritative owners

| Responsibility                                        | Owner                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Requested route                                       | TanStack Router; application requests a destination from the coordinator. |
| Input draft/focus and controls                        | React; submitting a word dispatches intent, not per-keystroke GPU work.   |
| Visitor sound/quality preference                      | Scoped Zustand application store.                                         |
| Preparation, handover and residency                   | Experience coordinator.                                                   |
| Artistic phase and simulation                         | Experience module.                                                        |
| Renderer, viewport, composition and graphics schedule | Rendering host.                                                           |
| AudioContext, sources, buses, playback and analysis   | Audio service.                                                            |
| UI view of actual runtime status                      | Read-only projected snapshots consumed through narrow store selectors.    |

Do not create a second writable phase/residency state machine in Zustand. Route cache is not GPU
cache. Construction/teardown must tolerate React development remounts; no import-time
renderer/AudioContext singleton. Isolate instances for tests/Storybook.

## Semantic commands

Operations include requesting an experience, beginning/canceling editing, submitting a word,
starting music, returning to reverie, changing sound/quality and subscribing to status. Validate
capabilities/phase/readiness and return explicit outcomes. Prefer typed commands over an untyped
event bus; React controls do not mutate arbitrary scene internals.

Dispatch directly from the handler when appropriate. Application → coordinator → experience is a
call/ownership boundary, not a required queued store/effect round trip. Keep checks cheap,
acknowledge accepted interaction promptly and publish actual completion/error separately. Prepare
costly sampling, decoding and GPU work outside the click handler.

Audio unlock/resume stays in the initiating visitor gesture where required. Do not await unrelated
preparation first or claim successful playback before it starts. Measure click-to-feedback, scene
response and audio start separately.

Publish stable low-frequency snapshots only when meaningful facts change: requested/visible
experience, preparation/handover, phase, audio status/errors and selected/resolved quality. FFT
buffers, pointer samples, particles, transition progress and GPU references remain internal.

## Readiness — confirmed

1. Required code/source assets available.
2. Selected entry-state CPU data prepared, including worker outputs.
3. Renderer initialization/resources/shaders prepared enough for the first visible frame.
4. Eligible for artistic handover with input/audio ownership coordinated.

Downloaded is not prepared. Readiness concerns the requested entry, not every future
phase/word/tier. Optional audio cannot block a viable silent entry. Prepare likely work within
budgets; shader precompilation does not guarantee zero first-use stalls.

Keep outgoing scenes alive and usable while preparing. First entry uses a minimal independent
DOM/background. Loader artwork remains deferred; loading infrastructure must not prescribe the
artistic transition.

## Navigation and interruption — confirmed

- New destination during preparation supersedes obsolete work; cancel where possible and
  release/ignore stale results.
- During a visible handover, preserve continuity and retain only the latest next destination.
  Complete current handover by default; a deliberately designed interruptible/reversible transition
  may specialize this.
- Incoming preparation failure retains the usable current scene with retry. Mid-handover failure
  needs coordinated recovery; do not assume the outgoing scene is fully active.
- Return from music uses current visual/audio values without a jump. Mute silences output promptly
  and invokes Fireflies' approved return-to-reverie rule.
- Preserve browser back/forward behavior. Exact route/history commit timing remains an
  implementation decision.

## Time and ownership

One graphics schedule updates active/transitioning scenes and renders. GSAP owns designated finite
transition values; simulation reads them without competing writes. Audio uses its own AudioContext
clock, deliberately bridged to visuals. Avoid a second independent graphics loop.

Separate simulation/visual elapsed time from wall-clock duration. Do not catch up hidden time.
Choose bounded integration steps from movement stability and profiling; precise limits/rates and
GSAP integration remain open.

Hidden page: pause scene and audio with a short sound fade where execution permits; preserve word,
phase and playback position. Return: resume progressively at the preserved passage. If browser
policy blocks audio, offer an explicit resume control. Focus loss while still visible does not
pause. This is suspension, not mute, and does not end the musical phase.

## Rendering recovery — confirmed

Pause the artistic passage/audio, retain lightweight word/phase/playback/preferences, reconstruct
invalid render resources where the backend permits, reveal the recovered scene softly and resume
after readiness. Exact GPU particle positions need not survive. Offer explicit retry if recovery
fails; avoid endless automatic attempts. Status/retry UI remains available independently of
graphics.

Hidden suspension, initial unsupported graphics and runtime device/context loss are distinct causes.
WebGPU/WebGL recovery mechanisms differ; validate supported APIs, attempt limits and timing during
implementation. See
[GPUDevice.lost](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost) and
[webglcontextlost](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event).

## Cleanup and verification

Every resource/property has an owner; subscribe/unsubscribe explicitly. Scene eviction releases its
work, not the shared host. Application teardown releases the host. Cancel finite
transitions/preparation and distinguish supersession from errors. Verify navigation interruption,
visibility/mute differences, recovery, resize, stale worker results and development remount
behavior.
