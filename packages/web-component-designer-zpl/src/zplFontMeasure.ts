/**
 * Browser-side font measurement used to map ZPL font metrics onto CSS text.
 *
 * Kept separate from zplFontMetrics.ts so that the metric rules themselves stay
 * pure and unit testable; everything here needs a DOM.
 */

/**
 * Stand-in for ZPL font 0. The printer font is CG Triumvirate Bold Condensed,
 * which we cannot ship, so this is a stack of metric-similar condensed bold
 * faces. Glyph shapes will differ slightly from a real printer; the cap height,
 * origin and scaling behaviour are exact regardless of which face resolves.
 */
export const ZPL_FONT_0_FAMILY = "'Arial Narrow', 'Liberation Sans Narrow', 'Roboto Condensed', 'Helvetica Neue', sans-serif";

/**
 * Stand-in for the fixed pitch bitmap font A. Which face resolves does not
 * affect layout: the advance is pinned exactly with letter-spacing, so this
 * only decides glyph shape.
 */
export const ZPL_FONT_A_FAMILY = "'Courier New', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";

export interface IFontRatios {
    /** Cap height as a fraction of font size. */
    capRatio: number;
    /** Font ascent as a fraction of font size. */
    ascentRatio: number;
    /** Font descent as a fraction of font size. */
    descentRatio: number;
    /** Advance of a representative glyph as a fraction of font size. */
    advanceRatio: number;
}

const REFERENCE_SIZE = 100;
const cache = new Map<string, IFontRatios>();
let context: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
    if (context === null) {
        context = document.createElement('canvas').getContext('2d');
    }
    return context;
}

/**
 * Measure a font once at a reference size. Every value scales linearly with
 * font size, so callers multiply by their own size.
 */
export function measureFontRatios(fontFamily: string, fontWeight: string): IFontRatios {
    const key = fontWeight + ' ' + fontFamily;
    const cached = cache.get(key);
    if (cached)
        return cached;

    // Sensible fallbacks if canvas or the extended TextMetrics are unavailable.
    let ratios: IFontRatios = { capRatio: 0.72, ascentRatio: 0.9, descentRatio: 0.21, advanceRatio: 0.5 };

    const ctx = getContext();
    if (ctx) {
        ctx.font = fontWeight + ' ' + REFERENCE_SIZE + 'px ' + fontFamily;
        const caps = ctx.measureText('H');
        const full = ctx.measureText('Hg');
        const capHeight = caps.actualBoundingBoxAscent;
        const ascent = full.fontBoundingBoxAscent ?? caps.actualBoundingBoxAscent;
        const descent = full.fontBoundingBoxDescent ?? 0;
        if (capHeight > 0) {
            ratios = {
                capRatio: capHeight / REFERENCE_SIZE,
                ascentRatio: ascent / REFERENCE_SIZE,
                descentRatio: descent / REFERENCE_SIZE,
                advanceRatio: caps.width / REFERENCE_SIZE,
            };
        }
    }

    cache.set(key, ratios);
    return ratios;
}

/**
 * Advance width of a string at a given size, in px. Used for the proportional
 * font 0, whose extent cannot be derived from the ZPL metrics alone.
 */
export function measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight: string): number {
    if (!text) return 0;
    const ctx = getContext();
    if (!ctx) return 0;
    ctx.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;
    return ctx.measureText(text).width;
}

/**
 * Distance from the top of a `line-height: 1` line box down to the top of the
 * capital letters, in px. The text has to be shifted up by this much so the
 * caps land on the ZPL field origin.
 */
export function capTopOffset(fontSize: number, ratios: IFontRatios): number {
    const ascent = ratios.ascentRatio * fontSize;
    const descent = ratios.descentRatio * fontSize;
    const capHeight = ratios.capRatio * fontSize;
    const halfLeading = (fontSize - (ascent + descent)) / 2;
    return halfLeading + ascent - capHeight;
}
