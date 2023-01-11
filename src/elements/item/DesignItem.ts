import { ServiceContainer } from '../services/ServiceContainer.js';
import { IDesignItem } from './IDesignItem.js';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer.js';
import { CssStyleChangeAction } from '../services/undoService/transactionItems/CssStyleChangeAction.js';
import { ChangeGroup } from '../services/undoService/ChangeGroup.js';
import { NodeType } from './NodeType.js';
import { AttributeChangeAction } from '../services/undoService/transactionItems/AttributeChangeAction.js';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType.js';
import { IDesignerExtension } from '../widgets/designerView/extensions/IDesignerExtension.js';
import { CssAttributeParser } from '../helper/CssAttributeParser.js';
import { ISize } from '../../interfaces/ISize.js';
import { PropertiesHelper } from '../services/propertiesService/services/PropertiesHelper.js';
import { InsertChildAction } from '../services/undoService/transactionItems/InsertChildAction.js';
import { DomConverter } from '../widgets/designerView/DomConverter.js';
import { DeleteAction } from '../services/undoService/transactionItems/DeleteAction.js';
import { IDesignerExtensionProvider } from '../widgets/designerView/extensions/IDesignerExtensionProvider.js';
import { IStyleRule } from '../services/stylesheetService/IStylesheetService.js';

const hideAtDesignTimeAttributeName = 'node-projects-hide-at-design-time'
const hideAtRunTimeAttributeName = 'node-projects-hide-at-run-time'
const lockAtDesignTimeAttributeName = 'node-projects-lock-at-design-time'

export class DesignItem implements IDesignItem {

  public lastContainerSize: ISize;

  parsedNode: any;

  node: Node;
  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;
  appliedDesignerExtensions: Map<ExtensionType, IDesignerExtension[]> = new Map();
  shouldAppliedDesignerExtensions: Map<ExtensionType, IDesignerExtensionProvider[]> = new Map();

  async clone() {
    const html = DomConverter.ConvertToString([this], null, false);
    const parsed = await this.serviceContainer.htmlParserService.parse(html, this.serviceContainer, this.instanceServiceContainer);
    return parsed[0];
  }

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

  private _attributes: Map<string, string>
  public get hasAttributes() {
    return this._attributes.size > 0;
  }
  public hasAttribute(name: string) {
    return this._attributes.has(name);
  }
  public getAttribute(name: string) {
    return this._attributes.get(name);
  }
  public *attributes() {
    for (let s of this._attributes) {
      yield s;
    }
  }
  _withoutUndoSetAttribute(name: string, value: string) {
    this._attributes.set(name, value);
  }
  _withoutUndoRemoveAttribute(name: string) {
    this._attributes.delete(name);
  }

