import { expect, jest, test } from '@jest/globals';
import type { IDesignItem } from '../src/elements/item/IDesignItem.js';
import { InsertAction } from '../src/elements/services/undoService/transactionItems/InsertAction.js';
import { InsertChildAction } from '../src/elements/services/undoService/transactionItems/InsertChildAction.js';

test.each([InsertAction, InsertChildAction])('%p records the placement index and reuses it on redo', Action => {
  const getInsertionIndex = jest.fn(() => 1);
  const children: IDesignItem[] = [{} as IDesignItem, {} as IDesignItem];
  const container = {
    getPlacementService: () => ({ getInsertionIndex }),
    _insertChildInternal(item: IDesignItem, index: number) {
      children.splice(index, 0, item);
      (item as any).parent = container;
    },
    _removeChildInternal(item: IDesignItem) {
      children.splice(children.indexOf(item), 1);
      (item as any).parent = null;
    },
  } as unknown as IDesignItem;
  const item = { parent: null } as IDesignItem;
  const action = Action === InsertAction
    ? new InsertAction(container, 2, item)
    : new InsertChildAction(item, container, 2);

  expect(getInsertionIndex).toHaveBeenCalledWith(container, item, 2);
  action.do();
  expect(children.indexOf(item)).toBe(1);
  action.undo();
  expect(children).not.toContain(item);
  action.do();
  expect(children.indexOf(item)).toBe(1);
  expect(getInsertionIndex).toHaveBeenCalledTimes(1);
});

test.each([InsertAction, InsertChildAction])('%p preserves the requested index without a placement hook', Action => {
  const insert = jest.fn();
  const container = {
    getPlacementService: () => ({}),
    _insertChildInternal: insert,
  } as unknown as IDesignItem;
  const item = { parent: null } as IDesignItem;
  const action = Action === InsertAction
    ? new InsertAction(container, 3, item)
    : new InsertChildAction(item, container, 3);
  action.do();
  expect(insert).toHaveBeenCalledWith(item, 3);
});
