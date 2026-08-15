export const barcodeTypes = [
    'code128', 'code39', 'code93', 'code11', 'interleaved2of5', 'standard2of5',
    'industrial2of5', 'codabar', 'logmars', 'msi', 'plessey', 'gs1databar',
    'planet', 'postnet', 'ean13', 'ean8', 'upca', 'upce', 'upceanextension',
    'code49', 'qrcode', 'datamatrix', 'pdf417', 'micropdf417', 'aztec',
    'codablock', 'maxicode', 'tlc39'
] as const;

export type BarcodeType = typeof barcodeTypes[number];
export type BarcodeRotation = 'N' | 'R' | 'I' | 'B';
export type BarcodeResizeKind = 'linear' | 'uniform-2d' | 'stacked-2d' | 'intrinsic' | 'tlc39';

export interface BarcodeByState {
    moduleWidth: number;
    wideRatio: number;
    barHeight: number;
}

interface BarcodePropsBase {
    type: BarcodeType;
    content: string;
    rotation: BarcodeRotation;
}

export interface LinearBarcodeProps extends BarcodePropsBase {
    type: 'code128' | 'code39' | 'code93' | 'code11' | 'interleaved2of5' |
        'standard2of5' | 'industrial2of5' | 'codabar' | 'logmars' | 'msi' |
        'plessey' | 'planet' | 'postnet' | 'ean13' | 'ean8' | 'upca' | 'upce' |
        'upceanextension' | 'code49';
    moduleWidth: number;
    wideRatio: number;
    barHeight: number;
    printInterpretation: boolean;
    printInterpretationAbove: boolean;
    checkDigit: boolean;
    mode: string;
    gs1: boolean;
}

export interface Gs1DataBarProps extends BarcodePropsBase {
    type: 'gs1databar';
    magnification: number;
    symbology: number;
    segments: number;
}

export interface QrBarcodeProps extends BarcodePropsBase {
    type: 'qrcode';
    magnification: number;
    errorCorrection: 'H' | 'Q' | 'M' | 'L';
    model: number;
}

export interface DataMatrixBarcodeProps extends BarcodePropsBase {
    type: 'datamatrix';
    dimension: number;
    quality: number;
    columns: number;
    rows: number;
    gs1: boolean;
    aspectRatio: number;
}

export interface StackedBarcodeProps extends BarcodePropsBase {
    type: 'pdf417' | 'micropdf417' | 'codablock';
    moduleWidth: number;
    rowHeight: number;
    securityLevel: number | string;
    columns: number;
    mode: number;
}

export interface AztecBarcodeProps extends BarcodePropsBase {
    type: 'aztec';
    magnification: number;
    ecLevel: number;
}

export interface MaxiCodeBarcodeProps extends BarcodePropsBase {
    type: 'maxicode';
    mode: number;
    symbolNumber: number;
    symbolTotal: number;
}

export interface Tlc39BarcodeProps extends BarcodePropsBase {
    type: 'tlc39';
    moduleWidth: number;
    wideRatio: number;
    barHeight: number;
    microPdfModuleWidth: number;
    microPdfRowHeight: number;
}

export type BarcodeProps = LinearBarcodeProps | Gs1DataBarProps | QrBarcodeProps |
    DataMatrixBarcodeProps | StackedBarcodeProps | AztecBarcodeProps |
    MaxiCodeBarcodeProps | Tlc39BarcodeProps;

export interface BarcodePropertyDefinition {
    readonly name: string;
    readonly attributeName: string;
    readonly type: 'string' | 'number' | 'boolean' | 'enum';
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
    readonly values?: readonly string[];
}

