import { ServiceContainer } from '../services/ServiceContainer';
import { IDesignItem } from './IDesignItem';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';
import { CssStyleChangeAction } from '../services/undoService/transactionItems/CssStyleChangeAction';
import { ChangeGroup } from '../services/undoService/ChangeGroup';
import { NodeType } from './NodeType';
import { AttributeChangeAction } from '../services/undoService/transactionItems/AttributeChangeAction';
//import { PropertyChangeAction } from '../services/undoService/transactionItems/PropertyChangeAction';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType';
import { IDesignerExtension } from '../widgets/designerView/extensions/IDesignerExtension';
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper';
import { CssAttributeParser } from '../helper/CssAttributeParser.js';

const hideAtDesignTimeAttributeName = 'node-projects-hide-at-design-time'
const hideAtRunTimeAttributeName = 'node-projects-hide-at-run-time'
const lockAtDesignTimeAttributeName = 'node-projects-lock-at-design-time'

export class DesignItem implements IDesignItem {
  node: Node;
  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;
  appliedDesignerExtensions: Map<ExtensionType, IDesignerExtension[]> = new Map();

  public replaceNode(newNode: Node) {
    DesignItem._designItemMap.delete(this.node);
    DesignItem._designItemMap.set(newNode, this);
    this.node = newNode;
  }

  public get nodeType(): NodeType {
    if (this.node instanceof Comment)
      return NodeType.Comment;
    if (this.node instanceof Text)
      return NodeType.TextNode;
    return NodeType.Element;
  }

  public get hasAttributes() {
    return this.attributes.size > 0;
  }
  public attributes: Map<string, string>

  public get hasStyles() {
    return this.styles.size > 0;
  }
  public styles: Map<string, string>

  private static _designItemMap = new WeakMap<Node, IDesignItem>();

  public get element(): Element {
    return <Element>this.node;
  }

  public get name() {
    return this.element.localName;
  }

  public get id(): string {
    return this.element.id;
  }
  public set id(value: string) {
    this.element.id = value;
  }

  public get isRootItem(): boolean {
    return this.instanceServiceContainer.contentService.rootDesignItem === this;
  }

