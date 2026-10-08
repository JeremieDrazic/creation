import { createRootRoute } from '@tanstack/react-router';

import { NotFound, Shell } from '../shell/Shell';

export const Route = createRootRoute({ component: Shell, notFoundComponent: NotFound });
