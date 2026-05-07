import { expect, test } from '@jest/globals';
import { parseSvgPathDataSourceMap } from '../dist/elements/services/sourceMapService/SvgPathDataSourceMap';

test('maps svg path coordinates to segment handles', () => {
  const source = 'M 10 20 L 30 40 C 1 2 3 4 5 6';
  const ranges = parseSvgPathDataSourceMap(source);

  expect(ranges).toEqual([
    { segmentIndex: 0, handleType: 'anchor', start: 2, length: 5 },
    { segmentIndex: 1, handleType: 'anchor', start: 10, length: 5 },
    { segmentIndex: 2, handleType: 'cp1', start: 18, length: 3 },
    { segmentIndex: 2, handleType: 'cp2', start: 22, length: 3 },
    { segmentIndex: 2, handleType: 'anchor', start: 26, length: 3 },
  ]);
});

test('maps implicit line segments after moveto', () => {
  const source = 'M0 0 10 10 20 20';
  const ranges = parseSvgPathDataSourceMap(source);

  expect(ranges.map(x => ({ segmentIndex: x.segmentIndex, handleType: x.handleType }))).toEqual([
    { segmentIndex: 0, handleType: 'anchor' },
    { segmentIndex: 1, handleType: 'anchor' },
    { segmentIndex: 2, handleType: 'anchor' },
  ]);
});
