import { ServiceContainer } from '../services/ServiceContainer.js';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer.js';
import { ChangeGroup } from '../services/undoService/ChangeGroup.js';
import { NodeType } from './NodeType.js';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType.js';
import { IDesignerExtension } from '../widgets/designerView/extensions/IDesignerExtension.js';
import { ISize } from "../../interfaces/ISize.js";
import { IDesignerExtensionProvider } from '../widgets/designerView/extensions/IDesignerExtensionProvider.js';
import { IStyleRule } from '../services/stylesheetService/IStylesheetService.js';

export interface IDesignItem {

  lastContainerSize: ISize;

  replaceNode(newNode: Node);
  clone(): Promise<IDesignItem>

  readonly nodeType: NodeType

  readonly name: string;
  id: string;
  readonly isRootItem: boolean;

  readonly hasAttributes: boolean;
  readonly hasStyles: boolean;

  readonly hasChildren: boolean;
  children(): IterableIterator<IDesignItem>
  allMatching(selectors: string):IterableIterator<IDesignItem>
  readonly childCount: number;
  readonly firstChild: IDesignItem;
  readonly parent: IDesignItem;

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
  updateChildrenFromNodesChildren();

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
  appliedDesignerExtensions: Map<ExtensionType, IDesignerExtension[]>
  shouldAppliedDesignerExtensions: Map<ExtensionType, IDesignerExtensionProvider[]>

  getOrCreateDesignItem(node: Node);

  openGroup(title: string): ChangeGroup

  styles(): Iterable<[name: string, value: string]>;
  getStyle(name: string);
  hasStyle(name: string);
  setStyle(name: string, value?: string | null, important?: boolean);
  removeStyle(name: string);
  updateStyleInSheetOrLocal(name: string, value?: string | null, important?: boolean);
  getStyleFromSheetOrLocal(name: string, fallback?: string);
  getStyleFromSheetOrLocalOrComputed(name: string, fallback?: string)
  getAllStyles(): IStyleRule[];

  attributes(): Iterable<[name: string, value: string]>
  getAttribute(name: string)
  hasAttribute(name: string)
  setAttribute(name: string, value?: string | null);
  removeAttribute(name: string);

  hideAtDesignTime: boolean;
  hideAtRunTime: boolean;
  lockAtDesignTime: boolean;
}