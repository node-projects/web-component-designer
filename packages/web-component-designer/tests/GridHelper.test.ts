import { expect, test } from '@jest/globals';
import { getGridColumnStartLineFromLocalX, getGridRowStartLineFromLocalY, type IGridInformation } from '../src/elements/helper/GridHelper';

function createGridInformation(): IGridInformation {
  return {
    xGap: 0,
    yGap: 0,
    gaps: [],
    cells: [
      [
        { x: 0, y: 0, width: 100, height: 50, name: 'a', localX: 0, localY: 0 },
        { x: 100, y: 0, width: 100, height: 50, name: 'b', localX: 100, localY: 0 },
        { x: 200, y: 0, width: 100, height: 50, name: 'c', localX: 200, localY: 0 }
      ],
      [
        { x: 0, y: 50, width: 100, height: 50, name: 'd', localX: 0, localY: 50 },
        { x: 100, y: 50, width: 100, height: 50, name: 'e', localX: 100, localY: 50 },
        { x: 200, y: 50, width: 100, height: 50, name: 'f', localX: 200, localY: 50 }
      ]
    ]
  };
}

test('maps left resize snapping to the first grid line', () => {
  const gridInformation = createGridInformation();

  expect(getGridColumnStartLineFromLocalX(gridInformation, 10)).toBe(1);
  expect(getGridColumnStartLineFromLocalX(gridInformation, 75)).toBe(2);
  expect(getGridColumnStartLineFromLocalX(gridInformation, 175)).toBe(3);
});

test('maps top resize snapping to the first grid line', () => {
  const gridInformation = createGridInformation();

  expect(getGridRowStartLineFromLocalY(gridInformation, 5)).toBe(1);
  expect(getGridRowStartLineFromLocalY(gridInformation, 30)).toBe(2);
  expect(getGridRowStartLineFromLocalY(gridInformation, 90)).toBe(3);
});