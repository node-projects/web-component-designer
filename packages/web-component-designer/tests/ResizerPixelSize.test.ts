/** @jest-environment jsdom */
import { afterAll, afterEach, beforeAll, expect, jest, test } from '@jest/globals';

const originalCSSStyleSheet = globalThis.CSSStyleSheet;
Object.defineProperty(globalThis, 'CSSStyleSheet', {
  configurable: true,
  value: class { replaceSync() {} }
});
afterAll(() => {
  Object.defineProperty(globalThis, 'CSSStyleSheet', { configurable: true, value: originalCSSStyleSheet });
});

// These widgets register custom elements when imported; keep module isolation
// focused on ServiceContainer's pointer-dependent defaults.
jest.unstable_mockModule('../src/elements/widgets/demoView/demoView', () => ({ DemoView: class {} }));
jest.unstable_mockModule('../src/elements/widgets/codeView/code-view-simple', () => ({ CodeViewSimple: class {} }));
jest.unstable_mockModule('../src/elements/helper/LayoutHelper', () => ({ roundValue: Math.round }));

beforeAll(async () => {
  // Reuse the dependency so isolated imports do not register its elements again.
  const baseComponents = await import('@node-projects/base-custom-webcomponent');
  jest.unstable_mockModule('@node-projects/base-custom-webcomponent', () => baseComponents);
});

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
const originalMaxTouchPoints = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');

afterEach(() => {
  if (originalMatchMedia)
    Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  else
    delete window.matchMedia;
  if (originalMaxTouchPoints)
    Object.defineProperty(navigator, 'maxTouchPoints', originalMaxTouchPoints);
  else
    Reflect.deleteProperty(navigator, 'maxTouchPoints');
});

test.each([
  { device: 'desktop mouse/trackpad', coarse: false, maxTouchPoints: 0, override: undefined, radius: 3 },
  { device: 'fine primary pointer with touch support', coarse: false, maxTouchPoints: 10, override: undefined, radius: 3 },
  { device: 'coarse primary pointer', coarse: true, maxTouchPoints: 10, override: undefined, radius: 8 },
  { device: 'fine primary pointer with explicit size', coarse: false, maxTouchPoints: 10, override: 5, radius: 5 },
  { device: 'coarse primary pointer with explicit size', coarse: true, maxTouchPoints: 10, override: 5, radius: 5 }
])('$device uses radius $radius and preserves zoom scaling', async ({ coarse, maxTouchPoints, override, radius }) => {
  const matchMedia = jest.fn((query: string) => ({ matches: query === '(pointer: coarse)' && coarse }));
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: maxTouchPoints });

  await jest.isolateModulesAsync(async () => {
    const { ServiceContainer } = await import('../src/elements/services/ServiceContainer');
    const { ResizeExtension } = await import('../src/elements/widgets/designerView/extensions/ResizeExtension');
    const { GridChildResizeExtension } = await import('../src/elements/widgets/designerView/extensions/grid/GridChildResizeExtension');
    const serviceContainer = new ServiceContainer();
    if (override !== undefined)
      serviceContainer.options.resizerPixelSize = override;
    expect(serviceContainer.options.resizerPixelSize).toBe(radius);
    expect(matchMedia).toHaveBeenCalledWith('(pointer: coarse)');

    const drawCircle = jest.fn((_source: string, _x: number, _y: number, _radius: number) =>
      document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
    const canvas = { serviceContainer, zoomFactor: 1, overlayLayer: { drawCircle } };
    const extensions = [
      new ResizeExtension({} as any, canvas as any, {} as any, false),
      new GridChildResizeExtension({} as any, canvas as any, {} as any)
    ];
    for (const extension of extensions) {
      for (const zoom of [0.5, 1, 2]) {
        canvas.zoomFactor = zoom;
        extension._drawResizerOverlay(10, 20, 'se-resize');
        expect(drawCircle.mock.calls.at(-1)[3]).toBe(radius / zoom);
        expect(serviceContainer.options.resizerPixelSize).toBe(radius);
      }
    }
  });
});
