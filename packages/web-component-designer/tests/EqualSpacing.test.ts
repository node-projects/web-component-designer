/** @jest-environment jsdom */
import { expect, test } from '@jest/globals';
import { createEqualSpacingSnapper, getEqualSpacingSnap } from '../src/elements/helper/EqualSpacingHelper.js';
import { Snaplines } from '../src/elements/widgets/designerView/Snaplines.js';
import { DefaultTranslationService } from '../src/elements/services/translationService/DefaultTranslationService.js';

const rect = (x: number, y = 0, width = 40, height = 20) => ({ x, y, width, height });
const transpose = (r: ReturnType<typeof rect>) => ({ x: r.y, y: r.x, width: r.height, height: r.width });

test.each([true, false])('snaps to equal gaps between and outside unequal sized neighbours (horizontal=%s)', horizontal => {
  const convert = horizontal ? (r: ReturnType<typeof rect>) => r : transpose;
  const neighbours = [rect(100), rect(200, 0, 60)].map(convert);
  for (const [position, expected, gaps] of [
    [159, 160, [[140, 160], [180, 200]]],
    [22, 20, [[40, 100], [140, 200]]],
    [318, 320, [[140, 200], [260, 320]]]
  ] as [number, number, number[][]][]) {
    const snap = getEqualSpacingSnap(convert(rect(position, 0, 20)), neighbours, horizontal, 5);
    expect(snap?.position).toBe(expected);
    expect(snap?.gaps).toEqual(gaps);
  }
});

test('requires nearby, non-overlapping neighbours in the same row', () => {
  expect(getEqualSpacingSnap(rect(170, 0, 20), [rect(100), rect(200)], true, 5)).toBeUndefined();
  expect(getEqualSpacingSnap(rect(160, 50, 20), [rect(100), rect(200)], true, 5)).toBeUndefined();
  expect(getEqualSpacingSnap(rect(135, 0, 20), [rect(100), rect(120)], true, 5)).toBeUndefined();
  expect(getEqualSpacingSnap(rect(160, 0, 80), [rect(100), rect(200)], true, 5)).toBeUndefined();
  expect(getEqualSpacingSnap(rect(320, 0, 20), [rect(100), rect(200, 0, 60), rect(290)], true, 5)).toBeUndefined();
});

test('enclosing container bounds do not mask the spacing between children', () => {
  expect(getEqualSpacingSnap(rect(159, 0, 20), [rect(0, 0, 500, 100), rect(100), rect(200)], true, 5)?.position).toBe(160);
});

test('prepared targets retain row, column and obstruction behavior across pointer updates', () => {
  const neighbours = [rect(0, 0, 500, 100), rect(100), rect(200, 0, 60), rect(290), rect(100, 60), rect(200, 60)];
  const prepared = createEqualSpacingSnapper(neighbours);
  expect(prepared(rect(159, 0, 20), true, 5)?.position).toBe(160);
  expect(prepared(rect(320, 0, 20), true, 5)).toBeUndefined();
  expect(prepared(rect(159, 60, 20), true, 5)?.position).toBe(160);
  expect(prepared(rect(100, 29, 40, 20), false, 5)?.position).toBe(30);
  expect(prepared(rect(100, 200), false, 5)).toBeUndefined();
  expect(prepared(rect(Number.NaN), true, 5)).toBeUndefined();
});

test('spacing guides use canvas units, retain closer alignment and clear after dragging away', () => {
  const overlays: Element[] = [];
  const snaplines = new Snaplines({
    addOverlay: (_source: string, element: Element) => overlays.push(element),
    removeAllNodesWithClass: () => { overlays.length = 0; }
  } as any);
  const a = rect(150, 70);
  const b = rect(250, 70, 60);
  snaplines.initialize({ instanceServiceContainer: { designerCanvas: { scaleFactor: 1 } }, serviceContainer: { translationService: new DefaultTranslationService(), snaplinesProviderService: { provideSnaplines: () => ({
    outerRect: { x: 50, y: 70 },
    positionsH: [[100, a], [140, a], [200, b], [260, b]],
    positionsMiddleH: [[120, a], [230, b]],
    positionsV: [[0, a], [20, a]], positionsMiddleV: [[10, a]]
  }) } } } as any);
  snaplines.calculateSnaplines([]);
  expect(snaplines.snapToPosition(rect(159), { width: 20, height: 20 }, { x: 1, y: 1 }).x).toBe(160);
  expect(overlays.filter(x => x.matches('.svg-spacing-guide')).map(x => x.querySelector('path')?.getAttribute('d'))).toEqual([
    'M 140 10 H 160 M 140 6 v 8 M 160 6 v 8',
    'M 180 10 H 200 M 180 6 v 8 M 200 6 v 8'
  ]);
  expect(overlays.filter(x => x.matches('.svg-spacing-guide')).map(x => x.querySelector('text')?.textContent)).toEqual(['20 px', '20 px']);
  expect(snaplines.snapToPosition(rect(170), { width: 20, height: 20 }, { x: 1, y: 1 }).x).toBeNull();
  expect(overlays.filter(x => x.matches('.svg-spacing-guide'))).toHaveLength(0);
  snaplines.clearSnaplines();
  expect(overlays).toHaveLength(0);
  expect(snaplines.snapToPosition(rect(159), { width: 20, height: 20 }, { x: 1, y: 1 }).x).toBeNull();
  expect(overlays).toHaveLength(0);
  a.x += 100;
  b.x += 100;
  snaplines.calculateSnaplines([]);
  expect(snaplines.snapToPosition(rect(159), { width: 20, height: 20 }, { x: 1, y: 1 }).x).toBeNull();
  expect(snaplines.snapToPosition(rect(259), { width: 20, height: 20 }, { x: 1, y: 1 }).x).toBe(260);
  expect(overlays.filter(x => x.matches('.svg-spacing-guide')).map(x => x.querySelector('path')?.getAttribute('d'))).toEqual([
    'M 240 10 H 260 M 240 6 v 8 M 260 6 v 8',
    'M 280 10 H 300 M 280 6 v 8 M 300 6 v 8'
  ]);
});

test.each([0.5, 2])('vertical spacing labels and end caps retain their screen size at zoom %s', scale => {
  const overlays: Element[] = [];
  const snaplines = new Snaplines({ addOverlay: (_source: string, element: Element) => overlays.push(element) } as any);
  snaplines.initialize({ instanceServiceContainer: { designerCanvas: { scaleFactor: scale } }, serviceContainer: { translationService: new DefaultTranslationService() } } as any);
  (snaplines as any)._drawSpacing({ gaps: [[10, 22.5], [40, 52.5]], crossPosition: 30 }, false);
  expect(overlays.map(x => x.querySelector('text')?.textContent)).toEqual(['12.5 px', '12.5 px']);
  expect(overlays.every(x => x.matches('.svg-snapline.svg-spacing-guide'))).toBe(true);
  for (const group of overlays) {
    expect(group.querySelector('g')?.getAttribute('transform')).toContain(`scale(${1 / scale})`);
    expect(group.querySelector('path')?.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    expect(group.querySelector('path')?.getAttribute('d')).toContain(`h ${8 / scale}`);
  }
});
