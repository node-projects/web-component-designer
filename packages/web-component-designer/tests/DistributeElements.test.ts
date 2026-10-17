import { expect, jest, test } from '@jest/globals';
import { CommandType } from '../src/commandHandling/CommandType.js';
import { DefaultModelCommandService } from '../src/elements/services/modelCommandService/DefaultModelCommandService.js';

function setup(horizontal: boolean, positions = [10, 60, 100, 250]) {
  const group = { commit: jest.fn() };
  const parent = { element: { rect: { x: 5, y: 5, width: 400, height: 400 } } };
  const items = positions.map((position, index) => ({
    parent, isRootItem: false,
    element: { rect: horizontal
      ? { x: position, y: 20, width: [30, 20, 40, 50][index], height: 20 }
      : { x: 20, y: position, width: 20, height: [30, 20, 40, 50][index] } },
    openGroup: () => group,
    hasStyle: (_name: string): boolean => false,
    setStyle: jest.fn()
  }));
  const canvas = {
    getNormalizedElementCoordinates: (element: any) => element.rect,
    instanceServiceContainer: { selectionService: { selectedElements: [items[2], items[0], items[3], items[1]] } }
  } as any;
  return { canvas, items, group };
}

test.each([true, false])('distribution keeps outer elements fixed and creates equal edge gaps (horizontal=%s)', async horizontal => {
  const { canvas, items, group } = setup(horizontal);
  const service = new DefaultModelCommandService();
  const command = { type: horizontal ? CommandType.distributeHorizontal : CommandType.distributeVertical };
  expect(service.canExecuteCommand(canvas, command)).toBe(true);
  expect(await service.executeCommand(canvas, command)).toBe(true);
  // Span 290, total element sizes 140: each gap is 50.
  expect(items[0].setStyle).not.toHaveBeenCalled();
  expect(items[3].setStyle).not.toHaveBeenCalled();
  expect(items[1].setStyle).toHaveBeenCalledWith(horizontal ? 'left' : 'top', '85px');
  expect(items[2].setStyle).toHaveBeenCalledWith(horizontal ? 'left' : 'top', '155px');
  expect(group.commit).toHaveBeenCalledTimes(1);
});

test('distribution supports right and bottom anchored items', async () => {
  for (const horizontal of [true, false]) {
    const { canvas, items } = setup(horizontal);
    items[1].hasStyle = name => name === (horizontal ? 'right' : 'bottom');
    await new DefaultModelCommandService().executeCommand(canvas, { type: horizontal ? CommandType.distributeHorizontal : CommandType.distributeVertical });
    expect(items[1].setStyle).toHaveBeenCalledWith(horizontal ? 'right' : 'bottom', '295px');
  }
});

test('distribution requires at least three non-root items, including explicitly supplied selections', async () => {
  const { canvas, items, group } = setup(true);
  const service = new DefaultModelCommandService();
  const command = { type: CommandType.distributeHorizontal };
  expect(service.canExecuteCommand(canvas, command, items.slice(0, 2) as any)).toBe(false);
  expect(await service.executeCommand(canvas, command, items.slice(0, 2) as any)).toBe(false);
  items[0].isRootItem = true;
  expect(service.canExecuteCommand(canvas, command)).toBe(false);
  expect(group.commit).not.toHaveBeenCalled();
});
