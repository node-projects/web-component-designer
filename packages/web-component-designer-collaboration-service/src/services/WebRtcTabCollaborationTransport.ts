import { ICollaborationDocumentSnapshot, ICollaborationRemoteChange, ICollaborationComment, ICollaborationTransport, ICollaborationService, ICollaborationSession } from "@node-projects/web-component-designer";

export type WebRtcTabCollaborationSignalingChannelKind = 'broadcast-channel' | 'manual';

export interface WebRtcTabCollaborationTransportOptions {
  enabledSignalingChannels?: readonly WebRtcTabCollaborationSignalingChannelKind[];
}

export interface IWebRtcManualSignalingBundle {
  version: 1;
  sessionId: string;
  fromPeerId: string;
  connectionId: string;
  createdAt: number;
  messages: SignalingMessage[];
}

export interface IWebRtcManualSignalingImportResult {
  importedCount: number;
  ignoredCount: number;
}

type SignalingMessage = {
  id: string;
  createdAt: number;
  connectionId: string;
  sessionId: string;
  fromPeerId: string;
  toPeerId?: string;
  type: 'hello' | 'hello-ack' | 'offer' | 'answer' | 'ice' | 'bye';
  requestInitialSnapshot?: boolean;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type DataMessage =
  | { type: 'snapshot'; snapshot: ICollaborationDocumentSnapshot; }
  | { type: 'change'; change: ICollaborationRemoteChange; snapshot: ICollaborationDocumentSnapshot; }
  | { type: 'selection'; selection: { peerId: string; selectedNodeIndexes: number[]; primaryNodeIndex?: number; }; }
  | { type: 'presence'; peer: { peerId: string; displayName?: string; color?: string; activeNodeIndex?: number; selectedNodeIndexes?: number[]; updatedAt: number; }; }
  | { type: 'comment-upsert'; comment: ICollaborationComment; }
  | { type: 'comment-remove'; commentId: string; };

export const defaultWebRtcTabCollaborationSignalingChannels: readonly WebRtcTabCollaborationSignalingChannelKind[] = ['broadcast-channel', 'manual'];

function createRandomId() {
  return globalThis.crypto?.randomUUID?.() ?? `wcd-collab-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createEnabledSignalingChannels(channels?: readonly WebRtcTabCollaborationSignalingChannelKind[]) {
  if (channels == null)
    return new Set<WebRtcTabCollaborationSignalingChannelKind>(defaultWebRtcTabCollaborationSignalingChannels);

  const validChannels = channels.filter((channel): channel is WebRtcTabCollaborationSignalingChannelKind =>
    channel === 'broadcast-channel' || channel === 'manual');
  return new Set<WebRtcTabCollaborationSignalingChannelKind>(validChannels);
}

function areSetsEqual<T>(first: Set<T>, second: Set<T>) {
  if (first.size !== second.size)
    return false;

  for (const entry of first) {
    if (!second.has(entry))
      return false;
  }

  return true;
}

function cloneSignalingMessage(message: SignalingMessage): SignalingMessage {
  return {
    ...message,
    description: message.description ? { ...message.description } : undefined,
    candidate: message.candidate ? { ...message.candidate } : undefined
  };
}

function escapeControlCharacter(character: string) {
  switch (character) {
    case '\b':
      return '\\b';
    case '\f':
      return '\\f';
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\t':
      return '\\t';
    default:
      return `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
  }
}

function normalizeJsonControlCharactersInStrings(data: string) {
  let normalized = '';
  let inString = false;
  let isEscaped = false;

  for (const character of data) {
    if (inString) {
      if (isEscaped) {
        normalized += character;
        isEscaped = false;
        continue;
      }

      if (character === '\\') {
        normalized += character;
        isEscaped = true;
        continue;
      }

      if (character === '"') {
        normalized += character;
        inString = false;
        continue;
      }

      if (character < ' ') {
        normalized += escapeControlCharacter(character);
        continue;
      }

      normalized += character;
      continue;
    }

    normalized += character;
    if (character === '"')
      inString = true;
  }

  return normalized;
}

