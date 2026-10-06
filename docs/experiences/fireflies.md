# Fireflies

Status: founding experience confirmed; experience design in progress. `Fireflies` is the historical working title, not a finalized experience brand.

## Confirmed foundation

The owner created an earlier Gobelins experiment where a visitor enters a word in a styled input. Living particles form the word; music then plays and the particles react.

The new experience must preserve:

- User-entered word and its readability.
- Music.
- Choreography that works without music and supports interaction.
- Music-reactive choreography.

The owner selected an abstract rather than realistic direction, with a nocturnal atmosphere that gives the fireflies' light its context. Detailed art direction, choreography, and interaction rules remain open. The original assets or implementation have not been reviewed.

## Proposed experience promise

Give a word to a living world; watch it become light, gently disturb it, and let it find its shape again.

## Art direction in progress

**Confirmed:** an abstract summer night with a deep, enveloping blue. This decision applies to Fireflies; the overall collection palette remains undecided.

**Proposed:** subtle differences between near-black blue in the distance and slightly more visible blue around the living forms. Use sparse layers of light and restrained atmospheric depth to suggest an enveloping space. Exact colors and any haze remain unconfirmed.

**Light directions to compare:** warm ivory/gold for a tender contrast with the blue; pale green-gold for a stronger organic association; cool pearl for a more ethereal atmosphere. Mentor preference: explore warm ivory with a restrained gold halo first. Warm ivory, pale gold, and subtle green-gold are accepted for exploration; exact colors remain open.

Keep adequate negative space around the word and preserve individual points of light so that the letters feel inhabited by living particles. This is a proposed composition principle to validate visually.

The [Fireflies moodboard](../../moodboard/fireflies/README.md) holds the reference and visual study plan.

## Particle rendering reference

The owner supplied [a luminous particle reference](../../moodboard/fireflies/references/01-luminous-particles.jpg). It is retained for internal design discussion, not as a production asset. Original source and usage rights have not been verified.

**Confirmed:** varied particle presences and behaviors, with different but coherent colors. The reference informs rendering character; its exact colors and light intensity are not selected.

**Visual observations:** the still combines tiny crisp points, larger bright cores with soft halos, diffuse lights, varying density, and substantial dark negative space. These cues suggest depth; motion, actual geometry, and implementation cannot be inferred from the image alone. The spiral and page branding are not requested design elements.

**Proposed adaptation:** distant subdued lights, legible particles forming the word, and sparse larger foreground lights. Explore related warm ivory, pale gold, and subtle green-gold accents against the confirmed deep blue night. Preserve individual lights and avoid overlapping halos obscuring letters. The owner accepts this as a starting direction to adjust through visuals; exact colors and intensity are not locked.

Depth and color should be separate variables: avoid assigning a fixed color to each depth layer. Controlled variation within layers can retain a coherent living population. This is a mentor recommendation to validate visually.

## Proposed journey

1. **Encounter:** a sparse living scene already has quiet autonomous motion. A restrained input invites one word.
2. **Formation:** after submission, individuals gradually gather into legible letters. Small delays and varied trajectories retain a sense of life.
3. **Quiet play:** the word remains alive without music. A slow gesture attracts nearby fireflies; a quicker gesture gently disperses them. On release, they return gradually to the letter formation.
4. **Musical play:** the visitor explicitly starts music. Musical features influence motion and light in a restrained, differentiated way. Word readability remains a design constraint, not an accidental result.
5. **Return:** the visitor can return to quiet choreography, change the word, or leave. Musical ending and replay behavior are undecided.

All steps above are proposals, not validated functionality. Gesture mappings need discussion and testing for discoverability and touch compatibility.

## Proposed behavior principles

- Movement continues without input or audio.
- Individuals differ in timing, movement, and light; avoid uniform blinking.
- The visitor influences a world rather than directly positioning every particle.
- Recovery toward readable text is gradual; decide whether all letters must remain readable during perturbation.
- Musical response should preserve calm and avoid constant high-intensity flashes.
- Design mobile gestures deliberately rather than assuming mouse hover exists.

## Open questions for the next iteration

- How should the abstract nocturnal world express depth, darkness, and light?
- Should the word remain continuously readable, or may it temporarily dissolve and reform?
- Does music accompany open-ended exploration or define a composed beginning-to-end piece?
- What music source and production approach should be used?
- Text limits, supported scripts, accents, empty input, and public interface language.
- Audio controls, onboarding, keyboard/touch interaction, reduced-motion alternative, and scene exit.
- 2D/3D treatment and whether a mode switch adds artistic value.
- Exact visual direction, palette, typography, logo, and soundscape.
- Performance acceptance criteria and representative devices.
