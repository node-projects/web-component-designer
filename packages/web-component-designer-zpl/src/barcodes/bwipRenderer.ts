import bwipjs from '@bwip-js/browser';
import {
    AztecBarcodeProps, BarcodeProps, DataMatrixBarcodeProps, Gs1DataBarProps,
    LinearBarcodeProps, MaxiCodeBarcodeProps, QrBarcodeProps, StackedBarcodeProps,
    Tlc39BarcodeProps, getBarcodeDefinition
} from './barcodeRegistry.js';

export interface BarcodeRenderResult {
    canvas: HTMLCanvasElement | null;
    error: string | null;
}

export interface BarcodeModuleGeometry {
    width: number;
    height: number;
}

const gs1DataBarBcid: Record<number, string> = {
    1: 'databaromni', 2: 'databartruncated', 3: 'databarstacked',
    4: 'databarstackedomni', 5: 'databarlimited', 6: 'databarexpanded',
    7: 'databarexpandedstacked'
};

function gtin14(value: string): string {
    const digits = value.replace(/\D/g, '').padStart(13, '0').slice(0, 13);
    const sum = [...digits].reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
    return `${digits}${(10 - sum % 10) % 10}`;
}

function cleanError(error: unknown): string {
    return String(error instanceof Error ? error.message : error)
        .replace(/^bwip-js:\s*/i, '').replace(/^bwipp\.[^:]+:\s*/i, '');
}

export function buildBwipOptions(props: BarcodeProps): Record<string, unknown> {
    const definition = getBarcodeDefinition(props.type);
    if (definition.bwipOptions) return definition.bwipOptions(props);

    if (definition.resizeKind === 'linear') {
        const v = props as LinearBarcodeProps;
        let bcid = definition.bcid;
        let text = v.content || definition.defaultContent || '0';
        if (v.type === 'upceanextension') bcid = text.length === 2 ? 'ean2' : 'ean5';
        if (v.type === 'upce' && text.length === 6) text = `0${text}`;
        if (v.type === 'logmars' || v.type === 'code39' || v.type === 'codabar') text = text.toUpperCase();
        const options: Record<string, unknown> = {
            bcid, text, scale: Math.max(1, Math.round(v.moduleWidth)), height: 10,
            includetext: false
        };
        if (!['msi', 'plessey', 'postnet', 'planet', 'ean13', 'ean8', 'upca', 'upce', 'upceanextension', 'code49'].includes(v.type)) {
            options.ratio = v.wideRatio;
        }
        if (v.checkDigit && ['code39', 'interleaved2of5', 'msi'].includes(v.type)) options.includecheck = true;
        if (v.type === 'code93') options.includecheck = true;
        if (v.type === 'code49') {
            options.rowheight = Math.max(8, Math.min(50, Math.round(v.barHeight / Math.max(v.moduleWidth, 1))));
            if (v.mode !== 'A') options.mode = Number(v.mode);
        }
        return options;
    }

    switch (props.type) {
        case 'gs1databar': {
            const v = props as Gs1DataBarProps;
            const text = v.symbology >= 6
                ? (v.content.includes('(') ? v.content : `(01)${gtin14(v.content)}`)
                : `(01)${gtin14(v.content)}`;
            return {
                bcid: gs1DataBarBcid[v.symbology] ?? 'databaromni', text,
                scale: v.magnification, ...(v.symbology === 7 ? { segments: v.segments } : {})
            };
        }
        case 'qrcode': {
            const v = props as QrBarcodeProps;
            return { bcid: 'qrcode', text: v.content || ' ', scale: v.magnification, eclevel: v.errorCorrection };
        }
        case 'datamatrix': {
            const v = props as DataMatrixBarcodeProps;
            const rectangular = v.aspectRatio === 2;
            const options: Record<string, unknown> = {
                bcid: v.gs1 ? (rectangular ? 'gs1datamatrixrectangular' : 'gs1datamatrix') : (rectangular ? 'datamatrixrectangular' : 'datamatrix'),
                text: v.content || ' ', scale: v.dimension
            };
            if (v.columns > 0 && v.rows > 0 && v.quality === 200) options.version = `${v.rows}x${v.columns}`;
            return options;
        }
        case 'pdf417': {
            const v = props as StackedBarcodeProps;
            return { bcid: 'pdf417', text: v.content || ' ', scale: v.moduleWidth,
                rowheight: Math.max(1, Math.round(v.rowHeight / Math.max(v.moduleWidth, 1))),
                ...(v.columns ? { columns: v.columns } : {}), eclevel: String(v.securityLevel) };
        }
        case 'micropdf417': {
            const v = props as StackedBarcodeProps;
            return { bcid: 'micropdf417', text: v.content || ' ', scale: v.moduleWidth,
                rowheight: Math.max(1, Math.round(v.rowHeight / Math.max(v.moduleWidth, 1))) };
        }
        case 'codablock': {
            const v = props as StackedBarcodeProps;
            return { bcid: 'codablockf', text: v.content || ' ', scale: v.moduleWidth,
                columns: Math.max(4, v.columns), rowheight: Math.max(8, Math.round(v.rowHeight / Math.max(v.moduleWidth, 1))) };
        }
        case 'aztec': {
            const v = props as AztecBarcodeProps;
            const options: Record<string, unknown> = { bcid: 'azteccodecompact', text: v.content || ' ', scale: v.magnification };
            if (v.ecLevel === 300) Object.assign(options, { bcid: 'azteccode', format: 'rune' });
            else if (v.ecLevel >= 201 && v.ecLevel <= 232) Object.assign(options, { bcid: 'azteccode', format: 'full', layers: v.ecLevel - 200 });
            else if (v.ecLevel >= 101 && v.ecLevel <= 104) options.layers = v.ecLevel - 100;
            else if (v.ecLevel >= 5 && v.ecLevel <= 95) options.eclevel = v.ecLevel;
            return options;
        }
        case 'maxicode': {
            const v = props as MaxiCodeBarcodeProps;
            return { bcid: 'maxicode', text: v.content || ' ', scale: 2, mode: v.mode };
        }
        case 'tlc39': {
            const v = props as Tlc39BarcodeProps;
            return { bcid: 'code39', text: v.content.split(',')[0] || '0', scale: v.moduleWidth,
                height: 10, includetext: false, ratio: v.wideRatio };
        }
    }
    return { bcid: definition.bcid, text: ' ', scale: 2 };
}

