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

### Coordinator contract — incremental implementation

The owner reviews small additions within a file before the full implementation is complete.
apps/web/src/types.ts defines PrepareCreationExperience and ExperienceCoordinator; the class lives
in apps/web/src/runtime/experience-coordinator. It borrows the initialized renderer/external
preparation signal, copies the current viewport and owns prepared experience instances. It is not
used by production routing. The temporary mountRenderingProbe adapter now creates it inside
prepareRendering, prepares RenderingProbeCreation through it and forwards frames, resize and
suspend/resume callbacks. Adapter cleanup awaits session disposal then coordinator disposal; setup
failure also disposes the coordinator. Integration tests exercise the real coordinator alongside the
real session/loop/viewport modules with mocked host and scene boundaries. Scene cleanup errors now
retain the coordinator domain code and original cause.

prepareAndActivateExperience retains the current instance while awaiting the requested ready
instance. It applies the latest dimensions, checks cancellation, activates and (when suspended)
suspends the incoming instance before selecting it. Preparation/resize/activation failure releases
an acquired incoming instance and leaves the previous one active. Preparers release their own
partially acquired resources before returning. Combined failure/cleanup causes retain a domain code.

Sequential replacement is now implemented: after selecting the ready instance, the coordinator
releases the previous one. Failure of that outgoing cleanup rejects with
PREVIOUS_EXPERIENCE_DISPOSAL_FAILED while retaining the new active instance; it must not be caught
by the incoming-instance cleanup path. This is the agreed first technical replacement, not final
artistic handover or standby retention. Completion does not wait for first drawing or reveal.

updateActiveExperience(frameTime) and renderActiveExperience() forward only to the active instance,
using the borrowed renderer and session time. No instance means no frame work; preparation of a
replacement does not interrupt current work. The caller orders update before render within one
session frame. resizeActiveExperience copies drawable dimensions for preparation and forwards a
separate copy to the active instance. Prepared instances receive current dimensions before
activation, including changes during preparation. The coordinator never resizes the renderer.

suspendActiveExperience blocks update/render before notifying the instance; resumeActiveExperience
notifies it before unblocking. Failed callbacks remain blocked; repeated same-state calls do not
repeat notifications. Incoming preparation finishing while suspended activates then suspends the
ready instance before selection. Resize remains available while suspended. The session owns actual
Three.js loop stopping/starting.

Each preparation owns an AbortController combined with the external constructor signal through
AbortSignal.any, preserving the first cancellation reason. Its promise is registered before work
starts in a microtask, allowing reentrant disposal from the preparer to wait for it. Public entry
and private prepareAndActivateRequestedExperience logic are separate to retain the pending promise.
Pending operations are recorded in pendingPreparations (promise to combined signal). New requests
are registered before aborting the previous controller with PREPARATION_SUPERSEDED. A stale
operation can never activate its result; it releases a returned instance and rejects with the
cancellation reason. If the latest preparation fails, the previous active experience remains; an
obsolete result cannot become a fallback. Settlement clears the latest controller only if it still
belongs to that operation. This protects newer requests from stale completion and reentrant abort
callbacks. dispose snapshots/awaits all pending operations, including superseded work that ignores
abort, before releasing the active instance.

Coordinator dispose permanently blocks all calls immediately, caches one cleanup promise and aborts
pending preparation with DISPOSED. Cleanup awaits preparation and releases the active instance; late
incoming instances are released without activation. Expected cancellation is distinct from
operational/cleanup failure. Other failures remain observable under DISPOSAL_FAILED with aggregate
causes. Repeated disposal shares the same result, including rejection. Cancellation checks after
experience callbacks prevent selection after those callbacks request disposal. The renderer remains
session-owned.

There are 30 coordinator tests and 64 web tests. Coverage includes frame/viewport forwarding,
suspension, preparation/replacement failures, outgoing cleanup failure retaining the new instance,
current-scene continuity, cooperative cancellation, late cleanup and reentrant disposal. No new
browser evidence follows from this increment; the POC adapter integration is covered by tests.