export interface BarcodeDefinition<T extends BarcodeType = BarcodeType> {
    readonly type: T;
    readonly label: string;
    readonly command: string;
    readonly bcid: string;
    readonly resizeKind: BarcodeResizeKind;
    readonly defaultContent: string;
    readonly defaults: Readonly<Record<string, string | number | boolean>>;
    readonly properties: readonly BarcodePropertyDefinition[];
    readonly validate: (props: BarcodeProps) => string | null;
    readonly emit: (props: BarcodeProps) => { by?: string; command: string; fieldData: string };
    readonly parse: (fields: string[], by: BarcodeByState) => Record<string, string | number | boolean>;
    readonly bwipOptions?: (props: BarcodeProps) => Record<string, unknown>;
}

const p = {
    content: { name: 'content', attributeName: 'content', type: 'string' } as const,
    rotation: { name: 'rotation', attributeName: 'rotation', type: 'enum', values: ['N', 'R', 'I', 'B'] } as const,
    moduleWidth: { name: 'moduleWidth', attributeName: 'module-width', type: 'number', min: 1, max: 10, step: 1 } as const,
    wideRatio: { name: 'wideRatio', attributeName: 'wide-ratio', type: 'number', min: 2, max: 3, step: 0.1 } as const,
    barHeight: { name: 'barHeight', attributeName: 'bar-height', type: 'number', min: 1, max: 32000, step: 1 } as const,
    printInterpretation: { name: 'printInterpretation', attributeName: 'print-interpretation', type: 'boolean' } as const,
    printInterpretationAbove: { name: 'printInterpretationAbove', attributeName: 'print-interpretation-above', type: 'boolean' } as const,
    checkDigit: { name: 'checkDigit', attributeName: 'check-digit', type: 'boolean' } as const,
    magnification: { name: 'magnification', attributeName: 'magnification', type: 'number', min: 1, max: 10, step: 1 } as const,
    rowHeight: { name: 'rowHeight', attributeName: 'row-height', type: 'number', min: 1, max: 9999, step: 1 } as const,
    columns: { name: 'columns', attributeName: 'columns', type: 'number', min: 0, max: 62, step: 1 } as const,
    mode: { name: 'mode', attributeName: 'mode', type: 'number', min: 0, max: 300, step: 1 } as const,
};

const bool = (value: boolean) => value ? 'Y' : 'N';
const number = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const rotation = (value: string | undefined): BarcodeRotation =>
    value === 'R' || value === 'I' || value === 'B' ? value : 'N';
const yes = (value: string | undefined, fallback = false) => value == null || value === '' ? fallback : value === 'Y';

const commonLinearDefaults = {
    moduleWidth: 2, wideRatio: 3, barHeight: 100, printInterpretation: true,
    printInterpretationAbove: false, checkDigit: false, mode: 'A', gs1: false
};
const linearGeometryProperties = [p.content, p.rotation, p.moduleWidth, p.wideRatio, p.barHeight] as const;
const linearHriProperties = [...linearGeometryProperties,
    p.printInterpretation, p.printInterpretationAbove] as const;
const linearProperties = [...linearHriProperties,
    p.checkDigit] as const;

function validateProps(props: BarcodeProps): string | null {
    const definition = getBarcodeDefinition(props.type);
    if (!String(props.content ?? '').length) return 'content is required';
    for (const property of definition.properties) {
        if (property.type !== 'number') continue;
        const value = Number((props as unknown as Record<string, unknown>)[property.name]);
        if (!Number.isFinite(value)) return `${property.name} must be a number`;
        if (property.min != null && value < property.min) return `${property.name} must be at least ${property.min}`;
        if (property.max != null && value > property.max) return `${property.name} must be at most ${property.max}`;
    }
    return null;
}

type LinearSyntax = 'height' | 'check-first' | 'height-check-last' | 'logmars' | 'msi' | 'code49' | 'code128' | 'upca';

