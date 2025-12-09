import { ServiceContainer } from '../services/ServiceContainer.js';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer.js';
import { ChangeGroup } from '../services/undoService/ChangeGroup.js';
import { NodeType } from './NodeType.js';
import { ISize } from "../../interfaces/ISize.js";
import { IStyleRule } from '../services/stylesheetService/IStylesheetService.js';
import { IPlacementService } from '../services/placementService/IPlacementService.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export interface IDesignItem {

  lastContainerSize: ISize;

  readonly window: Window & typeof globalThis;
  readonly document: Document;
  readonly usableContainer: ShadowRoot | Element | Document;
  updateChildrenFromNodesChildren();

  setView(node: Element);

  replaceNode(newNode: Node);
  nodeReplaced: TypedEvent<void>;
  clone(): Promise<IDesignItem>

  readonly nodeType: NodeType;

  readonly name: string;
  id: string;
  readonly isRootItem: boolean;

  readonly hasAttributes: boolean;
  readonly hasStyles: boolean;

  readonly hasChildren: boolean;
  children(recursive?: boolean): IterableIterator<IDesignItem>
  allMatching(selectors: string): IterableIterator<IDesignItem>
  readonly childCount: number;
  readonly firstChild: IDesignItem;
  readonly parent: IDesignItem;

  _insertChildsInternal(designItems: IDesignItem[], index?: number);
  _insertChildInternal(designItem: IDesignItem, index?: number);
  _removeChildInternal(designItem: IDesignItem);
  _withoutUndoSetStyle(name: string, value: string);
  _withoutUndoRemoveStyle(name: string);
  _withoutUndoSetAttribute(name: string, value: string);
  _withoutUndoRemoveAttribute(name: string);

  indexOf(designItem: IDesignItem): number;
  insertAdjacentElement(designItem: IDesignItem, where: InsertPosition);
  insertChild(designItem: IDesignItem, index?: number);
  removeChild(designItem: IDesignItem);
  remove();
  clearChildren();

  removeDesignerAttributesAndStylesFromChildren();

  editContent();
  editContentFinish();

  readonly hasContent: boolean;
  content: string;
  innerHTML?: string;
  readonly isEmptyTextNode: boolean;

  /** Could be a special node if another parser is used */
  readonly parsedNode: any;
  readonly node: Node;
  readonly element: Element;

  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;

  getOrCreateDesignItem(node: Node);

  openGroup(title: string): ChangeGroup

  styles(): Iterable<[name: string, value: string]>;
  getStyle(name: string): string
  hasStyle(name: string): boolean
  setStyle(name: string, value?: string | null, important?: boolean);
  setStyleAsync(name: string, value?: string | null, important?: boolean): Promise<void>;
  removeStyle(name: string);
  updateStyleInSheetOrLocal(name: string, value?: string | null, important?: boolean, forceSet?: boolean);
  updateStyleInSheetOrLocalAsync(name: string, value?: string | null, important?: boolean, forceSet?: boolean): Promise<void>;
  getStyleFromSheetOrLocal(name: string, fallback?: string);
  getStyleFromSheetOrLocalOrComputed(name: string, fallback?: string)
  getAllStyles(): IStyleRule[];

  readonly hasForcedCss: boolean;
  cssForceHover: boolean;
  cssForceActive: boolean;
  cssForceVisited: boolean;
  cssForceFocus: boolean;
  cssForceFocusWithin: boolean;
  cssForceFocusVisible: boolean;

  attributes(): Iterable<[name: string, value: string]>
  getAttribute(name: string): string
  hasAttribute(name: string): boolean
  setAttribute(name: string, value?: string | null);
  removeAttribute(name: string);

  setProperty(name: string, value?: any);
  setPropertyAndAttribute(name: string, value?: string | null);
  removePropertyAndAttribute(name: string);

  hideAtDesignTime: boolean;
  hideAtRunTime: boolean;
  lockAtDesignTime: boolean;

  getPlacementService(style?: CSSStyleDeclaration): IPlacementService;

  getComputedStyleProperty(name: string, fallback: string): string;
  getComputedStyle(): CSSStyleDeclaration;
  querySelectorAll<T extends HTMLElement>(selectors: string): NodeListOf<T>;
}