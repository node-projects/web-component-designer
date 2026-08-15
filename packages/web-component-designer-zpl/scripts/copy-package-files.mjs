import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceAssets = resolve(root, 'assets');
const dist = resolve(root, 'dist');
const targetAssets = resolve(dist, 'assets');

if (!existsSync(dist)) {
    throw new Error('dist is missing. Run npm run build before npm run copy.');
}
if (!existsSync(sourceAssets)) {
    throw new Error('Package assets are missing.');
}

rmSync(targetAssets, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(sourceAssets, targetAssets, { recursive: true });

for (const requiredFile of [
    'fonts/PrintLabZPL-Bold.woff2',
    'fonts/PrintLabMono.ttf',
    'fonts/VeraMono-Bold.ttf',
    'fonts/OCRB.ttf',
    'fonts/OCRA.ttf',
    'fonts/LICENSE-APACHE-2.0.txt',
    'licenses/ZPLab-LICENSE.txt',
    'licenses/BWIP-JS-LICENSE.txt'
]) {
    if (!existsSync(resolve(targetAssets, requiredFile))) {
        throw new Error(`Copied package asset is missing: ${requiredFile}`);
    }
}
