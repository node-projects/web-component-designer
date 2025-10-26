import { ServiceContainer } from '../services/ServiceContainer.js';
import { IDesignItem } from './IDesignItem.js';
import { InstanceServiceContainer } from '../services/InstanceServiceContainer.js';
import { CssStyleChangeAction } from '../services/undoService/transactionItems/CssStyleChangeAction.js';
import { ChangeGroup } from '../services/undoService/ChangeGroup.js';
import { NodeType } from './NodeType.js';
import { AttributeChangeAction } from '../services/undoService/transactionItems/AttributeChangeAction.js';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType.js';
import { CssAttributeParser } from '../helper/CssAttributeParser.js';
import { ISize } from '../../interfaces/ISize.js';
import { PropertiesHelper } from '../services/propertiesService/services/PropertiesHelper.js';
import { InsertChildAction } from '../services/undoService/transactionItems/InsertChildAction.js';
import { DomConverter } from '../widgets/designerView/DomConverter.js';
import { IStyleRule } from '../services/stylesheetService/IStylesheetService.js';
import { enableStylesheetService } from '../widgets/designerView/extensions/buttons/StylesheetServiceDesignViewConfigButtons.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IPlacementService } from '../services/placementService/IPlacementService.js';
import { TextContentChangeAction } from '../services/undoService/transactionItems/TextContentChangeAction.js';
import { PropertyChangeAction } from '../services/undoService/transactionItems/PropertyChangeAction.js';
import { deepValue } from '../helper/Helper.js';

export const hideAtDesignTimeAttributeName = 'node-projects-hide-at-design-time';
export const hideAtRunTimeAttributeName = 'node-projects-hide-at-run-time';
export const lockAtDesignTimeAttributeName = 'node-projects-lock-at-design-time';

export const forceHoverAttributeName = 'node-projects-force-hover';
export const forceActiveAttributeName = 'node-projects-force-active';
export const forceVisitedAttributeName = 'node-projects-force-visited';
export const forceFocusAttributeName = 'node-projects-force-focus';
export const forceFocusWithinAttributeName = 'node-projects-force-focus-within';
export const forceFocusVisibleAttributeName = 'node-projects-force-focus-visible';

export class DesignItem implements IDesignItem {

  public lastContainerSize: ISize;

  parsedNode: any;

  node: Node;
  view: Node;
  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;
  nodeReplaced = new TypedEvent<void>;

  get window() {
    if (this.isRootItem && this.node instanceof HTMLIFrameElement)
      return this.node.contentDocument.defaultView;
    return (this.node.ownerDocument.defaultView ?? window);
  }

  get document() {
    if (this.isRootItem && this.node instanceof HTMLIFrameElement)
      return this.node.contentDocument;
    return this.node.ownerDocument;
  }

