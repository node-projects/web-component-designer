/** @jest-environment jsdom */

import { beforeAll, describe, expect, test } from '@jest/globals';

let ZplText: typeof import('../src/widgets/zpl-text.js').ZplText;
let zplTextPreviewYOffset: typeof import('../src/widgets/zpl-text.js').zplTextPreviewYOffset;
let ZplBarcode: typeof import('../src/widgets/zpl-barcode.js').ZplBarcode;
let ZplTextPropertiesService: typeof import('../src/services/ZplTextPropertiesService.js').ZplTextPropertiesService;
let ZplBarcodePropertiesService: typeof import('../src/services/ZplBarcodePropertiesService.js').ZplBarcodePropertiesService;
let ZplElementResizeStrategy: typeof import('../src/services/ZplElementResizeStrategy.js').ZplElementResizeStrategy;

beforeAll(async () => {
    for (const name of ['SVGPathElement', 'SVGRectElement', 'SVGCircleElement', 'SVGEllipseElement',
        'SVGLineElement', 'SVGPolylineElement', 'SVGPolygonElement', 'SVGGraphicsElement']) {
        if (!(globalThis as any)[name]) Object.defineProperty(globalThis, name, { value: SVGElement });
    }
    if (!CSSStyleSheet.prototype.replaceSync) {
        CSSStyleSheet.prototype.replaceSync = function () { /* jsdom stylesheet shim */ };
    }
    if (!('adoptedStyleSheets' in ShadowRoot.prototype)) {
        Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
    }
    if (!globalThis.FontFace) {
        Object.defineProperty(globalThis, 'FontFace', {
            value: class {
                constructor(public family: string, public source: string) { }
                load() { return Promise.resolve(this); }
            }
        });
    }
    if (!document.fonts) {
        Object.defineProperty(document, 'fonts', { value: { add() { } } });
    }

    ({ ZplText, zplTextPreviewYOffset } = await import('../src/widgets/zpl-text.js'));
    ({ ZplBarcode } = await import('../src/widgets/zpl-barcode.js'));
    ({ ZplTextPropertiesService } = await import('../src/services/ZplTextPropertiesService.js'));
    ({ ZplBarcodePropertiesService } = await import('../src/services/ZplBarcodePropertiesService.js'));
    ({ ZplElementResizeStrategy } = await import('../src/services/ZplElementResizeStrategy.js'));
});

const flushReady = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

describe('ZPL widget runtime updates', () => {
    test('text property edits update content and device font immediately', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'Before');
        element.setAttribute('font-name', '0');
        element.setAttribute('font-height', '30');
        element.setAttribute('font-width', '30');
        document.body.appendChild(element);
        await flushReady();

        const service = new ZplTextPropertiesService();
        const designItem = {
            element,
            setAttribute: (name: string, value: string) => element.setAttribute(name, value),
            getAttribute: (name: string) => element.getAttribute(name),
            openGroup: () => ({ commit() { }, abort() { } })
        } as any;
        const properties = await service.getProperties();

        await service.setValue([designItem], properties.find(property => property.name === 'content')!, 'After');
        expect(element.shadowRoot!.querySelector('#text-div')!.textContent).toBe('After');

        await service.setValue([designItem], properties.find(property => property.name === 'fontName')!, 'E');
        expect((element.shadowRoot!.querySelector('#text-div') as HTMLElement).style.fontFamily).toContain('ZplOCRB');
    });

    test('aligns browser text ink with the ZPL field origin', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'Origin');
        element.setAttribute('font-name', '0');
        element.setAttribute('font-height', '30');
        element.setAttribute('font-width', '30');
        element.style.left = '20px';
        element.style.top = '40px';
        document.body.appendChild(element);
        await flushReady();

        const text = element.shadowRoot!.querySelector('#text-div') as HTMLElement;
        expect(zplTextPreviewYOffset).toBe(-7);
        expect(text.style.transform).toBe('translate(0px, -7px) scaleX(1)');
        expect(element.createZpl()).toContain('^FO20,40,0^A0N,30,30');
    });

    test('successive resize previews stay relative to the gesture start', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'Resize');
        element.setAttribute('font-name', '0');
        element.setAttribute('font-height', '30');
        element.setAttribute('font-width', '30');
        document.body.appendChild(element);
        await flushReady();
        element.getBoundingClientRect = () => ({
            x: 0, y: 0, top: 0, left: 0, right: parseFloat(element.style.width) || 1,
            bottom: parseFloat(element.style.height) || 1,
            width: parseFloat(element.style.width) || 1, height: parseFloat(element.style.height) || 1,
            toJSON() { return this; }
        });

        const designItem = {
            element,
            getAttribute: (name: string) => element.getAttribute(name),
            setAttribute: (name: string, value: string) => element.setAttribute(name, value)
        } as any;
        const strategy = new ZplElementResizeStrategy();
        const initial = { designItem, handle: 'se-resize', initialSize: { width: 100, height: 30 }, currentSize: { width: 100, height: 30 } } as any;
        const state = strategy.begin(initial);

        strategy.preview({ ...initial, currentSize: { width: 200, height: 60 } }, state);
        expect(element.getAttribute('font-width')).toBe('60');
        expect(element.getAttribute('font-height')).toBe('60');

        strategy.preview({ ...initial, currentSize: { width: 150, height: 45 } }, state);
        expect(element.getAttribute('font-width')).toBe('45');
        expect(element.getAttribute('font-height')).toBe('45');
    });

    test('barcode property edits refresh the rendered rotation', async () => {
        const element = document.createElement('zpl-barcode') as InstanceType<typeof ZplBarcode>;
        element.setAttribute('type', 'qrcode');
        element.setAttribute('content', '');
        element.setAttribute('rotation', 'N');
        element.setAttribute('magnification', '4');
        document.body.appendChild(element);
        await flushReady();

        const service = new ZplBarcodePropertiesService();
        const designItem = {
            element,
            getAttribute: (name: string) => element.getAttribute(name),
            setAttribute: (name: string, value: string) => element.setAttribute(name, value),
            openGroup: () => ({ commit() { }, abort() { } })
        } as any;
        const properties = await service.getProperties(designItem);
        await service.setValue([designItem], properties.find(property => property.name === 'rotation')!, 'R');

        expect(element.getAttribute('rotation')).toBe('R');
        expect((element.shadowRoot!.querySelector('#barcode-frame') as HTMLElement).style.transform).toContain('rotate(90deg)');
    });
});
