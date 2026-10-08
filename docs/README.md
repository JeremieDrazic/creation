# Creation documentation

This is the current project reference, not a transcript of design exploration. Updated October 8, 2026.

## Start here

1. [Project brief](project-brief.md): intent, scope and constraints.
2. [Decisions](decisions.md): current choices and unresolved topics.
3. [Implementation sequence](implementation-plan.md): next work and review boundaries.
4. [Collaboration](collaboration.md): code-first senior mentorship and delivery permissions.

## Experience and design

- [Intro](experiences/intro.md): celestial veil, interaction and Genesis 1:3.
- [Fireflies](experiences/fireflies.md): atmosphere, interactions, word and music behavior.
- [Fireflies storyboard](experiences/fireflies-storyboard.md): the visitor journey and editing ritual.
- [Interface direction](interface-direction.md): shared UI, icons, accessibility and deferred loader.
- [Branding](branding.md): Cormorant Garamond Light and provisional C sign.
- [Sound design](sound-design.md): shared sonic vocabulary and mixing rules.
- [Moodboard](../moodboard/README.md): retained visual targets and their limitations.

## Engineering

- [Architecture](architecture.md): monorepo boundaries, lifecycle and scene residency.
- [Runtime contracts](runtime-contracts.md): ownership, commands, transitions and recovery.
- [Stack](stack.md): selected dependencies, rationale and integration checks.
- [Standards](standards.md): TypeScript, formatting, linting and meaningful verification.
- [Performance and quality](performance-and-quality.md): desktop targets, quality settings and workers.
- [Sharing](sharing.md): route-specific static metadata and social previews.
- [Delivery](delivery.md): branches, PRs and isolated Docker/Traefik deployment.
- [Research references](research/references.md): The Nature of Code and rendering foundations.

## Status conventions

**Confirmed** means requested or accepted by the owner. **Proposed** means a recommendation awaiting discussion. **Open** means unresolved. Visual approval does not imply validated animation, browser support or measured performance.

Keep one authoritative home for each requirement and link to it elsewhere. Update these documents as implementation reveals new facts; remove stale alternatives rather than preserve a running conversation log.