function parseManualSignalingBundleData(data: string) {
  try {
    return JSON.parse(data) as IWebRtcManualSignalingBundle;
  } catch (error) {
    const normalizedData = normalizeJsonControlCharactersInStrings(data);
    if (normalizedData === data)
      throw error;

    return JSON.parse(normalizedData) as IWebRtcManualSignalingBundle;
  }
}

export class WebRtcTabCollaborationTransport implements ICollaborationTransport {
  private _service: ICollaborationService | null = null;
  private _session: ICollaborationSession | null = null;
  private _broadcastSignalingChannel: BroadcastChannel | null = null;
  private _enabledSignalingChannels = createEnabledSignalingChannels();
  private _manualSignalingMessages: SignalingMessage[] = [];
  private _peerConnections = new Map<string, RTCPeerConnection>();
  private _dataChannels = new Map<string, RTCDataChannel>();
  private _initiatedPeers = new Set<string>();
  private _peersNeedingInitialSnapshot = new Set<string>();
  private _pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private _processedSignalIds = new Set<string>();
  private _remoteConnectionIds = new Map<string, string>();
  private _localConnectionId: string | null = null;

  constructor(options?: WebRtcTabCollaborationTransportOptions) {
    this._enabledSignalingChannels = createEnabledSignalingChannels(options?.enabledSignalingChannels);
  }

  get enabledSignalingChannels(): readonly WebRtcTabCollaborationSignalingChannelKind[] {
    return [...this._enabledSignalingChannels];
  }

  setEnabledSignalingChannels(channels: readonly WebRtcTabCollaborationSignalingChannelKind[]) {
    const nextChannels = createEnabledSignalingChannels(channels);
    if (areSetsEqual(this._enabledSignalingChannels, nextChannels))
      return;

    this._enabledSignalingChannels = nextChannels;
    this.ensureBroadcastChannelState();

    if (this._session && this.hasAvailableSignalingChannel()) {
      this.sendSignal({
        sessionId: this._session.sessionId,
        fromPeerId: this._session.peerId,
        type: 'hello',
        requestInitialSnapshot: this.shouldRequestInitialSnapshot()
      });
    }
  }

  getManualSignalingBundle(): IWebRtcManualSignalingBundle | null {
    if (!this._session || !this._localConnectionId)
      return null;

    return {
      version: 1,
      sessionId: this._session.sessionId,
      fromPeerId: this._session.peerId,
      connectionId: this._localConnectionId,
      createdAt: Date.now(),
      messages: this._manualSignalingMessages.map(cloneSignalingMessage)
    };
  }

  exportManualSignalingData(space: number = 2): string {
    const bundle = this.getManualSignalingBundle();
    return bundle ? JSON.stringify(bundle, null, space) : '';
  }

  async importManualSignalingData(data: string | IWebRtcManualSignalingBundle): Promise<IWebRtcManualSignalingImportResult> {
    if (!this._session)
      throw new Error('Collaboration is not connected for this document.');

    const bundle = typeof data === 'string'
      ? parseManualSignalingBundleData(data)
      : data;

    if (!bundle || !Array.isArray(bundle.messages))
      throw new Error('Invalid collaboration signaling data.');

    if (bundle.sessionId !== this._session.sessionId)
      throw new Error(`Signaling data is for session "${bundle.sessionId}", but the active session is "${this._session.sessionId}".`);

    let importedCount = 0;
    let ignoredCount = 0;

    for (const message of bundle.messages) {
      if (!this.isSignalingMessage(message)) {
        ignoredCount++;
        continue;
      }

      const handled = await this.handleSignalMessage(message);
      if (handled)
        importedCount++;
      else
        ignoredCount++;
    }

    return { importedCount, ignoredCount };
  }

  async attach(service: ICollaborationService) {
    this._service = service;
  }

