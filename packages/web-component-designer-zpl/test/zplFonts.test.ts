import { describe, expect, test } from '@jest/globals';
import { applyDeviceFontCase, getDeviceFontMetrics, zplFontFamilies } from '../src/fonts/zplFonts.js';

describe('ZPL built-in font previews', () => {
    test('maps fonts 0 and A-H to the bundled substitute families', () => {
        expect(Object.keys(zplFontFamilies)).toEqual(['0', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
        expect(zplFontFamilies['0']).toBe('ZplPrintLab');
        expect(zplFontFamilies.E).toBe('ZplOCRB');
        expect(zplFontFamilies.H).toBe('ZplOCRA');
    });

    test('snaps device fonts to their discrete magnifications', () => {
        const a9 = getDeviceFontMetrics('A', 9, 5)!;
        const a10 = getDeviceFontMetrics('A', 10, 5)!;
        expect(a10.fontSize).toBe(a9.fontSize);
        expect(a9.scaleX).toBeGreaterThan(0);
        expect(getDeviceFontMetrics('0', 30, 30)).toBeNull();
    });

    test('mirrors Zebra device-font case behavior', () => {
        expect(applyDeviceFontCase('B', 'Text')).toBe('TEXT');
        expect(applyDeviceFontCase('H', 'Text')).toBe('T');
        expect(applyDeviceFontCase('A', 'Text')).toBe('Text');
    });
});
