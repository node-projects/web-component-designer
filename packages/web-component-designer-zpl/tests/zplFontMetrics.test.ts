import { describe, expect, it } from '@jest/globals';
import {
    ZPL_BITMAP_FONTS,
    blockLineStep,
    justifyOffset,
    justifyWordSpacing,
    wrapZplLines,
    clampGraphicSize,
    getZplTextMetrics,
    isBitmapFont,
    predictTextWidth,
    quantizeScale,
    resolveFontWidth,
} from '../src/zplFontMetrics';

// Every expectation here is a value read back from a label rendered by
// api.labelary.com at 8dpmm. See the header of zplFontMetrics.ts.

describe('font 0 (scalable)', () => {
    it('has a cap height of 0.75 * h', () => {
        expect(getZplTextMetrics('0', 20, 20).capHeight).toBe(15);
        expect(getZplTextMetrics('0', 40, 40).capHeight).toBe(30);
        expect(getZplTextMetrics('0', 80, 80).capHeight).toBe(60);
    });

    it('treats a width of 0 as "same as height"', () => {
        expect(resolveFontWidth(80, 0)).toBe(80);
        expect(getZplTextMetrics('0', 80, 0).scaleX).toBe(1);
    });

    it('scales horizontally by w/h', () => {
        // ^A0N,40,20 measured exactly half the width of ^A0N,40,40
        expect(getZplTextMetrics('0', 40, 20).scaleX).toBe(0.5);
    });

    it('cannot predict a width, being proportional', () => {
        expect(predictTextWidth('0', 40, 40, 'ABC')).toBeNull();
    });
});

describe('bitmap scale quantisation', () => {
    // Measured over ^CFA,h for h = 6..30: cap steps 7 -> 14 at h = 14 and
    // 14 -> 21 at h = 23. That is round(h/9); floor(h/9) would step at 18/27.
    it('rounds to the nearest whole cell', () => {
        expect(quantizeScale(13, 9)).toBe(1);
        expect(quantizeScale(14, 9)).toBe(2);
        expect(quantizeScale(17, 9)).toBe(2);
        expect(quantizeScale(22, 9)).toBe(2);
        expect(quantizeScale(23, 9)).toBe(3);
    });

    it('never collapses below one cell', () => {
        expect(quantizeScale(0, 9)).toBe(1);
        expect(quantizeScale(4, 9)).toBe(1);
    });
});

describe('font A (bitmap)', () => {
    it('has cap height 7n and cell height 9n', () => {
        for (const n of [1, 2, 3, 4]) {
            const m = getZplTextMetrics('A', n * 9, 0);
            expect(m.capHeight).toBe(7 * n);
            expect(m.cellHeight).toBe(9 * n);
        }
    });

    it('has an advance of exactly 6n', () => {
        // derived from measuring "H"/"HH"/"HHH" at n = 1..4
        for (const n of [1, 2, 3, 4])
            expect(getZplTextMetrics('A', n * 9, 0).advance).toBe(6 * n);
    });

    it('resolves the width parameter against the 5-dot cell', () => {
        // measured at h=18: w=5 -> n=1, w=10 -> n=2, w=15 -> n=3, w=20 -> n=4
        expect(getZplTextMetrics('A', 18, 5).advance).toBe(6);
        expect(getZplTextMetrics('A', 18, 10).advance).toBe(12);
        expect(getZplTextMetrics('A', 18, 15).advance).toBe(18);
        expect(getZplTextMetrics('A', 18, 20).advance).toBe(24);
        expect(getZplTextMetrics('A', 18, 0).advance).toBe(12);
    });
});

describe('font B (bitmap)', () => {
    // ^CFB,25 is what a real shipping label uses.
    it('quantises 25 dots to two 11-dot cells', () => {
        const m = getZplTextMetrics('B', 25, 0);
        expect(m.capHeight).toBe(22);
        expect(m.cellHeight).toBe(22);
        expect(m.advance).toBe(18);
    });

    it('predicts field widths exactly', () => {
        // verified against Labelary: the pen advance across each of these
        // strings at ^CFB,25 is len * 18
        expect(predictTextWidth('B', 25, 0, 'FROM:')).toBe(90);
        expect(predictTextWidth('B', 25, 0, 'TO:')).toBe(54);
        expect(predictTextWidth('B', 25, 0, 'Test sender')).toBe(198);
        expect(predictTextWidth('B', 25, 0, 'TN, COLLIERVILLE, 38017')).toBe(414);
        expect(predictTextWidth('B', 25, 0, 'Accounts Payable Dept.')).toBe(396);
    });

    it('scales linearly with n', () => {
        for (const n of [1, 2, 3, 4]) {
            const m = getZplTextMetrics('B', n * 11, 0);
            expect(m.capHeight).toBe(11 * n);
            expect(m.advance).toBe(9 * n);
        }
    });
});

