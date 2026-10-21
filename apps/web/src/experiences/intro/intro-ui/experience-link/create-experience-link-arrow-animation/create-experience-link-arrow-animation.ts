import { gsap } from 'gsap';

import { createMotionPreferenceContext } from '../../../../../utils/animation/create-motion-preference-context/create-motion-preference-context';

const ARROW_EXIT_DURATION_SECONDS = 0.14;
const ARROW_RETURN_DURATION_SECONDS = 0.7;
const ARROW_OFFSCREEN_PERCENT = 110;

/** Owns the arrow's transform and motion preference listener until dispose is called. */
export function createExperienceLinkArrowAnimation(arrow: SVGSVGElement) {
  let timeline: gsap.core.Timeline | null = null;

  const motionPreference = createMotionPreferenceContext(() => {
    timeline = gsap
      .timeline({ paused: true })
      .to(arrow, {
        xPercent: ARROW_OFFSCREEN_PERCENT,
        duration: ARROW_EXIT_DURATION_SECONDS,
        ease: 'power2.in',
      })
      .set(arrow, { xPercent: -ARROW_OFFSCREEN_PERCENT })
      .to(arrow, {
        xPercent: 0,
        duration: ARROW_RETURN_DURATION_SECONDS,
        ease: 'power2.out',
      });

    return () => {
      timeline = null;
      // The exit/return sequence owns this transform; reduced motion restores the resting arrow.
      gsap.set(arrow, { clearProps: 'transform' });
    };
  });

  function playOnce(): void {
    if (timeline === null || timeline.isActive()) {
      return;
    }

    timeline.restart();
  }

  function dispose(): void {
    // GSAP restores the original transform and releases the media query listener.
    motionPreference.dispose();
  }

  return { playOnce, dispose };
}
