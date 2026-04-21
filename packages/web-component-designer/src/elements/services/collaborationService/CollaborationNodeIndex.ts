import { IDesignItem } from '../../item/IDesignItem.js';
import { NodeType } from '../../item/NodeType.js';

type CollaborationNodeIndexCache = {
  orderedItems: IDesignItem[];
  byItem: WeakMap<IDesignItem, number>;
};

const collaborationNodeIndexCacheKey = Symbol('collaborationNodeIndexCache');

function buildCache(rootDesignItem: IDesignItem): CollaborationNodeIndexCache {
  const orderedItems: IDesignItem[] = [];
  const byItem = new WeakMap<IDesignItem, number>();
  let index = 0;

  const visit = (designItem: IDesignItem) => {
    if (!designItem)
      return;

    if (!designItem.isRootItem && designItem.nodeType === NodeType.Element) {
      orderedItems.push(designItem);
      byItem.set(designItem, index++);
    }

    if (designItem.hasChildren) {
      for (const child of designItem.children())
        visit(child);
    }
  };

  visit(rootDesignItem);

  return { orderedItems, byItem };
}

function getCache(rootDesignItem: IDesignItem, cache?: Record<string | symbol, any>): CollaborationNodeIndexCache {
  if (cache?.[collaborationNodeIndexCacheKey])
    return cache[collaborationNodeIndexCacheKey];

  const nodeIndexCache = buildCache(rootDesignItem);
  if (cache)
    cache[collaborationNodeIndexCacheKey] = nodeIndexCache;
  return nodeIndexCache;
}

export function getCollaborationNodeIndex(designItem: IDesignItem, cache?: Record<string | symbol, any>): number {
  if (!designItem || designItem.isRootItem)
    return null;

  const rootDesignItem = designItem.instanceServiceContainer.designerCanvas.rootDesignItem;
  return getCache(rootDesignItem, cache).byItem.get(designItem) ?? null;
}

export function getCollaborationNodeIndexes(designItems: IDesignItem[], cache?: Record<string | symbol, any>): number[] {
  if (!designItems?.length)
    return [];

  return designItems.map(x => getCollaborationNodeIndex(x, cache)).filter(x => x != null);
}

export function getDesignItemByCollaborationNodeIndex(rootDesignItem: IDesignItem, nodeIndex: number, cache?: Record<string | symbol, any>): IDesignItem {
  if (nodeIndex == null || nodeIndex < 0)
    return null;

  return getCache(rootDesignItem, cache).orderedItems[nodeIndex] ?? null;
}