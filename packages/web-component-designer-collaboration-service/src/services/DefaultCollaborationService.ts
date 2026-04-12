import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { CollaborationConnectionState, DomConverter, getCollaborationNodeIndex, getCollaborationNodeIndexes, getDesignItemByCollaborationNodeIndex, ICollaborationComment, ICollaborationCommentsChangedEvent, ICollaborationDocumentSnapshot, ICollaborationPeerPresence, ICollaborationPeersChangedEvent, ICollaborationRemoteChange, ICollaborationSelectionEvent, ICollaborationService, ICollaborationSession, ICollaborationStateChangedEvent, ICollaborationTransport, IDesignerCanvas, ITransactionItem, IUndoChangeEvent, UndoChangeSource } from '@node-projects/web-component-designer';

function createPeerColor(peerId: string) {
  let hash = 0;
  for (let i = 0; i < peerId.length; i++)
    hash = ((hash << 5) - hash) + peerId.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}deg 74% 48%)`;
}

function createSyntheticTransactionItem(title?: string): ITransactionItem {
  return {
    title: title ?? 'remote change',
    affectedItems: [],
    do: () => { },
    undo: () => { },
    mergeWith: () => false
  };
}

export class DefaultCollaborationService implements ICollaborationService {
  private _state: CollaborationConnectionState = 'disconnected';
  private _session: ICollaborationSession | null = null;
  private _transport: ICollaborationTransport | null = null;
  private _peers = new Map<string, ICollaborationPeerPresence>();
  private _comments = new Map<string, ICollaborationComment>();
  private _applyingRemoteChanges = false;
  private _lastLocalCursorPosition: { x: number, y: number } | undefined;
  private _lastLocalCursorUpdate = 0;
  private _refreshExtensionsHandle: number | null = null;

  constructor(private _designerCanvas: IDesignerCanvas) {
    this._designerCanvas.instanceServiceContainer.undoService.onTransaction.on(change => {
      if (this._applyingRemoteChanges)
        return;

      this.onChange.emit(change);
      if (change.source !== 'remote')
        void this._transport?.sendChange({ kind: change.kind, title: change.item?.title }, this.createSnapshot());
    });

    this._designerCanvas.instanceServiceContainer.selectionService.onSelectionChanged.on(() => {
      if (!this._session || this._applyingRemoteChanges)
        return;

      const selectedElements = this._designerCanvas.instanceServiceContainer.selectionService.selectedElements;
      const selectedNodeIndexes = getCollaborationNodeIndexes(selectedElements);
      const primaryDesignItem = this._designerCanvas.instanceServiceContainer.selectionService.primarySelection;
      const primaryNodeIndex = getCollaborationNodeIndex(primaryDesignItem);
      const selectedDesignItemIds = selectedElements
        .map(x => x?.id)
        .filter(x => !!x);
      const primaryDesignItemId = primaryDesignItem?.id;

      this.storePeerPresence({
        peerId: this._session.peerId,
        displayName: this._session.displayName,
        color: this._peers.get(this._session.peerId)?.color ?? createPeerColor(this._session.peerId),
        activeDesignItemId: primaryDesignItemId,
        activeNodeIndex: primaryNodeIndex,
        selectedDesignItemIds,
        selectedNodeIndexes,
        updatedAt: Date.now()
      }, 'local');

      const event: ICollaborationSelectionEvent = {
        source: 'local',
        peerId: this._session.peerId,
        selectedNodeIndexes,
        primaryNodeIndex,
        selectedDesignItemIds,
        primaryDesignItemId
      };

      this.onSelectionChanged.emit(event);
      void this._transport?.sendSelection(event);
    });

    this._designerCanvas.clickOverlay.addEventListener('pointermove', this._handlePointerMove);
    this._designerCanvas.clickOverlay.addEventListener('pointerleave', this._handlePointerLeave);
  }

  get state(): CollaborationConnectionState {
    return this._state;
  }

  get session(): ICollaborationSession {
    return this._session!;
  }

  get peers(): readonly ICollaborationPeerPresence[] {
    return [...this._peers.values()];
  }

  get comments(): readonly ICollaborationComment[] {
    return [...this._comments.values()];
  }

  get transport(): ICollaborationTransport {
    return this._transport!;
  }

  get isApplyingRemoteChanges(): boolean {
    return this._applyingRemoteChanges;
  }

  attachTransport(transport: ICollaborationTransport): void {
    if (this._transport === transport)
      return;

    this.detachTransport();
    this._transport = transport;
    void this._transport?.attach(this);
    if (this._session)
      void this._transport?.connect(this._session);
  }

  detachTransport(): void {
    if (this._transport) {
      void this._transport.disconnect();
      void this._transport.detach();
    }
    this._transport = null;
  }

  connect(sessionId: string, peerId: string, displayName?: string): void {
    const currentSelection = this.getCurrentSelectionState();
    this._state = 'connected';
    this._session = { sessionId, peerId, displayName: displayName ?? `peer-${peerId.substring(0, 4)}` };
    this.onStateChanged.emit({ state: this._state, session: this._session });
    this.updatePeerPresence({
      peerId,
      displayName: this._session.displayName,
      color: createPeerColor(peerId),
      activeDesignItemId: currentSelection.primaryDesignItemId,
      activeNodeIndex: currentSelection.primaryNodeIndex,
      selectedDesignItemIds: currentSelection.selectedDesignItemIds,
      selectedNodeIndexes: currentSelection.selectedNodeIndexes,
      updatedAt: Date.now()
    }, 'local');
    void this._transport?.connect(this._session);
  }

  disconnect(): void {
    const previousSession = this._session;
    if (previousSession?.peerId)
      this._peers.delete(previousSession.peerId);

    this._lastLocalCursorPosition = undefined;
    void this._transport?.disconnect();
    this._session = null;
    this._state = 'disconnected';
    this.onStateChanged.emit({ state: this._state, session: previousSession! });
    this.onPeersChanged.emit({ source: 'local', peerId: previousSession?.peerId, peers: this.peers });
  }

  createSnapshot(): ICollaborationDocumentSnapshot {
    const html = this._designerCanvas.rootDesignItem.childCount > 0
      ? DomConverter.ConvertToString(Array.from(this._designerCanvas.rootDesignItem.children()), true, true)
      : '';
    const stylesheets = this._designerCanvas.instanceServiceContainer.stylesheetService?.getStylesheets()?.map(x => ({ ...x })) ?? [];
    return { html, stylesheets, updatedAt: Date.now() };
  }

  async applyRemoteSnapshot(snapshot: ICollaborationDocumentSnapshot): Promise<void> {
    try {
      this._applyingRemoteChanges = true;

      const designItems = snapshot.html
        ? await this._designerCanvas.serviceContainer.htmlParserService.parse(snapshot.html, this._designerCanvas.serviceContainer, this._designerCanvas.instanceServiceContainer, false)
        : [];

      this._designerCanvas._internalSetDesignItems(designItems);
      if (this._designerCanvas.instanceServiceContainer.stylesheetService)
        await this._designerCanvas.instanceServiceContainer.stylesheetService.setStylesheets(snapshot.stylesheets ?? []);
    } finally {
      this._applyingRemoteChanges = false;
    }
  }

  async applyRemoteChange(change: ICollaborationRemoteChange, snapshot?: ICollaborationDocumentSnapshot): Promise<void> {
    if (snapshot)
      await this.applyRemoteSnapshot(snapshot);

    this.onChange.emit({
      item: createSyntheticTransactionItem(change.title),
      kind: change.kind,
      source: 'remote'
    });
  }

  updateRemoteSelection(peerId: string, selectedNodeIndexes: number[], primaryNodeIndex?: number): void {
    const rootDesignItem = this._designerCanvas.instanceServiceContainer.contentService.rootDesignItem;
    const selectedDesignItemIds = selectedNodeIndexes
      .map(x => getDesignItemByCollaborationNodeIndex(rootDesignItem, x)?.id)
      .filter(x => !!x);
    const primaryDesignItemId = primaryNodeIndex != null
      ? getDesignItemByCollaborationNodeIndex(rootDesignItem, primaryNodeIndex)?.id
      : undefined;

    this.storePeerPresence({
      peerId,
      activeDesignItemId: primaryDesignItemId,
      activeNodeIndex: primaryNodeIndex,
      selectedDesignItemIds,
      selectedNodeIndexes,
      updatedAt: Date.now()
    }, 'remote');

    this.onSelectionChanged.emit({
      source: 'remote',
      peerId,
      selectedNodeIndexes,
      primaryNodeIndex,
      selectedDesignItemIds,
      primaryDesignItemId
    });
  }

  updatePeerPresence(peer: ICollaborationPeerPresence, source: UndoChangeSource = 'local'): void {
    const normalizedPeer = { ...peer, color: peer.color ?? createPeerColor(peer.peerId) };
    this.storePeerPresence(normalizedPeer, source);
    if (source !== 'remote')
      void this._transport?.sendPresence(normalizedPeer);
  }

  removePeer(peerId: string, source: UndoChangeSource = 'local'): void {
    this._peers.delete(peerId);
    this.onPeersChanged.emit({ source, peerId, peers: this.peers });
if (source === 'remote')
      this.requestExtensionRefresh();
  }

  upsertComment(comment: ICollaborationComment, source: UndoChangeSource = 'local'): void {
    const normalizedComment = {
      ...comment,
      updatedAt: comment.updatedAt ?? Date.now()
    };
    this._comments.set(normalizedComment.id, normalizedComment);

    const event: ICollaborationCommentsChangedEvent = {
      source,
      comment: normalizedComment,
      comments: this.comments
    };

    this.onCommentsChanged.emit(event);
    this.requestExtensionRefresh();
    if (source !== 'remote')
      void this._transport?.sendComment(event);
  }

  removeComment(commentId: string, source: UndoChangeSource = 'local'): void {
    this._comments.delete(commentId);

    const event: ICollaborationCommentsChangedEvent = {
      source,
      commentId,
      comments: this.comments
    };

    this.onCommentsChanged.emit(event);
    this.requestExtensionRefresh();
    if (source !== 'remote')
      void this._transport?.sendComment(event);
  }

  readonly onStateChanged = new TypedEvent<ICollaborationStateChangedEvent>();
  readonly onChange = new TypedEvent<IUndoChangeEvent>();
  readonly onSelectionChanged = new TypedEvent<ICollaborationSelectionEvent>();
  readonly onPeersChanged = new TypedEvent<ICollaborationPeersChangedEvent>();
  readonly onCommentsChanged = new TypedEvent<ICollaborationCommentsChangedEvent>();

  private storePeerPresence(peer: ICollaborationPeerPresence, source: UndoChangeSource) {
    const currentPeer = this._peers.get(peer.peerId);
    const nextPeer = { ...currentPeer, ...peer, color: peer.color ?? currentPeer?.color ?? createPeerColor(peer.peerId), updatedAt: peer.updatedAt ?? Date.now() };
    this._peers.set(peer.peerId, nextPeer);
    this.onPeersChanged.emit({ source, peer: nextPeer, peers: this.peers });
    if (source === 'remote')
      this.requestExtensionRefresh();
  }

  private requestExtensionRefresh() {
    if (this._refreshExtensionsHandle != null)
      return;

    this._refreshExtensionsHandle = requestAnimationFrame(() => {
      this._refreshExtensionsHandle = null;
      this._designerCanvas.extensionManager?.refreshAllAppliedExtentions();
    });
  }

  private _handlePointerMove = (event: PointerEvent) => {
    if (!this._session || this._applyingRemoteChanges)
      return;

    const now = Date.now();
    const cursorPosition = this._designerCanvas.getNormalizedEventCoordinates(event);
    const previousPosition = this._lastLocalCursorPosition;
    const hasMoved = !previousPosition
      || Math.abs(previousPosition.x - cursorPosition.x) >= 1
      || Math.abs(previousPosition.y - cursorPosition.y) >= 1;

    if (!hasMoved && now - this._lastLocalCursorUpdate < 40)
      return;

    this._lastLocalCursorPosition = cursorPosition;
    this._lastLocalCursorUpdate = now;
    this.updatePeerPresence({
      peerId: this._session.peerId,
      displayName: this._session.displayName,
      cursorPosition,
      updatedAt: now
    }, 'local');
  };

  private _handlePointerLeave = () => {
    if (!this._session)
      return;

    if (!this._lastLocalCursorPosition)
      return;

    this._lastLocalCursorPosition = undefined;
    this._lastLocalCursorUpdate = Date.now();
    this.updatePeerPresence({
      peerId: this._session.peerId,
      displayName: this._session.displayName,
      cursorPosition: undefined,
      updatedAt: this._lastLocalCursorUpdate
    }, 'local');
  };

  private getCurrentSelectionState() {
    const selectedElements = this._designerCanvas.instanceServiceContainer.selectionService.selectedElements ?? [];
    const primarySelection = this._designerCanvas.instanceServiceContainer.selectionService.primarySelection;
    return {
      selectedDesignItemIds: selectedElements.map(x => x?.id).filter(x => !!x),
      selectedNodeIndexes: getCollaborationNodeIndexes(selectedElements),
      primaryDesignItemId: primarySelection?.id,
      primaryNodeIndex: getCollaborationNodeIndex(primarySelection)
    };
  }
}