function linearDefinition(type: LinearBarcodeProps['type'], label: string, command: string, bcid: string,
    defaultContent: string, syntax: LinearSyntax = 'height', overrides: Partial<BarcodeDefinition> = {}, fixedByRatio?: number | null): BarcodeDefinition {
    const emit = (props: BarcodeProps) => {
        const v = props as LinearBarcodeProps;
        let params: string;
        switch (syntax) {
            case 'check-first':
                params = `${v.rotation},${bool(v.checkDigit)},${v.barHeight},${bool(v.printInterpretation)},${bool(v.printInterpretationAbove)}`;
                break;
            case 'height-check-last':
                params = `${v.rotation},${v.barHeight},${bool(v.printInterpretation)},${bool(v.printInterpretationAbove)},${bool(v.checkDigit)}`;
                break;
            case 'logmars':
                params = `${v.rotation},${v.barHeight},${bool(v.printInterpretation)}`;
                break;
            case 'msi':
                params = `${v.rotation},${v.checkDigit ? (['B', 'C', 'D'].includes(v.mode) ? v.mode : 'B') : 'A'},${v.barHeight},${bool(v.printInterpretation)},${bool(v.printInterpretationAbove)}`;
                break;
            case 'code49':
                params = `${v.rotation},${v.barHeight},${bool(v.printInterpretation)},${v.mode || 'A'}`;
                break;
            case 'code128':
                params = `${v.rotation},${v.barHeight},${bool(v.printInterpretation)},${bool(v.printInterpretationAbove)},${bool(v.checkDigit)}${v.gs1 ? ',D' : ''}`;
                break;
            case 'upca':
                params = `${v.rotation},${v.barHeight},${bool(v.printInterpretation)},${bool(v.printInterpretationAbove)},Y`;
                break;
            default:
                params = `${v.rotation},${v.barHeight},${bool(v.printInterpretation)},${bool(v.printInterpretationAbove)}`;
        }
        const by = fixedByRatio === null ? `^BY${v.moduleWidth}` : `^BY${v.moduleWidth},${fixedByRatio ?? v.wideRatio}`;
        return { by, command: `^${command}${params}`, fieldData: v.content };
    };
    const parse = (fields: string[], by: BarcodeByState) => {
        const result: Record<string, string | number | boolean> = { ...commonLinearDefaults, moduleWidth: by.moduleWidth, wideRatio: fixedByRatio ?? by.wideRatio };
        if (syntax === 'check-first') {
            Object.assign(result, { rotation: rotation(fields[0]), checkDigit: yes(fields[1]), barHeight: number(fields[2], by.barHeight), printInterpretation: yes(fields[3], true), printInterpretationAbove: yes(fields[4]) });
        } else if (syntax === 'height-check-last') {
            Object.assign(result, { rotation: rotation(fields[0]), barHeight: number(fields[1], by.barHeight), printInterpretation: yes(fields[2], true), printInterpretationAbove: yes(fields[3]), checkDigit: yes(fields[4]) });
        } else if (syntax === 'msi') {
            Object.assign(result, { rotation: rotation(fields[0]), checkDigit: fields[1] !== 'A', mode: fields[1] || 'A', barHeight: number(fields[2], by.barHeight), printInterpretation: yes(fields[3], true), printInterpretationAbove: yes(fields[4]) });
        } else if (syntax === 'code49') {
            Object.assign(result, { rotation: rotation(fields[0]), barHeight: number(fields[1], 20), printInterpretation: yes(fields[2], true), mode: fields[3] || 'A' });
        } else if (syntax === 'code128') {
            Object.assign(result, { rotation: rotation(fields[0]), barHeight: number(fields[1], by.barHeight), printInterpretation: yes(fields[2], true), printInterpretationAbove: yes(fields[3]), checkDigit: yes(fields[4]), gs1: fields[5] === 'D' });
        } else {
            Object.assign(result, { rotation: rotation(fields[0]), barHeight: number(fields[1], by.barHeight), printInterpretation: yes(fields[2], true), printInterpretationAbove: yes(fields[3]) });
        }
        return result;
    };
    return {
        type, label, command, bcid, resizeKind: 'linear', defaultContent,
        defaults: { ...commonLinearDefaults }, properties: linearProperties, validate: validateProps, emit, parse,
        ...overrides
    };
}

