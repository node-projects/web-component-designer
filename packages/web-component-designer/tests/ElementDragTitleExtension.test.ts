/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from '@jest/globals';
import { ElementDragTitleExtension } from '../src/elements/widgets/designerView/extensions/ElementDragTitleExtension';
import { NamedTools } from '../src/elements/widgets/designerView/tools/NamedTools';

afterEach(() => jest.restoreAllMocks());

function setup(mirrorX = 1, mirrorY = 1, rotation = 0, scale = 1) {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ measureText: () => ({ width: 36 }) } as any);
  const element = document.createElement('button');
  element.style.cssText = `transform:matrix(${mirrorX},0,0,${mirrorY},0,0);width:136px;height:60px;position:absolute;left:254px;top:262px`;
  const point = (x: number, y: number) => ({
    x: 322 + mirrorX * x * Math.cos(rotation) - mirrorY * y * Math.sin(rotation),
    y: 292 + mirrorX * x * Math.sin(rotation) + mirrorY * y * Math.cos(rotation)
  });
  const quad = { p1: point(-68, -30), p2: point(68, -30), p3: point(68, 30), p4: point(-68, 30) };
  element.getBoxQuads = (() => [quad]) as any;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const draw = (tag: string, x: number, y: number, width: number, height: number, className: string) => {
    const node = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, value] of Object.entries({ x, y, width, height, class: className })) node.setAttribute(key, String(value));
    svg.append(node);
    return node;
  };
  const pointerEventHandler = jest.fn();
  const item = { element, name: 'button' };
  const canvas = {
    canvas: document.createElement('div'), scaleFactor: scale,
    serviceContainer: { designerTools: new Map([[NamedTools.Pointer, { pointerEventHandler }]]) },
    overlayLayer: {
      drawRect: (_source, ...args) => draw('rect', ...args as [number, number, number, number, string]),
      drawHTML: (_source, html, ...args) => {
        const node = draw('foreignObject', ...args as [number, number, number, number, string]);
        node.innerHTML = html;
        return node;
      },
      removeOverlay: node => node.remove()
    }
  };
  const extension = new ElementDragTitleExtension({} as any, canvas as any, item as any);
  extension.extend({});
  return { extension, svg, quad, canvas, element, pointerEventHandler };
}

test.each([
  { mirrorX: 1, mirrorY: 1, rotation: 0, x: 254, y: 262, angle: 0 },
  { mirrorX: -1, mirrorY: 1, rotation: 0, x: 254, y: 262, angle: 0 },
  { mirrorX: 1, mirrorY: -1, rotation: 0, x: 390, y: 322, angle: 180 },
  { mirrorX: -1, mirrorY: -1, rotation: 0, x: 390, y: 322, angle: 180 },
  { mirrorX: -1, mirrorY: 1, rotation: Math.PI / 2, x: 352, y: 224, angle: 90 }
])('aligns title and hit area outside the top edge: $mirrorX, $mirrorY, $rotation', ({ mirrorX, mirrorY, rotation, x, y, angle }) => {
  const { svg } = setup(mirrorX, mirrorY, rotation);
  for (const node of svg.children) {
    expect(node.getAttribute('x')).toBe('0');
    expect(node.getAttribute('y')).toBe('0');
    expect(node.getAttribute('transform')).toBe(`translate(${x} ${y}) rotate(${angle}) translate(0 -16)`);
    expect(node.getAttribute('width')).toBe('60');
  }
  expect((svg.querySelector('span') as HTMLElement).style.rotate).toBe('');
});

test('refreshes the same overlays when reflection and zoom change', () => {
  const { extension, svg, quad, canvas } = setup();
  const overlays = [...svg.children];
  [quad.p1, quad.p2] = [quad.p2, quad.p1];
  [quad.p3, quad.p4] = [quad.p4, quad.p3];
  canvas.scaleFactor = 2;
  extension.refresh({});
  expect([...svg.children]).toEqual(overlays);
  for (const node of overlays) {
    expect(node.getAttribute('transform')).toBe('translate(254 262) rotate(0) translate(0 -8)');
    expect(node.getAttribute('width')).toBe('30');
  }
  expect(overlays.map(n => n.getAttribute('height'))).toEqual(['7.5', '9', '7.5']);
  extension.dispose();
  expect(svg.childElementCount).toBe(0);
});

test('forwards drag events from the mirrored title to the pointer tool', () => {
  const { svg, canvas, element, pointerEventHandler } = setup(-1);
  const hitArea = svg.querySelectorAll('rect')[1];
  for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 });
    hitArea.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(pointerEventHandler).toHaveBeenLastCalledWith(canvas, event, element);
  }
  expect(pointerEventHandler).toHaveBeenCalledTimes(3);
});