Confirmed target supersession semantics: latest request wins, obsolete preparation receives
cancellation, a stale returned instance is disposed without activation, and its promise rejects with
the cancellation reason. Cancellation is expected control flow, not visitor failure feedback.
Supersession is implemented. Artistic handover and residency require subsequent bounded
implementation.

Chrome integration check, October 19: reloaded the current POC from the owner's existing server,
then completed three unmount/remount cycles through the React harness. Every mount reached Ready;
canvas counts alternated 0/1 and the final screenshot shows the static triangle. Captured console
warnings/errors were empty. No page instrumentation, visibility emulation, viewport override or
server process was introduced. Screenshot: /private/tmp/creation-coordinator-chrome.jpg. This checks
the current single-experience browser assembly; supersession/replacement remain unit/integration
test evidence, not a browser navigation or artistic-transition check.

## Semantic commands

Experience implementation direction — confirmed October 14: use concrete classes implementing a
common CreationExperience interface, initially IntroCreation and FirefliesCreation, without a shared
base class. Shared effects use composition; pure calculations stay outside the classes. Preparation
is asynchronous and distinct from activation; activation does not implicitly trigger the artistic
reveal. The owner accepts static async preparation on each class with a private constructor,
returning a ready instance and releasing partial resources on failure/cancellation. The common
methods and their signatures are implemented for review in apps/web/src/types.ts. The
CreationExperience interface declares synchronous activate, update(FrameTime),
render(WebGPURenderer), resize(RenderingViewport), suspend, resume and repeatable dispose methods.
CreationExperiencePreparationOptions supplies an initialized borrowed renderer, current drawable
viewport and required preparation AbortSignal; static preparation is separate from the instance
interface. FrameTime.elapsedSeconds belongs to the session, not time since experience activation; an
experience uses deltaSeconds to advance its own passage clock when needed. Experiences own their
scene/effect resources and never dispose the shared renderer. The caller stops using an experience
before disposing it; app shutdown awaits session disposal first. No concrete experience, artistic
choreography or new coordinator is implemented by this type-only increment.

The owner reaffirmed direct typed commands for requested actions, scoped typed subscriptions for
notifications, and readable current-state snapshots for UI. No application-wide event bus is
planned. The coordinator owns multi-service sequencing, such as visibility suspension of scenes,
graphics and audio. A future event bus requires a concrete broadcast need and its own scope
discussion.

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

The initial React integration contract is RenderingRuntimeStatus in apps/web/src/types.ts: preparing
covers renderer/initial-experience preparation; ready means that preparation succeeded, not that a
frame was presented or an artistic reveal completed; failed retains the original terminal
initialization/rendering error for diagnostics. Preparing includes progress from 0 to 1, or null
when it cannot be measured. Progress of 1 does not itself imply ready; readiness is confirmed
separately. Do not invent percentages for unmeasurable operations. Localized visitor messages,
including any ready phrase, belong to UI. This contract does not describe later experience
navigation.

`createStatusStore<Status>(initialStatus)` in apps/web/src/stores/status-store creates an isolated
vanilla Zustand store with a caller-owned shape and initial value. It imports no runtime or
experience types. Publishers receive publishStatus; consumers receive only getState, getInitialState
and subscribe through statusStore. Initial and published snapshots are copied and shallow-frozen,
replace the previous status completely, and notify only when shallow field values change. Nested
values retain identity and must be treated as immutable. The store does not validate domain
transitions or determine readiness.

ApplicationRendering and rendering fixtures instantiate it with RenderingRuntimeStatus and the
initial preparing/unknown-progress value, then pass publishStatus to the rendering runtime. The
component lives under shell/application-rendering and receives preparation as a prop, importing no
experience or route. Shell now mounts it behind Outlet and derives its input from the route mapping.

