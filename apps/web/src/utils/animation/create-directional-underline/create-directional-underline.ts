import { gsap } from 'gsap';

import { createMotionPreferenceContext } from '../create-motion-preference-context/create-motion-preference-context';

type Side = 'left' | 'right';

const UNDERLINE_REVEAL_DURATION_SECONDS = 0.35;
const UNDERLINE_HIDE_DURATION_SECONDS = 0.14;

function getPointerSide(event: PointerEvent, link: HTMLElement): Side {
  const bounds = link.getBoundingClientRect();

  return event.clientX < bounds.left + bounds.width / 2 ? 'left' : 'right';
}

/** Owns one finite underline pass and its input/media listeners until disposal. */
export function createDirectionalUnderline(link: HTMLAnchorElement, underline: HTMLElement) {
  let timeline: gsap.core.Timeline | null = null;
  let isBackwardTab = false;

  const motionPreference = createMotionPreferenceContext(() => {
    timeline = gsap.timeline({ paused: true });

    return () => {
      timeline = null;
      gsap.set(underline, { clearProps: 'transform,transformOrigin' });
    };
  });

  function playOnce(side: Side): void {
    if (timeline === null || timeline.isActive()) {
      return;
    }

    const entryOrigin = side === 'left' ? 'left center' : 'right center';
    const exitOrigin = side === 'left' ? 'right center' : 'left center';

    timeline
      .clear()
      .set(underline, { scaleX: 0, transformOrigin: entryOrigin })
      .to(underline, {
        scaleX: 1,
        duration: UNDERLINE_REVEAL_DURATION_SECONDS,
        ease: 'power2.out',
      })
      // At full width, changing the anchor does not move the visible line.
      .set(underline, { transformOrigin: exitOrigin })
      .to(underline, {
        scaleX: 0,
        duration: UNDERLINE_HIDE_DURATION_SECONDS,
        ease: 'power2.in',
      })
      .restart();
  }

  function onPointerEnter(event: PointerEvent): void {
    playOnce(getPointerSide(event, link));
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      isBackwardTab = event.shiftKey;
    }
  }

  function onFocus(): void {
    if (link.matches(':focus-visible')) {
      playOnce(isBackwardTab ? 'right' : 'left');
    }
  }

  link.addEventListener('pointerenter', onPointerEnter);
  link.addEventListener('focus', onFocus);
  // Capture Tab before focus moves, including when it comes from outside this link.
  link.ownerDocument.addEventListener('keydown', onKeyDown, true);

  function dispose(): void {
    link.removeEventListener('pointerenter', onPointerEnter);
    link.removeEventListener('focus', onFocus);
    link.ownerDocument.removeEventListener('keydown', onKeyDown, true);
    motionPreference.dispose();
  }

  return { playOnce, dispose };
}
