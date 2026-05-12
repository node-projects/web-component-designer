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
let interpolateLinePoints: typeof import('../src/elements/helper/PathDataPolyfill').interpolateLinePoints;
const originalGlobals = new Map<SvgElementGlobalName, unknown>();

beforeAll(async () => {
  for (const globalName of svgElementGlobals) {
    originalGlobals.set(globalName, (<any>globalThis)[globalName]);
    (<any>globalThis)[globalName] = class { };
  }

  ({ straightenLine, interpolateLinePoints } = await import('../src/elements/helper/PathDataPolyfill'));
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

test('interpolateLinePoints fills long gaps with evenly spaced points', () => {
  const result = interpolateLinePoints({ x: 0, y: 0 }, { x: 12, y: 0 }, 5);

  expect(result).toHaveLength(3);
  expect(result[0].x).toBeCloseTo(4);
  expect(result[0].y).toBeCloseTo(0);
  expect(result[1].x).toBeCloseTo(8);
  expect(result[1].y).toBeCloseTo(0);
  expect(result[2].x).toBeCloseTo(12);
  expect(result[2].y).toBeCloseTo(0);
});

test('interpolateLinePoints does not duplicate identical points', () => {
  const result = interpolateLinePoints({ x: 3, y: 4 }, { x: 3, y: 4 }, 5);

  expect(result).toEqual([]);
});