Lifecycle vocabulary: clear erases canvas pixels; removeActiveExperience releases the selected
experience while preserving its coordinator; dispose permanently closes its receiver and releases
the resources it owns. Attachment disposal synchronously cancels startup and initiates asynchronous
runtime cleanup; errors reach onError. It does not return the runtime cleanup promise.

ExperienceCoordinator.removeActiveExperience cancels the pending preparation and releases the active
instance without disposing the coordinator or renderer. It removes the active reference before
cleanup, so a cleanup failure cannot leave a broken instance selected. Pending preparations retain
their existing promise and cancellation cleanup; the method does not await late results. Repeated
removal calls are safe. It does not erase canvas pixels; the rendering integration must handle the
empty presentation. The route-to-experience mapping's null case now uses this operation through
runtime selection.

RenderingRuntime.selectExperience(prepare | null) now exposes live selection through the existing
coordinator and renderer. A preparation function replaces the current experience only when ready;
null clears the canvas then removes and disposes the active experience. Initial preparation can also
be null. The operation rejects after disposal or terminal rendering failure with
RENDERING_RUNTIME_UNAVAILABLE. Selection errors, including supersession, reject to the caller;
startup status remains separate from later navigation progress. React attachment and route-selection
props are now connected.

createRenderingRuntime in apps/web/src/runtime/rendering-runtime connects the production session and
coordinator with caller-supplied initial preparation, resolution and frame-delta settings.
Preparation/activation precedes frames; frames update before drawing. Viewport and visibility
callbacks reach the coordinator. Startup errors reject after cleanup; later failures reach the
required non-throwing onError callback. Cancellation applies to startup only. Successful callers
must dispose the returned runtime; repeated disposal shares one promise, releases the session before
the coordinator, and attempts both cleanups even after failure. Combined failures use runtime domain
codes with AggregateError causes. The POC still uses its existing adapter.

The required non-throwing publishStatus callback receives preparing with null progress at startup,
ready after successful session creation, and failed with the original reported/rejected error.
Initial failures publish after cleanup and reject; later failures publish before onError. An
already-aborted request neither publishes nor creates a session. Expected startup cancellation
(rejection identical to signal.reason) does not publish failed; cancellation with cleanup failure
does. No measured progress source has been connected yet. Disposal errors reject dispose without
publishing a new rendering status.

RenderingCanvas in apps/web/src/runtime/rendering-canvas owns a full-parent-size container and a
fresh canvas/runtime per lifetime Effect setup. The parent establishes drawable dimensions and
stable resolution-reader/frame-delta/publisher inputs. Requested experience changes are handled by a
separate selection Effect, preserving the renderer. Cleanup cancels startup and removes the canvas,
releasing ready or late results. Status publication after attachment disposal is suppressed;
expected cancellation is silent and real failures reach the latest non-throwing onError handler
through useEffectEvent. ApplicationRendering owns status consumption; Shell mounts it persistently
behind route UI. At the owner's request, async startup/cancellation/late-result handling is
extracted into the adjacent attach-rendering-runtime.ts, not a generic utility or Hook.
attachRenderingRuntime receives the runtime inputs without a signal, owns its AbortController and
returns an attachment object with synchronous selectExperience and dispose commands. Disposal
remains idempotent. Selection remembers the latest requested preparation during startup and forwards
it when the runtime is ready, only if it differs from the initial preparation. Initial startup is
not cancelled/restarted for route changes. Repeated selection of the same function is ignored. Later
selections use runtime.selectExperience; expected supersession and attachment-disposal cancellations
are silent, while genuine failures (including late cleanup failures) reach onError. A disposed
attachment ignores new selections and disposes late runtime results without applying queued
requests. RenderingCanvas now accepts prepareExperience (a preparation function or null). Its
lifetime Effect creates/attaches the canvas and cleans it up; its selection Effect forwards
prepareExperience changes through the retained attachment. A useEffectEvent reads the current
initial selection without making route choices lifetime dependencies. readPixelRatio,
maxDeltaSeconds and publishStatus remain lifetime settings; changing them restarts the runtime.
Initial startup and later selections retain the attachment's queue/cancellation semantics. Unit
tests cover these cases at the simulated runtime boundary, not real GPU behavior.