  get usableContainer() {
    if (this.isRootItem && this.element instanceof (this.element.ownerDocument.defaultView ?? window).HTMLIFrameElement)
      return this.element.contentWindow.document;
    else if (this.isRootItem)
      return (<HTMLElement>this.node).shadowRoot;
    return this.element;
  }

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
    if (this.view == this.node)
      this.view = newNode;
    this.node = newNode;
    this.nodeReplaced.emit();
  }

  public get nodeType(): NodeType {
    if (this.node instanceof (this.node.ownerDocument.defaultView ?? window).Comment)
      return NodeType.Comment;
    if (this.node instanceof (this.node.ownerDocument.defaultView ?? window).Text)
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
    this.serviceContainer.designItemService.handleSpecialAttributes(name, this);
  }
  _withoutUndoRemoveAttribute(name: string) {
    this._attributes.delete(name);
    this.serviceContainer.designItemService.handleSpecialAttributes(name, this);
  }

  private _styles: Map<string, string>
  public get hasStyles() {
    return this._styles.size > 0;
  }
  public hasStyle(name: string) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    return this._styles.has(nm);
  }
  public getStyle(name: string) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    return this._styles.get(nm);
  }
  public *styles() {
    for (let s of this._styles) {
      yield s;
    }
  }
  _withoutUndoSetStyle(name: string, value: string) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    this._styles.set(nm, value);
  }
  _withoutUndoRemoveStyle(name: string) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    this._styles.delete(nm);
  }

  private static _designItemMap = new WeakMap<Node, IDesignItem>();

  public get element(): Element {
    return <Element>this.view;
  }

  public get name() {
    return (<Element>this.node).localName;
  }

  public get id(): string {
    return this.element.id;
  }
  public set id(value: string) {
    this.element.id = value;
    if (this.id)
      this.setAttribute("id", value);
    else
      this.removeAttribute("id")
  }

  public get isRootItem(): boolean {
    return this.instanceServiceContainer.contentService.rootDesignItem === this;
  }

  *childrenRect(selectors: string) {
    if (this.hasChildren) {
      for (let d of this.children()) {
        if (d.nodeType == NodeType.Element && d.element.matches(selectors))
          yield d;
        yield* d.allMatching(selectors);
      }
    }
  }

  _childArray: IDesignItem[] = [];
  public get hasChildren() {
    return this._childArray.length > 0;
  }
  public *children(recursive: boolean = false): IterableIterator<IDesignItem> {
    for (const e of this._childArray) {
      yield e;
      if (recursive) {
        for (const c of e.children(recursive)) {
          yield c;
        }
      }
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
    this.serviceContainer.deletionService.removeItems([designItem]);
  }
  public remove() {
    this.serviceContainer.deletionService.removeItems([this]);
  }
  public clearChildren() {
    for (let i = this._childArray.length - 1; i >= 0; i--) {
      let di = this._childArray[i];
      di.remove();
    }
  }

  //abstract text content to own property. so only change via designer api will use it.
  public get hasContent() {
    return ((this.nodeType == NodeType.TextNode || this.nodeType == NodeType.Comment) && this.element.textContent != "") || (this._childArray.length === 0);
  }
  public get content(): string {
    if (this.nodeType == NodeType.TextNode || this.nodeType == NodeType.Comment)
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
    } else if (this.nodeType == NodeType.Comment) {
      const action = new TextContentChangeAction(this, value, this.content);
      this.instanceServiceContainer.undoService.execute(action);
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
      this.clearChildren();
      const range = document.createRange();
      range.selectNode(document.body);
      const fragment = range.createContextualFragment(value);
      for (const n of [...fragment.childNodes]) {
        let di = DesignItem.createDesignItemFromInstance(n, this.serviceContainer, this.instanceServiceContainer)
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
    let designItem = <DesignItem>serviceContainer.designItemService.createDesignItem(node, node, serviceContainer, instanceServiceContainer);

    if (node instanceof (node.ownerDocument.defaultView ?? window).HTMLTemplateElement && node.getAttribute('shadowrootmode') == 'open') {
      try {
        const shadow = (<HTMLElement>node.parentNode).attachShadow({ mode: 'open' });
        shadow.appendChild(node.content.cloneNode(true));
      } catch (err) {
        console.error("error attaching shadowdom", err)
      }
    }

    if (designItem.nodeType == NodeType.Element) {
      for (let a of designItem.element.attributes) {
        if (a.name !== 'style') {
          designItem._attributes.set(a.name, a.value);
        }
      }

      if (node instanceof (node.ownerDocument.defaultView ?? window).HTMLElement || node instanceof (node.ownerDocument.defaultView ?? window).SVGElement) {
        const cssParser = new CssAttributeParser();
        const st = node.getAttribute("style");
        if (st) {
          cssParser.parse(st);
          for (let e of cssParser.entries) {
            designItem._styles.set(<string>e.name, e.value);
          }
        }
        serviceContainer.designItemService.handleSpecialAttributes(lockAtDesignTimeAttributeName, designItem);
      }

      (<HTMLElement>node).draggable = false; //even if it should be true, for better designer exp.
    }

    designItem._childArray = designItem._internalUpdateChildrenFromNodesChildren();
    for (let c of designItem._childArray) {
      (<DesignItem>c)._parent = designItem;
    }

    return designItem;
  }

  querySelectorAll(selectors: string): NodeListOf<HTMLElement> {
    return this.usableContainer.querySelectorAll(selectors);
  }

  removeDesignerAttributesAndStylesFromChildren() {
    const els = this.querySelectorAll('*');
    for (let e of els) {
      const di = DesignItem.GetDesignItem(e);
      if (!di.hasAttribute("draggable"))
        e.removeAttribute("draggable");
      if (!di.hasStyle("pointer-events"))
        e.style.pointerEvents = '';
    }
  }

  updateChildrenFromNodesChildren() {
    this._childArray = this._internalUpdateChildrenFromNodesChildren();
    for (let c of this._childArray) {
      (<DesignItem>c)._parent = this;
    }
  }

  _internalUpdateChildrenFromNodesChildren() {
    const newChilds = [];
    if (this.nodeType == NodeType.Element) {
      if (this.element instanceof (this.node.ownerDocument.defaultView ?? window).HTMLTemplateElement) {
        for (const c of this.element.content.childNodes) {
          const di = DesignItem.createDesignItemFromInstance(c, this.serviceContainer, this.instanceServiceContainer);
          newChilds.push(di);
        }
      } else if (this.isRootItem && this.element instanceof (this.node.ownerDocument.defaultView ?? window).HTMLIFrameElement) {
        for (const c of this.element.contentWindow.document.childNodes) {
          const di = DesignItem.createDesignItemFromInstance(c, this.serviceContainer, this.instanceServiceContainer);
          newChilds.push(di);
        }
      } else {
        for (const c of this.element.childNodes) {
          const di = DesignItem.createDesignItemFromInstance(c, this.serviceContainer, this.instanceServiceContainer);
          newChilds.push(di);
        }
      }
    }
    return newChilds;
  }

  _backupWhenEditContent;
  _inEditContent = false;
  editContent() {
    this._inEditContent = true;
    this._backupWhenEditContent = [...this.element.childNodes];
    const nn = this.element.innerHTML
    this.element.innerHTML = '';
    this.element.innerHTML = nn;
    this.element.setAttribute('contenteditable', '');
  }

  editContentFinish() {
    if (this._inEditContent) {
      this._inEditContent = false;
      this.element.removeAttribute('contenteditable');
      this.element.innerHTML = '';
      for (let n of this._backupWhenEditContent) {
        this.element.appendChild(n);
      }
      this._backupWhenEditContent = null;
    }
  }

  public constructor(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    this.node = node;
    this.view = node;
    this.parsedNode = parsedNode;
    this.serviceContainer = serviceContainer;
    this.instanceServiceContainer = instanceServiceContainer;

    this._attributes = new Map();
    this._styles = new Map();

    DesignItem._designItemMap.set(node, this);
  }

  public setView(node: Element) {
    this.view = node;
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
      designItem = dis.createDesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
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
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    if (this.isRootItem) {
      throw 'not allowed to set style on root item or use async setStyle';
    } else {
      const action = new CssStyleChangeAction(this, nm, value, this._styles.get(nm));
      this.instanceServiceContainer.undoService.execute(action);
    }
  }
  public async setStyleAsync(name: string, value?: string | null, important?: boolean): Promise<void> {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    //TODO: remove this special case (I think), should be in CSSSytleChangeAction.
    //Maybe we should be able to set a setscope (sheet, local, pseudo selctor, ...)
    if (this.isRootItem) {
      if (!this.instanceServiceContainer.stylesheetService)
        throw 'not allowed to set style on root item';
      else {
        let decls = this.instanceServiceContainer.stylesheetService.getDeclarationsSortedBySpecificity(this, name);
        if (decls !== null && decls.length > 0) {
          this.instanceServiceContainer.stylesheetService.updateDeclarationValue(decls[0], value, important);
        } else {
          let rules = this.instanceServiceContainer.stylesheetService.getRules(':host').filter(x => !x.stylesheet?.readOnly);
          if (decls === null || rules.length === 0) {
            const cg = this.openGroup('add rule and set style: ' + name);
            const sheets = this.instanceServiceContainer.stylesheetService.getStylesheets();
            const rule = await this.instanceServiceContainer.stylesheetService.addRule(sheets[0], ':host')
            this.instanceServiceContainer.stylesheetService.insertDeclarationIntoRule(rule, name, value, important);
            cg.commit();
          } else {
            this.instanceServiceContainer.stylesheetService.insertDeclarationIntoRule(rules[0], name, value, important);
          }
        }
      }
    } else {
      const action = new CssStyleChangeAction(this, nm, value, this._styles.get(nm));
      this.instanceServiceContainer.undoService.execute(action);
    }
  }

  public removeStyle(name: string) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);
    const action = new CssStyleChangeAction(this, nm, '', this._styles.get(nm));
    this.instanceServiceContainer.undoService.execute(action);
  }
  public updateStyleInSheetOrLocal(name: string, value?: string | null, important?: boolean, forceSet?: boolean) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);

    let declarations = this.instanceServiceContainer.stylesheetService?.getDeclarationsSortedBySpecificity(this, nm).filter(x => !x.stylesheet?.readOnly);

    if (this.hasStyle(name) || this.instanceServiceContainer.designContext.extensionOptions[enableStylesheetService] === false || !declarations?.length) {
      // Set style locally
      if (this.getStyle(nm) != value || forceSet) {
        this.setStyle(nm, value);
      } else if (value == null) {
        this.removeStyle(nm);
      }
    } else {
      this.instanceServiceContainer.stylesheetService.updateDeclarationValue(declarations[0], value, false);
    }
  }
  public async updateStyleInSheetOrLocalAsync(name: string, value?: string | null, important?: boolean, forceSet?: boolean): Promise<void> {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);

    let declarations = this.instanceServiceContainer.stylesheetService?.getDeclarationsSortedBySpecificity(this, nm).filter(x => !x.stylesheet?.readOnly);

    if (this.hasStyle(name) || this.instanceServiceContainer.designContext.extensionOptions[enableStylesheetService] === false || !declarations?.length) {
      // Set style locally
      if (this.getStyle(nm) != value || forceSet) {
        await this.setStyleAsync(nm, value);
      } else if (value == null) {
        this.removeStyle(nm);
      }
    } else {
      this.instanceServiceContainer.stylesheetService.updateDeclarationValue(declarations[0], value, false);
    }
  }

  public getStyleFromSheetOrLocal(name: string, fallback: string = null) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);

    if (this.hasStyle(name))
      // Get style locally
      return this.getStyle(nm);

    let decls = this.instanceServiceContainer.stylesheetService?.getDeclarationsSortedBySpecificity(this, nm);
    if (decls && decls.length > 0)
      return decls[0].value;

    return null;
  }

  getStyleFromSheetOrLocalOrComputed(name: string, fallback: string = null) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);

    let value = this.getStyleFromSheetOrLocal(nm);
    if (!value) {
      value = getComputedStyle(this.element).getPropertyValue(nm)
    }
    return value ?? fallback;
  }

  getComputedStyleProperty(name: string, fallback: string = null) {
    let nm = name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(name);

    let value = this.getStyleFromSheetOrLocal(nm);
    if (!value) {
      value = getComputedStyle(this.element).getPropertyValue(nm)
    }
    return value ?? fallback;
  }

  getComputedStyle() {
    if (this.nodeType == NodeType.Element)
      return this.window.getComputedStyle(this.element);
    return null;
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
          return [{ selector: null, declarations: localStyles, specificity: null, stylesheet: null }, ...rules];
        }
      }
      catch (err) {
        console.warn('getAppliedRules', err);
      }
    }
    styles = [{ selector: null, declarations: localStyles, specificity: null, stylesheet: null }];
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

  // todo : public setPropertyAndAttrbute()
  //getProperty ...

  public setProperty(name: string, value?: any) {   //the prop change action should use the prop service. We need th setPropAndattribute. So undo works!
    if (this.isRootItem)
      throw 'not allowed to set attribute on root item';
    const oldValue = deepValue(this.node, name);
    const action = new PropertyChangeAction(this, name, value, oldValue);
    this.instanceServiceContainer.undoService.execute(action);
  }

  // Internal implementations wich don't use undo/redo
  public _insertChildInternal(designItem: DesignItem, index?: number) {
    this._insertChildsInternal([designItem], index);
  }
  public _insertChildsInternal(designItems: DesignItem[], index?: number) {
    const frag = this.document.createDocumentFragment();
    let beforeDs: IDesignItem = null;
    for (let designItem of designItems) {
      if (designItem.parent && this.instanceServiceContainer.selectionService.primarySelection == designItem) {
        designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
        designItem.instanceServiceContainer.designerCanvas.extensionManager.removeExtension(designItem.parent, ExtensionType.PrimarySelectionContainerAndCanBeEntered);
      }
      if (designItem.parent) {
        designItem.parent._removeChildInternal(designItem);
      }

      frag.appendChild(designItem.view);
      (<DesignItem>designItem)._parent = this;

      if (index == null || this._childArray.length == 0 || index >= this._childArray.length) {
        this._childArray.push(designItem);
      } else {
        beforeDs = this._childArray[index];
        this._childArray.splice(index, 0, designItem);
        index++;
      }
    }
    if (beforeDs == null) {
      if (this.isRootItem) {
        if (this.usableContainer?.children[0] instanceof this.window.HTMLHtmlElement)
          this.usableContainer.children[0].remove();
        this.usableContainer.appendChild(frag);
      } else if (this.view instanceof (this.node.ownerDocument.defaultView ?? window).HTMLTemplateElement) {
        this.view.content.appendChild(frag);
      } else
        this.view.appendChild(frag);
    } else {
      if (this.isRootItem) {
        if (this.usableContainer?.children[0] instanceof this.window.HTMLHtmlElement)
          this.usableContainer.children[0].remove();
        this.usableContainer.insertBefore(frag, beforeDs.element);
      } else if (this.view instanceof (this.node.ownerDocument.defaultView ?? window).HTMLTemplateElement) {
        this.view.content.insertBefore(frag, beforeDs.element)
      } else
        this.view.insertBefore(frag, beforeDs.element)
    }

    //TODO: is this still needed???
    /*
    if (this.instanceServiceContainer.selectionService.primarySelection == designItem) {
      designItem.instanceServiceContainer.designerCanvas.extensionManager.applyExtension(designItem.parent, ExtensionType.PrimarySelectionContainer);
      if (designItem.getPlacementService().isEnterableContainer(this))
        designItem.instanceServiceContainer.designerCanvas.extensionManager.applyExtension(designItem.parent, ExtensionType.PrimarySelectionContainerAndCanBeEntered);
    }
    */

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

      //TODO: do not patch styles in templates, this needs to be recursive, cause the style does not need to be on the root
      /*const realContent = this._childArray.reduce((a, b) => a + b.content, '');
      this.view.textContent = AbstractStylesheetService.buildPatchedStyleSheet([cssFromString(realContent)]);
      this.instanceServiceContainer.designerCanvas.lazyTriggerReparseDocumentStylesheets();*/
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
        return resolve(di);
      }
      reader.readAsDataURL(data);
    })
  }

  get hasForcedCss() {
    return this.cssForceHover || this.cssForceActive || this.cssForceVisited || this.cssForceFocus || this.cssForceFocusWithin || this.cssForceFocusVisible;
  }

  get cssForceHover() {
    return this.element.hasAttribute(forceHoverAttributeName);
  }
  set cssForceHover(value: boolean) {
    if (value)
      this.element.setAttribute(forceHoverAttributeName, '');
    else
      this.element.removeAttribute(forceHoverAttributeName);
    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'changed', designItems: [this] });
  }

  get cssForceActive() {
    return this.element.hasAttribute(forceActiveAttributeName);
  }
  set cssForceActive(value: boolean) {
    if (value)
      this.element.setAttribute(forceActiveAttributeName, '');
    else
      this.element.removeAttribute(forceActiveAttributeName);
    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'changed', designItems: [this] });
  }

  get cssForceVisited() {
    return this.element.hasAttribute(forceVisitedAttributeName);
  }
  set cssForceVisited(value: boolean) {
    if (value)
      this.element.setAttribute(forceVisitedAttributeName, '');
    else
      this.element.removeAttribute(forceVisitedAttributeName);
    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'changed', designItems: [this] });
  }

  get cssForceFocus() {
    return this.element.hasAttribute(forceFocusAttributeName);
  }
  set cssForceFocus(value: boolean) {
    if (value)
      this.element.setAttribute(forceFocusAttributeName, '');
    else
      this.element.removeAttribute(forceFocusAttributeName);
    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'changed', designItems: [this] });
  }

  get cssForceFocusWithin() {
    return this.element.hasAttribute(forceFocusWithinAttributeName);
  }
  set cssForceFocusWithin(value: boolean) {
    if (value)
      this.element.setAttribute(forceFocusWithinAttributeName, '');
    else
      this.element.removeAttribute(forceFocusWithinAttributeName);
    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'changed', designItems: [this] });
  }

  get cssForceFocusVisible() {
    return this.element.hasAttribute(forceFocusVisibleAttributeName);
  }
  set cssForceFocusVisible(value: boolean) {
    if (value)
      this.element.setAttribute(forceFocusVisibleAttributeName, '');
    else
      this.element.removeAttribute(forceFocusVisibleAttributeName);
    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'changed', designItems: [this] });
  }
}
