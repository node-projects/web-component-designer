/** @jest-environment jsdom */

import { beforeAll, describe, expect, test } from '@jest/globals';

let ZplText: typeof import('../src/widgets/zpl-text.js').ZplText;
let getZplTextOutputOffset: typeof import('../src/widgets/zpl-text.js').getZplTextOutputOffset;
let zplTextOutputOriginCorrection: typeof import('../src/widgets/zpl-text.js').zplTextOutputOriginCorrection;
let ZplBarcode: typeof import('../src/widgets/zpl-barcode.js').ZplBarcode;
let ZplGraphicBox: typeof import('../src/widgets/zpl-graphic-box.js').ZplGraphicBox;
let ZplTextPropertiesService: typeof import('../src/services/ZplTextPropertiesService.js').ZplTextPropertiesService;
let ZplBarcodePropertiesService: typeof import('../src/services/ZplBarcodePropertiesService.js').ZplBarcodePropertiesService;
let ZplElementResizeStrategy: typeof import('../src/services/ZplElementResizeStrategy.js').ZplElementResizeStrategy;
let ZplGraphicResizeStrategy: typeof import('../src/services/ZplGraphicResizeStrategy.js').ZplGraphicResizeStrategy;
let ZplSelectionExtensionProvider: typeof import('../src/services/ZplSelectionExtensionProvider.js').ZplSelectionExtensionProvider;
let ZplTextEditExtensionProvider: typeof import('../src/services/ZplTextEditExtension.js').ZplTextEditExtensionProvider;
let resizeZplDiagonalEndpoint: typeof import('../src/services/ZplDiagonalLineExtension.js').resizeZplDiagonalEndpoint;
let getZplDiagonalVisibleHeight: typeof import('../src/services/ZplDiagonalLineExtension.js').getZplDiagonalVisibleHeight;
let getZplDiagonalElementHeight: typeof import('../src/services/ZplDiagonalLineExtension.js').getZplDiagonalElementHeight;
let parseZplFontWidth: typeof import('../src/services/ZplParserService.js').parseZplFontWidth;