The colocated RenderingCanvas stories now mount the component with the actual runtime and static
probe, plus an intentionally failed preparation. Chromium Storybook tests pass with root StrictMode:
readiness, stable canvas across interface rerender and resize, resized buffer width, two clean
unmount/remount cycles, failed status and original error reporting. This establishes browser
component assembly, not pixel-level drawing approval, native WebGPU acceptance, continuous resize
smoothness, memory or performance guarantees. The application now mounts the component through
Shell; the original POC remains separate.

The owner reported a wide-to-narrow change when opening/reloading the static story. Its play
function was automatically clicking resize and unmount/remount controls. StaticTriangle now only
asserts initial state; those interactions moved to LifecycleChecks (!dev/!autodocs, still tested).
PreparationFailure no longer automatically unmounts. All 5 Storybook tests pass. The existing Chrome
story reloaded to a visible triangle at 640 CSS/buffer pixels with the interface counter at zero. No
production sizing/lifecycle change was needed for this issue.

The earlier development triangle panel was removed before the production intro UI merge. The current
Shell integration mounts the actual intro scene via route selection, with an empty graphics
selection for UI-only Fireflies and unknown routes. Production browser journeys verify persistent
canvas identity, route/locale behavior and direct Fireflies entry without a veil data request. See
[the intro reference](experiences/intro.md) for provisional full-screen framing and remaining
effects.

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

### Frame clock — accepted implementation

The rendering package exposes createFrameClock({ maxDeltaSeconds }) through
@creation/rendering/frame-clock. calculateFrameTime(timestampMs) accepts finite, non-negative,
non-decreasing timestamps from one monotonic source and returns deltaSeconds plus elapsedSeconds.
The first calculation returns zero delta; subsequent deltas convert milliseconds to seconds and are
capped by the caller's required limit. Elapsed passage time sums only the capped deltas; discarded
time is never caught up. resetPreviousFrameTimestamp() preserves elapsed time and makes the next
delta zero, excluding a suspension interval. It does not stop scheduling. Invalid inputs throw
CodedError with FRAME_CLOCK_INVALID_MAX_DELTA or FRAME_CLOCK_INVALID_TIMESTAMP without advancing
clock state. Codes are exported through @creation/rendering/frame-clock/errors. Each clock owns
independent state and returns independent snapshots. The production limit remains open pending
movement validation.

The clock owns no browser subscriptions, renderer, audio clock or scheduling. Connecting it to the
renderer callback is implemented in the module below. Coordinating suspension and driving GSAP and
shader time remain later increments.

### Rendering viewport — agreed scope, implementation awaiting owner review

@creation/rendering/rendering-viewport exposes createRenderingViewport({ initialViewport,
measureViewport }). The baseline must already be drawable and applied to the renderer/cameras; the
supplied synchronous measurement reads current CSS dimensions and caller-selected pixel ratio.
requestViewportMeasurement() marks the next frame for measurement, coalescing repeated
notifications. readViewportForFrame() measures when pending, including the first frame after
creation, and returns viewport, hasChanged and hasDrawableArea. Dimensions/pixel ratio must be
finite; CSS dimensions may be zero but not negative, and pixel ratio must be strictly positive.
Physical dimensions are CSS dimensions times pixel ratio, rounded down as in Three.js; both must
contain a pixel to be drawable. Invalid values or an empty initial baseline throw
RENDERING_VIEWPORT_INVALID_MEASUREMENT, exported through
@creation/rendering/rendering-viewport/errors. Caller measurement failures retain their original
cause and leave measurement pending.

