/** @jest-environment jsdom */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';

Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
Object.defineProperty(globalThis, 'ResizeObserver', { value: class { observe() { } disconnect() { } unobserve() { } } });
for (const name of ['SVGPathElement', 'SVGRectElement', 'SVGCircleElement', 'SVGEllipseElement', 'SVGLineElement', 'SVGPolylineElement', 'SVGPolygonElement', 'SVGForeignObjectElement'])
  (globalThis as any)[name] = class extends SVGElement { };
(globalThis as any).MathMLElement ??= class extends Element { };

let CssParserStylesheetService: typeof import('../../web-component-designer-stylesheetservice-css-parser/src/service/stylesheetservice/CssParserStylesheetService').CssParserStylesheetService;
beforeAll(async () => {
  const core = await import('../src/index');
  jest.unstable_mockModule('@node-projects/web-component-designer', () => core);
  ({ CssParserStylesheetService } = await import('../../web-component-designer-stylesheetservice-css-parser/src/service/stylesheetservice/CssParserStylesheetService'));
});
afterEach(() => { document.body.replaceChildren(); jest.restoreAllMocks(); });

async function setup(css: string) {
  const service = new CssParserStylesheetService({ instanceServiceContainer: {} } as any);
  await service.setStylesheets([{ name: 'test', content: css }]);
  const element = document.createElement('div');
  element.className = 'card';
  document.body.appendChild(element);
  const item = { element } as any;
  const values = () => service.getAppliedRules(item).flatMap(rule => rule.declarations.map(d => d.value));
  return { service, element, item, values };
}

test('container conditions use the inspected element and retain the complete named query', async () => {
  const { element, values } = await setup(`
    @container layout (width >= 400px) { .card { color: green; } }
    @container style(--theme: dark) { .card { color: white; } }
    @container (width < 400px) { .other { color: red; } }
  `);
  let wide = true;
  const matchContainer = jest.fn(function (this: Element, query: string) {
    expect(this).toBe(element);
    return { matches: query === 'layout (width >= 400px)' ? wide : query === 'style(--theme: dark)' };
  });
  Object.assign(element, { matchContainer });
  expect(values()).toEqual(['green', 'white']);
  expect(matchContainer).toHaveBeenCalledWith('layout (width >= 400px)');
  expect(matchContainer).toHaveBeenCalledWith('style(--theme: dark)');
  wide = false;
  expect(values()).toEqual(['white']);
});

test('missing container API excludes conditional rules while selector lookup and editing still work', async () => {
  const { service, values } = await setup('.card { color: black; } @container (width > 1px) { .card { color: green; } }');
  expect(values()).toEqual(['black']);
  const rules = service.getRules('.card');
  expect(rules).toHaveLength(2);
  service.updateDeclarationValueWithoutUndo(rules[1].declarations[0] as any, 'blue', true);
  expect(service.getStylesheets()[0].content).toContain('blue !important');
});

test('media and supports use the inspected document and gate nested containers', async () => {
  const { service, element, item } = await setup(`
    @media (min-width: 500px) {
      @supports (display: grid) {
        .card { @container layout (width > 1px) { & { color: green; } } }
      }
    }
  `);
  const frame = document.createElement('iframe');
  document.body.appendChild(frame);
  frame.contentDocument.body.appendChild(element);
  let media = true;
  let supports = true;
  const matchMedia = jest.fn(() => ({ matches: media }));
  const supportsQuery = jest.fn(() => supports);
  Object.defineProperty(frame.contentWindow, 'matchMedia', { value: matchMedia });
  Object.defineProperty(frame.contentWindow, 'CSS', { value: { supports: supportsQuery } });
  const matchContainer = jest.fn(() => ({ matches: true }));
  Object.assign(element, { matchContainer });
  const values = () => service.getAppliedRules(item).flatMap(r => r.declarations.map(d => d.value));
  expect(values()).toEqual(['green']);
  expect(matchMedia).toHaveBeenCalledWith('(min-width: 500px)');
  expect(supportsQuery).toHaveBeenCalledWith('(display: grid)');
  supports = false;
  matchContainer.mockClear();
  expect(values()).toEqual([]);
  expect(matchContainer).not.toHaveBeenCalled();
  media = false;
  supportsQuery.mockClear();
  expect(values()).toEqual([]);
  expect(supportsQuery).not.toHaveBeenCalled();
  expect(service.getRules('.card')).toHaveLength(2);
});

test('all enclosing container conditions must match', async () => {
  const { element, values } = await setup(`
    @container outer (width > 500px) {
      @container inner (width < 300px) { .card { color: green; } }
    }
  `);
  let inner = false;
  Object.assign(element, { matchContainer: (query: string) => ({ matches: query.startsWith('outer') || inner }) });
  expect(values()).toEqual([]);
  inner = true;
  expect(values()).toEqual(['green']);
});

test('rule text includes enclosing at-rules and nested selectors without unrelated siblings', async () => {
  const { service } = await setup(`
    @media (min-width: 500px) {
      @supports (display: grid) {
        @container layout (width >= 400px) {
          .wrapper {
            & .card { color: green !important; }
            & .other { color: red; }
          }
          .unrelated { display: none; }
        }
      }
    }
  `);
  const rule = service.getRules('.wrapper .card')[0];
  expect(rule.cssText).toBe(`@media (min-width: 500px) {
  @supports (display: grid) {
    @container layout (width >= 400px) {
      .wrapper {
        & .card {
          color: green !important;
        }
      }
    }
  }
}`);
  service.updateDeclarationValue(rule.declarations[0], 'blue', false);
  expect(rule.cssText).toContain('color: blue;');
  expect(rule.cssText).not.toContain('!important');
  expect(service.getStylesheets()[0].content).toContain('.unrelated');
});
