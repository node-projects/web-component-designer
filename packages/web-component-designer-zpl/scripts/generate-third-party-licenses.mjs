import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8').trim();
const requiredFiles = [
    'assets/fonts/PrintLabZPL-Bold.woff2', 'assets/fonts/PrintLabZPL-Bold.ttf',
    'assets/fonts/PrintLabMono.ttf', 'assets/fonts/VeraMono.ttf',
    'assets/fonts/VeraMono-Bold.ttf', 'assets/fonts/OCRB.ttf', 'assets/fonts/OCRA.ttf',
    'assets/fonts/NOTICE.md', 'assets/fonts/PrintLabMono-NOTICE.md',
    'assets/fonts/VeraMono-NOTICE.md', 'assets/fonts/OCRB-NOTICE.md',
    'assets/fonts/OCRA-NOTICE.md', 'assets/fonts/LICENSE-APACHE-2.0.txt',
    'assets/licenses/ZPLab-LICENSE.txt', 'assets/licenses/BWIP-JS-LICENSE.txt'
];

for (const file of requiredFiles) {
    if (!existsSync(resolve(root, file))) throw new Error(`Required third-party asset is missing: ${file}`);
}

const sections = [
    '# Third-party licenses',
    '',
    'The original source code of `@node-projects/web-component-designer-zpl` is MIT licensed. This document records third-party code and font material redistributed by the package. Those components retain the terms stated below.',
    '',
    '## ZPLab',
    '',
    'Barcode command mappings, BWIP-JS preview geometry, reverse-field compositing, resize behavior, device-font mappings and the bundled printer-preview fonts were adapted from [ZPLab](https://github.com/u8array/ZPLab) at commit `19af998017b1a5559f0a9b069c7ccb34ff4f4223`.',
    '',
    '```text', read('assets/licenses/ZPLab-LICENSE.txt'), '```',
    '',
    '## BWIP-JS / @bwip-js/browser 4.11.2',
    '',
    'Barcode previews use [`@bwip-js/browser`](https://github.com/metafloor/bwip-js).',
    '',
    '```text', read('assets/licenses/BWIP-JS-LICENSE.txt'), '```',
    '',
    '## Bundled fonts',
    '',
    'The following notices are preserved verbatim from ZPLab. The published font binaries ship in `dist/assets/fonts/`.',
    '',
    read('assets/fonts/NOTICE.md'),
    '',
    read('assets/fonts/PrintLabMono-NOTICE.md'),
    '',
    read('assets/fonts/VeraMono-NOTICE.md'),
    '',
    read('assets/fonts/OCRB-NOTICE.md'),
    '',
    read('assets/fonts/OCRA-NOTICE.md'),
    '',
    '### Apache License 2.0 (PrintLab ZPL / Roboto Condensed)',
    '',
    '```text', read('assets/fonts/LICENSE-APACHE-2.0.txt'), '```',
    ''
];
const output = sections.join('\n');
const target = resolve(root, 'THIRD-PARTY-LICENSES.md');

if (process.argv.includes('--check')) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== output) {
        throw new Error('THIRD-PARTY-LICENSES.md is missing or out of date. Run npm run attribution:generate.');
    }
} else {
    writeFileSync(target, output);
}
