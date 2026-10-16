const fs = require('node:fs/promises');
const path = require('node:path');
const { packagePlugin } = require('@dockit/plugin-sdk/package');
const { validateManifest } = require('@dockit/plugin-sdk');

(async () => {
  const root = path.resolve(__dirname, '..');
  const ids = new Set();
  for (const entry of await fs.readdir(path.join(root, 'plugins'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(root, 'plugins', entry.name);
    const manifest = validateManifest(JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8')));
    if (ids.has(manifest.id)) throw new Error('Duplicate plugin ID: ' + manifest.id);
    ids.add(manifest.id);
    await packagePlugin(folder, path.join(root, '.cache', manifest.id + '.zip'));
    console.log(manifest.id + ' ' + manifest.version + ': OK');
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