  async detach() {
    await this.disconnect();
    this._service = null;
  }

  async connect(session: ICollaborationSession) {
    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('WebRTC collaboration is not available in this browser.');
      return;
    }

    await this.disconnect();
    this._session = session;
    this._localConnectionId = createRandomId();
    this.ensureBroadcastChannelState();

    if (!this.hasAvailableSignalingChannel())
      console.warn('WebRTC collaboration signaling is disabled. Enable manual or broadcast signaling to connect peers.');

    this.sendSignal({
      sessionId: session.sessionId,
      fromPeerId: session.peerId,
      type: 'hello',
      requestInitialSnapshot: this.shouldRequestInitialSnapshot()
    });
  }

  async disconnect() {
    if (this._session) {
      this.sendSignal({
        sessionId: this._session.sessionId,
        fromPeerId: this._session.peerId,
        type: 'bye'
      }, { includeManual: false });
    }

    if (this._broadcastSignalingChannel) {
      this._broadcastSignalingChannel.close();
      this._broadcastSignalingChannel = null;
    }

    for (const channel of this._dataChannels.values()) {
      try {
        channel.close();
      } catch {
      }
    }
    this._dataChannels.clear();

    for (const peerConnection of this._peerConnections.values()) {
      try {
        peerConnection.close();
      } catch {
      }
    }
    this._peerConnections.clear();
    this._pendingCandidates.clear();
    this._initiatedPeers.clear();
    this._peersNeedingInitialSnapshot.clear();
    this._manualSignalingMessages = [];
    this._processedSignalIds.clear();
    this._remoteConnectionIds.clear();
    this._localConnectionId = null;
    this._session = null;
  }

  async sendChange(change: ICollaborationRemoteChange, snapshot: ICollaborationDocumentSnapshot) {
    this.sendData({ type: 'change', change, snapshot });
  }

  async sendSelection(selection: { peerId: string; selectedNodeIndexes: number[]; primaryNodeIndex?: number; }) {
    this.sendData({ type: 'selection', selection });
  }

  async sendPresence(peer: { peerId: string; displayName?: string; color?: string; activeNodeIndex?: number; selectedNodeIndexes?: number[]; updatedAt: number; }) {
    this.sendData({ type: 'presence', peer });
  }

  async sendComment(change: { comment?: ICollaborationComment; commentId?: string; }) {
    if (change.comment)
      this.sendData({ type: 'comment-upsert', comment: change.comment });
    else if (change.commentId)
      this.sendData({ type: 'comment-remove', commentId: change.commentId });
  }

  private ensureBroadcastChannelState() {
    if (!this._session || !this._enabledSignalingChannels.has('broadcast-channel') || typeof BroadcastChannel === 'undefined') {
      if (this._broadcastSignalingChannel) {
        this._broadcastSignalingChannel.close();
        this._broadcastSignalingChannel = null;
      }
      return;
    }

    if (this._broadcastSignalingChannel)
      return;

    this._broadcastSignalingChannel = new BroadcastChannel(`wcd-collab:${this._session.sessionId}`);
    this._broadcastSignalingChannel.onmessage = event => {
      void this.handleSignalMessage(event.data as SignalingMessage);
    };
  }

  private hasAvailableSignalingChannel() {
    return this._enabledSignalingChannels.has('manual')
      || (this._enabledSignalingChannels.has('broadcast-channel') && typeof BroadcastChannel !== 'undefined');
  }

  private isSignalingMessage(message: Partial<SignalingMessage>): message is SignalingMessage {
    if (!message)
      return false;

    return typeof message.id === 'string'
      && typeof message.connectionId === 'string'
      && typeof message.createdAt === 'number'
      && typeof message.sessionId === 'string'
      && typeof message.fromPeerId === 'string'
      && (message.requestInitialSnapshot == null || typeof message.requestInitialSnapshot === 'boolean')
      && (message.type === 'hello'
        || message.type === 'hello-ack'
        || message.type === 'offer'
        || message.type === 'answer'
        || message.type === 'ice'
        || message.type === 'bye');
  }

  private rememberRemoteConnection(remotePeerId: string, connectionId: string) {
    const previousConnectionId = this._remoteConnectionIds.get(remotePeerId);
    if (previousConnectionId === connectionId)
      return;

    this.cleanupPeer(remotePeerId, false);
    this._remoteConnectionIds.set(remotePeerId, connectionId);
  }

  private shouldRequestInitialSnapshot() {
    const snapshot = this._service?.createSnapshot();
    return !snapshot?.html?.trim();
  }

  private updateInitialSnapshotRequest(remotePeerId: string, requestInitialSnapshot?: boolean) {
    if (requestInitialSnapshot)
      this._peersNeedingInitialSnapshot.add(remotePeerId);
    else
      this._peersNeedingInitialSnapshot.delete(remotePeerId);
  }

  private async handleSignalMessage(message: SignalingMessage) {
    if (!this._session || !message || message.sessionId !== this._session.sessionId || message.fromPeerId === this._session.peerId)
      return false;

    if (message.toPeerId && message.toPeerId !== this._session.peerId)
      return false;

    if (this._processedSignalIds.has(message.id))
      return false;
    this._processedSignalIds.add(message.id);

    const knownRemoteConnectionId = this._remoteConnectionIds.get(message.fromPeerId);
    const isHandshakeMessage = message.type === 'hello' || message.type === 'hello-ack';
    if (!isHandshakeMessage) {
      if (!knownRemoteConnectionId || knownRemoteConnectionId !== message.connectionId)
        return false;
    }

    switch (message.type) {
      case 'hello':
        this.rememberRemoteConnection(message.fromPeerId, message.connectionId);
        this.updateInitialSnapshotRequest(message.fromPeerId, message.requestInitialSnapshot);
        this.sendSignal({
          sessionId: this._session.sessionId,
          fromPeerId: this._session.peerId,
          toPeerId: message.fromPeerId,
          type: 'hello-ack',
          requestInitialSnapshot: this.shouldRequestInitialSnapshot()
        });
        if (this.shouldInitiate(message.fromPeerId))
          await this.ensureOffer(message.fromPeerId);
        else
          this.getOrCreatePeerConnection(message.fromPeerId);
        return true;
      case 'hello-ack':
        this.rememberRemoteConnection(message.fromPeerId, message.connectionId);
        this.updateInitialSnapshotRequest(message.fromPeerId, message.requestInitialSnapshot);
        if (this.shouldInitiate(message.fromPeerId))
          await this.ensureOffer(message.fromPeerId);
        return true;
      case 'offer':
        if (message.description)
          await this.acceptOffer(message.fromPeerId, message.description);
        return true;
      case 'answer':
        if (message.description)
          await this.acceptAnswer(message.fromPeerId, message.description);
        return true;
      case 'ice':
        if (message.candidate)
          await this.acceptIceCandidate(message.fromPeerId, message.candidate);
        return true;
      case 'bye':
        this.cleanupPeer(message.fromPeerId, false);
        this._remoteConnectionIds.delete(message.fromPeerId);
        this._service?.removePeer(message.fromPeerId, 'remote');
        return true;
    }
  }

  private shouldInitiate(remotePeerId: string) {
    if (!this._session)
      return false;
    return this._session.peerId.localeCompare(remotePeerId) < 0;
  }

  private getOrCreatePeerConnection(remotePeerId: string) {
    let peerConnection = this._peerConnections.get(remotePeerId);
    if (peerConnection)
      return peerConnection;

    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = event => {
      if (event.candidate && this._session) {
        this.sendSignal({
          sessionId: this._session.sessionId,
          fromPeerId: this._session.peerId,
          toPeerId: remotePeerId,
          type: 'ice',
          candidate: event.candidate.toJSON()
        });
      }
    };
    peerConnection.ondatachannel = event => {
      this.registerDataChannel(remotePeerId, event.channel);
    };
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'closed' || peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        this.cleanupPeer(remotePeerId, false);
        this._service?.removePeer(remotePeerId, 'remote');
      }
    };

    this._peerConnections.set(remotePeerId, peerConnection);
    return peerConnection;
  }

  private async ensureOffer(remotePeerId: string) {
    if (this._initiatedPeers.has(remotePeerId))
      return;

    const peerConnection = this.getOrCreatePeerConnection(remotePeerId);
    this._initiatedPeers.add(remotePeerId);

    if (!this._dataChannels.has(remotePeerId)) {
      const channel = peerConnection.createDataChannel('web-component-designer-collaboration');
      this.registerDataChannel(remotePeerId, channel);
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    if (!this._session)
      return;
    this.sendSignal({
      sessionId: this._session.sessionId,
      fromPeerId: this._session.peerId,
      toPeerId: remotePeerId,
      type: 'offer',
      description: peerConnection.localDescription?.toJSON() ?? offer
    });
  }

  private async acceptOffer(remotePeerId: string, description: RTCSessionDescriptionInit) {
    const peerConnection = this.getOrCreatePeerConnection(remotePeerId);
    await peerConnection.setRemoteDescription(description);
    await this.flushPendingCandidates(remotePeerId);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    if (!this._session)
      return;
    this.sendSignal({
      sessionId: this._session.sessionId,
      fromPeerId: this._session.peerId,
      toPeerId: remotePeerId,
      type: 'answer',
      description: peerConnection.localDescription?.toJSON() ?? answer
    });
  }

  private async acceptAnswer(remotePeerId: string, description: RTCSessionDescriptionInit) {
    const peerConnection = this.getOrCreatePeerConnection(remotePeerId);
    await peerConnection.setRemoteDescription(description);
    await this.flushPendingCandidates(remotePeerId);
  }

  private async acceptIceCandidate(remotePeerId: string, candidate: RTCIceCandidateInit) {
    const peerConnection = this.getOrCreatePeerConnection(remotePeerId);
    if (!peerConnection.remoteDescription) {
      const pending = this._pendingCandidates.get(remotePeerId) ?? [];
      pending.push(candidate);
      this._pendingCandidates.set(remotePeerId, pending);
      return;
    }

    await peerConnection.addIceCandidate(candidate);
  }

  private async flushPendingCandidates(remotePeerId: string) {
    const peerConnection = this._peerConnections.get(remotePeerId);
    const candidates = this._pendingCandidates.get(remotePeerId);
    if (!peerConnection || !candidates?.length)
      return;

    for (const candidate of candidates)
      await peerConnection.addIceCandidate(candidate);

    this._pendingCandidates.delete(remotePeerId);
  }

  private registerDataChannel(remotePeerId: string, channel: RTCDataChannel) {
    const previousChannel = this._dataChannels.get(remotePeerId);
    if (previousChannel && previousChannel !== channel) {
      try {
        previousChannel.close();
      } catch {
      }
    }

    channel.onopen = () => {
      void this.handleOpenChannel(remotePeerId);
    };
    channel.onmessage = event => {
      void this.handleDataMessage(remotePeerId, event.data);
    };
    channel.onclose = () => {
      if (this._dataChannels.get(remotePeerId) === channel)
        this._dataChannels.delete(remotePeerId);
    };

    this._dataChannels.set(remotePeerId, channel);
  }

  private async handleOpenChannel(remotePeerId: string) {
    if (!this._session || !this._service)
      return;

    const session = this._session;
    const service = this._service;

    this._manualSignalingMessages = this._manualSignalingMessages.filter(x => x.toPeerId !== remotePeerId);

    const localPeer = service.peers.find(x => x.peerId === session.peerId);
    if (localPeer)
      await this.sendPresence(localPeer);

    const currentSelection = localPeer?.selectedNodeIndexes?.length || localPeer?.activeNodeIndex != null
      ? {
          peerId: session.peerId,
          selectedNodeIndexes: [...(localPeer.selectedNodeIndexes ?? [])],
          primaryNodeIndex: localPeer.activeNodeIndex
        }
      : null;

    if (currentSelection)
      await this.sendSelection(currentSelection);

    if (this._peersNeedingInitialSnapshot.has(remotePeerId)) {
      this._peersNeedingInitialSnapshot.delete(remotePeerId);
      this.sendData({ type: 'snapshot', snapshot: service.createSnapshot() }, remotePeerId);
      for (const comment of service.comments)
        this.sendData({ type: 'comment-upsert', comment }, remotePeerId);
    }
  }

  private async handleDataMessage(remotePeerId: string, rawData: string) {
    if (!this._service)
      return;

    const message = JSON.parse(rawData) as DataMessage;

    switch (message.type) {
      case 'snapshot':
        await this._service.applyRemoteSnapshot(message.snapshot);
        break;
      case 'change':
        await this._service.applyRemoteChange(message.change, message.snapshot);
        break;
      case 'selection':
        this._service.updateRemoteSelection(remotePeerId, message.selection.selectedNodeIndexes ?? [], message.selection.primaryNodeIndex);
        break;
      case 'presence':
        this._service.updatePeerPresence({ ...message.peer, peerId: remotePeerId }, 'remote');
        break;
      case 'comment-upsert':
        this._service.upsertComment(message.comment, 'remote');
        break;
      case 'comment-remove':
        this._service.removeComment(message.commentId, 'remote');
        break;
    }
  }

  private sendSignal(
    message: Omit<SignalingMessage, 'id' | 'createdAt' | 'connectionId'>,
    options?: { includeBroadcast?: boolean; includeManual?: boolean; }
  ) {
    if (!this._localConnectionId)
      return;

    const signal: SignalingMessage = {
      ...message,
      id: createRandomId(),
      createdAt: Date.now(),
      connectionId: this._localConnectionId
    };

    this._processedSignalIds.add(signal.id);

    const includeBroadcast = options?.includeBroadcast ?? this._enabledSignalingChannels.has('broadcast-channel');
    if (includeBroadcast)
      this._broadcastSignalingChannel?.postMessage(signal);

    const includeManual = options?.includeManual ?? this._enabledSignalingChannels.has('manual');
    if (includeManual && signal.type !== 'bye')
      this.enqueueManualSignal(signal);
  }

  private enqueueManualSignal(signal: SignalingMessage) {
    if (signal.type === 'hello')
      this._manualSignalingMessages = this._manualSignalingMessages.filter(x => x.type !== 'hello');
    else if (signal.type === 'hello-ack' || signal.type === 'offer' || signal.type === 'answer')
      this._manualSignalingMessages = this._manualSignalingMessages.filter(x => !(x.type === signal.type && x.toPeerId === signal.toPeerId));

    this._manualSignalingMessages.push(cloneSignalingMessage(signal));
  }

  private sendData(message: DataMessage, remotePeerId?: string) {
    const payload = JSON.stringify(message);
    for (const [peerId, channel] of this._dataChannels) {
      if (remotePeerId && peerId !== remotePeerId)
        continue;
      if (channel.readyState === 'open')
        channel.send(payload);
    }
  }

  private cleanupPeer(remotePeerId: string, clearInitialSnapshotState: boolean = true) {
    const dataChannel = this._dataChannels.get(remotePeerId);
    if (dataChannel) {
      try {
        dataChannel.close();
      } catch {
      }
      this._dataChannels.delete(remotePeerId);
    }

    const peerConnection = this._peerConnections.get(remotePeerId);
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch {
      }
      this._peerConnections.delete(remotePeerId);
    }

    this._initiatedPeers.delete(remotePeerId);
    if (clearInitialSnapshotState)
      this._peersNeedingInitialSnapshot.delete(remotePeerId);
    this._pendingCandidates.delete(remotePeerId);
  }
}