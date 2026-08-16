import { describe, expect, test } from '@jest/globals';
import { attributesForBarcode, barcodeCommandRegistry, barcodeObservedAttributes, barcodeRegistry, barcodeTypes, BarcodeProps,
    getBarcodeFieldOriginOffset, getDataMatrixVersion, readBarcodeProps } from '../src/barcodes/barcodeRegistry.js';
import { barcodeFieldOriginAboveOffset, barcodeHorizontalInsets, barcodeInterpretationText, barcodeShowsInterpretation, barcodeTextAbove,
    barcodeTextZoneDots, buildBwipOptions, getEanUpcHriFragments, getEanUpcHriStyle, getTlc39Geometry, getZebraWidthBarGeometry, measureBarcodeBounds, measureBarcodeModules,
    measureBarcodePreview } from '../src/barcodes/bwipRenderer.js';
import geometryFixtures from './fixtures/barcodeGeometry.json';
import printerBounds from './fixtures/barcodePrinterBounds.json';

describe('ZPL barcode registry', () => {
    test('observes every registry-backed preview property', () => {
        const propertyAttributes = Object.values(barcodeRegistry)
            .flatMap(definition => definition.properties.map(property => property.attributeName));
        expect(new Set(barcodeObservedAttributes)).toEqual(new Set(['type', ...propertyAttributes]));
    });

    test('contains the 28 supported symbologies with unique commands', () => {
        expect(barcodeTypes).toHaveLength(28);
        expect(Object.keys(barcodeRegistry)).toHaveLength(28);
        expect(new Set(barcodeTypes.map(type => barcodeRegistry[type].command)).size).toBe(28);
        expect(Object.keys(barcodeCommandRegistry)).toHaveLength(28);
    });

    test.each(barcodeTypes)('%s command parses and emits canonically', type => {
        const definition = barcodeRegistry[type];
        const props = {
            type, content: definition.defaultContent, rotation: 'N', ...definition.defaults
        } as unknown as BarcodeProps;
        const emitted = definition.emit(props);
        expect(emitted.command.startsWith(`^${definition.command}`)).toBe(true);
        const parsed = definition.parse(emitted.command.slice(3).split(','), {
            moduleWidth: Number((props as any).moduleWidth ?? (props as any).magnification ?? 2),
            wideRatio: Number((props as any).wideRatio ?? 3),
            barHeight: Number((props as any).barHeight ?? 100)
        });
        const second = definition.emit({ ...props, ...parsed } as BarcodeProps);
        expect(second.command).toBe(emitted.command);
        expect(second.by).toBe(emitted.by);
    });

    test('EAN-13 emits ^BE and QR keeps its ZPL field prefix', () => {
        const ean = barcodeRegistry.ean13.emit({ type: 'ean13', content: '590123412345', rotation: 'N', ...barcodeRegistry.ean13.defaults } as unknown as BarcodeProps);
        expect(ean.command).toMatch(/^\^BE/);
        const qr = barcodeRegistry.qrcode.emit({ type: 'qrcode', content: 'hello', rotation: 'N', ...barcodeRegistry.qrcode.defaults } as unknown as BarcodeProps);
        expect(qr.fieldData).toBe('QA,hello');
    });

    test('preserves false booleans and emits canonical GS1 DataBar geometry', () => {
        expect(attributesForBarcode('code128', { printInterpretation: false })['print-interpretation']).toBe('false');
        const definition = barcodeRegistry.gs1databar;
        const emitted = definition.emit({ type: 'gs1databar', content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps);
        expect(emitted.command).toBe('^BRN,1,2,2,100');
    });

    test('validates numeric property limits before preview', () => {
        const definition = barcodeRegistry.qrcode;
        const props = { type: 'qrcode', content: 'ok', rotation: 'N', ...definition.defaults, magnification: 11 } as unknown as BarcodeProps;
        expect(definition.validate(props)).toBe('magnification must be at most 10');
    });

    test('builds offline BWIP options for each preview category', () => {
        const samples = ['code128', 'qrcode', 'datamatrix', 'pdf417', 'aztec', 'maxicode', 'tlc39'] as const;
        for (const type of samples) {
            const definition = barcodeRegistry[type];
            const options = buildBwipOptions({ type, content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps);
            expect(typeof options.bcid).toBe('string');
            expect(Number(options.scale)).toBeGreaterThan(0);
        }
    });

    test('keeps a bare numeric ^BC in Zebra Code Set B', () => {
        const definition = barcodeRegistry.code128;
        const props = { type: 'code128', content: '12345678', rotation: 'N', ...definition.defaults,
            moduleWidth: 5, barHeight: 270, printInterpretation: true } as unknown as BarcodeProps;
        expect(buildBwipOptions(props)).toMatchObject({ bcid: 'code128', raw: true, scale: 5 });
        expect(measureBarcodeBounds(props).width).toBe(615);
        expect(barcodeTextZoneDots(props)).toBe(42);
    });

    test('shows generated Code 39 start/stop asterisks only in the interpretation line', () => {
        const definition = barcodeRegistry.code39;
        const props = { type: 'code39', content: 'abc123', rotation: 'N', ...definition.defaults,
            printInterpretation: true } as unknown as BarcodeProps;

        expect(barcodeInterpretationText(props)).toBe('*ABC123*');
        expect(buildBwipOptions(props).text).toBe('ABC123');
        expect(definition.emit(props).fieldData).toBe('abc123');
        expect(barcodeShowsInterpretation(props)).toBe(true);
        expect(barcodeTextAbove(props)).toBe(false);
        expect(barcodeTextAbove({ ...props, printInterpretationAbove: true } as BarcodeProps)).toBe(true);
        expect(barcodeShowsInterpretation({ ...props, printInterpretation: false } as BarcodeProps)).toBe(false);
    });

    test.each<[keyof typeof barcodeRegistry, string, string, number]>([
        ['ean13', '590123412345', '5901234123457', 13],
        ['ean8', '1234567', '12345670', 8],
        ['upca', '01234567890', '012345678905', 12],
        ['upce', '012345', '00123457', 8]
    ])('%s uses printer-formatted, individually positioned HRI digits', (type, content, hri, count) => {
        const definition = barcodeRegistry[type];
        const props = { type, content, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        const fragments = getEanUpcHriFragments(props);
        expect(fragments).toHaveLength(count);
        expect(fragments.map(fragment => fragment.char).join('')).toBe(hri);
        expect(barcodeInterpretationText(props)).toBe(hri);
        if (type === 'ean13' || type === 'upca' || type === 'upce')
            expect(fragments[0].xModule).toBeLessThan(0);
        if (type === 'upca' || type === 'upce')
            expect(fragments.at(-1)!.xModule).toBeGreaterThan(fragments.at(-2)!.xModule);
    });

    test('uses Zebra EAN/UPC font-size steps instead of generic centered HRI sizing', () => {
        expect(getEanUpcHriStyle(1)).toEqual({ fontSize: 8, gap: 4, fontFamily: 'ZplVeraMono' });
        expect(getEanUpcHriStyle(2)).toEqual({ fontSize: 18, gap: 4, fontFamily: 'ZplVeraMono' });
        expect(getEanUpcHriStyle(3)).toEqual({ fontSize: 28, gap: 5, fontFamily: 'ZplOCRB' });
        expect(getEanUpcHriStyle(8)).toEqual({ fontSize: 56, gap: 7, fontFamily: 'ZplOCRB' });
    });

    test.each(barcodeTypes)('%s has a non-empty offline preview footprint', type => {
        const definition = barcodeRegistry[type];
        const props = { type, content: definition.defaultContent, rotation: 'N', ...definition.defaults,
            ...('printInterpretation' in definition.defaults ? {
                printInterpretation: false, printInterpretationAbove: false
            } : {}) } as unknown as BarcodeProps;
        const bounds = measureBarcodeBounds(props);
        const expected = printerBounds[type];
        const height = definition.resizeKind === 'linear'
            ? (props as any).barHeight + barcodeTextZoneDots(props) : bounds.height;
        expect({ width: bounds.width, height }).toEqual({ width: expected.width, height: expected.height });
    });

    test.each(Object.entries(geometryFixtures))('%s matches its offline module-geometry fixture', (type, fixture) => {
        const definition = barcodeRegistry[type as keyof typeof barcodeRegistry];
        const props = { type, content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        expect(measureBarcodeModules(props)).toEqual(fixture);
    });

    test.each<[keyof typeof barcodeRegistry, number, number]>([
        ['qrcode', 100, 100],
        ['datamatrix', 60, 60],
        ['aztec', 60, 60],
        ['maxicode', 606, 576]
    ])('%s preview uses ZPL module dimensions instead of the BWIP backing-store size', (type, width, height) => {
        const definition = barcodeRegistry[type];
        const props = { type, content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        expect(measureBarcodePreview(props, { width: 999, height: 999 })).toEqual({ width, height });
    });

    test('uses firmware rows and columns for stacked barcode preview bounds', () => {
        const pdfDefinition = barcodeRegistry.pdf417;
        const pdf = { type: 'pdf417', content: pdfDefinition.defaultContent, rotation: 'N', ...pdfDefinition.defaults } as unknown as BarcodeProps;
        expect(measureBarcodePreview(pdf, { width: 172, height: 48 })).toEqual({ width: 172, height: 16 });

        const microDefinition = barcodeRegistry.micropdf417;
        const micro = { type: 'micropdf417', content: microDefinition.defaultContent, rotation: 'N', ...microDefinition.defaults } as unknown as BarcodeProps;
        expect(buildBwipOptions(micro)).toMatchObject({ columns: 1, rows: 11 });
        expect(measureBarcodePreview(micro, { width: 76, height: 56 })).toEqual({ width: 76, height: 22 });
    });

    test('matches printer HRI reservations instead of a fixed CSS line height', () => {
        const linear = (type: 'code128' | 'ean13' | 'logmars' | 'upceanextension') => {
            const definition = barcodeRegistry[type];
            return { type, content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        };
        expect(barcodeTextZoneDots(linear('code128'))).toBe(21);
        expect(barcodeTextZoneDots(linear('ean13'))).toBe(18);
        expect(barcodeTextZoneDots(linear('logmars'))).toBe(26);
        expect(barcodeTextZoneDots(linear('upceanextension'))).toBe(18);
        expect(barcodeTextZoneDots({ ...linear('logmars'), printInterpretation: false } as BarcodeProps)).toBe(20);
        expect(barcodeTextZoneDots({ ...linear('logmars'), printInterpretation: true } as BarcodeProps)).toBe(26);
    });

    test('includes printer-visible EAN/UPC side digits in preview bounds', () => {
        const props = (type: 'ean13' | 'ean8' | 'upca' | 'upce') => {
            const definition = barcodeRegistry[type];
            return { type, content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        };
        expect(barcodeHorizontalInsets(props('ean13'))).toEqual({ left: 21, right: 0 });
        expect(barcodeHorizontalInsets(props('ean8'))).toEqual({ left: 0, right: 0 });
        expect(barcodeHorizontalInsets(props('upca'))).toEqual({ left: 22, right: 13 });
        expect(measureBarcodePreview(props('ean13'), { width: 190, height: 100 })).toEqual({ width: 211, height: 100 });
        expect(measureBarcodePreview(props('upca'), { width: 190, height: 100 })).toEqual({ width: 225, height: 100 });
        expect(measureBarcodePreview(props('upce'), { width: 102, height: 100 })).toEqual({ width: 137, height: 100 });
        expect(barcodeHorizontalInsets({ ...props('upca'), printInterpretation: false } as BarcodeProps))
            .toEqual({ left: 0, right: 0 });
    });

    test('parses numeric enum attributes as numbers', () => {
        const elementWith = (attributes: Record<string, string>) => ({
            getAttribute: (name: string) => attributes[name] ?? null
        }) as unknown as Element;
        const dataMatrix = elementWith(attributesForBarcode('datamatrix'));
        expect((readBarcodeProps(dataMatrix) as any).quality).toBe(200);

        const maxicode = elementWith(attributesForBarcode('maxicode'));
        expect((readBarcodeProps(maxicode) as any).mode).toBe(4);
    });

    test('uses only valid ECC 200 DataMatrix versions and suppresses rectangular mode for older qualities', () => {
        const definition = barcodeRegistry.datamatrix;
        const base = { type: 'datamatrix', content: 'DataMatrixTest', rotation: 'N', ...definition.defaults } as any;
        const square = { ...base, rows: 20, columns: 20 };
        expect(getDataMatrixVersion(square)).toBe('20x20');
        expect(buildBwipOptions(square)).toMatchObject({ bcid: 'datamatrix', version: '20x20' });
        expect(measureBarcodeBounds(square)).toEqual({ width: 100, height: 100 });
        expect(definition.emit(square).command).toBe('^BXN,5,200,20,20');

        const rectangle = { ...base, rows: 12, columns: 26, aspectRatio: 2 };
        expect(getDataMatrixVersion(rectangle)).toBe('12x26');
        expect(buildBwipOptions(rectangle)).toMatchObject({ bcid: 'datamatrixrectangular', version: '12x26' });
        expect(measureBarcodeBounds(rectangle)).toEqual({ width: 130, height: 60 });
        expect(definition.emit(rectangle).command).toBe('^BXN,5,200,26,12,,,2');

        const legacy = { ...base, quality: 0, aspectRatio: 2 };
        expect(buildBwipOptions(legacy).bcid).toBe('datamatrix');
        expect(definition.emit(legacy).command).not.toMatch(/,2$/);
        expect(definition.validate({ ...base, rows: 18, columns: 18, aspectRatio: 2 }))
            .toBe('rows and columns are not a valid rectangular ECC 200 size');
    });

    test('POSTNET uses Zebra bar pitch and short-bar geometry', () => {
        const definition = barcodeRegistry.postnet;
        const props = { type: 'postnet', content: '12345', rotation: 'N', ...definition.defaults,
            printInterpretation: false } as any;
        const geometry = getZebraWidthBarGeometry(props)!;
        expect(geometry.rects).toHaveLength(32);
        expect(geometry.width).toBe(157);
        expect(geometry.height).toBe(100);
        expect(geometry.rects[0]).toEqual({ x: 0, y: 0, width: 2, height: 100 });
        expect(geometry.rects.at(-1)).toMatchObject({ x: 155, y: 0, width: 2, height: 100 });
        expect(geometry.rects.some(rect => rect.y === 60 && rect.height === 40)).toBe(true);
        expect(definition.validate({ ...props, content: '12A45' })).toBe('POSTNET content must contain digits only');
    });

    test('TLC39 renders the linked MicroPDF417 and tall linkage bar as one composite', () => {
        const definition = barcodeRegistry.tlc39;
        const props = { type: 'tlc39', content: definition.defaultContent, rotation: 'N', ...definition.defaults } as any;
        const geometry = getTlc39Geometry(props);
        expect(geometry).toMatchObject({ width: 250, height: 74, code39Y: 26, stopOverhang: 8 });
        expect(geometry.microPdf).toMatchObject({ x: 2, y: 0, width: 198, height: 24, rows: 6 });
        expect(geometry.tallFromModule).not.toBeNull();
        expect(definition.validate({ ...props, content: '12345,SERIAL' })).toBe('TLC39 ECI must contain exactly six digits');
    });

    test('places LOGMARS interpretation on the printer side selected by its flag', () => {
        const definition = barcodeRegistry.logmars;
        const base = { type: 'logmars', content: definition.defaultContent, rotation: 'N', ...definition.defaults } as any;
        expect(barcodeShowsInterpretation({ ...base, printInterpretation: false })).toBe(true);
        expect(barcodeTextAbove({ ...base, printInterpretation: true })).toBe(true);
        expect(barcodeFieldOriginAboveOffset({ ...base, printInterpretation: true })).toBe(26);
        expect(barcodeTextAbove({ ...base, printInterpretation: false })).toBe(false);
        expect(barcodeFieldOriginAboveOffset({ ...base, printInterpretation: false })).toBe(0);
    });

    test('rejects invalid preview geometry without a canvas or network', () => {
        const definition = barcodeRegistry.qrcode;
        const props = { type: 'qrcode', content: '', rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        expect(() => measureBarcodeModules(props)).toThrow('content is required');
    });

    test('applies the printer QR field-origin correction by rotation', () => {
        expect(getBarcodeFieldOriginOffset('qrcode', 'N')).toEqual({ x: 0, y: -10 });
        expect(getBarcodeFieldOriginOffset('qrcode', 'R')).toEqual({ x: 0, y: 0 });
        expect(getBarcodeFieldOriginOffset('qrcode', 'I')).toEqual({ x: 0, y: 0 });
        expect(getBarcodeFieldOriginOffset('qrcode', 'B')).toEqual({ x: -10, y: 0 });
        expect(getBarcodeFieldOriginOffset('code128', 'N')).toEqual({ x: 0, y: 0 });
        expect(getBarcodeFieldOriginOffset('gs1databar', 'N')).toEqual({ x: -2, y: 0 });
    });
});
