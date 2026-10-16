import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import tailwind from '@tailwindcss/postcss';

const root = fileURLToPath(new URL('..', import.meta.url));
const plugins = path.join(root, 'plugins');
for (const entry of await fs.readdir(plugins, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const folder = path.join(plugins, entry.name);
  const source = path.join(folder, 'source');
  const output = path.resolve(folder, 'dist');
  if (path.dirname(output) !== folder) throw new Error('Invalid plugin output directory');
  if (process.argv[2] && process.argv[2] !== entry.name) continue;
  await build({ configFile: false, root: source, base: './', publicDir: false, cacheDir: path.join(root, '.cache', 'vite', entry.name), esbuild: { jsx: 'automatic' }, css: { postcss: { plugins: [tailwind({ base: source })] } }, build: { outDir: output, emptyOutDir: true, rollupOptions: { onwarn(warning, warn) { if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning); } } } });
}
