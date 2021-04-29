import { ServiceContainer } from '../services/ServiceContainer';
import { IDesignItem } from './IDesignItem';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';
import { CssStyleChangeAction } from '../services/undoService/transactionItems/CssStyleChangeAction';
import { ChangeGroup } from '../services/undoService/ChangeGroup';
import { NodeType } from './NodeType';

export class DesignItem implements IDesignItem {
  node: Node;
  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;

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
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.display = this.styles['display'];
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
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.opacity = this.styles['opacity'];
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
        if (a.name === 'node-projects-hide-at-design-time')
          designItem._hideAtDesignTime = true;
        if (a.name === 'node-projects-hide-at-run-time')
          designItem._hideAtRunTime = true;
        if (a.name === 'node-projects-lock-at-design-time')
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

  public setStyle(name: keyof CSSStyleDeclaration, value?: string | null) {
    let action = new CssStyleChangeAction(this, name, value, this.styles.get(<string>name));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeStyle(name: keyof CSSStyleDeclaration) {
    let action = new CssStyleChangeAction(this, name, '', this.styles.get(<string>name));
    this.instanceServiceContainer.undoService.execute(action);
  }

  public setAttribute(name: string, value?: string | null) {
    this.attributes.set(name, value);
    if (name != "draggable") {
      this.element.setAttribute(name, value);
    }
  }
  public removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name != "draggable") {
      this.element.removeAttribute(name);
    }
  }
}