# Interface direction

Status: shared adaptive interface principle accepted by the owner. Details below remain mentor proposals; no specific layout, control inventory, or component technology is selected.

## Accepted principle

One recognizable Creation interface system that adapts to each experience. Combine a shared navigation and control grammar with experience-specific entry rituals and interactions.

## Shared foundation — proposed

- Creation identity, typography hierarchy, spacing, focus treatment, and basic control behavior.
- Consistent patterns for finding experiences, leaving the current scene, discovering help, and controlling sound where relevant.
- A coherent interaction and motion language: pacing, restrained transitions, and feedback.
- Familiar semantics and understandable controls across the collection, including keyboard and touch behavior.

Specific control inventory and positions remain open. Use relevant controls only; an experience without sound does not need sound controls.

## Adaptation — proposed

- Each experience can have its own title, animated logo, accent palette, local material treatment, and motion signature.
- Adapt interface contrast and surface treatment to the scene rather than applying identical colors everywhere.
- Experience-specific interactions remain distinctive: Fireflies has a word-entry ritual; other experiences may invite a gesture or observation instead.
- Keep shared controls recognizable even when their visual treatment changes.

## Fireflies application — proposed

Use a restrained Creation frame, a distinctive word-entry interaction, and contextual controls whose presence can evolve from entry to exploration. Explore a quieter interface during contemplation, with reliably discoverable controls and a clear exit. Exact layout, labels, visibility behavior, and input design require owner discussion and visual validation.

## Learning and scalability rationale

A shared foundation supports recognizable authorship, lower relearning effort, and reuse. Experience-specific rituals preserve artistic identity. Reuse should follow stable behavior and responsibilities; implementation boundaries will be decided in the architecture phase rather than imposed by these visual notes.

## Next design step — proposed

Develop the entry-state interface against Fireflies Study 09, the accepted atmosphere baseline. Focus first on Creation's typographic presence, the invitation to enter a word, the word-entry interaction, and relevant surrounding controls. Exact controls and layout are not yet selected. The owner confirmed a bilingual French/English public website; code and documentation remain English.

## Fireflies word-entry exploration

**Accepted exploration direction:** use a bottom-line input with a few small fireflies moving around the line. This describes the input's lower border, not a confirmed placement at the bottom of the viewport.

**Mentor recommendation:** explore a fine subdued ivory line, a readable persistent invitation/label, and standard editable text and caret. A few tiny fireflies can wander near the line with irregular timing and short pauses rather than constantly orbit in synchronized loops. Keep them clear of the letters and quiet enough to support reading.

On focus, consider a restrained increase in line contrast and local firefly attention. During typing, avoid continually reforming particle letters in a way that makes editing harder. On submission, consider those few fireflies initiating the larger swarm's formation. These gestures are proposals; detailed choreography remains open.

Keep submission discoverable with an explicit action whose label/visual form is still to design, plus keyboard submission. Maintain an understandable text-entry control, visible focus, readable text, and reduced-motion behavior; the precise accessibility implementation will be defined later.

Example invitation copy for discussion only: French "Confiez un mot à la nuit"; English "Give a word to the night". Public copy is not approved.

## Remaining questions

- Is Creation's navigation a gallery, an atlas, a sequence, or another form?
- Which controls are shared, and which appear only for particular experiences?
- What remains visible during contemplation, and how are hidden controls discovered and reached?
- Which typography and motion principles bind the collection?
- How should the interface work on touch, keyboard, and reduced-motion settings?

## Visual proposals

[Study 10 — French entry state](../moodboard/fireflies/studies/10-entry-interface-fr.md) explores the word input, brand typography and shared controls. Exact layout, copy, control inventory and logo are not approved. The atmosphere should remain anchored to Study 09 despite the generated mockup's increased veil and light intensity.
