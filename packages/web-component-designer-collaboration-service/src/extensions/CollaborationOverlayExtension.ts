import { ICollaborationPeerPresence, ICollaborationComment, IDesignItem, AbstractExtension, IExtensionManager, IDesignerCanvas, getCollaborationNodeIndex, OverlayLayer } from "@node-projects/web-component-designer";

const collaborationOverlayCacheKey = Symbol('collaborationOverlayCache');

type CollaborationOverlayCache = {
  peerMap: Map<number, ICollaborationPeerPresence[]>;
  commentMap: Map<number, ICollaborationComment[]>;
};

function getOverlayCache(designItem: IDesignItem, cache: Record<string | symbol, any>): CollaborationOverlayCache {
  if (cache[collaborationOverlayCacheKey])
    return cache[collaborationOverlayCacheKey];

  const collaborationService = designItem.instanceServiceContainer.collaborationService;
  const peerMap = new Map<number, ICollaborationPeerPresence[]>;
  const commentMap = new Map<number, ICollaborationComment[]>;
  const localPeerId = collaborationService?.session?.peerId;

  for (const peer of collaborationService?.peers ?? []) {
    if (!peer || peer.peerId === localPeerId)
      continue;

    const indexes = new Set<number>();
    if (peer.activeNodeIndex != null)
      indexes.add(peer.activeNodeIndex);
    for (const nodeIndex of peer.selectedNodeIndexes ?? [])
      indexes.add(nodeIndex);

    for (const nodeIndex of indexes) {
      const peers = peerMap.get(nodeIndex) ?? [];
      peers.push(peer);
      peerMap.set(nodeIndex, peers);
    }
  }

  for (const comment of collaborationService?.comments ?? []) {
    if (comment.targetNodeIndex == null)
      continue;

    const comments = commentMap.get(comment.targetNodeIndex) ?? [];
    comments.push(comment);
    commentMap.set(comment.targetNodeIndex, comments);
  }

  const overlayCache = { peerMap, commentMap };
  cache[collaborationOverlayCacheKey] = overlayCache;
  return overlayCache;
}

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength)
    return text;
  return text.substring(0, Math.max(0, maxLength - 1)) + '…';
}

export class CollaborationOverlayExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const collaborationService = this.extendedItem.instanceServiceContainer.collaborationService;
    if (!collaborationService) {
      if (this.overlays.length)
        this._removeAllOverlays();
      return;
    }

    const nodeIndex = getCollaborationNodeIndex(this.extendedItem, cache);
    if (nodeIndex == null) {
      if (this.overlays.length)
        this._removeAllOverlays();
      return;
    }

    const overlayCache = getOverlayCache(this.extendedItem, cache);
    const peers = [...(overlayCache.peerMap.get(nodeIndex) ?? [])].sort((a, b) => a.peerId.localeCompare(b.peerId));
    const comments = [...(overlayCache.commentMap.get(nodeIndex) ?? [])].sort((a, b) => a.createdAt - b.createdAt);

    if (!peers.length && !comments.length) {
      if (this.overlays.length)
        this._removeAllOverlays();
      return;
    }

    const rect = this.designerCanvas.getNormalizedElementCoordinates(this.extendedItem.element);
    const overlayState = JSON.stringify({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      peers: peers.map(x => ({
        peerId: x.peerId,
        displayName: x.displayName,
        color: x.color,
        activeNodeIndex: x.activeNodeIndex,
        selectedNodeIndexes: x.selectedNodeIndexes
      })),
      comments: comments.map(x => ({ id: x.id, resolved: x.resolved, text: x.text, authorPeerId: x.authorPeerId }))
    });

    if (!this._valuesHaveChanges(overlayState))
      return;

    this._removeAllOverlays();

    peers.forEach((peer, index) => {
      const offset = index * 3;
      const peerRect = this._drawRect(rect.x - offset, rect.y - offset, rect.width + (offset * 2), rect.height + (offset * 2), 'svg-collaboration-peer', undefined, OverlayLayer.Foreground);
      peerRect.style.stroke = peer.color ?? '#1f7ae0';
      peerRect.style.strokeWidth = peer.activeNodeIndex === nodeIndex ? '2.5px' : '1.5px';
      peerRect.style.opacity = peer.activeNodeIndex === nodeIndex ? '1' : '0.75';
      peerRect.style.fill = 'none';

      const labelText = truncateText(peer.displayName ?? peer.peerId, 24);
      this._drawTextWithBackground(labelText, rect.x - offset, rect.y - 8 - (index * 14), peer.color ?? '#1f7ae0', 'svg-collaboration-label', undefined, OverlayLayer.Foreground);
    });

    if (comments.length) {
      const unresolvedComments = comments.filter(x => !x.resolved);
      const badgeColor = unresolvedComments.length ? '#f57c00' : '#9e9e9e';
      const commentRect = this._drawRect(rect.x + 2, rect.y + 2, Math.max(0, rect.width - 4), Math.max(0, rect.height - 4), 'svg-collaboration-comment', undefined, OverlayLayer.Foreground);
      commentRect.style.stroke = badgeColor;
      commentRect.style.fill = 'none';

      const commentLabel = unresolvedComments.length
        ? `${unresolvedComments.length} comment${unresolvedComments.length === 1 ? '' : 's'}`
        : `${comments.length} resolved`;
      this._drawTextWithBackground(commentLabel, rect.x + rect.width - 12, rect.y + 14, badgeColor, 'svg-collaboration-comment-label', undefined, OverlayLayer.Foreground);

      const previewComment = comments[comments.length - 1];
      this._drawTextWithBackground(truncateText(previewComment.text, 28), rect.x + 4, rect.y + rect.height + 16, badgeColor, 'svg-collaboration-comment-preview', undefined, OverlayLayer.Foreground);
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}