Shared viewport, frame time, host, loop, viewport controller, session and resize-observer contracts
are defined in src/types.ts, accessible through @creation/rendering/types. Existing module type
exports remain compatible. The shared type file has no runtime imports or implementation-module
dependencies. Module-specific options and preparation inputs remain colocated with their module.
hasDrawableArea and hasViewportChanged live in src/utils/has-drawable-area and
src/utils/has-viewport-changed, each with a matching source filename and colocated test. Neither the
controller nor these helpers imports the host.

hasChanged compares width, height and pixel ratio with the last drawable viewport. Empty layout does
not replace that baseline or request buffer clearing; a same-size return requires drawing but no
redundant resize. A drawable change is reported once; following frames reuse a snapshot with
hasChanged false. Caller-owned measurement objects are copied to preserve comparisons. The caller
must apply every reported change to buffer/cameras/effects and draw within that same callback; this
controller owns no DOM observer or GPU resource. If application fails, reconstruct it from known
applied dimensions before resuming. Fourteen unit tests cover coalescing, first-frame changes, pixel
ratio, empty/subpixel layout, snapshots and failure/retry. The temporary mount-rendering-probe now
uses this controller, removing its duplicate resize state. Web integration tests cover coherent
buffer/camera/draw ordering, same-size return from empty layout and pixel-ratio-only changes. Chrome
rechecks across October 13-14 confirmed square/landscape resize, controlled hidden/resume with a
resized drawing buffer on return, and three clean remounts. Instrumentation/viewport overrides were
removed. This verifies the static POC, not animated passage continuity or production performance.
The controller has been studied; the new integration remains available for owner review.

Owner decision, October 14: retain the current implementation and defer investigation of the
reported Chrome resize flash/left-edge latency until real experience development. Functional resize
checks pass, but continuous resize quality remains unvalidated. Evaluate it with actual movement and
effects; real content is not assumed to resolve the issue. This deferral does not authorize starting
an experience or changing the graphics scheduling contract.

### Temporary experience-contract validation — implementation awaiting owner review

apps/web/src/rendering-probe/rendering-probe-creation.ts defines RenderingProbeCreation implementing
CreationExperience, without a shared base class. Its private constructor receives the existing
triangle scene; static async prepare checks cancellation and creates it using the supplied viewport.
Construction remains synchronous within the async API. render borrows the provided renderer, resize
adapts the camera, and dispose releases scene resources once and blocks further drawing. The static
probe has no inputs, autonomous work or animation; activate/update/suspend/resume are intentionally
empty, documented implementations. No lifecycle-state machine is introduced for this test.

This class is temporary contract validation, not intro artwork or a production scene. It reuses
createRenderingProbe instead of duplicating geometry/camera construction. Three tests exercise
preparation/drawing, resizing, resource ownership/disposal and pre-cancelled preparation. The
current browser adapter does not yet use the class; integration follows after owner review. These
tests do not validate animated suspension or asynchronous asset preparation.

Chrome integration check, October 18: the current POC renders the static triangle and reaches Ready
with one canvas. Temporary lifecycle instrumentation recorded 13 draws before hiding; the count
remained at 13 across two hidden samples, with one suspension notification. The first resumed frame
had deltaSeconds 0 and retained elapsedSeconds 0.1991. Visibility used temporarily adjusted focus
emulation; automated foreground requests alone did not consistently make the tab visible. This is
controlled browser evidence, not manual tab-switch or animated-continuity acceptance. Three complete
unmount/remount cycles each reached Ready; canvas counts alternated between zero and one. Three
preceding quick cycles also completed, one interrupting initialization. Captured console
warning/error logs were empty; the protocol event buffer was truncated and cannot prove absence of
every earlier exception. Instrumentation was removed by reload and focus emulation restored. Final
screenshot: /private/tmp/creation-rendering-lifecycle-chrome.jpg. No native
resize/performance/recovery check or production-milestone acceptance is implied.

### Rendering session — authorized assembly, implementation awaiting owner review

