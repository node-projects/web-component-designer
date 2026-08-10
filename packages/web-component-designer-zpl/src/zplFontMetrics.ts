/**
 * Font and layout metrics for ZPL, derived by measuring the rendered output of
 * api.labelary.com at 8dpmm and reading back the pixel bounding boxes.
 *
 * All values are in dots. The designer renders 1 dot = 1 CSS px, so these are
 * also the px values the widgets must produce to match a printed label.
 *
 * ZPL has two kinds of font:
 *
 *  - font 0 is scalable and proportional. Cap height is 0.75 * h, and the width
 *    parameter scales it horizontally (w = 0 means w = h). Per-glyph widths
 *    come from the printer's font and cannot be reproduced exactly in CSS.
 *
 *  - fonts A..H are bitmaps drawn at whole multiples of a base cell, so their
 *    layout is fully predictable. Measured at the base size (^CF<f>,1):
 *
 *      font   cap   advance      font   cap   advance
 *        A      7      6           E     20      20
 *        B     11      9           F     21      16
 *        C     14     12           G     48      48
 *        D     14     12           H     21      19
 *
 * The scale is *rounded*, not truncated. Measuring font A over h = 6..30 the
 * cap height steps 7 -> 14 at h = 14 and 14 -> 21 at h = 23, which is
 * round(h / 9); floor(h / 9) would step at 18 and 27 and mismatches 8 of the 25
 * samples. So ^AAN,20 and ^AAN,17 both print at n = 2.
 *
 * The key origin rule for every font: the measured dy is 0 at all sizes, so the
 * ^FO y coordinate is the top of the capital letters, not the top of the line
 * box and not the baseline.
 */

/** Cap height of the scalable font 0 as a fraction of the declared height. */
export const FONT_0_CAP_RATIO = 0.75;

export interface IZplBitmapFont {
    /** Base cell width in dots; the width parameter is resolved against this. */
    cellWidth: number;
    /** Base cell height in dots; the height parameter is resolved against this. */
    cellHeight: number;
    /** Height of a capital letter at scale 1. */
    capHeight: number;
    /** Pen advance from one glyph origin to the next at scale 1. */
    advance: number;
}

/**
 * The bitmap fonts. cellWidth/cellHeight are Zebra's documented base cell;
 * capHeight and advance are measured. C and D share a cell, as do their metrics.
 */
export const ZPL_BITMAP_FONTS: Readonly<Record<string, IZplBitmapFont>> = {
    A: { cellWidth: 5, cellHeight: 9, capHeight: 7, advance: 6 },
    B: { cellWidth: 7, cellHeight: 11, capHeight: 11, advance: 9 },
    C: { cellWidth: 10, cellHeight: 18, capHeight: 14, advance: 12 },
    D: { cellWidth: 10, cellHeight: 18, capHeight: 14, advance: 12 },
    E: { cellWidth: 15, cellHeight: 28, capHeight: 20, advance: 20 },
    F: { cellWidth: 13, cellHeight: 26, capHeight: 21, advance: 16 },
    G: { cellWidth: 40, cellHeight: 60, capHeight: 48, advance: 48 },
    H: { cellWidth: 13, cellHeight: 21, capHeight: 21, advance: 19 },
};

export type ZplFontName = '0' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface IZplTextMetrics {
    /** Height of a capital letter, in dots. ^FO y is the top of this. */
    capHeight: number;
    /** Full character cell height, in dots. */
    cellHeight: number;
    /** Horizontal scale to apply relative to the font's natural proportions. */
    scaleX: number;
    /**
     * Pen advance per character, in dots. Exact for the bitmap fonts; null for
     * font 0, which is proportional and has to be measured from rendered text.
     */
    advance: number | null;
}

export function isBitmapFont(fontName: string): boolean {
    return !!fontName && Object.prototype.hasOwnProperty.call(ZPL_BITMAP_FONTS, fontName);
}

/**
 * Resolve a requested dot size onto a bitmap font's cell grid. The printer
 * rounds to the nearest whole cell and never drops below one.
 */
export function quantizeScale(value: number, cell: number): number {
    if (!(value > 0) || !(cell > 0)) return 1;
    return Math.max(1, Math.round(value / cell));
}

/**
 * Resolve the declared width of a ^A / ^CF command. A width of 0 (or omitted)
 * means "derive it from the height", which for font 0 yields the font's natural
 * aspect and for a bitmap font yields the same scale as the height.
 */
export function resolveFontWidth(height: number, width: number): number {
    return width > 0 ? width : height;
}

/**
 * Layout metrics for a ZPL text field.
 *
 * @param fontName '0' for the scalable font, 'A'..'H' for the bitmap fonts.
 * @param height   the h parameter of ^A / ^CF, in dots.
 * @param width    the w parameter of ^A / ^CF, in dots. 0 means "from height".
 */
export function getZplTextMetrics(fontName: ZplFontName, height: number, width: number): IZplTextMetrics {
    const h = height > 0 ? height : 0;

    const bitmap = ZPL_BITMAP_FONTS[fontName];
    if (bitmap) {
        const n = quantizeScale(h, bitmap.cellHeight);
        const nx = width > 0 ? quantizeScale(width, bitmap.cellWidth) : n;
        return {
            capHeight: bitmap.capHeight * n,
            cellHeight: bitmap.cellHeight * n,
            scaleX: nx / n,
            advance: bitmap.advance * nx,
        };
    }

    const w = resolveFontWidth(h, width);
    return {
        capHeight: h * FONT_0_CAP_RATIO,
        cellHeight: h,
        // ^A0 scales the glyph cell to w wide; w == h is the natural aspect.
        scaleX: h > 0 ? w / h : 1,
        advance: null,
    };
}

