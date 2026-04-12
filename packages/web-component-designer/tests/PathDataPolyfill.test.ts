import { afterAll, beforeAll, expect, test } from '@jest/globals';

const svgElementGlobals = [
  'SVGPathElement',
  'SVGRectElement',
  'SVGCircleElement',
  'SVGEllipseElement',
  'SVGLineElement',
  'SVGPolylineElement',
  'SVGPolygonElement'
] as const;

type SvgElementGlobalName = (typeof svgElementGlobals)[number];

let straightenLine: typeof import('../src/elements/helper/PathDataPolyfill').straightenLine;
const originalGlobals = new Map<SvgElementGlobalName, unknown>();

beforeAll(async () => {
  for (const globalName of svgElementGlobals) {
    originalGlobals.set(globalName, (<any>globalThis)[globalName]);
    (<any>globalThis)[globalName] = class { };
  }

  ({ straightenLine } = await import('../src/elements/helper/PathDataPolyfill'));
});

afterAll(() => {
  for (const globalName of svgElementGlobals) {
    const originalGlobal = originalGlobals.get(globalName);
    if (originalGlobal === undefined)
      delete (<any>globalThis)[globalName];
    else
      (<any>globalThis)[globalName] = originalGlobal;
  }
});

test('straightenLine keeps upward vertical snap upward', () => {
  const result = straightenLine({ x: 10, y: 10 }, { x: 10, y: 0 }, 90);

  expect(result.x).toBeCloseTo(10);
  expect(result.y).toBeCloseTo(0);
});

test('straightenLine keeps downward vertical snap downward', () => {
  const result = straightenLine({ x: 10, y: 10 }, { x: 10, y: 25 }, 90);

  expect(result.x).toBeCloseTo(10);
  expect(result.y).toBeCloseTo(25);
});