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
import { enableStylesheetService } from '../widgets/designerView/extensions/buttons/StylesheetServiceDesignViewConfigButtons.js';
import { AbstractStylesheetService } from '../services/stylesheetService/AbstractStylesheetService.js';
import { TypedEvent, cssFromString } from '@node-projects/base-custom-webcomponent';
import { IPlacementService } from '../services/placementService/IPlacementService.js';

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
  nodeReplaced = new TypedEvent<void>;

  async clone() {
    try {
      const html = DomConverter.ConvertToString([this], false);
      const parsed = await this.serviceContainer.htmlParserService.parse(html, this.serviceContainer, this.instanceServiceContainer, true);
      return parsed[0];
    }
    catch (err) {
      //TODO: clone service for design item, maybe refactor copy&paste to use this also...
      console.warn("could not clone design item.", this);
    }
    return null;
  }

  *allMatching(selectors: string) {
    if (this.hasChildren) {
      for (let d of this.children()) {
        if (d.nodeType == NodeType.Element && d.element.matches(selectors))
          yield d;
        yield* d.allMatching(selectors);
      }
    }
  }

  public replaceNode(newNode: Node) {
    DesignItem._designItemMap.delete(this.node);
    DesignItem._designItemMap.set(newNode, this);
    this.node = newNode;
    this.nodeReplaced.emit();
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
  public getAttribute(name: string): string {
    return this._attributes.get(name);
  }
  public *attributes() {
    for (let s of this._attributes) {
      yield s;
    }
  }
  _withoutUndoSetAttribute(name: string, value: string) {
    this._attributes.set(name, value);
    this._reparseSpecialAttributes(name);
  }
  _withoutUndoRemoveAttribute(name: string) {
    this._attributes.delete(name);
    this._reparseSpecialAttributes(name);
  }

  _reparseSpecialAttributes(name: string) {
    if (name == hideAtDesignTimeAttributeName) {
      if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
        if (!this._attributes.has(hideAtDesignTimeAttributeName))
          this.element.style.display = <any>this._styles.get('display') ?? "";
        else
          this.element.style.display = 'none';
      }
    } else if (name == hideAtRunTimeAttributeName) {
      if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
        if (!this._attributes.has(hideAtRunTimeAttributeName))
          this.element.style.opacity = <any>this._styles.get('opacity') ?? "";
        else
          this.element.style.opacity = '0.3';
      }
    } else if (name == lockAtDesignTimeAttributeName) {
      if (this.element instanceof HTMLElement || this.element instanceof SVGElement) {
        if (!this._attributes.has(lockAtDesignTimeAttributeName))
          this.element.style.pointerEvents = 'auto';
        else
          this.element.style.pointerEvents = 'none';
      }
    }
  }

  private _styles: Map<string, string>
  public get hasStyles() {
    return this._styles.size > 0;
  }
  public hasStyle(name: string) {
    let nm = PropertiesHelper.camelToDashCase(name);
    return this._styles.has(nm);
  }
  public getStyle(name: string) {
    let nm = PropertiesHelper.camelToDashCase(name);
    return this._styles.get(nm);
  }
  public *styles() {
    for (let s of this._styles) {
      yield s;
    }
  }
  _withoutUndoSetStyle(name: string, value: string) {
    let nm = PropertiesHelper.camelToDashCase(name);
    this._styles.set(nm, value);
  }
  _withoutUndoRemoveStyle(name: string) {
    let nm = PropertiesHelper.camelToDashCase(name);
    this._styles.delete(nm);
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
  private _parent: IDesignItem;
  public get parent(): IDesignItem {
    return this._parent;
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
    if (!this.hasChildren)
      return this.node.textContent;
    else
      return this._childArray.map(x => x.content).join();
  }
  public set content(value: string) {
    const grp = this.openGroup('set content');
    this.clearChildren();
    let t = document.createTextNode(value);
    let di = DesignItem.GetOrCreateDesignItem(t, t, this.serviceContainer, this.instanceServiceContainer);
    if (this.nodeType == NodeType.TextNode) {
      const idx = this.parent.indexOf(this);
      const parent = this.parent;
      this.remove()
      parent.insertChild(di, idx);
    } else
      this.insertChild(di);
    grp.commit();
  }

  public get innerHTML(): string {
    return this.element.innerHTML;
  }
  public set innerHTML(value: string) {
    if (this.nodeType != NodeType.TextNode) {
      const grp = this.openGroup('set innerHTML');
      const range = document.createRange();
      range.selectNode(document.body);
      const fragment = range.createContextualFragment(value);
      for (const n of fragment.childNodes) {
        let di = DesignItem.GetOrCreateDesignItem(n, n, this.serviceContainer, this.instanceServiceContainer)
        this.insertChild(di);
      }
      grp.commit();
    }
  }

  public get isEmptyTextNode(): boolean {
    return this.nodeType === NodeType.TextNode && this.content?.trim() == '';
  }

  public get hideAtDesignTime() {
    return this.hasAttribute(hideAtDesignTimeAttributeName);
  }
  public set hideAtDesignTime(value: boolean) {
    if (value)
      this.setAttribute(hideAtDesignTimeAttributeName, "");
    else
      this.removeAttribute(hideAtDesignTimeAttributeName);
  }

  public get hideAtRunTime() {
    return this.hasAttribute(hideAtRunTimeAttributeName);
  }
  public set hideAtRunTime(value: boolean) {
    if (value)
      this.setAttribute(hideAtRunTimeAttributeName, "");
    else
      this.removeAttribute(hideAtRunTimeAttributeName);
  }

  public get lockAtDesignTime() {
    return this.hasAttribute(lockAtDesignTimeAttributeName);
  }
  public set lockAtDesignTime(value: boolean) {
    if (value)
      this.setAttribute(lockAtDesignTimeAttributeName, "")
    else
      this.removeAttribute(lockAtDesignTimeAttributeName);
  }

  public static createDesignItemFromInstance(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): DesignItem {
    let designItem = new DesignItem(node, node, serviceContainer, instanceServiceContainer);

    if (designItem.nodeType == NodeType.Element) {
      for (let a of designItem.element.attributes) {
        if (a.name !== 'style') {
          designItem._attributes.set(a.name, a.value);
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
        if (!designItem.lockAtDesignTime) {
          requestAnimationFrame(() => node.style.pointerEvents = 'auto');
        } else
          node.style.pointerEvents = 'none';
      }

      (<HTMLElement>node).draggable = false; //even if it should be true, for better designer exp.
    }

    designItem.updateChildrenFromNodesChildren();

    return designItem;
  }

  updateChildrenFromNodesChildren() {
    this._childArray = [];
    if (this.nodeType == NodeType.Element) {
      for (const c of this.element.childNodes) {
        const di = DesignItem.createDesignItemFromInstance(c, this.serviceContainer, this.instanceServiceContainer);
        this._childArray.push(di);
        (<DesignItem>di)._parent = this;
      }
    }
    this._refreshIfStyleSheet();
  }

  public constructor(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
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
    return DesignItem.GetOrCreateDesignItem(node, node, this.serviceContainer, this.instanceServiceContainer);
  }

  static GetOrCreateDesignItem(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
    if (!node)
      return null;
    let designItem: IDesignItem = DesignItem._designItemMap.get(node);
    if (!designItem) {
      let dis = serviceContainer.designItemService;
      if (dis)
        designItem = dis.createDesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
      else
        designItem = new DesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
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
    if (this.isRootItem)
      throw 'not allowed to set style on root item';
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

    // Pre-sorted by specificity
    let declarations = this.instanceServiceContainer.stylesheetService?.getDeclarations(this, nm);

    if (this.hasStyle(name) || this.instanceServiceContainer.designContext.extensionOptions[enableStylesheetService] === false || !declarations?.length) {
      // Set style locally
      if (this.getStyle(nm) != value) {
        this.setStyle(nm, value);
      } else if (value == null) {
        this.removeStyle(nm);
      }
    } else {
      this.instanceServiceContainer.stylesheetService.updateDeclarationValue(declarations[0], value, false);
    }
  }

  public getStyleFromSheetOrLocal(name: string, fallback: string = null) {
    let nm = PropertiesHelper.camelToDashCase(name);

    if (this.hasStyle(name))
      // Get style locally
      return this.getStyle(nm);

    // Pre-sorted by specificity
    let decls = this.instanceServiceContainer.stylesheetService?.getDeclarations(this, nm);
    if (decls && decls.length > 0)
      return decls[0].value;

    return null;
  }

  getStyleFromSheetOrLocalOrComputed(name: string, fallback: string = null) {
    let value = this.getStyleFromSheetOrLocal(name);
    if (!value) {
      value = getComputedStyle(this.element).getPropertyValue(name)
    }
    return value ?? fallback;
  }

  getComputedStyle(name: string, fallback: string = null) {
    let value = this.getStyleFromSheetOrLocal(name);
    if (!value) {
      value = getComputedStyle(this.element).getPropertyValue(name)
    }
    return value ?? fallback;
  }

  _stylesCache: IStyleRule[] = null;
  _cacheClearTimer: NodeJS.Timeout;

  public getAllStyles(): IStyleRule[] {
    let styles = this._stylesCache;
    if (styles)
      return styles;
    if (this.nodeType != NodeType.Element)
      return [];

    const localStyles = [...this._styles.entries()].map(x => ({ name: x[0], value: x[1], important: false, parent: null }));
    if (this.instanceServiceContainer.stylesheetService) {
      try {
        const rules = this.instanceServiceContainer.stylesheetService?.getAppliedRules(this);
        if (rules) {
          return [{ selector: null, declarations: localStyles, specificity: -1 }, ...rules];
        }
      }
      catch (err) { }
    }
    styles = [{ selector: null, declarations: localStyles, specificity: -1 }];
    this._stylesCache = styles;
    clearTimeout(this._cacheClearTimer);
    this._cacheClearTimer = setTimeout(() => this._stylesCache = null, 30);
    return styles;
  }

  public setAttribute(name: string, value?: string | null) {
    if (this.isRootItem)
      throw 'not allowed to set attribute on root item';
    const action = new AttributeChangeAction(this, name, value, this._attributes.get(name));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public removeAttribute(name: string) {
    const action = new AttributeChangeAction(this, name, null, this._attributes.get(name));
    this.instanceServiceContainer.undoService.execute(action);
  }

  // Internal implementations wich don't use undo/redo

  public _insertChildInternal(designItem: IDesignItem, index?: number) {
    if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem) {
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainerAndCanBeEntered);
    }
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
    (<DesignItem>designItem)._parent = this;

    //todo: is this still needed???
    if (this.instanceServiceContainer.selectionService.primarySelection == designItem) {
      designItem.instanceServiceContainer.designerCanvas.extensionManager.applyExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
      if (designItem.getPlacementService().isEnterableContainer(this))
        designItem.instanceServiceContainer.designerCanvas.extensionManager.applyExtension(designItem.parent, ExtensionType.PrimarySelectionContainerAndCanBeEntered);
    }
    this._refreshIfStyleSheet();
  }
  public _removeChildInternal(designItem: IDesignItem) {
    if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem) {
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
      designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionAndCanBeEntered);
    }

    designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtensions([designItem], true);

    const index = this._childArray.indexOf(designItem);
    if (index > -1) {
      this._childArray.splice(index, 1);
      designItem.element.remove();
      (<DesignItem>designItem)._parent = null;
    }

    this._refreshIfStyleSheet();
  }

  _refreshIfStyleSheet() {
    if (this.name == 'style' || this.parent?.name == 'style') {
      //Update Stylesheetservice with sheet info
      //Patch this sheetdata

      const realContent = this._childArray.reduce((a, b) => a + b.content, '');
      this.node.textContent = AbstractStylesheetService.buildPatchedStyleSheet([cssFromString(realContent)]);
      this.instanceServiceContainer.designerCanvas.lazyTriggerReparseDocumentStylesheets();
    } else if (this.name == 'link') {

    }
  }

  getPlacementService(style?: CSSStyleDeclaration): IPlacementService {
    if (this.nodeType != NodeType.Element)
      return null;
    style ??= getComputedStyle(this.element);
    return this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this, style));
  }

  static createDesignItemFromImageBlob(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, data: Blob): Promise<IDesignItem> {
    return new Promise<IDesignItem>(resolve => {
      let reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement('img');
        img.src = <string>reader.result;
        const di = DesignItem.createDesignItemFromInstance(img, serviceContainer, instanceServiceContainer);
        return resolve(di)
      }
      reader.readAsDataURL(data);
    })
  }
}