import { AbstractExtension, getDesignItemByCollaborationNodeIndex } from '@node-projects/web-component-designer';
import type { IDesignItem, IDesignerCanvas, IExtensionManager } from '@node-projects/web-component-designer';
import { CollaborationOverlayExtension } from './CollaborationOverlayExtension.js';

/** One root extension owns only the items actually selected/commented by peers. */
export class CollaborationSelectionOverlayExtension extends AbstractExtension {
  private readonly items = new Map<IDesignItem, CollaborationOverlayExtension>();

  constructor(extensionManager: IExtensionManager, canvas: IDesignerCanvas, root: IDesignItem) {
    super(extensionManager, canvas, root);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) { this.refresh(cache, event); }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    cache ??= {};
    const service = this.extendedItem.instanceServiceContainer.collaborationService;
    const indexes = new Set<number>();
    for (const peer of service?.peers ?? []) {
      if (peer.peerId === service.session?.peerId) continue;
      if (peer.activeNodeIndex != null) indexes.add(peer.activeNodeIndex);
      for (const index of peer.selectedNodeIndexes ?? []) indexes.add(index);
    }
    for (const comment of service?.comments ?? [])
      if (comment.targetNodeIndex != null) indexes.add(comment.targetNodeIndex);
    const targets = new Set<IDesignItem>();
    for (const index of indexes) {
      const item = getDesignItemByCollaborationNodeIndex(this.extendedItem, index, cache);
      if (item) targets.add(item);
    }
    for (const [item, extension] of this.items) {
      if (!targets.has(item)) { extension.dispose(); this.items.delete(item); }
    }
    for (const item of targets) {
      let extension = this.items.get(item);
      if (!extension) {
        extension = new CollaborationOverlayExtension(this.extensionManager, this.designerCanvas, item);
        this.items.set(item, extension);
      }
      extension.refresh(cache, event);
    }
  }

  override dispose() {
    for (const extension of this.items.values()) extension.dispose();
    this.items.clear();
  }
}
