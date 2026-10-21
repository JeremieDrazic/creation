import * as stylex from '@stylexjs/stylex';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { MouseEvent } from 'react';

import { IntroUi } from '../experiences/intro/intro-ui/intro-ui';

const styles = stylex.create({
  intro: {
    height: '100svh',
    minHeight: '28rem',
    // Temporary composition backdrop until the WebGL veil is implemented.
    backgroundImage: 'radial-gradient(ellipse at 85% 35%, #173344 0%, #08141d 32%, #03090e 68%)',
  },
});

function Page() {
  const navigate = useNavigate();

  function navigateWithinApp(event: MouseEvent<HTMLAnchorElement>, to: '/' | '/fireflies'): void {
    // Modified clicks keep the anchor's native new-tab/window behavior.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    void navigate({ to }).catch((error: unknown) => {
      console.error('INTRO_NAVIGATION_FAILED', error);
    });
  }

  return (
    <div {...stylex.props(styles.intro)}>
      <IntroUi
        onReturnHome={(event) => navigateWithinApp(event, '/')}
        onDiscoverFireflies={(event) => navigateWithinApp(event, '/fireflies')}
      />
    </div>
  );
}

export const Route = createFileRoute('/')({ component: Page });