/** Returns the encoder's unscaled module bounds without a canvas or network. */
export function measureBarcodeModules(props: BarcodeProps): BarcodeModuleGeometry {
    const validationError = getBarcodeDefinition(props.type).validate(props);
    if (validationError) throw new Error(validationError);
    const { scale: _scale, ...options } = buildBwipOptions(props);
    const engine = bwipjs as unknown as { raw(options: Record<string, unknown>): Array<{
        sbs?: number[]; bbs?: number[]; bhs?: number[]; pixx?: number; pixy?: number;
    }> };
    const symbol = engine.raw(options)[0];
    if (!symbol) throw new Error('BWIP-JS returned no geometry');
    if (symbol.pixx != null && symbol.pixy != null) return { width: symbol.pixx, height: symbol.pixy };
    const width = symbol.sbs?.reduce((total, value) => total + value, 0) ?? 0;
    const height = Math.max(0, ...(symbol.bhs ?? []).map((value, index) => value + (symbol.bbs?.[index] ?? 0)));
    return { width, height };
}

export function renderBarcode(props: BarcodeProps): BarcodeRenderResult {
    const canvas = document.createElement('canvas');
    try {
        const validationError = getBarcodeDefinition(props.type).validate(props);
        if (validationError) return { canvas: null, error: validationError };
        const engine = bwipjs as unknown as { toCanvas(canvas: HTMLCanvasElement, options: Record<string, unknown>): void };
        engine.toCanvas(canvas, buildBwipOptions(props));
        return { canvas, error: null };
    } catch (error) {
        return { canvas: null, error: cleanError(error) };
    }
}
