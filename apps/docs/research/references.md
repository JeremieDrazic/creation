# Research references

Consulted: 2026-10-06. Applications below are mentor proposals, not claims made by the sources or
selected implementation choices.

## The Nature of Code — Daniel Shiffman

Primary source: https://natureofcode.com/

Use the book to understand generative behavior and natural simulation. It is a learning reference,
not a selected production stack or a visual template.

| Source                                      | Topic                                     | Proposed application                                                                   |
| ------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| https://natureofcode.com/random/            | Random distributions and coherent noise   | Individual variation and smooth wandering rather than jitter.                          |
| https://natureofcode.com/particles/         | Particle systems                          | Living populations and particle behavior.                                              |
| https://natureofcode.com/autonomous-agents/ | Steering behavior and collective behavior | Returning toward letter targets, responding to a visitor, and future bird murmuration. |

For Fireflies, explore a balance between wandering, attraction toward text targets, and visitor
influence. Adapt the algorithms to measured production needs instead of directly adopting the
educational examples' object model. Credit reused material appropriately and review its license if
code or assets are copied.

## Owner-provided interactive references — October 14, 2026

The owner identifies Symphony of Vines as the closest reference to Creation. These sites inform
craft, interaction and motion exploration; they do not replace the approved intro/Fireflies visual
targets or establish measured performance requirements.

Owner clarification — confirmed inspiration qualities: Symphony of Vines is a whole-experience
reference, including its introduction, distinct scenes, interactions, abstract interpretation of
nature, graphical coherence, atmosphere, art direction, sound design and UI. The owner specifically
highlights growing roots, particle interactions and using the mouse to reveal or conceal elements.
These examples describe what the owner values in the reference; roots or additional scenes are not
new V1 commitments. Creation's experiences are visitor-selected rather than sequential chapters.
Apply this reference to the quality and coherence of the approved intro/Fireflies direction; exact
gesture behavior, choreography, sound and UI details still need their own bounded design decisions.

| Reference                                                                  | Review evidence                                                                                                                                                                                                                                                                | Proposed focus for Creation                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [Symphony of Vines — Unseen](https://symphonyofvines.unseen.co/)           | Browser entry, first terrain chapter and ending observed; the site describes four elemental chapters with cursor interaction. Full interaction and sound assessment remain open.                                                                                               | Cinematic composition, atmospheric depth, lighting, restrained interface and gesture-driven natural forces. |
| [Aurelia — holtsetio](https://holtsetio.com/lab/aurelia/)                  | Luminous jellyfish scene observed. Its information panel identifies procedural jellyfish, Verlet physics, simulated volumetric light and Three.js WebGPU/TSL; [public source](https://github.com/holtsetio/aurelia/) is available. Source implementation has not been audited. | Organic movement, luminous forms against deep blue and concrete research using our selected graphics stack. |
| [My Little Storybook — Lusion](https://exp-my-little-storybook.lusion.co/) | Entry and first story scene observed. Lusion describes a stylized-nature experiment about a bird family crossing a river. Full story and sound review remain open.                                                                                                             | Gentle staging, readable natural forms and coordinated visual storytelling.                                 |
| [Chartogne-Taillet](https://chartogne-taillet.com/en)                      | Only the age-verification entry was inspected. [Studio case study](https://ailienintelligence.com/projects/mind-seeds/) describes hand-drawn maps, watercolor-inspired effects and vineyard exploration; deeper interaction was not directly verified.                         | Art-directed typography, organic marks and coherent material treatment.                                     |

## Theatre.js — research candidate, not selected

[Theatre.js](https://www.theatrejs.com/) provides a visual animation editor and animates JavaScript
values, including camera, light and material properties. The
[Three.js guide](https://www.theatrejs.com/docs/0.5/getting-started/with-three-js) documents direct
integration. Its [custom frame driver](https://www.theatrejs.com/docs/latest/manual/advanced) can
synchronize sequence playback and value subscriptions with our shared graphics schedule.
Pause/resume and the chosen time source would still need explicit integration.

Proposed evaluation: a bounded prototype of an artistic entrance, comparing visual authoring with
our selected GSAP workflow. Potential uses include camera movement, veil appearance and light
intensity. Organic simulation and live audio response remain experience-owned rather than authored
as a fixed playback sequence. No installation, stack replacement or experience implementation is
authorized by this reference review. Public README describes work toward 1.0 in a private
repository; current maintenance/version compatibility need verification before adoption. See the
[official repository](https://github.com/theatre-js/theatre). Studio is development-only and its
licensing differs from core according to that README; review the exact packages if adopted.

## React canvas lifecycle comparison — October 20, 2026

At the owner's request, reviewed the official React Three Fiber development-branch
[Canvas implementation](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/web/Canvas.tsx).
It declares canvas in JSX, configures a delegated rendering root from a layout effect, and includes
specialized cleanup for StrictMode/hidden trees. This is development source, not a verified
installed release. It demonstrates lifecycle delegation, not a requirement to reproduce Fiber's
internals.

Creation retains a fresh imperative canvas per runtime Effect setup to isolate asynchronous teardown
observed in its POC. Normal experience navigation retains one canvas/renderer. The Effect delegates
asynchronous ownership to attachRenderingRuntime. React documents effects for
[external-system synchronization](https://react.dev/reference/react/useEffect); effect length alone
does not determine correctness. Prefer clear ownership and symmetric cleanup. Do not copy Fiber's
insertion-effect strategy into application code merely to bypass development replay: React
[documents useInsertionEffect](https://react.dev/reference/react/useInsertionEffect) primarily for
CSS-in-JS library authors. No Fiber dependency or lifecycle-strategy replacement was introduced.

## Rendering and mobile performance sources

- MDN WebGL best practices:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- Three.js responsive rendering: https://threejs.org/manual/pages/responsive.html

These references discuss rendering budgets and resolution management. High device pixel density can
greatly increase rendering work. Creation targets desktop for V1 and presents an invitation to
desktop on mobile. Measure frame times on the reference device matrix and adapt internal resolution
and visual complexity; exact acceptance thresholds remain open. See
[performance and quality](../performance-and-quality.md).
