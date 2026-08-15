import { describe, expect, test } from '@jest/globals';
import { attributesForBarcode, barcodeCommandRegistry, barcodeObservedAttributes, barcodeRegistry, barcodeTypes, BarcodeProps } from '../src/barcodes/barcodeRegistry.js';
import { buildBwipOptions, measureBarcodeModules } from '../src/barcodes/bwipRenderer.js';
import geometryFixtures from './fixtures/barcodeGeometry.json';

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

    test.each(Object.entries(geometryFixtures))('%s matches its offline module-geometry fixture', (type, fixture) => {
        const definition = barcodeRegistry[type as keyof typeof barcodeRegistry];
        const props = { type, content: definition.defaultContent, rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        expect(measureBarcodeModules(props)).toEqual(fixture);
    });

    test('rejects invalid preview geometry without a canvas or network', () => {
        const definition = barcodeRegistry.qrcode;
        const props = { type: 'qrcode', content: '', rotation: 'N', ...definition.defaults } as unknown as BarcodeProps;
        expect(() => measureBarcodeModules(props)).toThrow('content is required');
    });
});
