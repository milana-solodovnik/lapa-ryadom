// Starts the web dev server programmatically.
// Used with scripts/run-detached.ps1 so it survives the parent shell.
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..', 'apps', 'web');

const server = await createServer({
  root: webRoot,
  configFile: path.join(webRoot, 'vite.config.ts'),
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: false,
      },
    },
  },
});

await server.listen();
server.printUrls();

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);