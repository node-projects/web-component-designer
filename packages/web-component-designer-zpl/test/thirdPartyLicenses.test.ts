import { describe, expect, test } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('published ZPL third-party material', () => {
    const root = process.cwd().endsWith('web-component-designer-zpl')
        ? process.cwd()
        : resolve(process.cwd(), 'packages/web-component-designer-zpl');

    test('notice covers ZPLab, BWIP-JS, and all bundled fonts', () => {
        const notice = readFileSync(resolve(root, 'THIRD-PARTY-LICENSES.md'), 'utf8');
        for (const marker of ['ZPLab', 'Copyright (c) 2026 u8array', 'BWIP-JS', 'PrintLab ZPL', 'PrintLab Mono', 'Bitstream Vera', 'OCR-A', 'OCR-B', 'Apache License']) {
            expect(notice).toContain(marker);
        }
    });

    test.each(['PrintLabZPL-Bold.woff2', 'PrintLabZPL-Bold.ttf', 'PrintLabMono.ttf', 'VeraMono.ttf', 'VeraMono-Bold.ttf', 'OCRB.ttf', 'OCRA.ttf'])('%s ships in package assets', file => {
        expect(existsSync(resolve(root, 'assets/fonts', file))).toBe(true);
    });

    test('npm publish builds and copies package assets without tracking dist', () => {
        const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
        expect(packageJson.scripts.copy).toBe('node scripts/copy-package-files.mjs');
        expect(packageJson.scripts.prepublishOnly).toContain('npm run build && npm run copy');

        const ignore = readFileSync(resolve(root, '../../.gitignore'), 'utf8');
        expect(ignore).toContain('dist/');
        expect(ignore).not.toContain('!packages/web-component-designer-zpl/dist/');
    });
});
