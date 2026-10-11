import { createRootRoute } from '@tanstack/react-router';

import { NotFound, Shell } from '../shell/shell';

export const Route = createRootRoute({ component: Shell, notFoundComponent: NotFound });
