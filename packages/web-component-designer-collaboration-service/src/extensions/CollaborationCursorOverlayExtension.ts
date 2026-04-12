import { AbstractExtension, IExtensionManager, IDesignerCanvas, IDesignItem, ICollaborationPeerPresence, OverlayLayer } from "@node-projects/web-component-designer";

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength)
    return text;
  return text.substring(0, Math.max(0, maxLength - 1)) + '…';
}

function createCursorPath(x: number, y: number) {
  return [
    `M ${x} ${y}`,
    `L ${x} ${y + 18}`,
    `L ${x + 4.5} ${y + 13.5}`,
    `L ${x + 8.5} ${y + 23}`,
    `L ${x + 12} ${y + 21.5}`,
    `L ${x + 8} ${y + 12.5}`,
    `L ${x + 15} ${y + 12.5}`,
    'Z'
  ].join(' ');
}

export class CollaborationCursorOverlayExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const collaborationService = this.extendedItem.instanceServiceContainer.collaborationService;
    if (!collaborationService || !this.extendedItem.isRootItem) {
      if (this.overlays.length)
        this._removeAllOverlays();
      return;
    }

    const localPeerId = collaborationService.session?.peerId;
    const peers = collaborationService.peers
      .filter(peer => peer.peerId !== localPeerId && !!peer.cursorPosition)
      .sort((a, b) => a.peerId.localeCompare(b.peerId));

    const overlayState = JSON.stringify(peers.map(peer => ({
      peerId: peer.peerId,
      displayName: peer.displayName,
      color: peer.color,
      cursorPosition: peer.cursorPosition
    })));

    if (!peers.length) {
      if (this.overlays.length)
        this._removeAllOverlays();
      this._valuesHaveChanges(overlayState);
      return;
    }

    if (!this._valuesHaveChanges(overlayState))
      return;

    this._removeAllOverlays();

    peers.forEach(peer => this.drawPeerCursor(peer));
  }

  override dispose() {
    this._removeAllOverlays();
  }

  private drawPeerCursor(peer: ICollaborationPeerPresence) {
    if (!peer.cursorPosition)
      return;

    const color = peer.color ?? '#1f7ae0';
    const x = peer.cursorPosition.x;
    const y = peer.cursorPosition.y;

    const cursor = this._drawPath(createCursorPath(x, y), 'svg-collaboration-cursor', undefined, OverlayLayer.Foreground);
    cursor.style.fill = color;
    cursor.style.stroke = '#ffffff';
    cursor.style.strokeWidth = '1.2px';

    this._drawCircle(x, y, 2.5, 'svg-collaboration-cursor-hotspot', undefined, OverlayLayer.Foreground).style.fill = color;

    this._drawTextWithBackground(
      truncateText(peer.displayName ?? peer.peerId, 18),
      x + 16,
      y + 16,
      color,
      'svg-collaboration-cursor-label',
      undefined,
      OverlayLayer.Foreground
    );
  }
}