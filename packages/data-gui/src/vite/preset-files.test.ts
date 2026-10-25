import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createServer } from 'vite';
import { expect, test } from 'vitest';

import { dataGuiPresetFiles } from './preset-files';

test('persists atomic authoring files, rejects invalid writes and keeps scopes isolated', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'creation-gui-presets-'));
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [dataGuiPresetFiles({ directory })],
  });
  const http = createHttpServer(vite.middlewares);
  try {
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    const address = http.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Expected a test server port.');
    }
    const url = `http://127.0.0.1:${address.port}/__data-gui/presets`;
    expect(await (await fetch(`${url}/intro`)).json()).toEqual({
      version: 1,
      scope: 'intro',
      presets: [],
    });
    const collection = {
      version: 1,
      scope: 'intro',
      presets: [{ id: 'a', name: 'Wide', settings: { scale: 1.5 } }],
    };
    const put = (scope: string, body: unknown, origin?: string) =>
      fetch(`${url}/${scope}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
        body: JSON.stringify(body),
      });
    expect((await put('intro', collection)).status).toBe(200);
    expect(JSON.parse(await readFile(join(directory, 'intro.json'), 'utf8'))).toEqual(collection);
    expect(await (await fetch(`${url}/intro`)).json()).toEqual(collection);
    expect((await put('intro', { ...collection, scope: 'other' })).status).toBe(400);
    expect((await put('bad%2Fscope', collection)).status).toBe(400);
    expect((await put('intro', collection, 'http://unrelated.example')).status).toBe(403);
    expect(JSON.parse(await readFile(join(directory, 'intro.json'), 'utf8'))).toEqual(collection);
    expect(await (await fetch(`${url}/fireflies`)).json()).toEqual({
      version: 1,
      scope: 'fireflies',
      presets: [],
    });
  } finally {
    await new Promise<void>((resolve, reject) =>
      http.close((error) => (error ? reject(error) : resolve()))
    );
    await vite.close();
    await rm(directory, { recursive: true, force: true });
  }
});