@creation/rendering/rendering-session exposes createRenderingSession with canvas, readPixelRatio,
maxDeltaSeconds, synchronous onViewportChange/onFrame/onError callbacks, optional onSuspend/onResume
callbacks and an optional creation signal. Optional prepareRendering(context) receives an
initialized borrowed renderer, a snapshot of the drawable viewport already applied to it, and an
AbortSignal. The application creates one session and supplies callbacks for the current experience;
scenes, cameras, navigation, audio and scene disposal remain application/experience-owned. Initial
canvas layout must be drawable. Resolution policy remains caller-owned. The session uses the
canvas's ownerDocument and browser window, rather than unrelated global DOM instances.

Creation initializes the host, constructs viewport/a stopped loop, awaits optional prepareRendering,
checks cancellation, then adjusts cameras through onViewportChange, then subscribes to layout/window
resize and page visibility. Initial hidden state leaves frames stopped. Notifications request
measurement; a frame reads pending dimensions, skips empty layout, applies buffer/camera changes,
then calls onFrame(renderer, frameTime) to update and draw. The renderer is borrowed: callbacks must
not dispose it or replace its animation callback.

Preparation runs before camera callbacks, browser subscriptions and application frame registration.
Its signal is always supplied; without an external signal the session creates an un-aborted one.
Cancellation is cooperative: the session waits for preparation to settle before releasing the
borrowed renderer, then rejects an obsolete creation even if the callback ignored cancellation. The
preparer owns its partial resources; application code also releases a prepared experience if later
session setup fails. Session cleanup covers its own renderer/loop/subscriptions only. Preparation
failures preserve their cause rather than become runtime onError notifications; combined cleanup
failure retains both causes under the existing session creation code. Current visibility is read
after preparation, and layout changes are applied before the first drawable frame.
RenderingPreparationContext is exported from the session module; it imports no web contract. Six
added tests cover waiting, layout/visibility changes, cooperative cancellation, default signal and
failure cleanup. The temporary POC now creates its static scene inside prepareRendering using the
supplied viewport, after renderer readiness. Its callback satisfies the async contract but performs
only synchronous scene construction; no artificial delay is added. Adapter tests verify preparation
ordering, layout changes during initialization, creation failure and cancellation cleanup. Browser
validation of this new wiring and actual asynchronous scene-resource preparation remain pending.

Owner-requested separation: observeCanvasResize lives in src/utils/observe-canvas-resize with
matching source/test names. It owns canvas ResizeObserver and window resize, forwarding measurement
requests without measuring, resizing, drawing or choosing scheduling policy. Disposal removes both
resize subscriptions once and blocks late notifications; setup failure removes acquired observations
and preserves the cause. It imports no session implementation or types. Page visibility remains a
separate createPageVisibilityObserver from @creation/utils/dom/page-visibility. Rendering session
owns both handles, disposing visibility and resize observations before loop/host cleanup. Four
resize-helper tests, five existing generic visibility tests and session/POC tests cover each role; a
session test verifies resize cleanup if visibility setup fails. The combined observer was removed.
Frame work is now delegated to renderFrameWithViewport in src/utils/render-frame-with-viewport, with
matching source/test names. This synchronous function receives frame time, host, viewport controller
and camera/draw callbacks explicitly. It owns no state/subscriptions and imports only types, not
session implementation. It skips empty layout; changed drawable layout updates buffer, then
camera/effects, then drawing. Unchanged frames draw without resizing. Failures propagate to the
session, which retains immediate restart blocking and loop-level error reporting. Five helper tests
cover ordering, unchanged/empty layouts and resize failure without subsequent drawing. Session-type
extraction remains a proposal for later review.

