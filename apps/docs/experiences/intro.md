# Creation — introductory experience

## Confirmed direction

Creation's homepage is an interactive experience, distinct from Fireflies.
[Celestial-veil study 07](https://github.com/JeremieDrazic/creation/blob/main/moodboard/intro/07-celestial-veil.md)
is the specific visual target: darkness, deep ink-blue, layered fine stellar dust, depth and
illumination under gesture. It contains no fireflies, particle word, bright nucleus, realistic
landscape or earthly mist.

Preserve the image's composition, colors, density and illuminated-state balance. The veil arrives
very discreetly and beautifully; text also enters with animation. Refine the implementation for
motion, legibility and performance without silently substituting a different art direction. Exact
reproduction and measured 60 fps are not established by the image.

Present the **complete Genesis 1:3** during the entrance, using La Bible du Semeur in French:

> Et Dieu dit alors : Que la lumière soit ! Et la lumière fut.

Source: [Genesis 1:3, BDS](https://www.bible.com/fr/bible/21/GEN.1.3.BDS). The owner confirmed that
the three phrases replace one another in the same position, ending with only “Et la lumière fut.”
and the biblical reference retained. Timing and transitions remain to design. The English resource
now uses [Genesis 1:3, NIV](https://www.biblegateway.com/passage/?search=Genesis+1%3A3&version=NIV).
Attribution and publication permissions remain to confirm.

The reference includes the edition and is set in italic: “Genèse 1:3 · BDS” / “Genesis 1:3 · NIV”.

Include subtle ambient sound to be chosen later. Activation is voluntary, retained during the visit.
V1 is desktop; mobile receives a designed desktop invitation.

## Staging proposals

Reveal dust through restrained opacity/depth, without an explosion or conspicuous zoom. Introduce
the verse, reference and UI with small offsets and carefully phased motion; avoid letter-by-letter
typing. The text should be readable without a required gesture.

Gesture influence illuminates nearby dust and fades gently. Preserve a rewarding contemplative scene
without input. Keep Fireflies accessible without a mandatory intro duration. The navigation
transition may withdraw the veil while the nocturnal scene/input arrives; no literal star-to-insect
morph is required.

The asset loader reports operational failures through CodedError with
CELESTIAL_VEIL_DATA_LOAD_FAILED and the original cause (network, HTTP status, JSON or schema).
Cancellation keeps the caller's reason and is not reclassified as an asset failure.

## Application integration direction — owner review

The owner requests continuing in the application, in small file-by-file learning increments. Explain
each file's role and choices, implement a bounded change, then study it together before advancing.
Recent offline-data/lifecycle files still need this walkthrough; implementation does not establish
owner understanding or code acceptance.

A subtle camera parallax is desired. Pointer-driven, damped motion is proposed; amplitude,
projection, framing and reduced-motion behavior remain to be reviewed. Establish responsive
composition before movement. Maintain depth-dependent displacement and quiet text/UI; do not move
the entire application as a flat layer.

The agreed developer palette is our development-only packages/data-gui adapter over lil-gui, not
direct library usage in experience code. It remains a separate next increment. The owner wants to
explore orientation, extent, placement and independent grain size in the application; no final
composition settings or palette binding are implemented in this veil increment.

## Remaining decisions

### Static veil — image-derived working composition

The owner resumed the veil with a static composition first, guided by reference 07, without audio.
Start at a fixed reference framing; resize policy and any future camera motion follow later review.
Screen positions and apparent sizes can be inferred from the image; depth is authored, not
recovered.

The owner accepted the overall shape of the image-derived tableau as a good working basis and
requested removing the earlier procedural layout. That unused comparison module is now removed; all
image-analysis data and plates remain preserved.

The owner clarified that image analysis must produce coordinates for as many detectable points as
possible, rather than a few landmarks. The
[extraction analysis](https://github.com/JeremieDrazic/creation/blob/main/moodboard/intro/07-celestial-veil-analysis.md)
records 5,676 detected lower-frame peak positions and an overlay. The owner subsequently authorized
full annotation and approximate staging depth; the enriched JSON and diagnostic maps are linked from
that analysis. Depth is a low-confidence authoring hypothesis, with unresolved entries explicitly
marked. The annotation is the working source for offline preparation below.

### Grain material — awaiting owner code review

The first rendering module is intro/celestial-veil/material/celestial-veil-material.ts. It creates
one shared MeshBasicNodeMaterial with TSL radial coverage on camera-facing UV-mapped squares.
Geometry owns diameter and placement; the material owns appearance. Required attributes are
grainColorLinear (linear working-space vec3), grainOpacity (authored float 0–1) and
grainEdgeSoftness (float 0–1). Offline preparation converts image sRGB and interprets measured
brightness; the annotated JSON is not copied directly into these attributes.

Softness zero retains a compact disk with a derivative-smoothed edge; softness one fades across the
radius. The material uses normal alpha blending, disables depth writes and tone mapping, and has no
bloom, lights, textures or motion. The scene must orient and order transparent grains and dispose
the material. Scene assembly and runtime preparation are described below; the scene is now mounted
in the application for integration review.

Targeted typed lint, web TypeScript and formatting pass. A temporary two-instance scene compiled and
drew the actual shader through WebGPURenderer's forced WebGL2 backend in headless
Chromium/SwiftShader. Pixel checks verified transparent corners, distinct softness and independent
live color/opacity attribute updates. This does not validate native WebGPU, subpixel fidelity,
artistic resemblance, large-particle-count performance or transparent ordering. The exploratory
script is /private/tmp/creation-veil-material-smoke.mjs. Its sharp/soft screenshot is preserved as
moodboard/intro/07-celestial-veil-material-probe.png for review and the possible future case study.

### Offline data and static runtime — awaiting owner study

The research annotation remains in moodboard/intro with all diagnostic plates. It is not downloaded
by the experience. Run pnpm --filter @creation/web prepare:veil to regenerate the compact rendering
asset from that source. The tool is apps/web/scripts/prepare-celestial-veil-asset.mts; it runs on
Node 24 with native TypeScript stripping and no new loader dependency. Explicit .ts imports are
allowed by the shared no-emit TypeScript profile. The generated minified JSON has a focused Oxfmt
ignore; source code and research JSON remain formatted normally.

prepare-celestial-veil-grain.ts owns the grain-specific interpretation and validation. Pure numeric
utilities live in @creation/utils: clampUnit, assertRgbChannels and srgbChannelToLinear. The offline
tool selects representatives, converts pixel centers/depth, estimates size/softness/color/opacity,
rounds to GPU Float32 precision and sorts far to near. Color conversion follows the normalized sRGB
transfer function, independently of Three.js. Source staging assumptions remain provisional.

The generated asset is src/experiences/intro/assets/celestial-veil/celestial-veil-data.json: 5,674
rows, schema/version, frame/depth span and an explicit column list. Each row contains x, y, z,
diameter, three linear RGB channels, opacity and softness. It measures 622,771 bytes versus
8,542,343 for the annotation; local gzip produces 155,532 bytes, not a measured production transfer.
A source hash records provenance. A unit check compares the complete prepared source with the
committed asset to catch stale generation.

celestial-veil-data.ts validates the version, layout, dimensions, finite values/ranges and draw
order. load-celestial-veil-data.ts fetches a separate Vite URL asset with the preparation signal;
HTTP errors, malformed data and cancellation reject. The scene consumes ready rows and creates one
geometry, material and InstancedMesh. It performs no per-grain image interpretation or color
conversion and does not import the research data or offline preparer.

IntroCreation implements the shared lifecycle. Static prepare loads the asset, constructs the veil,
applies the initial viewport and compiles shaders with the borrowed renderer. Failure/cancellation
releases the scene; render/dispose never replace or destroy the shared renderer/schedule. Resize now
delegates to the scene's camera adjustment before subsequent draws.

celestial-veil/camera/celestial-veil-camera.ts owns the orthographic camera and framing. Its pure
getCelestialVeilCameraBounds computes uniform containment of the reference frame, centered with
additional space along the unconstrained axis. resizeCelestialVeilCamera applies those bounds and
updates the projection matrix; createCelestialVeilCamera owns the original depth/near/far setup. The
reference 3:1 projection is preserved exactly. Other aspects retain equal X/Y world-to-screen scale,
keeping circular grains round without changing source positions, diameters or GPU buffers.

This is a working projection correction, not final artistic framing. Smaller/narrower windows show a
more compact veil with space above/below; the requested top-to-bottom passage, text-aware placement,
perspective and parallax remain pending. Orthographic camera distance was not changed.

Storybook Experiences/Intro/CelestialVeil / Default is a temporary fixed-frame technical review
fixture using RenderingCanvas and the real runtime. It is not final application layout/loading UI.
The build emits the JSON as a separate hashed asset. Storybook directly declares the same
catalog-pinned Three.js version for predictable shader preoptimization; no dependency versions were
upgraded. The grain structure remains drier/sharper than reference 07 without bloom/inter-grain
diffuse light. The original first tableau and all analysis plates are preserved for the possible
case study.

The celestial-veil folder groups data validation/loading under data, offline calculations under
preparation and the shader under material; scene assembly stays at its root. Tests are colocated.
The story stays directly under experiences/intro because it exercises IntroCreation preparation. It
remains a useful comparison fixture, not a commitment to retain it permanently.

Current softness comes from authored radial coverage and derivative antialiasing. Both the app and
preview follow display density. The preserved ratio-1/ratio-2 comparison and live Retina inspection
confirmed the density setting; it does not remove authored softness. No postprocessing blur, bloom
or depth of field exists.

A temporary Douceur des contours range control in the same story scales authored softness from 0
(sharp contours) through 0.5 (intermediate) to 1 (original appearance), in 0.05 steps. The preview
fixture copies rows and changes only the softness field, preserving relative differences between
grains and retaining derivative antialiasing. Positions, depth, diameter, color and opacity are
unchanged. At 1 the preview uses IntroCreation directly; other values use a temporary static
lifecycle adapter with the same scene/material/shared runtime. Production APIs and generated assets
are unchanged. Sharper coverage can increase visible brightness; this is not an energy-normalized
study or a final appearance decision.

The homepage GPU scene is mounted for integration review. Audio, bloom, camera motion and
perspective remain unimplemented. The owner proposes softness scale 0.8 in the Storybook comparison;
the application still uses the prepared asset unchanged, without that preview-only multiplier.
Native WebGPU, subpixel fidelity and performance targets remain unaccepted. Continue the
function-by-function walkthrough and visual review before extending the experience.

### Application integration — implemented for review

Route / now shows IntroUi over the GPU veil. Shell mounts a persistent ApplicationRendering behind
Outlet and resolves its preparation from the current pathname. The earlier graphics prop and opaque
CSS study backdrop are removed. Fireflies and unknown routes select null, keeping an empty renderer
available. Direct entry to Fireflies does not request the veil asset. The intro loads its code and
compact data on demand when selected. Navigation retains the canvas.

Web TypeScript, targeted typed lint, web build and both production shell browser journeys pass. The
journeys check canvas identity across navigation, direct UI-only entry without a veil download,
language persistence and unknown-route recovery. The preserved application screenshot is
moodboard/intro/07-celestial-veil-application-integration.png. The earlier integration capture
preserves the stretched projection before correction. New 07-celestial-veil-framing-1024x768.png,
-1440x900.png and -2560x1080.png captures preserve corrected uniform containment. Projection tests
span six aspect ratios; three production browser journeys pass, including live resize/canvas
retention. This validates aspect preservation and integration, not final artistic composition,
illumination, transitions or native WebGPU performance. Owner dev servers were untouched.

IntroUi accepts optional native click handlers for the identity and Fireflies invitation. The home
route uses TanStack navigate for ordinary clicks, preserving modified-click native behavior.
Fireflies still displays a temporary localized placeholder with a Home link; unknown routes also
provide a way home. ProjectResourceLink now has its own colocated Default story, localized through
the global toolbar, in addition to the list's interaction tests.

The owner explicitly deferred sound integration to a separate PR. No sound provider, application
store or audio playback was added. IntroUi shows the existing SoundToggle only when both sound state
and its callback are supplied: stories still supply them; the application currently omits them.
Hiding versus disabling this control in the application was asked; hiding is the current default
pending owner feedback.

Twenty-five Storybook tests, web/Storybook types, targeted lint/format and both builds pass. Two
production browser journeys cover localized intro content, navigation without a document reload,
saved language across reloads, direct Fireflies entry and unknown-route recovery. Chrome verified
the actual application and return navigation; its existing English preference was preserved.

### UI composition and ownership

The owner accepted the composition as a working basis: Creation at upper left, FR/EN at upper right,
the verse left-aligned in the quiet left portion and Discover Fireflies at lower right. The three
project-resource links sit at lower left. SoundToggle remains available in the Storybook
composition; application integration is deferred. Keep the right-hand diagonal dust area
unobstructed.

IntroUi owns placement and composes IntroVerse, CreationIdentity, LanguageSwitcher,
ProjectResourceLinks, SoundToggle and ExperienceLink, each with colocated stories.
ProjectResourceLink owns each resource anchor's finite underline interaction. Shared controls/tokens
can be extracted when concrete cross-experience consumers justify them.

Cormorant Garamond Light 300 is retained for expressive identity, verse and navigation. Utility
labels use a provisional system sans. Local study values remain candidates: night #03090e, ivory
#f2eee4, secondary text #b9c5d5 and interaction #e0cc9d. Shared tokens, supporting typeface and
optimized font delivery remain open. The unchanged TTF, OFL license and source notes live under
intro/assets/cormorant-garamond; the application currently serves that study file.

The static verse keeps its exact wording across three lines and an italic edition/reference. The
later entrance will replace the phrases in the same position. FR BDS and EN NIV resources live under
intro/locales. All intro labels follow useTranslation and identify their content language.
LanguageSwitcher keeps both native-language buttons focusable, exposes the selected language with
aria-pressed and reports language-change failures using a diagnostic code. Application localization
owns browser-language resolution and localStorage persistence; the component accesses neither.

Storybook has one visible Default story per component, a global FR/EN toolbar and an illuminated
composition variant. Preview-owned i18n clones synchronize component and toolbar changes without
saving the site's preference. Interaction/unmount test stories stay hidden from browsable previews.
The global preview background is #03090e, preserving the scene halo without a lighter outer frame.
Resource anchors open the repository, public /design-system/ and /docs/ URLs in a new tab with
explicit accessible names. About/Credits remains a proposal, with no extra destination implemented.

ExperienceLink is extracted under intro-ui/experience-link. It accepts a native href,
caller-supplied localized children and an optional click handler. IntroUi owns its right-side
placement and the Fireflies translation. The component preserves the existing decorative arrow,
Cormorant Light, hover color and keyboard focus ring. Its Default story uses the global locale;
automated action/motion checks remain hidden from visual previews. Shared-token extraction remains
deferred.

The owner approved one finite arrow pass on pointer entry or keyboard focus: leave right, then
return from the left of the arrow's own clipped area after the stationary label. No looping while
hovered; a new entry during an active pass is ignored. GSAP 3.15.0 drives only the arrow transform.
createExperienceLinkArrowAnimation owns the paused timeline, using the shared
utils/animation/create-motion-preference-context helper for GSAP preference setup and cleanup.
Clearing its owned transform after context cleanup keeps the arrow visible at rest. Reduced motion
leaves the arrow stationary. Exit 0.14 seconds (power2.in) and return 0.7 seconds (power2.out) are
timing candidates, not final artistic approval. The owner found the previous return adjustment
imperceptible; the longer return makes its slowdown easier to see.

Language controls retain the CSS-only underlineStyles under utils/animation/underline-styles,
including a permanent line for the selected language. Their behavior is unchanged.

Only GitHub, Storybook and Documentation use createDirectionalUnderline under utils/animation.
ProjectResourceLink owns the native anchor, decorative span and effect cleanup; the list owns
destinations and localized accessible labels. The owner chose a finite playOnce pass instead of
interruptible clipping: draw the line, then erase it even while hovered or focused. Active passes
ignore new requests without queuing a replay. Pointer entry chooses the nearer horizontal edge; Tab
enters from the left and Shift+Tab from the right, without preventing navigation. GSAP scales the
line from zero to full width (0.35s, power2.out), switches its origin at full width, then shrinks it
toward the opposite side (0.14s, power2.in). There is no clipPath or clipping-edge calculation.
Reduced motion disables the decorative pass; preference changes restore the hidden line. Disposal
reverts the timeline, clears transforms and removes listeners. Native destinations, focus outlines
and layout remain unchanged. Language controls are unaffected.

Twenty-four Storybook tests, web/Storybook types, targeted lint/format and the Storybook build pass
after this increment. Tests cover keyboard-triggered motion, right/left/rest order, stable label
bounds and cleanup during and after a pass. Chrome frame sampling confirmed positive then negative
travel, final offset zero and no label movement; reduced-motion sampling stayed at zero throughout.
Temporary media emulation was reset. Chrome also verified actual resource hover, the selected
language line and zero CSS transition duration under reduced motion; the extracted GSAP helper kept
the arrow stationary throughout a reduced-motion frame sample. Current underline tests cover both
entry directions, ignored active re-entry, later replay, completion while focused, Tab/Shift+Tab,
stable bounds and unmount cleanup. This does not establish a full device/performance acceptance
matrix.

CreationIdentity is extracted under intro-ui/creation-identity with its Default and hidden
KeyboardAndAction stories. It preserves the Creation home anchor, localized accessible name,
Cormorant Light styling and visible keyboard focus. IntroUi now assembles the six extracted elements
and owns their layout. The owner wants WebGL title work later, alongside the veil; its exact
interaction remains open. No title effect is implemented.

Exact entrance/release timing, title interaction, final link-motion timing, pointer field,
keyboard/reduced-motion behavior, loader artwork, sound assets and intro/Fireflies handover remain
to design. [Runtime readiness](../runtime-contracts.md) and
[shared interface](../interface-direction.md) define infrastructure without prescribing artistic
choreography.
