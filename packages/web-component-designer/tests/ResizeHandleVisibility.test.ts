/** @jest-environment jsdom */
import { beforeAll, describe, expect, jest, test } from '@jest/globals';

// Geometry editing is unrelated to rendering the resize handles.
jest.unstable_mockModule('../src/elements/helper/LayoutHelper', () => ({ roundValue: Math.round }));

let ResizeExtension: typeof import('../src/elements/widgets/designerView/extensions/ResizeExtension').ResizeExtension;
let GridChildResizeExtension: typeof import('../src/elements/widgets/designerView/extensions/grid/GridChildResizeExtension').GridChildResizeExtension;
beforeAll(async () => {
  ({ ResizeExtension } = await import('../src/elements/widgets/designerView/extensions/ResizeExtension'));
  ({ GridChildResizeExtension } = await import('../src/elements/widgets/designerView/extensions/grid/GridChildResizeExtension'));
});

function setup(kind: string, width: number, height: number, radius = 3, zoom = 1, rotation = 0, strategy?: any) {
  const geometry = { width, height };
  const point = (x: number, y: number) => ({
    x: x * Math.cos(rotation) - y * Math.sin(rotation),
    y: x * Math.sin(rotation) + y * Math.cos(rotation)
  });
  const item = {
    element: { getBoxQuads: () => [{ p1: point(0, 0), p2: point(geometry.width, 0), p3: point(geometry.width, geometry.height), p4: point(0, geometry.height) }] }
  };
  const circles: SVGCircleElement[] = [];
  const canvas = {
    zoomFactor: zoom,
    serviceContainer: { options: { resizerPixelSize: radius }, getLastServiceWhere: () => strategy },
    overlayLayer: {
      drawCircle: (_source: string, _x: number, _y: number, r: number, _className: string, oldCircle?: SVGCircleElement) => {
        const circle = oldCircle ?? document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', String(r));
        if (!oldCircle) circles.push(circle);
        return circle;
      }
    }
  };
  const extension = kind === 'normal'
    ? new ResizeExtension({} as any, canvas as any, item as any, false)
    : new GridChildResizeExtension({} as any, canvas as any, item as any);
  extension.refresh({});
  const visible = () => circles.filter(circle => circle.style.display !== 'none').map(circle => circle.style.cursor).sort();
  return { canvas, geometry, circles, extension, visible };
}

const corners = ['ne-resize', 'nw-resize', 'se-resize', 'sw-resize'];
const allHandles = [...corners, 'n-resize', 's-resize', 'e-resize', 'w-resize'].sort();

describe.each(['normal', 'grid'])('%s resize handles', kind => {
  test.each([
    { width: 2, height: 2, radius: 3, zoom: 1, expected: corners },
    { width: 17, height: 17, radius: 3, zoom: 1, expected: corners },
    { width: 18, height: 18, radius: 3, zoom: 1, expected: allHandles },
    { width: 20, height: 20, radius: 8, zoom: 1, expected: corners },
    { width: 48, height: 48, radius: 8, zoom: 1, expected: allHandles },
    { width: 30, height: 30, radius: 5, zoom: 1, expected: allHandles },
    { width: 18, height: 18, radius: 3, zoom: 0.5, expected: corners },
    { width: 9, height: 9, radius: 3, zoom: 2, expected: allHandles },
    { width: 100, height: 10, radius: 3, zoom: 1, expected: [...corners, 'n-resize', 's-resize'].sort() },
    { width: 10, height: 100, radius: 3, zoom: 1, expected: [...corners, 'e-resize', 'w-resize'].sort() }
  ])('$width x $height, radius $radius, zoom $zoom', ({ width, height, radius, zoom, expected }) => {
    expect(setup(kind, width, height, radius, zoom).visible()).toEqual(expected);
  });

  test('uses edge lengths for rotated elements', () => {
    expect(setup(kind, 20, 20, 3, 1, Math.PI / 4).visible()).toEqual(allHandles);
    expect(setup(kind, 10, 100, 3, 1, Math.PI / 4).visible()).toEqual([...corners, 'e-resize', 'w-resize'].sort());
  });

  test('updates existing handles after size, zoom, or radius changes', () => {
    const { canvas, geometry, extension, circles, visible } = setup(kind, 10, 10);
    const originalCircles = [...circles];
    expect(visible()).toEqual(corners);
    geometry.width = geometry.height = 20;
    extension.refresh({});
    expect(visible()).toEqual(allHandles);
    canvas.serviceContainer.options.resizerPixelSize = 8;
    extension.refresh({});
    expect(visible()).toEqual(corners);
    expect(circles.every(circle => circle.getAttribute('r') === '8')).toBe(true);
    canvas.zoomFactor = 3;
    extension.refresh({});
    expect(visible()).toEqual(allHandles);
    geometry.width = geometry.height = 1;
    extension.refresh({});
    expect(visible()).toEqual(corners);
    expect(circles).toEqual(originalCircles);
  });

  test('keeps the active midpoint visible while shrinking, then hides it after the drag', () => {
    const { geometry, extension, visible } = setup(kind, 100, 100);
    (extension as any)._initialPoint = { x: 0, y: 0 };
    (extension as any)._actionModeStarted = 'n-resize';
    geometry.width = geometry.height = 10;
    extension.refresh({});
    expect(visible()).toEqual([...corners, 'n-resize'].sort());
    (extension as any)._initialPoint = null;
    extension.refresh({});
    expect(visible()).toEqual(corners);
  });
});

test('does not enable handles disabled by the resize strategy', () => {
  const strategy = { getEnabledHandles: () => ['nw-resize', 'se-resize', 'e-resize'] };
  const { geometry, extension, visible } = setup('normal', 10, 10, 3, 1, 0, strategy);
  expect(visible()).toEqual(['nw-resize', 'se-resize']);
  geometry.width = geometry.height = 100;
  extension.refresh({});
  expect(visible()).toEqual(['e-resize', 'nw-resize', 'se-resize']);
});

test('keeps edge handles available when the strategy does not allow corner resizing', () => {
  const edges = ['e-resize', 'n-resize', 's-resize', 'w-resize'];
  const strategy = { getEnabledHandles: () => edges };
  expect(setup('normal', 2, 2, 3, 1, 0, strategy).visible()).toEqual(edges);
});