requestViewportMeasurement supports explicit resolution changes. Page return remeasures and resets
the frame delta through the existing loop. Frame/visibility failures report existing domain errors
through onError and remain terminal until session recreation. The optional onSuspend callback runs
synchronously after blocking hidden-page frames, including initially hidden setup. onResume runs
synchronously before restarting after suspension, never on initial visible setup. Repeated
same-state notifications do not repeat these callbacks. Pending viewport changes still apply during
the first resumed frame, after onResume; consumers must not assume current dimensions inside that
callback. Disposal does not emit visibility callbacks. Callbacks must be synchronous. A callback
failure immediately blocks restart, waits for frame shutdown and reports the original error; if
shutdown also fails, an AggregateError retains both. Initial callback failure rejects creation and
triggers cleanup without runtime notification. Six added session tests cover notification order,
initial hidden state, duplicate notifications, post-disposal events and failure handling. The POC
adapter does not yet forward these callbacks to the experience. Scene/audio suspension policy still
belongs to the application/future coordinator. dispose immediately blocks work, removes browser
subscriptions, then awaits loop disposal before host disposal. Repeated disposal shares a promise;
renderer cleanup is attempted even if loop cleanup fails. Await session disposal before releasing
scene resources.

Creation failures clean up acquired resources and reject without runtime notification, preserving
the original cause/cancellation reason when cleanup succeeds. Session error codes cover unavailable
browser window, disposal failure, and combined creation/cleanup failure; aggregate causes retain
both errors. Codes are exported through @creation/rendering/rendering-session/errors. Seventeen unit
tests exercise assembly with real loop/viewport/visibility modules and a mocked host. Production POC
wiring is now implemented in mount-rendering-probe: it delegates assembly to the session and keeps
only scene callbacks, POC resolution policy and scene cleanup. Twelve adapter tests use the real
session with a mocked host/scene. Chrome checks confirm buffer sizing, controlled hidden/resume and
three clean remounts with no captured console warnings/errors. Instruments and overrides were
removed. Integration awaits owner review; the deferred resize flash and production quality limits
remain open.

