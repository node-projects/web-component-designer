import { expect, test } from '@jest/globals';
import type { IDesignItem } from '../src/elements/item/IDesignItem';
import { getCollaborationNodeIndex, getCollaborationNodeIndexes, getDesignItemByCollaborationNodeIndex } from '../src/elements/services/collaborationService/CollaborationNodeIndex';

test('large selection lookups reuse the document index and follow structural changes', () => {
  let visited = 0;
  let notify: (changes: { changeType: string }[]) => void;
  const items: IDesignItem[] = [];
  const root = {
    isRootItem: true, hasChildren: true,
    *children() { visited++; yield* items; },
    instanceServiceContainer: { onContentChanged: { on(callback: typeof notify) { notify = callback; return { dispose() {} }; } } }
  } as unknown as IDesignItem;
  root.instanceServiceContainer.rootDesignItem = root;
  for (let index = 0; index < 2000; index++) items.push({
    isRootItem: false, nodeType: 1, hasChildren: false, instanceServiceContainer: root.instanceServiceContainer
  } as IDesignItem);
  expect(getCollaborationNodeIndexes(items)).toEqual(items.map((_, index) => index));
  expect(getDesignItemByCollaborationNodeIndex(root, 42)).toBe(items[42]);
  expect(visited).toBeLessThan(3);
  notify([{ changeType: 'changed' }]);
  expect(getCollaborationNodeIndex(items[42])).toBe(42);
  expect(visited).toBeLessThan(3);
  items.reverse(); notify([{ changeType: 'moved' }]);
  expect(getCollaborationNodeIndex(items[42])).toBe(42);
  expect(getDesignItemByCollaborationNodeIndex(root, 42)).toBe(items[42]);
  const removed = items.shift(); notify([{ changeType: 'removed' }]);
  expect(getCollaborationNodeIndex(removed)).toBeNull();
  expect(getDesignItemByCollaborationNodeIndex(root, 0)).toBe(items[0]);
});