/**
 * Width of a text field in dots, measured as the pen advance across the string
 * (the field's layout extent, which is what the next field must clear).
 *
 * Exact for the bitmap fonts, which are fixed pitch. Null for font 0, whose
 * glyphs are proportional, so its extent has to be measured from rendered text.
 */
export function predictTextWidth(fontName: ZplFontName, height: number, width: number, text: string): number | null {
    const m = getZplTextMetrics(fontName, height, width);
    if (m.advance == null) return null;
    if (!text) return 0;
    return text.length * m.advance;
}

/** Justification of a ^FB field block. Anything else behaves as left. */
export type ZplJustification = 'L' | 'C' | 'R' | 'J';

/** The escape that forces a line break inside ^FD when ^FB is active. */
export const ZPL_LINE_BREAK = '\\&';

/**
 * Break field data into the lines a ^FB block would print.
 *
 * Measured behaviour: wrapping happens at spaces only, greedily; a single word
 * wider than the block is truncated rather than broken; and the result is cut
 * to maxLines. `\&` forces a break.
 *
 * @param measure width of a string in dots, so this works for both the fixed
 *                pitch bitmap fonts and the proportional font 0.
 */
export function wrapZplLines(
    text: string,
    blockWidth: number,
    maxLines: number,
    measure: (s: string) => number,
): string[] {
    const limit = maxLines > 0 ? maxLines : 1;
    if (!text) return [''];
    if (!(blockWidth > 0)) return text.split(ZPL_LINE_BREAK).slice(0, limit);

    const lines: string[] = [];
    for (const paragraph of text.split(ZPL_LINE_BREAK)) {
        if (lines.length >= limit) break;
        const words = paragraph.split(' ');
        let line = '';
        for (const word of words) {
            const candidate = line ? line + ' ' + word : word;
            if (measure(candidate) <= blockWidth) {
                line = candidate;
                continue;
            }
            if (line) {
                lines.push(line);
                if (lines.length >= limit) { line = ''; break; }
            }
            if (measure(word) <= blockWidth) {
                line = word;
                continue;
            }
            // A word wider than the block is not broken: keep what fits.
            let cut = word;
            while (cut.length > 1 && measure(cut) > blockWidth) cut = cut.slice(0, -1);
            lines.push(cut);
            line = '';
            if (lines.length >= limit) break;
        }
        if (line && lines.length < limit) lines.push(line);
    }
    return lines.length ? lines.slice(0, limit) : [''];
}

/**
 * Left offset of a line inside a ^FB block, in dots.
 *
 * Measured at ^CFB,25 (advance 18) in a 300 dot block:
 *   R: len 1,2,4 -> 282, 264, 228  == blockWidth - len * advance
 *   C: len 1,2,4 -> 132, 123, 105  == (blockWidth - (len + 1) * advance) / 2
 * so centring behaves as though one further character cell were present.
 * For the proportional font 0 there is no cell, so it centres on width alone.
 */
export function justifyOffset(
    justification: string,
    blockWidth: number,
    lineWidth: number,
    advance: number | null,
): number {
    if (!(blockWidth > 0)) return 0;
    switch (justification) {
        case 'R':
            return Math.max(0, blockWidth - lineWidth);
        case 'C':
            return Math.max(0, (blockWidth - lineWidth - (advance ?? 0)) / 2);
        case 'J':
            // Justified text starts flush at the block's left edge, same as L;
            // the fill to the right margin is done by stretching inter-word
            // gaps (see justifyWordSpacing), not by an offset.
            return 0;
        default:
            return 0;
    }
}

/**
 * Extra inter-word spacing, in dots, needed to stretch a line so it fills a
 * justified (^FB ...,J,...) block. 0 for anything that doesn't stretch: a
 * line with no word gaps, or one already at or past the block width.
 *
 * ZPL's own J behaviour isn't independently measured against a printed label
 * like the rest of this file (Zebra doesn't document the exact algorithm);
 * this follows the conventional typesetting rule of spreading the shortfall
 * evenly across the gaps, same as every other renderer's "justify".
 */
export function justifyWordSpacing(lineWidth: number, blockWidth: number, gapCount: number): number {
    if (gapCount <= 0 || !(blockWidth > lineWidth)) return 0;
    return (blockWidth - lineWidth) / gapCount;
}

/** Baseline to baseline distance of a ^FB block: the cell height plus c. */
export function blockLineStep(cellHeight: number, lineSpacing: number): number {
    return cellHeight + (lineSpacing || 0);
}

/**
 * ^GB / ^GE / ^GD all treat ^FO as the outer top-left and draw the border
 * inward, so the painted extent is exactly w x h. ZPL also clamps the box up to
 * at least the border thickness: ^GB10,10,20 prints 20x20.
 */
export function clampGraphicSize(size: number, thickness: number): number {
    const t = thickness > 0 ? thickness : 1;
    return Math.max(size > 0 ? size : 0, t);
}