Owner-requested readability refinement: measureCanvasViewport and disposeRenderingLoopAndHost live
in matching rendering/src/utils folders with colocated tests. They remain internal package helpers.
Generic getElementWindow(element, unavailableWindowErrorCode) lives in
utils/src/dom/get-element-window, exported through @creation/utils/dom/get-element-window. It
accepts any HTMLElement and a caller-owned error code, so utils imports no rendering domain. The
session supplies its existing UNAVAILABLE_WINDOW code. disposeRenderingLoopAndHost imports host/loop
contracts from root types and receives DISPOSAL_FAILED from the session. Likewise, hasDrawableArea
receives INVALID_MEASUREMENT from the viewport controller and reportRenderingFrameFailure receives
FRAME_FAILED from the loop. Production utilities import no implementation modules or domain error
constants; callers own error policy. Tests may exercise real modules without imposing that
production dependency direction on test fixtures. Measurement uses clientWidth/clientHeight (integer
layout dimensions before transforms), following the
[Three.js responsive guide](https://threejs.org/manual/pages/responsive.html). getBoundingClientRect
includes borders and CSS transforms; it is not substituted for drawing layout measurement. Keep the
canvas unpadded; place decorations on its container. This extraction does not change scheduling or
resolve the deferred resize flash.

### Rendering loop — agreed scope, implementation awaiting owner review

@creation/rendering/rendering-loop exposes createRenderingLoop with an initialized borrowed
renderer, maxDeltaSeconds, a synchronous onFrame callback and a synchronous non-throwing onError
callback. It starts stopped. startRenderingFrames() installs one Three.js setAnimationLoop callback;
repeated starts share the pending/completed operation. Each callback calculates frame time and
invokes onFrame for scene updates and drawing. No independent requestAnimationFrame is introduced.

stopRenderingFrames() blocks frame work immediately, resets the previous clock timestamp while
preserving elapsed time, and awaits callback removal. dispose() permanently prevents starts, removes
the callback and shares one disposal promise across repeated calls. Neither operation disposes the
borrowed renderer. The loop exclusively owns the renderer's animation callback slot until disposal
settles; application teardown must dispose the loop before disposing the host. Three.js internal
housekeeping may continue without the application callback.

setRendererCallback calls Three.js directly. With the required initialized renderer, each callback
change takes effect immediately. No task queue, request tracker or counter belongs to the loop.
Promise rejection handling compares the failing change promise to the latest change promise before
stopping frame work: an earlier rejection observed in a later microtask cannot stop a newer start.
Explicit start/stop/dispose failures reject their returned promises with
RENDERING_LOOP_CALLBACK_CHANGE_FAILED; starting after disposal rejects with RENDERING_LOOP_DISPOSED.
Frame failures block further work and reach onError with RENDERING_LOOP_FRAME_FAILED after callback
removal settles. A removal failure retains both causes. Codes are exported through
@creation/rendering/rendering-loop/errors. No automatic recovery, DOM observations, scene selection,
resize handling or audio control belongs to this module.

Unit evidence covers lifecycle ordering, repeated calls, preserved passage time, stale callbacks and
failures through mocked Three.js registration. Chrome integration passed October 13 through the
temporary static triangle: visible rendering, matching drawing dimensions after resize, and three
unmount/remount cycles without captured console warnings/errors. The tested integration adds no
application requestAnimationFrame. Graphics visibility integration is verified in the temporary POC
below; native-backend identification and target performance remain unverified.

reportRenderingFrameFailure lives in
src/utils/report-rendering-frame-failure/report-rendering-frame-failure.ts with its colocated test.
It receives the failure, stopRenderingFrames and onError explicitly, awaits shutdown, then reports
the original cause or both failures. It owns no loop state and has no separate public package
export.

Complexity review — confirmed: in pinned Three.js 0.186.1, setAnimationLoop changes its callback
before returning when the renderer is already initialized; its only await is conditional
initialization. The owner agreed to direct callback changes. Tests model immediate
installation/removal and verify rapid start/stop/restart and disposal before awaiting returned
promises, rather than inventing delayed callback installation. The shared async utilities remain
independently available. A promise return type alone does not justify queuing operations; inspect
actual await boundaries before introducing ordering infrastructure. The simplified implementation
awaits final owner review.

Hidden page: pause scene and audio with a short sound fade where execution permits; preserve word,
phase and playback position. Return: resume progressively at the preserved passage. If browser
policy blocks audio, offer an explicit resume control. Focus loss while still visible does not
pause. This is suspension, not mute, and does not end the musical phase.

### Visibility observation — reviewed observer, POC integration awaiting owner review

Three.js 0.186.1 uses requestAnimationFrame internally. Browsers generally suspend those callbacks
for hidden pages; this reduces graphics work but does not reset the application's previous frame
timestamp or suspend audio. Without an explicit clock reset, a resumed callback advances by a capped
interval instead of zero. Use visibilitychange to coordinate the passage's pause and resume rather
than relying on graphics throttling or focus/blur. See
[Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) and
[requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

@creation/utils/dom/page-visibility exposes createPageVisibilityObserver({ document,
onVisibilityChange }). It reports !document.hidden synchronously after listener registration, then
on each visibilitychange event. dispose() is repeatable, removes the exact listener and blocks later
notifications. Initial callback failure releases the listener and preserves the original cause;
event callback errors follow normal DOM dispatch behavior. Async callback work must handle its own
failures. The observer owns no loop, timer, renderer or audio service. Five Node unit tests cover
initial visible/hidden states, events, focus/blur independence and cleanup/failure.

The temporary mount-rendering-probe integration uses the initial notification to start only while
visible, stops frames on hidden, and remeasures layout in the first resumed frame. It removes the
visibility listener at disposal and retains failure as terminal until remount. Web unit tests cover
hide/return, changed layout without a resize notification, initial hidden mounting, post-disposal
events and failure without automatic restart. Browser evidence uses controlled Chrome visibility
states and temporary renderer instrumentation: callbacks detached when hidden, drawing stopped,
callbacks reattached at visible, and pending dimensions applied on return. Test instrumentation and
emulation overrides were restored. Animated scene/audio passage continuity remains to validate; the
static triangle only verifies scheduling and resize behavior, with clock tests covering time.

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
