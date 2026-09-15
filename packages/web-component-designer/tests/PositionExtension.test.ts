/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals';
import { PositionExtension } from '../src/elements/widgets/designerView/extensions/PositionExtension';

function setup(options: { allowDocking?: boolean } = {}) {
  const container = document.createElement('div');
  container.style.cssText = 'width:400px;height:300px';
  const parent = document.createElement('div');
  const element = document.createElement('button');
  container.append(parent);
  parent.append(element);
  document.body.replaceChildren(container);
  Object.defineProperties(container, { offsetWidth: { value: 400 }, offsetHeight: { value: 300 } });
  Object.defineProperty(element, 'offsetParent', { value: container });
  element.style.cssText = 'position:absolute;left:40px;top:30px;width:100px;height:50px';
  const resolved: Record<string, string> = { left: '40px', right: '260px', top: '30px', bottom: '220px', width: '100px', height: '50px' };
  const specified: Record<string, string> = { left: '40px', right: 'auto', top: '30px', bottom: 'auto', width: '100px', height: '50px', 'margin-left': '0px', 'margin-right': '0px', 'margin-top': '0px', 'margin-bottom': '0px' };
  element.computedStyleMap = (() => ({ get: (name: string) => ({ toString: () => specified[name] ?? 'auto' }) })) as any;
  element.getBoxQuads = jest.fn(() => [{ p1: { x: 40, y: 30 }, p2: { x: 140, y: 30 }, p3: { x: 140, y: 80 }, p4: { x: 40, y: 80 } }]) as any;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.append(svg);
  const draw = (tag: string, attributes: Record<string, any>, existing?: SVGElement) => {
    const node = existing ?? document.createElementNS(svg.namespaceURI, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, '' + value);
    if (!existing) svg.append(node);
    return node;
  };
  const overlayLayer = {
    drawLine: (_source, x1, y1, x2, y2, className, line) => draw('line', { x1, y1, x2, y2, class: className }, line),
    drawGroup: (_source, className, group) => draw('g', { class: className }, group),
    drawTextWithBackground: (_source, text, x, y, _color, className, existing) => {
      const nodes = existing ?? [draw('filter', {}), draw('feFlood', {}), draw('text', {}), draw('text', {})];
      for (const node of nodes.slice(2)) {
        draw('text', { x, y, class: className }, node);
        node.textContent = text;
      }
      return nodes;
    },
    removeOverlay: node => node.remove()
  };
  const group = { commit: jest.fn(), abort: jest.fn() };
  const item = {
    element, parent: { element: parent },
    getComputedStyle: () => ({ position: element.style.position, getPropertyValue: (name: string) => resolved[name] ?? '0px' }),
    getStyleFromSheetOrLocal: (name: string) => specified[name],
    setStyle: jest.fn((name: string, value: string) => { specified[name] = value; element.style.setProperty(name, value); }),
    openGroup: jest.fn(() => group)
  };
  // Rotation and skew: local (x,y) -> (500-y, 20+x+y/2).
  const canvas = {
    overlayLayer, scaleFactor: 2, iframes: [],
    canvas: { convertPointFromNode: jest.fn((p: { x: number, y: number }, _container: Element, _options: any) => ({ x: 500 - p.y, y: 20 + p.x + p.y / 2, w: 1 })) },
    ignoreEvent: jest.fn()
  };
  const manager = { refreshAllExtensions: jest.fn() };
  const extension = new PositionExtension(manager as any, canvas as any, item as any, options);
  extension.extend();
  return { extension, element, container, svg, item, group, options, specified, resolved, canvas, manager };
}

