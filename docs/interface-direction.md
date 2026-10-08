# Interface direction

## Confirmed foundation

One recognizable Creation UI adapts to each experience. Share typography, spacing, focus/control behavior and navigation grammar; allow local palette, artistic identity, motion and entry rituals. See [branding](branding.md) for Cormorant Garamond Light and the provisional C.

Each experience has a direct URL and a discreet path back to Creation. The site is FR/EN; sound activation is voluntary and its choice is retained during the visit. Shared controls must remain discoverable and keyboard-accessible during contemplation. Layouts, supporting typography, public copy and exact control visibility remain to refine.

## Fireflies input and editing

The input's fine bottom rule is a horizontal axis, not necessarily a control placed at the bottom of the viewport. Small lights orbit it in shallow depth, with varied phases, radii, speeds and positions. Pass above/below and in front/behind; draw no tracks. Protect letters, caret and controls; concentrate entry activity around the input.

Keep conventional editable typography and a clear label/submit action. Do not rebuild particle text per keystroke. Formation and later editing preserve one word's position, silhouette and perceived scale; see the [storyboard](experiences/fireflies-storyboard.md). During editing, gesture-driven scene perturbation is suspended while autonomous motion/ambient sound continue.

## SVG icons and tokens

Hand-author shared SVG icons in packages/ui/icons. Use explicit exports, currentColor and a consistent optical weight/curve/end-cap language. Choose actual sizes and geometry by review against both scenes. Decorative icons are hidden from assistive technology; icon-only controls have accessible names. Preserve path identifiers required for purposeful animation.

packages/design-tokens owns shared semantic design values; experience artwork and simulation parameters stay local. Experience logos need not follow utility-icon geometry. No stock icon library is selected.

## Accessibility

Keyboard navigation, visible focus, labels, contrast, reduced-motion treatment and usable error/retry states are required. Sound and motion cannot be the only means of understanding a control. Essential actions must not depend on hover. Design the mobile invitation separately from the interactive desktop experience.

Detailed interaction alternatives and reduced-motion visuals remain to design in their implementation increments. Reduced motion is independent of hardware quality.

## Loader — deferred

A polished Creation loader is required; its artwork/motion is deferred. No stagger, C reveal or breathing animation is approved.

Retain the approved [readiness strategy](runtime-contracts.md): a lightweight initial DOM/background before GPU readiness; outgoing scene stays usable during incoming preparation. A discreet waiting indicator may appear when useful, without a forced full-screen overlay or artificial minimum duration. Show measurable progress only when bounded work supports it; otherwise communicate preparation. Provide accessible status and retry; do not announce animation frames. No sound before audio consent.

Loader design must not constrain the experience transition or become an expensive loading dependency itself.