const definitions: BarcodeDefinition[] = [
    linearDefinition('code128', 'Code 128', 'BC', 'code128', 'CODE128', 'code128', {
        properties: [...linearProperties, { name: 'gs1', attributeName: 'gs1', type: 'boolean' }]
    }),
    linearDefinition('code39', 'Code 39', 'B3', 'code39', 'CODE39', 'check-first'),
    linearDefinition('code93', 'Code 93', 'BA', 'code93', 'CODE93', 'height-check-last'),
    linearDefinition('code11', 'Code 11', 'B1', 'code11', '12345', 'check-first'),
    linearDefinition('interleaved2of5', 'Interleaved 2 of 5', 'B2', 'interleaved2of5', '12345678', 'height-check-last'),
    linearDefinition('standard2of5', 'Standard 2 of 5', 'BJ', 'iata2of5', '12345678', 'height', { properties: linearHriProperties }),
    linearDefinition('industrial2of5', 'Industrial 2 of 5', 'BI', 'industrial2of5', '12345678', 'height', { properties: linearHriProperties }),
    linearDefinition('codabar', 'Codabar', 'BK', 'rationalizedCodabar', 'A12345A', 'check-first'),
    linearDefinition('logmars', 'LOGMARS', 'BL', 'code39', 'LOGMARS1', 'logmars', {
        properties: [...linearGeometryProperties, p.printInterpretation]
    }),
    linearDefinition('msi', 'MSI', 'BM', 'msi', '12345678', 'msi', {
        defaults: { ...commonLinearDefaults, wideRatio: 2 },
        properties: [p.content, p.rotation, p.moduleWidth, p.barHeight, p.printInterpretation,
            p.printInterpretationAbove, p.checkDigit,
            { name: 'mode', attributeName: 'mode', type: 'enum', values: ['B', 'C', 'D'] }]
    }, 2),
    linearDefinition('plessey', 'Plessey', 'BP', 'plessey', '12345678', 'check-first', {
        defaults: { ...commonLinearDefaults, wideRatio: 2 },
        properties: [p.content, p.rotation, p.moduleWidth, p.barHeight,
            p.printInterpretation, p.printInterpretationAbove, p.checkDigit]
    }, 2),
    {
        type: 'gs1databar', label: 'GS1 DataBar', command: 'BR', bcid: 'databaromni', resizeKind: 'intrinsic', defaultContent: '0112345678901',
        defaults: { magnification: 2, symbology: 1, segments: 22 },
        properties: [p.content, p.rotation, p.magnification,
            { name: 'symbology', attributeName: 'symbology', type: 'number', min: 1, max: 7, step: 1 },
            { name: 'segments', attributeName: 'segments', type: 'number', min: 2, max: 22, step: 2 }],
        validate: validateProps,
        emit: props => { const v = props as Gs1DataBarProps; return { by: `^BY${v.magnification}`, command: `^BR${v.rotation},${v.symbology},${v.magnification},2,100${v.symbology === 7 ? `,${v.segments}` : ''}`, fieldData: v.content }; },
        parse: (f, by) => ({ rotation: rotation(f[0]), symbology: number(f[1], 1), magnification: number(f[2], by.moduleWidth), segments: number(f[5], 22) })
    },
    linearDefinition('planet', 'Planet Code', 'B5', 'planet', '12345678901', 'height', { properties: linearHriProperties }),
    linearDefinition('postnet', 'POSTNET', 'BZ', 'postnet', '12345', 'height', { properties: linearHriProperties }),
    linearDefinition('ean13', 'EAN-13', 'BE', 'ean13', '590123412345', 'height', { properties: linearHriProperties }),
    linearDefinition('ean8', 'EAN-8', 'B8', 'ean8', '1234567', 'height', { properties: linearHriProperties }),
    linearDefinition('upca', 'UPC-A', 'BU', 'upca', '01234567890', 'upca', { properties: linearHriProperties }),
    linearDefinition('upce', 'UPC-E', 'B9', 'upce', '012345', 'height', { properties: linearHriProperties }),
    linearDefinition('upceanextension', 'UPC/EAN supplement', 'BS', 'ean5', '51999', 'logmars', {
        properties: [...linearGeometryProperties, p.printInterpretation]
    }),
    linearDefinition('code49', 'Code 49', 'B4', 'code49', 'CODE49', 'code49', {
        defaults: { ...commonLinearDefaults, barHeight: 20, mode: 'A' },
        properties: [p.content, p.rotation, p.moduleWidth, p.barHeight, p.printInterpretation,
            { name: 'mode', attributeName: 'mode', type: 'enum', values: ['A', '0', '1', '2', '3', '4', '5'] }]
    }, null),
    {
        type: 'qrcode', label: 'QR Code', command: 'BQ', bcid: 'qrcode', resizeKind: 'uniform-2d', defaultContent: 'https://example.com',
        defaults: { magnification: 4, errorCorrection: 'Q', model: 2 },
        properties: [p.content, p.rotation, p.magnification,
            { name: 'errorCorrection', attributeName: 'error-correction', type: 'enum', values: ['H', 'Q', 'M', 'L'] },
            { name: 'model', attributeName: 'model', type: 'number', min: 1, max: 2, step: 1 }],
        validate: validateProps,
        emit: props => { const v = props as QrBarcodeProps; return { command: `^BQ${v.rotation},${v.model},${v.magnification}`, fieldData: `${v.errorCorrection}A,${v.content}` }; },
        parse: f => ({ rotation: rotation(f[0]), model: number(f[1], 2), magnification: number(f[2], 4) })
    },
    {
        type: 'datamatrix', label: 'DataMatrix', command: 'BX', bcid: 'datamatrix', resizeKind: 'uniform-2d', defaultContent: '1234567890',
        defaults: { dimension: 5, quality: 200, columns: 0, rows: 0, gs1: false, aspectRatio: 1 },
        properties: [p.content, p.rotation, { name: 'dimension', attributeName: 'dimension', type: 'number', min: 1, max: 12, step: 1 },
            { name: 'quality', attributeName: 'quality', type: 'enum', values: ['0', '50', '80', '100', '140', '200'] }, p.columns,
            { name: 'rows', attributeName: 'rows', type: 'number', min: 0, max: 144, step: 1 },
            { name: 'gs1', attributeName: 'gs1', type: 'boolean' },
            { name: 'aspectRatio', attributeName: 'aspect-ratio', type: 'number', min: 1, max: 2, step: 1 }],
        validate: validateProps,
        emit: props => { const v = props as DataMatrixBarcodeProps; const args: (string | number)[] = [v.rotation, v.dimension, v.quality, v.columns || '', v.rows || '', '', v.gs1 ? '_' : '', v.aspectRatio === 2 ? 2 : '']; while (args.at(-1) === '') args.pop(); return { command: `^BX${args.join(',')}`, fieldData: v.content }; },
        parse: f => ({ rotation: rotation(f[0]), dimension: number(f[1], 5), quality: number(f[2], 200), columns: number(f[3], 0), rows: number(f[4], 0), gs1: !!f[6], aspectRatio: number(f[7], 1) })
    },
    {
        type: 'pdf417', label: 'PDF417', command: 'B7', bcid: 'pdf417', resizeKind: 'stacked-2d', defaultContent: '1234567890',
        defaults: { moduleWidth: 2, rowHeight: 2, securityLevel: 0, columns: 0, mode: 0 },
        properties: [p.content, p.rotation, { ...p.moduleWidth, min: 2 }, p.rowHeight,
            { name: 'securityLevel', attributeName: 'security-level', type: 'number', min: 0, max: 8, step: 1 },
            { ...p.columns, max: 30 }],
        validate: validateProps,
        emit: props => { const v = props as StackedBarcodeProps; return { by: `^BY${v.moduleWidth}`, command: `^B7${v.rotation},${v.rowHeight},${v.securityLevel},${v.columns},,,`, fieldData: v.content }; },
        parse: (f, by) => ({ rotation: rotation(f[0]), moduleWidth: by.moduleWidth, rowHeight: number(f[1], 2), securityLevel: number(f[2], 0), columns: number(f[3], 0) })
    },
    {
        type: 'micropdf417', label: 'MicroPDF417', command: 'BF', bcid: 'micropdf417', resizeKind: 'stacked-2d', defaultContent: '1234',
        defaults: { moduleWidth: 2, rowHeight: 2, securityLevel: 0, columns: 0, mode: 0 },
        properties: [p.content, p.rotation, p.moduleWidth, p.rowHeight, { ...p.mode, max: 33 }],
        validate: validateProps,
        emit: props => { const v = props as StackedBarcodeProps; return { by: `^BY${v.moduleWidth}`, command: `^BF${v.rotation},${v.rowHeight},${v.mode}`, fieldData: v.content }; },
        parse: (f, by) => ({ rotation: rotation(f[0]), moduleWidth: by.moduleWidth, rowHeight: number(f[1], 2), mode: number(f[2], 0) })
    },
    {
        type: 'aztec', label: 'Aztec', command: 'B0', bcid: 'azteccodecompact', resizeKind: 'uniform-2d', defaultContent: '1234567890',
        defaults: { magnification: 4, ecLevel: 0 }, properties: [p.content, p.rotation, p.magnification,
            { name: 'ecLevel', attributeName: 'ec-level', type: 'number', min: 0, max: 300, step: 1 }],
        validate: validateProps,
        emit: props => { const v = props as AztecBarcodeProps; return { command: `^B0${v.rotation},${v.magnification},N,${v.ecLevel}`, fieldData: v.content }; },
        parse: f => ({ rotation: rotation(f[0]), magnification: number(f[1], 4), ecLevel: number(f[3], 0) })
    },
    {
        type: 'codablock', label: 'CODABLOCK', command: 'BB', bcid: 'codablockf', resizeKind: 'stacked-2d', defaultContent: 'CODABLOCK',
        defaults: { moduleWidth: 2, rowHeight: 2, securityLevel: 'Y', columns: 6, mode: 0 },
        properties: [p.content, p.rotation, { ...p.moduleWidth, min: 2 }, p.rowHeight,
            { name: 'securityLevel', attributeName: 'security-level', type: 'enum', values: ['Y', 'N'] },
            { ...p.columns, min: 2, max: 62 }],
        validate: validateProps,
        emit: props => { const v = props as StackedBarcodeProps; return { by: `^BY${v.moduleWidth}`, command: `^BB${v.rotation},${v.rowHeight},${v.securityLevel},${v.columns},,F`, fieldData: v.content }; },
        parse: (f, by) => ({ rotation: rotation(f[0]), moduleWidth: by.moduleWidth, rowHeight: number(f[1], 2), securityLevel: f[2] || 'Y', columns: number(f[3], 6) })
    },
    {
        type: 'maxicode', label: 'MaxiCode', command: 'BD', bcid: 'maxicode', resizeKind: 'intrinsic', defaultContent: '1234567890',
        defaults: { mode: 4, symbolNumber: 1, symbolTotal: 1 }, properties: [p.content,
            { name: 'mode', attributeName: 'mode', type: 'enum', values: ['2', '3', '4', '5', '6'] },
            { name: 'symbolNumber', attributeName: 'symbol-number', type: 'number', min: 1, max: 8, step: 1 },
            { name: 'symbolTotal', attributeName: 'symbol-total', type: 'number', min: 1, max: 8, step: 1 }],
        validate: validateProps,
        emit: props => { const v = props as MaxiCodeBarcodeProps; return { command: `^BD${v.mode},${v.symbolNumber},${v.symbolTotal}`, fieldData: v.content }; },
        parse: f => ({ mode: number(f[0], 2), symbolNumber: number(f[1], 1), symbolTotal: number(f[2], 1) })
    },
    {
        type: 'tlc39', label: 'TLC39', command: 'BT', bcid: 'code39', resizeKind: 'tlc39', defaultContent: '123456,SERIAL',
        defaults: { moduleWidth: 2, wideRatio: 2, barHeight: 40, microPdfModuleWidth: 2, microPdfRowHeight: 4 },
        properties: [p.content, p.rotation, p.moduleWidth, p.wideRatio, p.barHeight,
            { name: 'microPdfModuleWidth', attributeName: 'micro-pdf-module-width', type: 'number', min: 1, max: 10, step: 1 },
            { name: 'microPdfRowHeight', attributeName: 'micro-pdf-row-height', type: 'number', min: 1, max: 9999, step: 1 }],
        validate: validateProps,
        emit: props => { const v = props as Tlc39BarcodeProps; return { by: `^BY${v.moduleWidth}`, command: `^BT${v.rotation},${v.moduleWidth},${v.wideRatio},${v.barHeight},${v.microPdfModuleWidth},${v.microPdfRowHeight}`, fieldData: v.content }; },
        parse: (f, by) => ({ rotation: rotation(f[0]), moduleWidth: number(f[1], by.moduleWidth), wideRatio: number(f[2], by.wideRatio), barHeight: number(f[3], by.barHeight), microPdfModuleWidth: number(f[4], 2), microPdfRowHeight: number(f[5], 4) })
    }
];

