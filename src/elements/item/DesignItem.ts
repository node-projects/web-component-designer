import { ServiceContainer } from '../services/ServiceContainer';
import { IDesignItem } from './IDesignItem';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';
import { CssStyleChangeAction } from '../services/undoService/transactionItems/CssStyleChangeAction';
import { ChangeGroup } from '../services/undoService/ChangeGroup';
import { NodeType } from './NodeType';
import { AttributeChangeAction } from '../services/undoService/transactionItems/AttributeChangeAction';
import { PropertyChangeAction } from '../services/undoService/transactionItems/PropertyChangeAction';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType';
import { IDesignerExtension } from '../widgets/designerView/extensions/IDesignerExtension';

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

  public get hasChildren() {
    return this.element.childNodes.length > 0;
  }
  public *children(): IterableIterator<IDesignItem> {
    for (const e of this.element.childNodes) {
      yield DesignItem.GetOrCreateDesignItem(e, this.serviceContainer, this.instanceServiceContainer);
    }
  }
  public get childCount(): number {
    return this.element.childNodes.length;
  }
  public get firstChild(): IDesignItem {
    return this.getOrCreateDesignItem(this.element.childNodes[0]);
  }
  public get parent(): IDesignItem {
    return this.getOrCreateDesignItem(this.element.parentNode);
  }

  public get hasContent() {
    return this.nodeType == NodeType.TextNode || (this.element.childNodes.length === 0 && this.content !== null);
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
        this.element.style.display = this.styles.get('display') ?? "";
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
        this.element.style.opacity = this.styles.get('opacity') ?? "";
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
      for (let s of node.style) {
        let val = node.style[s];
        if (val && typeof val === 'string')
          designItem.styles.set(s, node.style[s]);
      }
      if (!designItem._lockAtDesignTime)
        node.style.pointerEvents = 'auto';
      else
        node.style.pointerEvents = 'none';

      //node.style.cursor = 'pointer';
    }

    (<HTMLElement>node).draggable = false; //even if it should be true, for better designer exp.

    if (designItem.element.children.length === 0)
      designItem.content = designItem.element.textContent;

    return designItem;
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
}