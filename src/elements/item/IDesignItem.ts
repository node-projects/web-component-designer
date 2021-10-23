import { ServiceContainer } from "../services/ServiceContainer";
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';
import { ChangeGroup } from "../services/undoService/ChangeGroup";
import { NodeType } from './NodeType';
import { ExtensionType } from "../widgets/designerView/extensions/ExtensionType";
import { IDesignerExtension } from "../widgets/designerView/extensions/IDesignerExtension";
import { IBinding } from "../services/bindingsService/IBinding";

export interface IDesignItem {

  replaceNode(newNode: Node);

  readonly nodeType: NodeType

  readonly name: string
  readonly id: string

  readonly hasAttributes: boolean;
  readonly attributes: Map<string, string|IBinding>

  readonly hasStyles: boolean;
  readonly styles: Map<string, string|IBinding>

  readonly hasChildren: boolean;
  children(): IterableIterator<IDesignItem>
  readonly childCount: number;
  readonly firstChild: IDesignItem;
  readonly parent: IDesignItem;

  insertChild(designItem: IDesignItem, index?: number);
  removeChild(designItem: IDesignItem);
  remove();
  clearChildren();
  updateChildrenFromNodesChildren();

  readonly hasContent: boolean;
  content: string

  readonly node: Node;
  readonly element: Element;

  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;
  appliedDesignerExtensions: Map<ExtensionType, IDesignerExtension[]>

  getOrCreateDesignItem(node: Node);

  openGroup(title: string, affectedItems?: IDesignItem[]): ChangeGroup
  
  setStyle(name: keyof CSSStyleDeclaration, value?: string | null);
  removeStyle(name: keyof CSSStyleDeclaration);

  setAttribute(name: string, value?: string | null);
  removeAttribute(name: string);

  hideAtDesignTime: boolean;
  hideAtRunTime: boolean;
  lockAtDesignTime: boolean;
}