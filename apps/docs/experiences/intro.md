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

## Remaining decisions

### Application integration — implemented for review

The owner authorized replacing the old shell presentation with the reviewed intro. Route / now
mounts IntroUi full-screen on the illuminated CSS study backdrop; this remains temporary until the
WebGL veil is built. Shell owns the page surface and document language, while routes own their
content. The old shared header/navigation and triangle validation panel were removed. The triangle
remains available through rendering-probe.html and RenderingCanvas stories; no production GPU
experience is mounted yet.

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