describe('the bitmap font table', () => {
    it('recognises every built in bitmap font', () => {
        for (const f of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
            expect(isBitmapFont(f)).toBe(true);
        expect(isBitmapFont('0')).toBe(false);
        expect(isBitmapFont('')).toBe(false);
    });

    it('matches the measured base metrics', () => {
        // cap height and advance measured at ^CF<font>,1
        const measured: Record<string, [number, number]> = {
            A: [7, 6], B: [11, 9], C: [14, 12], D: [14, 12],
            E: [20, 20], F: [21, 16], G: [48, 48], H: [21, 19],
        };
        for (const [font, [cap, advance]] of Object.entries(measured)) {
            expect(ZPL_BITMAP_FONTS[font].capHeight).toBe(cap);
            expect(ZPL_BITMAP_FONTS[font].advance).toBe(advance);
        }
    });

    it('predicts a width for every bitmap font', () => {
        for (const f of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
            expect(predictTextWidth(<any>f, 30, 0, 'AB')).not.toBeNull();
    });
});

describe('graphic primitives', () => {
    it('clamps the box up to the border thickness', () => {
        // measured: ^GB10,10,20 prints 20x20
        expect(clampGraphicSize(10, 20)).toBe(20);
        expect(clampGraphicSize(200, 4)).toBe(200);
    });

    it('keeps a zero dimension as a line of the border thickness', () => {
        // ^GB0,100,2 is a 2 x 100 vertical line
        expect(clampGraphicSize(0, 2)).toBe(2);
        expect(clampGraphicSize(0, 0)).toBe(1);
    });
});

describe('^FB field blocks', () => {
    // font B at ^CFB,25: advance 18, cell height 22
    const ADV = 18;
    const measure = (s: string) => s.length * ADV;

    it('steps lines by the cell height plus c', () => {
        // measured: c=0 -> 22, c=10 -> 32, c=-4 -> 18
        expect(blockLineStep(22, 0)).toBe(22);
        expect(blockLineStep(22, 10)).toBe(32);
        expect(blockLineStep(22, -4)).toBe(18);
    });

    it('right aligns on the pen advance', () => {
        // measured in a 300 dot block: len 1,2,4 -> 282, 264, 228
        expect(justifyOffset('R', 300, 1 * ADV, ADV)).toBe(282);
        expect(justifyOffset('R', 300, 2 * ADV, ADV)).toBe(264);
        expect(justifyOffset('R', 300, 4 * ADV, ADV)).toBe(228);
    });

    it('centres as though one further cell were present', () => {
        // measured in a 300 dot block: len 1,2,4,8 -> 132, 123, 105, 69
        expect(justifyOffset('C', 300, 1 * ADV, ADV)).toBe(132);
        expect(justifyOffset('C', 300, 2 * ADV, ADV)).toBe(123);
        expect(justifyOffset('C', 300, 4 * ADV, ADV)).toBe(105);
        expect(justifyOffset('C', 300, 8 * ADV, ADV)).toBe(69);
    });

    it('leaves left aligned text at the block origin', () => {
        expect(justifyOffset('L', 300, 2 * ADV, ADV)).toBe(0);
        // the label uses N, which is not a documented value; treat as left
        expect(justifyOffset('N', 300, 2 * ADV, ADV)).toBe(0);
    });

    it('wraps greedily at spaces', () => {
        // measured: ^FB200 fits "AAA BBB CCC" (11 chars = 198) then wraps
        expect(wrapZplLines('AAA BBB CCC DDD', 200, 5, measure))
            .toEqual(['AAA BBB CCC', 'DDD']);
    });

    it('truncates to the maximum number of lines', () => {
        expect(wrapZplLines('AA\\&BB\\&CC', 300, 2, measure)).toEqual(['AA', 'BB']);
        expect(wrapZplLines('AA\\&BB\\&CC', 300, 3, measure)).toEqual(['AA', 'BB', 'CC']);
    });

    it('breaks on the \\& escape', () => {
        expect(wrapZplLines('PRODUCT A x 1, PRODUCT B x 4\\&', 692, 5, measure))
            .toEqual(['PRODUCT A x 1, PRODUCT B x 4']);
    });

    it('truncates a word wider than the block rather than breaking it', () => {
        // measured: ^FB100 with a 14 character word prints only what fits
        expect(wrapZplLines('AAAAAAAAAAAAAA', 100, 5, measure)).toEqual(['AAAAA']);
    });

    it('centres the box counter line from the real label', () => {
        // ^FO60,1000^FB692,1,0,C,0^FDBox 1 of 1^FS
        const lines = wrapZplLines('Box 1 of 1', 692, 1, measure);
        expect(lines).toEqual(['Box 1 of 1']);
        expect(justifyOffset('C', 692, measure(lines[0]), ADV)).toBe(247);
    });

    it('starts justified lines flush at the block origin, like L', () => {
        expect(justifyOffset('J', 300, 2 * ADV, ADV)).toBe(0);
    });

    it('spreads the shortfall evenly across a justified line\'s word gaps', () => {
        // "AAA BBB CCC" is 11 chars * ADV = 198 wide with 2 gaps, in a 300 block
        expect(justifyWordSpacing(11 * ADV, 300, 2)).toBe((300 - 11 * ADV) / 2);
    });

    it('does not stretch a justified line with no word gaps', () => {
        expect(justifyWordSpacing(3 * ADV, 300, 0)).toBe(0);
    });

    it('does not stretch a justified line already at or past the block width', () => {
        expect(justifyWordSpacing(300, 300, 2)).toBe(0);
        expect(justifyWordSpacing(320, 300, 2)).toBe(0);
    });
});