  private _styles: Map<string, string>
  public get hasStyles() {
    return this._styles.size > 0;
  }
  public hasStyle(name: string) {
    return this._styles.has(name);
  }
  public getStyle(name: string) {
    return this._styles.get(name);
  }
  public *styles() {
    for (let s of this._styles) {
      yield s;
    }
  }
  _withoutUndoSetStyle(name: string, value: string) {
    this._styles.set(name, value);
  }
  _withoutUndoRemoveStyle(name: string) {
    this._styles.delete(name);
  }

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
    this.setAttribute("id", value);
  }

  public get isRootItem(): boolean {
    return this.instanceServiceContainer.contentService.rootDesignItem === this;
  }

  _childArray: IDesignItem[] = [];
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

  public indexOf(designItem: IDesignItem): number {
    return this._childArray.indexOf(designItem);
  }

  public insertAdjacentElement(designItem: IDesignItem, where: InsertPosition) {
    let action: InsertChildAction;
    if (where == 'afterbegin') {
      action = new InsertChildAction(designItem, this, 0);
    } else if (where == 'beforeend') {
      action = new InsertChildAction(designItem, this, this._childArray.length);
    } else if (where == 'beforebegin') {
      action = new InsertChildAction(designItem, this.parent, this.parent.indexOf(this));
    } else if (where == 'afterend') {
      action = new InsertChildAction(designItem, this.parent, this.parent.indexOf(this) + 1);
    }
    this.instanceServiceContainer.undoService.execute(action);
  }

  public insertChild(designItem: IDesignItem, index?: number) {
    const action = new InsertChildAction(designItem, this, index);
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeChild(designItem: IDesignItem) {
    const action = new DeleteAction([designItem]);
    this.instanceServiceContainer.undoService.execute(action);
  }
  public remove() {
    const action = new DeleteAction([this]);
    this.instanceServiceContainer.undoService.execute(action);
  }
  public clearChildren() {
    for (let i = this._childArray.length - 1; i >= 0; i--) {
      let di = this._childArray[i];
      di.remove();
    }
  }

  //abstract text content to own property. so only change via designer api will use it.
  public get hasContent() {
    return this.nodeType == NodeType.TextNode || (this._childArray.length === 0 && this.content !== null);
  }
  public get content(): string {
    return this.node.textContent;
  }
  public set content(value: string) {
    this.node.textContent = value;
  }

  public get innerHTML(): string {
    return this.element.innerHTML;
  }
  public set innerHTML(value: string) {
    this.element.innerHTML = value;
    this.updateChildrenFromNodesChildren();
  }

  public get isEmptyTextNode(): boolean {
    return this.nodeType === NodeType.TextNode && this.content?.trim() == '';
  }

  private _hideAtDesignTime: boolean;
  public get hideAtDesignTime() {
    return this._hideAtDesignTime;
  }
  public set hideAtDesignTime(value: boolean) {
    this._hideAtDesignTime = value;
    if (value)
      this._attributes.set(hideAtDesignTimeAttributeName, "");
    else
      this._attributes.delete(hideAtDesignTimeAttributeName);
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.display = <any>this._styles.get('display') ?? "";
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
      this._attributes.set(hideAtRunTimeAttributeName, "");
    else
      this._attributes.delete(hideAtRunTimeAttributeName);
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.opacity = <any>this._styles.get('opacity') ?? "";
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
      this._attributes.set(lockAtDesignTimeAttributeName, "");
    else
      this._attributes.delete(lockAtDesignTimeAttributeName);
    if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
      if (!value)
        this.element.style.pointerEvents = 'auto';
      else
        this.element.style.pointerEvents = 'none';
    }
  }

  public static createDesignItemFromInstance(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): DesignItem {
    let designItem = new DesignItem(node, node, serviceContainer, instanceServiceContainer);

    if (designItem.nodeType == NodeType.Element) {
      for (let a of designItem.element.attributes) {
        if (a.name !== 'style') {
          designItem._attributes.set(a.name, a.value);
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
            designItem._styles.set(<string>e.name, e.value);
          }
        }
        if (!designItem._lockAtDesignTime) {
          requestAnimationFrame(() => node.style.pointerEvents = 'auto');
        } else
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
      for (const c of this.element.childNodes)
        this._childArray.push(DesignItem.createDesignItemFromInstance(c, this.serviceContainer, this.instanceServiceContainer));
    }
  }

  constructor(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    this.node = node;
    this.parsedNode = parsedNode;
    this.serviceContainer = serviceContainer;
    this.instanceServiceContainer = instanceServiceContainer;

    this._attributes = new Map();
    this._styles = new Map();

    DesignItem._designItemMap.set(node, this);
  }

  public openGroup(title: string): ChangeGroup {
    return this.instanceServiceContainer.undoService.openGroup(title);
  }

  public getOrCreateDesignItem(node: Node) {
    return DesignItem.GetOrCreateDesignItem(node, this.serviceContainer, this.instanceServiceContainer);
  }

  static GetOrCreateDesignItem(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    if (!node)
      return null;
    let designItem: IDesignItem = DesignItem._designItemMap.get(node);
    if (!designItem) {
      designItem = new DesignItem(node, node, serviceContainer, instanceServiceContainer);
    }
    return designItem;
  }

  static GetDesignItem(node: Node): IDesignItem {
    if (!node)
      return null;
    let designItem: IDesignItem = DesignItem._designItemMap.get(node);
    return designItem;
  }

  public setStyle(name: string, value?: string | null, important?: boolean) {
    let nm = PropertiesHelper.camelToDashCase(name);
    const action = new CssStyleChangeAction(this, nm, value, this._styles.get(nm));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeStyle(name: string) {
    let nm = PropertiesHelper.camelToDashCase(name);
    const action = new CssStyleChangeAction(this, nm, '', this._styles.get(nm));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public updateStyleInSheetOrLocal(name: string, value?: string | null, important?: boolean) {
    let nm = PropertiesHelper.camelToDashCase(name);

    const declaration = null;
    //const declaration = this.serviceContainer.stylesheetService?.getDeclarations(d, property);
    //const rules = this.serviceContainer.stylesheetService?.getAppliedRules(d, property);

    if (!declaration) {
      if (this.getStyle(nm) != value) {
        this.setStyle(nm, value);
      } else if (value == null) {
        this.removeStyle(nm)
      }
    }
    //todo -> modify stylesheet, or local css
    //we need undo for modification of stylesheet, look how we do this
    //maybe undo in stylsheet service?
  }
  
  public getAllStyles(): IStyleRule[] {
    const localStyles = [...this._styles.entries()].map(x => ({ name: x[0], value: x[1], important: false }));
    const rules = this.instanceServiceContainer.stylesheetService?.getAppliedRules(this);
    return [{ selector: null, declarations: localStyles, specificity: -1 }, ...rules];
  }

  public setAttribute(name: string, value?: string | null) {
    const action = new AttributeChangeAction(this, name, value, this._attributes.get(name));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeAttribute(name: string) {
    const action = new AttributeChangeAction(this, name, null, this._attributes.get(name));
    this.instanceServiceContainer.undoService.execute(action);
  }

  // Internal implementations wich don't use undo/redo

  public _insertChildInternal(designItem: IDesignItem, index?: number) {
    if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem)
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);

    if (designItem.parent) {
      designItem.parent._removeChildInternal(designItem);
    }

    if (index == null || this._childArray.length == 0 || index >= this._childArray.length) {
      this._childArray.push(designItem);
      this.element.appendChild(designItem.node);
    } else {
      let el = this._childArray[index];
      this.node.insertBefore(designItem.node, el.element)
      this._childArray.splice(index, 0, designItem);
    }

    //todo: is this still needed???
    if (this.instanceServiceContainer.selectionService.primarySelection == designItem)
      designItem.instanceServiceContainer.designerCanvas.extensionManager.applyExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
  }
  public _removeChildInternal(designItem: IDesignItem) {
    if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem)
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);

    designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtensions([designItem]);

    const index = this._childArray.indexOf(designItem);
    if (index > -1) {
      this._childArray.splice(index, 1);
      designItem.element.remove();
    }
  }
}