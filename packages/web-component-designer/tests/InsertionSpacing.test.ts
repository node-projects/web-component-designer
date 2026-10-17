/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals';

CSSStyleSheet.prototype.replaceSync = function () { };
for (const name of ['SVGPathElement', 'SVGRectElement', 'SVGCircleElement', 'SVGEllipseElement', 'SVGLineElement', 'SVGPolylineElement', 'SVGPolygonElement'])
  (globalThis as any)[name] = class { };
const { DragDropService } = await import('../src/elements/services/dragDropService/DragDropService.js');
const { DrawElementTool } = await import('../src/elements/widgets/designerView/tools/DrawElementTool.js');

function setup() {
  const element = document.createElement('button');
  element.style.width = '20px';
  element.getBoundingClientRect = () => ({ x: 0, y: 0, width: 40, height: 40 }) as DOMRect;
  const container = {
    element: document.body, usableContainer: document.body,
    getComputedStyle: () => ({ display: 'block' })
  };
  const canvas = {
    alignOnSnap: true, alignOnGrid: false, scaleFactor: 2,
    getNormalizedEventCoordinates: () => ({ x: 159, y: 10 }),
    getNormalizedElementCoordinates: () => ({ x: 50, y: 10 }),
    snapLines: {
      clearSnaplines: jest.fn(), calculateSnaplines: jest.fn(),
      snapToPosition: jest.fn(() => ({ x: 160, y: null }))
    },
    overlayLayer: { addOverlay: jest.fn(), removeOverlay: jest.fn(), removeAllNodesWithClass: jest.fn() },
    serviceContainer: { globalContext: { finishedWithTool: jest.fn() } }
  };
  const item = {
    element, parent: container,
    setStyle: jest.fn(),
    serviceContainer: { options: { roundPixelsToDecimalPlaces: 2 } },
    instanceServiceContainer: { designerCanvas: canvas }
  };
  return { canvas, item, container };
}

test('palette insertion measures in the target container and snaps in canvas units with the mouse offset', () => {
  const { canvas, item, container } = setup();
  const snap = (DragDropService.prototype as any).snapPaletteItem;
  const originalStyle = item.element.style.cssText;
  expect(snap(canvas, {}, container, item, { x: 5, y: 3 })).toEqual({ x: 165, y: 10 });
  expect(canvas.snapLines.calculateSnaplines).toHaveBeenCalledWith([item]);
  expect(canvas.snapLines.snapToPosition).toHaveBeenCalledWith({ x: 154, y: 7 }, { width: 20, height: 20 }, { x: 1, y: 1 });
  expect(item.element.isConnected).toBe(false);
  expect(item.element.style.cssText).toBe(originalStyle);

  document.body.append(item.element);
  expect(snap(canvas, {}, container, item)).toEqual({ x: 160, y: 10 });
  expect(item.element.isConnected).toBe(true);
  item.element.remove();
});

test('palette insertion bypasses snap guides for grid, flex, disabled snapping and command-key override', () => {
  const snap = (DragDropService.prototype as any).snapPaletteItem;
  for (const mode of ['grid', 'flex', 'disabled', 'command', 'gridAlign']) {
    const { canvas, item, container } = setup();
    if (mode === 'grid' || mode === 'flex') container.getComputedStyle = () => ({ display: mode });
    if (mode === 'disabled') canvas.alignOnSnap = false;
    if (mode === 'gridAlign') canvas.alignOnGrid = true;
    expect(snap(canvas, { ctrlKey: mode === 'command', metaKey: mode === 'command' }, container, item)).toEqual({ x: 159, y: 10 });
    expect(canvas.snapLines.snapToPosition).not.toHaveBeenCalled();
    expect(canvas.snapLines.clearSnaplines).toHaveBeenCalled();
  }
});

test('draw insertion applies snapped coordinates to both the item and its preview and clears guides on completion', async () => {
  const { canvas, item } = setup();
  const tool = new DrawElementTool({ tag: 'button' }) as any;
  tool._createdItem = item;
  tool._startPosition = { x: 139, y: 0 };
  tool._changeGroup = { commit: jest.fn(), abort: jest.fn() };
  await tool._onPointerMove(canvas, {});
  expect(canvas.snapLines.snapToPosition).toHaveBeenCalledWith({ x: 139, y: 0 }, { width: 20, height: 10 }, { x: 1, y: 1 });
  expect(item.setStyle).toHaveBeenCalledWith('left', '110.00px');
  expect(item.setStyle).toHaveBeenCalledWith('top', '-10.00px');
  expect(tool._rect.getAttribute('x')).toBe('160');
  // An aborted insertion must remove its guides too.
  tool.sizeOverlapThreshold = false;
  await tool._onPointerUp(canvas, {});
  expect(canvas.snapLines.clearSnaplines).toHaveBeenCalled();
  expect(canvas.overlayLayer.removeOverlay).toHaveBeenCalled();
});
