export type ZplFontName = '0' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface ZplDeviceFontMetrics {
    fontSize: number;
    scaleX: number;
    xOffset: number;
    yOffset: number;
    letterSpacing: number;
}

interface DeviceFontSpec {
    magStep: number;
    magWidthStep: number;
    advancePerMag: number;
    capInkPerMag: number;
    capPerEm: number;
    advancePerEm: number;
    yOffsetEm?: number;
    xOffsetEm?: number;
    widthCorrection?: number;
    letterSpacingEm?: number;
}

const deviceFonts: Record<Exclude<ZplFontName, '0'>, DeviceFontSpec> = {
    A: { magStep: 9, magWidthStep: 5, advancePerMag: 6, capInkPerMag: 7.125, capPerEm: .757, advancePerEm: .602, yOffsetEm: .096, xOffsetEm: -.032, widthCorrection: .964, letterSpacingEm: .021 },
    B: { magStep: 11, magWidthStep: 7, advancePerMag: 9, capInkPerMag: 11.5, capPerEm: .762, advancePerEm: .602, xOffsetEm: -.040 },
    C: { magStep: 18, magWidthStep: 10, advancePerMag: 12, capInkPerMag: 14.75, capPerEm: .757, advancePerEm: .602, yOffsetEm: .026, xOffsetEm: -.043 },
    D: { magStep: 18, magWidthStep: 10, advancePerMag: 12, capInkPerMag: 14.75, capPerEm: .757, advancePerEm: .602, yOffsetEm: .026, xOffsetEm: -.043 },
    E: { magStep: 28, magWidthStep: 15, advancePerMag: 20, capInkPerMag: 21.875, capPerEm: .787, advancePerEm: .723, yOffsetEm: .198, xOffsetEm: -.189 },
    F: { magStep: 26, magWidthStep: 13, advancePerMag: 16, capInkPerMag: 22, capPerEm: .757, advancePerEm: .602, yOffsetEm: .034, xOffsetEm: -.052 },
    G: { magStep: 60, magWidthStep: 40, advancePerMag: 48, capInkPerMag: 48, capPerEm: .757, advancePerEm: .602, yOffsetEm: .055, widthCorrection: .817, letterSpacingEm: .142 },
    H: { magStep: 21, magWidthStep: 13, advancePerMag: 19, capInkPerMag: 21, capPerEm: .780, advancePerEm: .723, yOffsetEm: -.030, xOffsetEm: -.193 }
};

export const zplFontFamilies: Record<ZplFontName, string> = {
    '0': 'ZplPrintLab', A: 'ZplPrintLabMono', B: 'ZplVeraMonoBold',
    C: 'ZplPrintLabMono', D: 'ZplPrintLabMono', E: 'ZplOCRB',
    F: 'ZplPrintLabMono', G: 'ZplPrintLabMono', H: 'ZplOCRA'
};

const documentLoads = new WeakMap<Document, Promise<void>>();

export async function loadZplFonts(document: Document): Promise<void> {
    let loading = documentLoads.get(document);
    if (!loading) {
        const sources = [
            ['ZplPrintLab', 'PrintLabZPL-Bold.woff2'],
            ['ZplPrintLabMono', 'PrintLabMono.ttf'],
            ['ZplVeraMono', 'VeraMono.ttf'],
            ['ZplVeraMonoBold', 'VeraMono-Bold.ttf'],
            ['ZplOCRB', 'OCRB.ttf'],
            ['ZplOCRA', 'OCRA.ttf']
        ] as const;
        loading = Promise.all(sources.map(async ([family, file]) => {
            const url = new URL(`../assets/fonts/${file}`, import.meta.url);
            const face = new FontFace(family, `url(${url})`);
            await face.load();
            document.fonts.add(face);
        })).then(() => undefined);
        documentLoads.set(document, loading);
    }
    await loading;
}

export function getDeviceFontMetrics(font: ZplFontName, height: number, width: number): ZplDeviceFontMetrics | null {
    if (font === '0' || !(height > 0)) return null;
    const spec = deviceFonts[font];
    const magnificationHeight = Math.min(10, Math.max(1, Math.round(height / spec.magStep)));
    const magnificationWidth = width > 0 ? Math.min(10, Math.max(1, Math.round(width / spec.magWidthStep))) : magnificationHeight;
    const fontSize = magnificationHeight * spec.capInkPerMag / spec.capPerEm;
    const scaleX = magnificationWidth * spec.advancePerMag / (fontSize * spec.advancePerEm) * (spec.widthCorrection ?? 1);
    return {
        fontSize,
        scaleX,
        xOffset: (spec.xOffsetEm ?? 0) * fontSize,
        yOffset: (spec.yOffsetEm ?? 0) * fontSize,
        letterSpacing: (spec.letterSpacingEm ?? 0) * fontSize
    };
}

/** Numeric ZPL width that represents the natural cell at a given requested
 * height. Used only when an automatic-width field is stretched
 * disproportionately and therefore has to become explicit. */
export function getNaturalZplFontWidth(font: ZplFontName, height: number): number {
    if (font === '0') return Math.max(1, Math.round(height));
    const spec = deviceFonts[font];
    const magnificationHeight = Math.min(10, Math.max(1, Math.round(height / spec.magStep)));
    return magnificationHeight * spec.magWidthStep;
}

export function applyDeviceFontCase(font: ZplFontName, content: string): string {
    if (font === 'B') return content.toUpperCase();
    if (font === 'H') return content.replace(/[a-z]/g, '');
    return content;
}
