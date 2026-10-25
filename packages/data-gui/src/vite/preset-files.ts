import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { join } from 'node:path';

import type { Plugin } from 'vite';

import { createAsyncTaskQueue } from '@creation/utils/async/task-queue';
import { CodedError } from '@creation/utils/errors/coded-errors';

import {
  assertPresetScope,
  parsePresetCollection,
  PRESET_ERROR_CODES,
  type PresetCollection,
} from '../presets/preset-data.ts';

async function readCollection(directory: string, scope: string): Promise<PresetCollection> {
  try {
    const value: unknown = JSON.parse(await readFile(join(directory, `${scope}.json`), 'utf8'));
    return parsePresetCollection(value, scope);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { version: 1, scope, presets: [] };
    }
    throw error;
  }
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  let body = '';
  for await (const chunk of request) {
    if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string') {
      throw new CodedError(PRESET_ERROR_CODES.INVALID);
    }
    body += chunk.toString();
    if (Buffer.byteLength(body) > 1_048_576) {
      throw new CodedError(PRESET_ERROR_CODES.INVALID);
    }
  }
  return JSON.parse(body) as unknown;
}

/** Atomic, serialized local authoring files. This endpoint does not exist in builds/previews. */
export function dataGuiPresetFiles(options: Readonly<{ directory: string }>): Plugin {
  const queue = createAsyncTaskQueue();
  return {
    name: 'creation-data-gui-presets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__data-gui/presets', (request, response) => {
        void queue
          .enqueueTask(async () => {
            const scope = (request.url ?? '').replace(/^\//, '').split('?')[0] ?? '';
            assertPresetScope(scope);
            response.setHeader('Cache-Control', 'no-store');
            response.setHeader('Content-Type', 'application/json');
            if (request.method === 'GET') {
              response.end(JSON.stringify(await readCollection(options.directory, scope)));
              return;
            }
            if (request.method !== 'PUT') {
              response.statusCode = 405;
              response.end();
              return;
            }
            const origin = request.headers.origin;
            if (origin !== undefined && new URL(origin).host !== request.headers.host) {
              response.statusCode = 403;
              response.end();
              return;
            }
            const collection = parsePresetCollection(await readBody(request), scope);
            await mkdir(options.directory, { recursive: true });
            const temporary = join(options.directory, `.${scope}-${randomUUID()}.tmp`);
            try {
              await writeFile(temporary, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
              await rename(temporary, join(options.directory, `${scope}.json`));
            } finally {
              // Only remove this operation's staging file; never alter a previously saved preset.
              await rm(temporary, { force: true });
            }
            response.end(JSON.stringify(collection));
          })
          .catch((error: unknown) => {
            response.statusCode =
              error instanceof SyntaxError ||
              (error instanceof CodedError && error.code === PRESET_ERROR_CODES.INVALID)
                ? 400
                : 500;
            response.end(
              JSON.stringify({
                error:
                  response.statusCode === 400
                    ? 'Invalid preset data.'
                    : 'Unable to access preset files.',
              })
            );
            if (response.statusCode === 500) {
              server.config.logger.error(String(error));
            }
          });
      });
    },
  };
}