export const barcodeRegistry: Readonly<Record<BarcodeType, BarcodeDefinition>> = Object.freeze(
    Object.fromEntries(definitions.map(definition => [definition.type, Object.freeze(definition)])) as Record<BarcodeType, BarcodeDefinition>
);

export const barcodeCommandRegistry: Readonly<Record<string, BarcodeDefinition>> = Object.freeze(
    Object.fromEntries(definitions.map(definition => [definition.command, definition]))
);

/** Every attribute that can affect a barcode preview.  Keeping this list
 * registry-derived makes custom-element reactivity follow the property grid. */
export const barcodeObservedAttributes: readonly string[] = Object.freeze([
    'type',
    ...new Set(definitions.flatMap(definition => definition.properties.map(property => property.attributeName)))
]);

export function getBarcodeDefinition(type: string | null | undefined): BarcodeDefinition {
    return barcodeRegistry[(type || 'code128').toLowerCase() as BarcodeType] ?? barcodeRegistry.code128;
}

export function readBarcodeProps(element: Element): BarcodeProps {
    const definition = getBarcodeDefinition(element.getAttribute('type'));
    const result: Record<string, unknown> = {
        type: definition.type,
        content: element.getAttribute('content') ?? definition.defaultContent,
        rotation: rotation(element.getAttribute('rotation') ?? undefined),
        ...definition.defaults
    };
    for (const property of definition.properties) {
        if (property.name === 'content' || property.name === 'rotation') continue;
        const raw = element.getAttribute(property.attributeName);
        if (raw == null) continue;
        if (property.type === 'boolean') result[property.name] = raw === '' || raw === 'true' || raw === 'Y';
        else if (property.type === 'number') result[property.name] = number(raw, Number(definition.defaults[property.name] ?? 0));
        else result[property.name] = raw;
    }
    return result as unknown as BarcodeProps;
}

export function attributesForBarcode(type: BarcodeType, values: Record<string, string | number | boolean> = {}): Record<string, string> {
    const definition = barcodeRegistry[type];
    const attributes: Record<string, string> = { type, content: definition.defaultContent, rotation: 'N' };
    for (const property of definition.properties) {
        const value = values[property.name] ?? definition.defaults[property.name];
        if (value == null || property.name === 'type') continue;
        if (property.type === 'boolean') {
            attributes[property.attributeName] = value ? 'true' : 'false';
        } else {
            attributes[property.attributeName] = String(value);
        }
    }
    return attributes;
}
