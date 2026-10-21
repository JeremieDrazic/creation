# Session state

Updated October 21, 2026. Read with AGENTS.md and [collaboration](collaboration.md).

## Objective, checkout and publication

Current branch: feat/intro-ui, created from main at cb5849d after the owner merged
[PR #2](https://github.com/JeremieDrazic/creation/pull/2). Verify Git state before resuming; this
document is a handoff, not proof of remote state.

The owner requested publication and then merged the rendering PR on October 20. The PR checks,
[main CI](https://github.com/JeremieDrazic/creation/actions/runs/39468726219) and automatic
[deployment](https://github.com/JeremieDrazic/creation/actions/runs/39468929981) all succeeded for
cb5849d. The assistant only verified those workflows and synchronized the checkout; no extra server
action was performed. Future commits/merges require their own authorized scope.

The rendering PR checkpoint is complete. The owner then chose to study intro UI, typography and
candidate colors before the GPU veil, accepted a composition proposal and authorized testing it. The
owner now requests the intro PR: committing this bounded UI/localization/motion integration and
publishing its branch/PR are authorized. Sound persistence/integration is explicitly excluded.
Merging and production deployment are not authorized by this request.

The intro is published in [PR #3](https://github.com/JeremieDrazic/creation/pull/3), targeting main
from feat/intro-ui. Implementation commit: c5bf259. Full local checks passed before publication;
check GitHub for current remote CI status. The owner retains merge review. Deferred sound work
remains in the local stash recorded below and is excluded from the published branch.

## Current intro UI increment

The owner accepted the static intro composition as a working basis and authorized component
extraction before GPU/motion work. IntroUi lives in apps/web/src/experiences/intro/intro-ui with
colocated IntroVerse, ProjectResourceLinks, SoundToggle, LanguageSwitcher, ExperienceLink and
CreationIdentity components/stories. Cormorant Garamond Light 300, candidate palette/spacing and
provisional system sans remain local; shared tokens and optimized font delivery are not finalized.
The unchanged retained TTF, OFL and notes live under intro/assets/cormorant-garamond. Route / now
mounts IntroUi full-screen on the temporary illuminated CSS background. Shared tokens and font
delivery remain to refine; this is not the WebGL veil.

The owner authorized replacing the old shell header/navigation and development triangle panel. Shell
now owns the page surface/document language and renders Outlet. Home owns intro navigation through
TanStack navigate for ordinary clicks; modified clicks preserve native anchor behavior. Fireflies is
still a localized placeholder with a Home link; the unknown-route fallback has its own Home link.
Rendering probe files/stories are retained. ProjectResourceLink has its previously missing colocated
Default story with global FR/EN localization.

The full French BDS / English NIV verse is visible in this static study. References include edition
and are italic. For the later entrance, phrases replace one another in the same position and only
“Et la lumière fut.” / its English counterpart remains with the reference. Choreography, title
interaction, loader and sound design need discussion before code. The approved link-arrow movement
is the first finite DOM motion; no veil, title effect or audio playback is implemented.
About/Credits remains a proposal.

LanguageSwitcher uses the provided react-i18next instance, keeps both FR/EN buttons
keyboard-accessible, exposes the active choice with aria-pressed and preserves focus. Errors retain
a language-change diagnostic code. IntroUi now uses it instead of a fixed French control;
onRequestLanguage was removed. The intro region/home labels and Fireflies invitation are translated,
so all visible/accessibility copy follows locale.

ExperienceLink accepts href, children and an optional native anchor click handler; IntroUi supplies
the localized Fireflies label and retains right-side placement. The component owns the existing
decorative arrow, Cormorant styling and focus-visible treatment. It adds no navigation engine.

Current increment for review: the owner approved the arrow leaving right and returning from the left
of its own mask, after the stationary text. GSAP 3.15.0 is catalog-pinned, installed in web and
declared/prebundled for Storybook; no other dependency was upgraded. A helper under experience-link/
create-experience-link-arrow-animation owns the paused sequence and reduced-motion context.
ExperienceLink's effect/ref own setup/cleanup; pointer entry and keyboard focus request one pass.
Active passes ignore extra requests. Current timing candidates: 0.14 seconds out, 0.7 seconds back
with power2.out for a more visible slowdown, following the owner's feedback. Visual approval is
pending. Reduced motion stays static; owned transforms are cleared after context cleanup so the
arrow cannot remain offscreen. Tests cover keyboard motion, ordered travel, stable text and cleanup
mid/end pass. Shared animation helpers now live under src/utils/animation:
createMotionPreferenceContext owns GSAP motion-preference setup/reversion. Language controls retain
their CSS-only underlineStyles and selected-language line. Resource links now use
createDirectionalUnderline with a finite playOnce pass, requested instead of the clipping-edge
approach. It draws then erases the line even while hovered/focused; active requests are ignored
without queuing. Pointer entry chooses the side; Tab enters left and Shift+Tab right. GSAP scaleX
goes 0 → 1 → 0, switching origin at full width to erase toward the other side. Reveal is 0.35s
power2.out, hide 0.14s power2.in. Reduced motion disables the decorative pass; preference changes
and unmount revert it. No clipPath, pointer-exit or blur animation remains. ProjectResourceLink owns
DOM/effect cleanup; the parent lists destinations/localized labels. Focus outlines remain.

CreationIdentity owns the existing Creation home anchor, localized accessible name, Cormorant
styling and focus/hover colors. IntroUi now assembles the six named components and owns their
layout. CreationIdentity has a Default story with global FR/EN and a hidden KeyboardAndAction test;
preview navigation is prevented. Artistic title interaction is deferred; the owner wants WebGL later
alongside the veil.

Storybook uses one Default story per component/language via its global FR/EN toolbar. IntroUi has
Default and IlluminatedBackdrop; automated destructive interactions stay in hidden test stories. The
global preview background is #03090e; per-story canvasBackground parameters were removed at the
owner's request. The scene halo is retained. Preview-owned memoized i18n clones and a cleaned-up
languageChanged listener synchronize the component and toolbar without saving the site's preference.
Chrome verified component EN → toolbar EN/English content, then toolbar FR → component FR/French
content. The tab is now on IntroUi/IlluminatedBackdrop in French. Chrome verified the resource
underline on actual hover and keyboard focus, zero CSS transition duration under reduced motion, and
a stationary arrow after extracting the preference helper. Chrome frame sampling previously
confirmed right/left/rest offsets and no text movement, then zero movement throughout reduced-motion
sampling. Temporary media emulation was reset. Screenshot artifacts are local.

The finite-pass increment passed tests for both entry directions, active re-entry being ignored,
later replay, completion while focused, Tab/Shift+Tab and cleanup. The owner still needs to review
its motion feel. Earlier clipping-based motion and its verification are superseded. Chrome confirmed
a full scale 0 → 1 → 0 pass while the link remained hovered, and a hidden/static line on re-entry
under reduced motion. Temporary media emulation was reset.

Latest component verification: 25 Storybook tests, web/Storybook TypeScript, targeted lint/format
and Storybook production build pass. This includes keyboard language changes/focus, full intro focus
order, translated resource names and external target/rel values. The previous localization increment
also passed 128 web unit tests, the production web build and 2 production Playwright journeys. Those
journeys verified FR/EN surviving full page reloads with an explicit browser locale. Initial study
checks fixed an EN accessible-name mismatch and footer clipping; the live a11y panel earlier had
zero violations and one inconclusive contrast item, not full manual accessibility acceptance.

Utilities now follow the owner's organization: src/utils/localization/i18n.ts and one function
folder each under utils/localization and utils/sound. Types remain at src/types.ts when shared.
resolveInitialLanguage uses saved choice → browser preference order (regional FR/EN variants) →
English. i18n reads creation.language-preference before initialization and saves later application
languageChanged events. Detection alone and Storybook clones do not save choices. Storage failures
preserve usable language selection and report the original cause; hot disposal releases the
listener.

Application sound integration and persistence are excluded from the intro PR at the owner's request.
The controlled SoundToggle and a React-state-only story remain. The application omits the control by
default; hiding versus disabling was asked and no owner response has arrived yet. No provider/store
or audio is mounted. The prepared persistence implementation, its 12 tests and persisted-story
variant are retained in local Git stash e8fa33ebc3aac7f9f656e829c939d9daed6d9217 (message: deferred:
sound preference store and persisted story for dedicated PR). Recover selected files from the
stash's third parent when starting that PR; do not apply it blindly over the current presentation
story. Existing unit/browser evidence for that deferred code is historical, not part of this PR's
check counts.

Full local pnpm check passed October 21 for the intro PR: formatting, typed lint, root/workspace
TypeScript, web/docs/Storybook builds, 247 unit tests (112 rendering, 19 utils, 116 web), 25
component tests and 4 production browser journeys. This excludes deferred sound tests. The root test
project now reads Vite's ImportMeta types for localization HMR. The production styles smoke test now
checks the intro and shared Storybook button instead of the removed shell button.

Journeys verify route changes without document reload, language persistence across reloads, direct
Fireflies entry, unknown-route recovery, shared styles and docs navigation. Chrome verified the
running app and Home → Fireflies → Home; the owner's English choice was preserved. No audio was
started. The app tab is on home; the Storybook tab is on ProjectResourceLink/Default. Only temporary
automated preview servers ran; owner-managed dev servers were untouched.

Next: owner reviews the integrated intro and ProjectResourceLink story. Do not start GPU, animation
or audio work without its bounded design discussion. Owner manages development servers; none were
started/stopped. Only temporary automated previews ran. The intro PR is authorized; merging remains
with the owner.

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
- The former development-only Shell triangle panel/status store were removed with intro integration.
  RenderingCanvas and the probe remain available in the dedicated harness/stories. No production GPU
  scene/runtime is mounted yet; reconnect the shared canvas for the real experience increment.
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
19.3.0. Three.js 0.186.1/types 0.186.0, Zustand 5.0.15 and GSAP 3.15.0 are catalog-pinned. This was
focused integration/version work, not a full periodic dependency review. Checkpoint: 1 completed
session since setup; default dedicated review every five completed sessions or before a relevant
milestone. No additional session closure has been requested. Session skills live in .agents/skills;
discovery may require refreshing the workspace. Do not silently update dependencies on resume.

Automated previews use 4173 (web), 4174 (docs) and 4175 (Storybook); Storybook development stays on
6006 so checks do not require stopping the owner's server. Generated VitePress caches and Storybook
debug logs are ignored, not source artifacts.
