import { gsap } from 'gsap';

/** Creates GSAP animations only while motion is allowed; setup may return extra cleanup. */
export function createMotionPreferenceContext(setup: () => void | (() => void)) {
  const motionPreference = gsap.matchMedia();

  motionPreference.add('(prefers-reduced-motion: no-preference)', setup);

  function dispose(): void {
    // Reverts captured animations, runs setup's cleanup and removes the preference listener.
    motionPreference.revert();
  }

  return { dispose };
}