  private _childArray: IDesignItem[] = [];
  public get hasChildren() {
    return this._childArray.length > 0;
  }
  public *children(): IterableIterator<IDesignItem> {
    for (const e of this._childArray) {
      yield e;
    }
  }
  public get childCount(): number {
    return this._childArray.length;
  }
  public get firstChild(): IDesignItem {
    return this._childArray[0];
  }
  public get parent(): IDesignItem {
    return this.getOrCreateDesignItem(this.element.parentNode);
  }
  public insertChild(designItem: IDesignItem, index?: number) {
    //todo... via undoredo system....
    if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem)
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);

    if (designItem.parent) {
      designItem.parent.removeChild(designItem);
    }
    this.removeChild(designItem);


    if (index == null || this._childArray.length == 0 || index >= this._childArray.length) {
      this._childArray.push(designItem);
      this.element.appendChild(designItem.node);
    } else {
      let el = this._childArray[index];
      this.node.insertBefore(designItem.node, el.element)
      this._childArray.splice(index, 0, designItem);
    }

    if (this.instanceServiceContainer.selectionService.primarySelection == designItem)
      designItem.instanceServiceContainer.designerCanvas.extensionManager.applyExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
  }
  public removeChild(designItem: IDesignItem) {
    //todo... via undoredo system....

    if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem)
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);

    const index = this._childArray.indexOf(designItem);
    if (index > -1) {
      this._childArray.splice(index, 1);
      designItem.element.remove();
    }
  }
  public remove() {
    this.parent.removeChild(this);
  }
  public clearChildren() {
    this._childArray = [];
    DomHelper.removeAllChildnodes(this.element);
  }

  //abstract text content to own property. so only chnage via designer api will use it.
  public get hasContent() {
    return this.nodeType == NodeType.TextNode || (this._childArray.length === 0 && this.content !== null);
  }
  public get content(): string {
    return this.node.textContent;
  }
  public set content(value: string) {
    this.node.textContent = value;
  }

  private _hideAtDesignTime: boolean;
  public get hideAtDesignTime() {
    return this._hideAtDesignTime;
  }
  public set hideAtDesignTime(value: boolean) {
    this._hideAtDesignTime = value;
    if (value)
      this.attributes.set(hideAtDesignTimeAttributeName, "");
    else
      this.attributes.delete(hideAtDesignTimeAttributeName);
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.display = <any>this.styles.get('display') ?? "";
      else
        this.element.style.display = 'none';
    }
  }

  private _hideAtRunTime: boolean;
  public get hideAtRunTime() {
    return this._hideAtRunTime;
  }
  public set hideAtRunTime(value: boolean) {
    this._hideAtRunTime = value;
    if (value)
      this.attributes.set(hideAtRunTimeAttributeName, "");
    else
      this.attributes.delete(hideAtRunTimeAttributeName);
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.opacity = <any>this.styles.get('opacity') ?? "";
      else
        this.element.style.opacity = '0.3';
    }
  }

  private _lockAtDesignTime: boolean;
  public get lockAtDesignTime() {
    return this._lockAtDesignTime;
  }
  public set lockAtDesignTime(value: boolean) {
    this._lockAtDesignTime = value;
    if (value)
      this.attributes.set(lockAtDesignTimeAttributeName, "");
    else
      this.attributes.delete(lockAtDesignTimeAttributeName);
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.pointerEvents = 'auto';
      else
        this.element.style.pointerEvents = 'none';
    }
  }

  public static createDesignItemFromInstance(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): DesignItem {
    let designItem = new DesignItem(node, serviceContainer, instanceServiceContainer);

    if (designItem.nodeType == NodeType.Element) {
      for (let a of designItem.element.attributes) {
        if (a.name !== 'style') {
          designItem.attributes.set(a.name, a.value);
          if (a.name === hideAtDesignTimeAttributeName)
            designItem._hideAtDesignTime = true;
          if (a.name === hideAtRunTimeAttributeName)
            designItem._hideAtRunTime = true;
          if (a.name === lockAtDesignTimeAttributeName)
            designItem._lockAtDesignTime = true;
        }
      }

      if (node instanceof HTMLElement || node instanceof SVGElement) {
        const cssParser = new CssAttributeParser();
        const st = node.getAttribute("style");
        if (st) {
          cssParser.parse(st);
          for (let e of cssParser.entries) {
            designItem.styles.set(<string>e.name, e.value);
          }
        }
        if (!designItem._lockAtDesignTime)
          node.style.pointerEvents = 'auto';
        else
          node.style.pointerEvents = 'none';

        //node.style.cursor = 'pointer';
      }

      (<HTMLElement>node).draggable = false; //even if it should be true, for better designer exp.
    }

    designItem.updateChildrenFromNodesChildren();

    return designItem;
  }

  updateChildrenFromNodesChildren() {
    this._childArray = [];
    if (this.nodeType == NodeType.Element) {
      if (this.element.children && this.element.children.length === 0 && this.element.childNodes.length <= 1)
        this.content = this.element.textContent; //was soll das bringen???
      else {
        for (const c of this.element.childNodes)
          this._childArray.push(DesignItem.createDesignItemFromInstance(c, this.serviceContainer, this.instanceServiceContainer));
      }
    }
  }

  constructor(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    this.node = node;
    this.serviceContainer = serviceContainer;
    this.instanceServiceContainer = instanceServiceContainer;

    this.attributes = new Map();
    this.styles = new Map();

    DesignItem._designItemMap.set(node, this);
  }

  public openGroup(title: string, affectedItems?: IDesignItem[]): ChangeGroup {
    return this.instanceServiceContainer.undoService.openGroup(title, affectedItems);
  }

  public getOrCreateDesignItem(node: Node) {
    return DesignItem.GetOrCreateDesignItem(node, this.serviceContainer, this.instanceServiceContainer);
  }

  static GetOrCreateDesignItem(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    if (!node)
      return null;
    let designItem: IDesignItem = DesignItem._designItemMap.get(node);
    if (!designItem) {
      designItem = new DesignItem(node, serviceContainer, instanceServiceContainer);
    }
    return designItem;
  }

  static GetDesignItem(node: Node): IDesignItem {
    if (!node)
      return null;
    let designItem: IDesignItem = DesignItem._designItemMap.get(node);
    return designItem;
  }

  public setStyle(name: keyof CSSStyleDeclaration, value?: string | null) {
    const action = new CssStyleChangeAction(this, name, value, this.styles.get(<string>name));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeStyle(name: keyof CSSStyleDeclaration) {
    const action = new CssStyleChangeAction(this, name, '', this.styles.get(<string>name));
    this.instanceServiceContainer.undoService.execute(action);
  }

  public setAttribute(name: string, value?: string | null) {
    const action = new AttributeChangeAction(this, name, value, this.attributes.get(name));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeAttribute(name: string) {
    const action = new AttributeChangeAction(this, name, null, this.attributes.get(name));
    this.instanceServiceContainer.undoService.execute(action);
  }

  /*
  public setProperty(name: string, value?: string | null) {
    const propService = this.serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(this));
    const property = propService.getProperty(this, name);
    const oldValue = propService.getValue([this], property)
    const action = new PropertyChangeAction(this, property, value, oldValue);
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeProperty(name: string, value?: string | null) {
    const propService = this.serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(this));
    const property = propService.getProperty(this, name);
    const oldValue = propService.getValue([this], property)
    const action = new PropertyChangeAction(this, property, undefined, oldValue);
    this.instanceServiceContainer.undoService.execute(action);
  }
  */
}