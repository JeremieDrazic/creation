# Sound design

Status: the owner requests polished experience sound design, including subtle hover feedback. This
expands the audio direction beyond ambient sound and the music-reactive track. Exact sound assets,
event inventory, mixing levels and per-experience signatures remain to design together.

## Proposed artistic direction

Creation's shared interaction sounds should feel soft, organic, intimate and spacious, consistent
with the approved emotional vocabulary. Explore small breath-like textures, delicate resonances and
restrained luminous accents rather than literal generic notification sounds. These are creative
proposals, not chosen instruments or finalized audio.

Use a recognizable shared sound vocabulary with local coloration for intro and Fireflies. A hover is
a quiet acknowledgement; a confirmed action may have a slightly more resolved sound. Avoid assigning
a sound to every action or creating a continuous sequence of interface noises during contemplation.

## Candidate moments

| Moment                          | Proposed intent                                                            |
| ------------------------------- | -------------------------------------------------------------------------- |
| Entering an interactive control | Brief, subtle presence; hover/focus behavior to validate together.         |
| Activating a control            | Distinct but related confirmation.                                         |
| Submitting a word               | A designed sonic gesture supporting typography-to-particle formation.      |
| Navigating between experiences  | A continuous handover texture coordinated with visual/audio transitions.   |
| Changing quality or settings    | Feedback only when useful; avoid making every slider update a sound event. |

Do not interpret this request as approval of per-keystroke sounds, pointer-movement sonification or
luciole-level positional audio. These may be explored only if they serve a real experiential
purpose.

## Interaction and access rules

- Respect the already confirmed voluntary sound activation. Do not attempt hover playback before
  sound is enabled; do not replay earlier hover events when audio becomes available.
- Global sound-off silences interface sounds as well as ambient/music output, while retaining the
  established music-to-reverie behavior. Do not make important controls understandable only through
  sound.
- Consider keyboard focus feedback alongside pointer hover; avoid duplicate playback when one action
  produces both focus and hover. Exact focus policy remains to assess for navigation comfort.
- Debounce/rate-limit repeated entries, limit overlapping voices and use restrained variation where
  helpful. Define limits from listening rather than randomize pitch indiscriminately.
- Avoid loud/piercing transients and distracting repeated feedback. Mixing must preserve the
  music/ambient hierarchy; no fixed decibel or loudness target is selected yet.
- A separate interface-sound preference could be offered if testing demonstrates value, but is not
  selected by this request.

## Audio architecture implications

Expose separate logical buses for ambience, music and interface/transition effects, with one
explicit audio-context owner. The music analyser must not include hover sounds or ambient audio;
sonic accents must not accidentally trigger the choreography. Keep analysis/output gain policy
consistent with packages/audio's agreed responsibilities.

Design sample preparation, voice pooling, scheduling, fades and cleanup in packages/audio when
implementing. Keep event-to-sound mapping in shared UI/experience composition rather than generic
utils. Small effects must not create a new AudioContext per interaction or stall rendering through
synchronous loading. Prepare only useful assets and include them in quality/download budgets.

Sound generation, recording/licensing and asset formats remain open. Finished sounds should be
evaluated in the real scene, with music and transitions, not only as isolated samples. Define a
compact sonic event map when implementing the relevant interactions, following the
[bounded implementation sequence](implementation-plan.md).