test('projects guides from the actual containing block through rotation and skew', () => {
  const { svg, element, container, canvas } = setup();
  expect(element.getBoxQuads).toHaveBeenCalledWith({ relativeTo: container, iframes: [] });
  const lines = svg.querySelectorAll('line');
  expect([...lines].map(line => ['x1', 'y1', 'x2', 'y2'].map(name => Number(line.getAttribute(name)))))
    .toEqual([[445, 47.5, 445, 87.5], [445, 447.5, 445, 187.5], [500, 110, 470, 125], [200, 260, 420, 150]]);
  expect(lines[0].style.strokeDasharray).toBe('none');
  expect(lines[1].style.strokeDasharray).toBe('2');
  expect(lines[0].style.strokeWidth).toBe('0.5');
  expect(canvas.canvas.convertPointFromNode.mock.calls.every(call => call[1] === container)).toBe(true);
  expect([...svg.querySelectorAll('text')].map(n => n.textContent)).toEqual(['40', '40', '260', '260', '30', '30', '220', '220']);
});

test('locks are read-only when disabled in the provider options, even for dispatched clicks', () => {
  const { svg, item } = setup({ allowDocking: false });
  const locks = svg.querySelectorAll<SVGGElement>('g');
  expect([...locks].map(n => n.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true', 'false']);
  expect(locks[1].style.pointerEvents).toBe('none');
  locks[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(item.openGroup).not.toHaveBeenCalled();
});

test('switches either axis in one undo group and refreshes unchanged geometry', () => {
  const { extension, svg, item, group, options, manager } = setup();
  const locks = svg.querySelectorAll<SVGGElement>('g');
  options.allowDocking = true;
  extension.refresh();
  expect(svg.querySelectorAll('g')[0]).toBe(locks[0]);
  expect(locks[1].style.pointerEvents).toBe('all');
  locks[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(item.setStyle.mock.calls).toEqual([['right', '260px'], ['left', 'auto']]);
  expect(group.commit).toHaveBeenCalledTimes(1);
  expect(manager.refreshAllExtensions).toHaveBeenCalledWith([item]);
  extension.refresh();
  expect(locks[0].getAttribute('aria-pressed')).toBe('false');
  expect(locks[1].getAttribute('aria-pressed')).toBe('true');
  locks[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(item.setStyle.mock.calls.slice(2)).toEqual([['bottom', '220px'], ['top', 'auto']]);
  expect(group.commit).toHaveBeenCalledTimes(2);
});

test('clicking a locked side switches to its opposite and freezes stretched dimensions', () => {
  const { extension, svg, item, options, specified } = setup();
  options.allowDocking = true;
  specified.width = 'auto';
  specified.right = '260px';
  extension.refresh();
  svg.querySelector('g').dispatchEvent(new MouseEvent('click'));
  expect(item.setStyle.mock.calls).toEqual([['width', '100px'], ['right', '260px'], ['left', 'auto']]);
});

test('uses stylesheet declarations without Typed OM and hides locks for relative positioning', () => {
  const { extension, element, svg, specified } = setup();
  element.computedStyleMap = undefined;
  specified.left = 'auto';
  specified.right = 'calc(10% + 5px)';
  extension.refresh();
  expect(svg.querySelectorAll('g')[1].getAttribute('aria-pressed')).toBe('true');
  expect([...svg.querySelectorAll('text')].map(n => n.textContent)).toEqual(['40', '40', '260', '260', '30', '30', '220', '220']);
  element.style.position = 'relative';
  extension.refresh();
  expect([...svg.querySelectorAll<SVGGElement>('g')].every(n => n.style.display === 'none')).toBe(true);
  extension.dispose();
  expect(svg.childElementCount).toBe(0);
});


test('switching overconstrained insets uses the actual gap instead of the ignored CSS inset', () => {
  const { extension, svg, item, options, specified, resolved } = setup();
  options.allowDocking = true;
  specified.right = resolved.right = '15px';
  extension.refresh();
  svg.querySelector('g').dispatchEvent(new MouseEvent('click'));
  expect(item.setStyle.mock.calls).toEqual([['right', '260px'], ['left', 'auto']]);
});


test('anchor editing is enabled by default without design context configuration', () => {
  const { svg, item, group } = setup();
  const lock = svg.querySelectorAll<SVGGElement>('g')[1];
  expect(lock.style.pointerEvents).toBe('all');
  lock.dispatchEvent(new MouseEvent('click'));
  expect(item.setStyle.mock.calls).toEqual([['right', '260px'], ['left', 'auto']]);
  expect(group.commit).toHaveBeenCalledTimes(1);
});
