import { describe, expect, test } from '@jest/globals';
import { quantizeZplValue, zplAxisScales } from '../src/services/zplResizeGeometry.js';

describe('ZPL resize quantization', () => {
    test('rounds only when an integer property threshold is crossed', () => {
        expect(quantizeZplValue(4.49, 1, 10)).toBe(4);
        expect(quantizeZplValue(4.5, 1, 10)).toBe(5);
    });

    test('clamps module, magnification, and Code 49 height limits', () => {
        expect(quantizeZplValue(0, 1, 10)).toBe(1);
        expect(quantizeZplValue(14, 1, 10)).toBe(10);
        expect(quantizeZplValue(9, 16, 100)).toBe(16);
        expect(quantizeZplValue(120, 16, 100)).toBe(100);
    });

    test.each(['N', 'I'])('%s text keeps screen axes', rotation => {
        expect(zplAxisScales(rotation, { width: 100, height: 50 }, { width: 200, height: 25 }))
            .toEqual({ width: 2, height: .5 });
    });

    test.each(['R', 'B'])('%s text swaps effective width and height axes', rotation => {
        expect(zplAxisScales(rotation, { width: 100, height: 50 }, { width: 200, height: 25 }))
            .toEqual({ width: .5, height: 2 });
    });
});
