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

let transformOffsetByInverseLinearMatrix: typeof import('../src/elements/helper/LayoutHelper').transformOffsetByInverseLinearMatrix;
const originalGlobals = new Map<SvgElementGlobalName, unknown>();

beforeAll(async () => {
  for (const globalName of svgElementGlobals) {
    originalGlobals.set(globalName, (<any>globalThis)[globalName]);
    (<any>globalThis)[globalName] = class { };
  }

  ({ transformOffsetByInverseLinearMatrix } = await import('../src/elements/helper/LayoutHelper'));
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

test('maps visual svg placement offset through inverse rotation', () => {
  const result = transformOffsetByInverseLinearMatrix(
    { x: 10, y: 0 },
    { a: 0, b: 1, c: -1, d: 0 }
  );

  expect(result.x).toBeCloseTo(0);
  expect(result.y).toBeCloseTo(-10);
});

test('maps visual svg placement offset through inverse scale and skew', () => {
  const result = transformOffsetByInverseLinearMatrix(
    { x: 14, y: 10 },
    { a: 2, b: 0, c: 1, d: 4 }
  );

  expect(result.x).toBeCloseTo(5.75);
  expect(result.y).toBeCloseTo(2.5);
});

test('keeps svg placement offset unchanged for non-invertible transforms', () => {
  const result = transformOffsetByInverseLinearMatrix(
    { x: 14, y: 10 },
    { a: 0, b: 0, c: 0, d: 0 }
  );

  expect(result).toEqual({ x: 14, y: 10 });
});