beforeAll(async () => {
    if (!window.matchMedia) {
        Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false }) });
    }
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
    if (!globalThis.ResizeObserver) {
        Object.defineProperty(globalThis, 'ResizeObserver', {
            value: class { observe() { } unobserve() { } disconnect() { } }
        });
    }

    ({ ZplText, getZplTextOutputOffset, zplTextOutputOriginCorrection } = await import('../src/widgets/zpl-text.js'));
    ({ ZplBarcode } = await import('../src/widgets/zpl-barcode.js'));
    ({ ZplGraphicBox } = await import('../src/widgets/zpl-graphic-box.js'));
    ({ ZplTextPropertiesService } = await import('../src/services/ZplTextPropertiesService.js'));
    ({ ZplBarcodePropertiesService } = await import('../src/services/ZplBarcodePropertiesService.js'));
    ({ ZplElementResizeStrategy } = await import('../src/services/ZplElementResizeStrategy.js'));
    ({ ZplGraphicResizeStrategy } = await import('../src/services/ZplGraphicResizeStrategy.js'));
    ({ ZplSelectionExtensionProvider } = await import('../src/services/ZplSelectionExtensionProvider.js'));
    ({ ZplTextEditExtensionProvider } = await import('../src/services/ZplTextEditExtension.js'));
    ({ resizeZplDiagonalEndpoint, getZplDiagonalVisibleHeight, getZplDiagonalElementHeight }
        = await import('../src/services/ZplDiagonalLineExtension.js'));
    ({ parseZplFontWidth } = await import('../src/services/ZplParserService.js'));
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

    test('keeps preview ink inside its design box and compensates the emitted origin', async () => {
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
        expect(zplTextOutputOriginCorrection).toBe(3);
        expect(text.style.transform).toBe('translate(0px, 0px) scaleX(1)');
        expect(element.createZpl()).toContain('^FO20,43,0^A0N,30,30');
    });

    test('rotates the emitted text-origin compensation with the field', () => {
        expect(getZplTextOutputOffset('N')).toEqual({ x: 0, y: 3 });
        expect(getZplTextOutputOffset('R')).toEqual({ x: -3, y: 0 });
        expect(getZplTextOutputOffset('I')).toEqual({ x: 0, y: -3 });
        expect(getZplTextOutputOffset('B')).toEqual({ x: 3, y: 0 });
    });

    test('keeps omitted font width automatic and corrects large Font 0 preview origins', async () => {
        expect(parseZplFontWidth(undefined)).toBe(0);
        expect(parseZplFontWidth('')).toBe(0);
        expect(parseZplFontWidth('18')).toBe(18);

        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'CA');
        element.setAttribute('font-name', '0');
        element.setAttribute('font-height', '190');
        element.setAttribute('font-width', '0');
        document.body.appendChild(element);
        await flushReady();

        const text = element.shadowRoot!.querySelector('#text-div') as HTMLElement;
        expect(text.style.transform).toBe('translate(0px, -16px) scaleX(1)');
        expect(element.createZpl()).toContain('^A0N,190,0');
    });

    test('measures scalable Font 0 even when browser layout reports zero width', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'John Doe');
        element.setAttribute('font-name', '0');
        element.setAttribute('font-height', '30');
        element.setAttribute('font-width', '0');
        document.body.appendChild(element);
        await flushReady();

        expect((element.shadowRoot!.querySelector('#text-div') as HTMLElement).scrollWidth).toBe(0);
        expect(parseFloat(element.style.width)).toBeGreaterThan(100);
    });

    test('supports caret-based plain-text editing for ZPL text', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'John Doe');
        element.setAttribute('font-name', '0');
        element.setAttribute('font-height', '30');
        document.body.appendChild(element);
        await flushReady();

        element.beginInlineEdit();
        expect(element.inlineEditElement.getAttribute('contenteditable')).toBe('plaintext-only');
        expect(element.inlineEditElement.style.cursor).toBe('text');
        element.inlineEditElement.textContent = 'Jane Doe';
        element.refreshInlineEditBounds();
        expect(element.inlineEditContent).toBe('Jane Doe');
        expect(parseFloat(element.style.width)).toBeGreaterThan(100);

        element.finishInlineEdit();
        expect(element.inlineEditElement.hasAttribute('contenteditable')).toBe(false);
        // The extension owns persistence; finishing the raw widget restores
        // the current attribute value.
        expect(element.inlineEditElement.textContent).toBe('John Doe');

        const provider = new ZplTextEditExtensionProvider();
        const designItem = { element } as any;
        expect(provider.shouldExtend({} as any, { readOnly: false } as any, designItem)).toBe(true);
        expect(provider.shouldExtend({} as any, { readOnly: true } as any, designItem)).toBe(false);
    });

    test('emits QR origins so visible printer ink matches the designer position', () => {
        const element = document.createElement('zpl-barcode') as InstanceType<typeof ZplBarcode>;
        element.setAttribute('type', 'qrcode');
        // Invalid preview content avoids requiring a jsdom canvas; origin
        // emission itself is independent of field validation.
        element.setAttribute('content', '');
        element.setAttribute('magnification', '4');
        element.style.left = '400px';
        element.style.top = '100px';

        element.setAttribute('rotation', 'N');
        expect(element.createZpl()).toContain('^FO400,90,0^BQN,2,4');
        element.setAttribute('rotation', 'B');
        expect(element.createZpl()).toContain('^FO390,100,0^BQB,2,4');
    });

    test('reverse graphic boxes use knockout compositing and emit field reverse', async () => {
        const element = document.createElement('zpl-graphic-box') as InstanceType<typeof ZplGraphicBox>;
        element.style.left = '75px';
        element.style.top = '75px';
        element.style.width = '100px';
        element.style.height = '100px';
        element.setAttribute('stroke-width', '100');
        element.setAttribute('stroke-color', 'black');
        element.setAttribute('corner-rounding', '0');
        document.body.appendChild(element);
        await flushReady();

        expect(element.style.mixBlendMode).toBe('');
        element.setAttribute('reverse', '');
        expect(element.style.mixBlendMode).toBe('difference');
        expect(element.shadowRoot!.querySelector('rect')!.getAttribute('stroke')).toBe('white');
        expect(element.createZpl()).toBe('^FO75,75,0^FR^GB100,100,100,B,0^FS');

        element.removeAttribute('reverse');
        expect(element.style.mixBlendMode).toBe('');
        expect(element.createZpl()).not.toContain('^FR');
    });

    test('filled graphic boxes render solid and emit a valid ZPL fill thickness', async () => {
        const element = document.createElement('zpl-graphic-box') as InstanceType<typeof ZplGraphicBox>;
        element.style.width = '100px';
        element.style.height = '60px';
        element.setAttribute('stroke-width', '5');
        element.setAttribute('stroke-color', 'black');
        element.setAttribute('corner-rounding', '0');
        document.body.appendChild(element);
        await flushReady();

        let rect = element.shadowRoot!.querySelector('rect')!;
        expect(rect.getAttribute('fill')).toBe('none');
        expect(rect.getAttribute('stroke')).toBe('black');
        expect(element.createZpl()).toContain('^GB100,60,5,B,0');

        element.setAttribute('filled', '');
        rect = element.shadowRoot!.querySelector('rect')!;
        expect(rect.getAttribute('fill')).toBe('black');
        expect(rect.getAttribute('stroke')).toBe('none');
        expect(element.createZpl()).toContain('^GB100,60,60,B,0');

        element.style.width = '30px';
        expect(element.createZpl()).toContain('^GB30,60,30,B,0');

        element.setAttribute('reverse', '');
        rect = element.shadowRoot!.querySelector('rect')!;
        expect(rect.getAttribute('fill')).toBe('white');
        expect(element.style.mixBlendMode).toBe('difference');
    });

    test('renders and preserves thin horizontal ^GB graphic lines', async () => {
        const element = document.createElement('zpl-graphic-box') as InstanceType<typeof ZplGraphicBox>;
        element.style.left = '50px';
        element.style.top = '250px';
        element.style.width = '700px';
        element.style.height = '3px';
        element.setAttribute('stroke-width', '3');
        element.setAttribute('stroke-color', 'black');
        element.setAttribute('corner-rounding', '0');
        element.setAttribute('filled', '');
        document.body.appendChild(element);
        await flushReady();

        const rect = element.shadowRoot!.querySelector('rect')!;
        expect(rect.getAttribute('fill')).toBe('black');
        expect((element.shadowRoot!.querySelector('#box-div') as HTMLElement).style.backgroundColor).toBe('black');
        expect(rect.getAttribute('width')).toBe('700');
        expect(rect.getAttribute('height')).toBe('3');
        expect(element.createZpl()).toBe('^FO50,250,0^GB700,3,3,B,0^FS');
    });

    test('renders overlapping ^GB strokes as a solid rule without changing their thickness', async () => {
        const element = document.createElement('zpl-graphic-box') as InstanceType<typeof ZplGraphicBox>;
        element.style.left = '199px';
        element.style.top = '324px';
        element.style.width = '300px';
        element.style.height = '7px';
        element.setAttribute('stroke-width', '5');
        element.setAttribute('stroke-color', 'black');
        element.setAttribute('corner-rounding', '0');
        document.body.appendChild(element);
        await flushReady();

        const box = element.shadowRoot!.querySelector('#box-div') as HTMLElement;
        const svg = element.shadowRoot!.querySelector('svg') as SVGElement;
        const rect = element.shadowRoot!.querySelector('rect')!;
        expect(element.hasAttribute('filled')).toBe(false);
        expect(box.style.backgroundColor).toBe('black');
        expect(svg.style.display).toBe('block');
        expect(rect.getAttribute('height')).toBe('2');
        expect(element.createZpl()).toBe('^FO199,324,0^GB300,7,5,B,0^FS');
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

    test('proportional resize preserves automatic device-font width', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'Resize');
        element.setAttribute('font-name', 'A');
        element.setAttribute('font-height', '30');
        element.setAttribute('font-width', '0');
        document.body.appendChild(element);
        await flushReady();
        element.getBoundingClientRect = () => ({ width: 100, height: 30 } as DOMRect);
        const designItem = { element, getAttribute: (name: string) => element.getAttribute(name),
            setAttribute: (name: string, value: string) => element.setAttribute(name, value) } as any;
        const strategy = new ZplElementResizeStrategy();
        const initial = { designItem, handle: 'se-resize', initialSize: { width: 100, height: 30 }, currentSize: { width: 100, height: 30 } } as any;
        const state = strategy.begin(initial);

        strategy.preview({ ...initial, currentSize: { width: 200, height: 60 } }, state);
        // Font A starts at 3x for height 30. Doubling its visible size means
        // 6x, whose canonical device-cell height is 54 dots.
        expect(element.getAttribute('font-height')).toBe('54');
        expect(element.getAttribute('font-width')).toBe('0');

        strategy.preview({ ...initial, currentSize: { width: 200, height: 30 } }, state);
        expect(element.getAttribute('font-height')).toBe('30');
        expect(element.getAttribute('font-width')).toBe('30');
    });

    test('Font A automatic width does not jump on the first small resize', async () => {
        const element = document.createElement('zpl-text') as InstanceType<typeof ZplText>;
        element.setAttribute('content', 'John Doe');
        element.setAttribute('font-name', 'A');
        element.setAttribute('font-height', '30');
        element.setAttribute('font-width', '0');
        document.body.appendChild(element);
        await flushReady();

        // Device-font bounds do not depend on browser layout. This also covers
        // parsing while the designer is hidden or entering split view, where
        // jsdom-like scrollWidth is zero.
        const initialSize = {
            width: parseFloat(element.style.width),
            height: parseFloat(element.style.height)
        };
        expect(initialSize.width).toBeGreaterThan(140);
        expect(initialSize.height).toBeGreaterThan(30);
        const designItem = {
            element,
            getAttribute: (name: string) => element.getAttribute(name),
            setAttribute: (name: string, value: string) => element.setAttribute(name, value)
        } as any;
        const strategy = new ZplElementResizeStrategy();
        const initial = { designItem, handle: 'se-resize', initialSize, currentSize: initialSize } as any;
        const state = strategy.begin(initial);

        const originalStyle = { width: element.style.width, height: element.style.height };
        // Mirror the generic resize extension's temporary pre-strategy box.
        element.style.width = `${initialSize.width + 2}px`;
        element.style.height = `${initialSize.height + 2}px`;
        strategy.preview({ ...initial, currentSize: { width: initialSize.width + 2, height: initialSize.height + 2 } }, state);
        expect(element.getAttribute('font-height')).toBe('30');
        expect(element.getAttribute('font-width')).toBe('0');
        expect({ width: element.style.width, height: element.style.height }).toEqual(originalStyle);

        strategy.preview({ ...initial, currentSize: { width: initialSize.width, height: initialSize.height * 1.2 } }, state);
        expect(element.getAttribute('font-height')).toBe('36');
        expect(element.getAttribute('font-width')).toBe('15');
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

    test('circle uses resize edge points and diagonal delegates to its endpoint extension', async () => {
        const circle = document.createElement('zpl-graphic-circle') as HTMLElement;
        const diagonal = document.createElement('zpl-graphic-diagonal-line') as HTMLElement;
        diagonal.setAttribute('orientation', 'R');
        const strategy = new ZplGraphicResizeStrategy();
        const item = (element: HTMLElement) => ({ element, getAttribute: (name: string) => element.getAttribute(name) }) as any;

        expect(strategy.getEnabledHandles(item(circle))).toEqual(['n-resize', 'w-resize', 's-resize', 'e-resize']);
        expect(strategy.getEnabledHandles(item(diagonal))).toEqual([]);

        const selection = new ZplSelectionExtensionProvider();
        expect(selection.shouldExtend({} as any, {} as any, item(circle))).toBe(false);
        expect(selection.shouldExtend({} as any, {} as any, item(diagonal))).toBe(false);
    });

    test('graphic resize commits the visual size through the design item', () => {
        const circle = document.createElement('zpl-graphic-circle') as HTMLElement;
        circle.style.width = '80px';
        circle.style.height = '60px';
        const committed: Record<string, string> = {};
        const designItem = {
            element: circle,
            getAttribute: (name: string) => circle.getAttribute(name),
            setStyle: (name: string, value: string) => { committed[name] = value; circle.style.setProperty(name, value); }
        } as any;
        const strategy = new ZplGraphicResizeStrategy();
        const context = { designItem, handle: 'se-resize', initialSize: { width: 40, height: 30 }, currentSize: { width: 80, height: 60 } } as any;
        const state = strategy.begin(context);
        strategy.commit(context, state);
        expect(committed).toEqual({ width: '80px', height: '60px' });
    });

    test('diagonal endpoint editing keeps the opposite endpoint immutable through crossings', () => {
        const original = { first: { x: 100, y: 200 }, second: { x: 180, y: 260 } };

        const above = resizeZplDiagonalEndpoint(original, 1, { x: 0, y: -100 }, 'L');
        expect(above).toEqual({
            endpoints: { first: { x: 100, y: 200 }, second: { x: 180, y: 160 } },
            left: 100, top: 160, width: 80, height: 40, orientation: 'R'
        });

        const fartherAbove = resizeZplDiagonalEndpoint(original, 1, { x: 0, y: -150 }, 'L');
        expect(fartherAbove.endpoints.first).toEqual(original.first);
        expect(fartherAbove.endpoints.second).toEqual({ x: 180, y: 110 });
        expect(fartherAbove).toMatchObject({ left: 100, top: 110, width: 80, height: 90, orientation: 'R' });
    });

    test('diagonal endpoint editing behaves symmetrically for either endpoint and both axes', () => {
        const original = { first: { x: 100, y: 200 }, second: { x: 180, y: 260 } };
        const crossedBoth = resizeZplDiagonalEndpoint(original, 0, { x: 120, y: 100 }, 'L');

        expect(crossedBoth.endpoints.second).toEqual(original.second);
        expect(crossedBoth.endpoints.first).toEqual({ x: 220, y: 300 });
        expect(crossedBoth).toMatchObject({ left: 180, top: 260, width: 40, height: 40, orientation: 'L' });
    });

    test('diagonal endpoint geometry accounts for the inset lower SVG endpoint', () => {
        expect(getZplDiagonalVisibleHeight(160, 10)).toBe(150);
        expect(getZplDiagonalElementHeight(150, 10)).toBe(160);
    });
});
