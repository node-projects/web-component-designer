/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals';
import type { IDesignItem } from '../src/elements/item/IDesignItem.js';
import { InsertAction } from '../src/elements/services/undoService/transactionItems/InsertAction.js';
import { InsertChildAction } from '../src/elements/services/undoService/transactionItems/InsertChildAction.js';

CSSStyleSheet.prototype.replaceSync = function () { };
const { DesignItem } = await import('../src/elements/item/DesignItem.js');

function container(getInsertionIndex?: (...args: any[]) => number) {
  const children: IDesignItem[] = [{} as IDesignItem, {} as IDesignItem];
  let action: InsertChildAction;
  const parent = {
    getPlacementService: () => ({ getInsertionIndex }),
    instanceServiceContainer: { undoService: { execute(value: InsertChildAction) { action = value; value.do(); } } },
    insertChild: DesignItem.prototype.insertChild,
    _insertChildInternal(item: IDesignItem, index: number) {
      children.splice(index, 0, item);
      (item as any).parent = parent;
    },
    _removeChildInternal(item: IDesignItem) {
      children.splice(children.indexOf(item), 1);
      (item as any).parent = null;
    },
  } as unknown as IDesignItem;
  return { parent, children, action: () => action };
}

test('the insertion API resolves placement before creating an action and redo reuses the index', () => {
  const getInsertionIndex = jest.fn(() => 1);
  const { parent, children, action } = container(getInsertionIndex);
  const item = { parent: null } as IDesignItem;
  parent.insertChild(item, 2);

  expect(getInsertionIndex).toHaveBeenCalledWith(parent, item, 2);
  expect(action().newIndex).toBe(1);
  expect(children.indexOf(item)).toBe(1);
  action().undo();
  expect(children).not.toContain(item);
  action().do();
  expect(children.indexOf(item)).toBe(1);
  expect(getInsertionIndex).toHaveBeenCalledTimes(1);
});

test('the insertion API preserves the requested index without a placement hook', () => {
  const { parent, children, action } = container();
  const item = { parent: null } as IDesignItem;
  parent.insertChild(item, 2);
  expect(action().newIndex).toBe(2);
  expect(children.indexOf(item)).toBe(2);
});

test('sibling insertion delegates to the parent insertion API', () => {
  const getInsertionIndex = jest.fn(() => 0);
  const { parent, children, action } = container(getInsertionIndex);
  (parent as any).indexOf = (item: IDesignItem) => children.indexOf(item);
  const sibling = { parent } as IDesignItem;
  children[0] = sibling;
  const item = { parent: null } as IDesignItem;
  DesignItem.prototype.insertAdjacentElement.call(sibling, item, 'afterend');
  expect(getInsertionIndex).toHaveBeenCalledWith(parent, item, 1);
  expect(action().newIndex).toBe(0);
  expect(children[0]).toBe(item);
});

test.each([InsertAction, InsertChildAction])('%p uses the supplied index without consulting placement', Action => {
  const getPlacementService = jest.fn(() => { throw new Error('Undo actions must not resolve placement.'); });
  const insert = jest.fn();
  const parent = { getPlacementService, _insertChildInternal: insert } as unknown as IDesignItem;
  const item = { parent: null } as IDesignItem;
  const action = Action === InsertAction
    ? new InsertAction(parent, 3, item)
    : new InsertChildAction(item, parent, 3);
  action.do();
  expect(insert).toHaveBeenCalledWith(item, 3);
  expect(getPlacementService).not.toHaveBeenCalled();
});
