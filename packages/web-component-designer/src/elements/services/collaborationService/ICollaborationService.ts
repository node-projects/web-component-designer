import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IStylesheet } from '../stylesheetService/IStylesheetService.js';
import { IUndoChangeEvent, UndoChangeKind, UndoChangeSource } from '../undoService/IUndoChangeEvent.js';
import { IService } from '../IService.js';

export type CollaborationConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface ICollaborationPeerPresence {
  peerId: string;
  displayName?: string;
  color?: string;
  activeDesignItemId?: string;
  selectedDesignItemIds?: string[];
  activeNodeIndex?: number;
  selectedNodeIndexes?: number[];
  cursorPosition?: { x: number, y: number };
  updatedAt: number;
}

export interface ICollaborationComment {
  id: string;
  targetDesignItemId?: string;
  targetNodeIndex?: number;
  text: string;
  authorPeerId: string;
  createdAt: number;
  updatedAt: number;
  resolved?: boolean;
}

export interface ICollaborationSession {
  sessionId: string;
  peerId: string;
  displayName?: string;
}

export interface ICollaborationStateChangedEvent {
  state: CollaborationConnectionState;
  session?: ICollaborationSession;
}

export interface ICollaborationSelectionEvent {
  source: UndoChangeSource;
  peerId: string;
  selectedNodeIndexes: number[];
  primaryNodeIndex?: number;
  selectedDesignItemIds: string[];
  primaryDesignItemId?: string;
}

export interface ICollaborationDocumentSnapshot {
  html: string;
  stylesheets: IStylesheet[];
  updatedAt: number;
}

export interface ICollaborationRemoteChange {
  kind: UndoChangeKind;
  title?: string;
}

export interface ICollaborationPeersChangedEvent {
  source: UndoChangeSource;
  peer?: ICollaborationPeerPresence;
  peerId?: string;
  peers: readonly ICollaborationPeerPresence[];
}

export interface ICollaborationCommentsChangedEvent {
  source: UndoChangeSource;
  comment?: ICollaborationComment;
  commentId?: string;
  comments: readonly ICollaborationComment[];
}

export interface ICollaborationTransport {
  attach(service: ICollaborationService): void | Promise<void>;
  detach(): void | Promise<void>;
  connect(session: ICollaborationSession): void | Promise<void>;
  disconnect(): void | Promise<void>;
  sendChange(change: ICollaborationRemoteChange, snapshot: ICollaborationDocumentSnapshot): void | Promise<void>;
  sendSelection(selection: ICollaborationSelectionEvent): void | Promise<void>;
  sendPresence(peer: ICollaborationPeerPresence): void | Promise<void>;
  sendComment(change: ICollaborationCommentsChangedEvent): void | Promise<void>;
}

export interface ICollaborationService extends IService {
  readonly state: CollaborationConnectionState;
  readonly session: ICollaborationSession;
  readonly peers: readonly ICollaborationPeerPresence[];
  readonly comments: readonly ICollaborationComment[];
  readonly transport: ICollaborationTransport;
  readonly isApplyingRemoteChanges: boolean;

  attachTransport(transport: ICollaborationTransport): void;
  detachTransport(): void;
  connect(sessionId: string, peerId: string, displayName?: string): void;
  disconnect(): void;
  createSnapshot(): ICollaborationDocumentSnapshot;
  applyRemoteSnapshot(snapshot: ICollaborationDocumentSnapshot): Promise<void>;
  applyRemoteChange(change: ICollaborationRemoteChange, snapshot?: ICollaborationDocumentSnapshot): Promise<void>;
  updateRemoteSelection(peerId: string, selectedNodeIndexes: number[], primaryNodeIndex?: number): void;
  updatePeerPresence(peer: ICollaborationPeerPresence, source?: UndoChangeSource): void;
  removePeer(peerId: string, source?: UndoChangeSource): void;
  upsertComment(comment: ICollaborationComment, source?: UndoChangeSource): void;
  removeComment(commentId: string, source?: UndoChangeSource): void;

  readonly onStateChanged: TypedEvent<ICollaborationStateChangedEvent>;
  readonly onChange: TypedEvent<IUndoChangeEvent>;
  readonly onSelectionChanged: TypedEvent<ICollaborationSelectionEvent>;
  readonly onPeersChanged: TypedEvent<ICollaborationPeersChangedEvent>;
  readonly onCommentsChanged: TypedEvent<ICollaborationCommentsChangedEvent>;
}