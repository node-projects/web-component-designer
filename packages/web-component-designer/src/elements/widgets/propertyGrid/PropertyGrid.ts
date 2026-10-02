import { ServiceContainer } from '../../services/ServiceContainer.js';
import { PropertyGridPropertyList } from './PropertyGridPropertyList.js';
import { DesignerTabControl } from '../../controls/DesignerTabControl.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { BaseCustomWebComponentLazyAppend, css, Disposable } from '@node-projects/base-custom-webcomponent';
import { IContentChanged, InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { RefreshMode } from '../../services/propertiesService/IPropertiesService.js';
import { IPropertyGroup } from '../../services/propertiesService/IPropertyGroup.js';
import { IProperty } from '../../services/propertiesService/IProperty.js';
import { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem.js';

export class PropertyGrid extends BaseCustomWebComponentLazyAppend {

  static readonly observedAttributes = ['appearance'];

  /** Modern is opt-in; existing hosts retain the classic layout. */
  public get appearance(): 'classic' | 'modern' {
    return this.getAttribute('appearance') === 'modern' ? 'modern' : 'classic';
  }
  public set appearance(value: 'classic' | 'modern') {
    this.setAttribute('appearance', value);
  }
  attributeChangedCallback() {
    this._designerTabControl?.setAttribute('appearance', this.appearance);
    for (const list of this._propertyGridPropertyLists ?? [])
      list.setAttribute('appearance', this.appearance);
  }

  private _serviceContainer: ServiceContainer;
  private _designerTabControl: DesignerTabControl;
  private _selectedItems: IDesignItem[];
  private _propertyGridPropertyLists: PropertyGridPropertyList[];
  private _propertyGridPropertyListsDict: Record<string, PropertyGridPropertyList>;
  private _nodeReplacedCb: Disposable;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;
  private _contentChangedHandler: Disposable;

  public propertyGroupHover: (group: IPropertyGroup, part: 'name' | 'desc') => boolean;
  public propertyGroupClick: (group: IPropertyGroup, part: 'name' | 'desc') => void;
  public propertyContextMenuProvider: (designItems: IDesignItem[], property: IProperty) => IContextMenuItem[];

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      user-select: none;
      -webkit-user-select: none;
    }
    button:hover {
      box-shadow: inset 0 3px 0 var(--wcd-property-grid-tab-indicator-inactive-color, var(--light-grey));
    }
    button:focus {
      box-shadow: inset 0 3px 0 var(--wcd-property-grid-tab-indicator-color, var(--highlight-pink, var(--wcd-color-accent, #e91e63)));
    }
    :host([appearance="modern"]) {
      color-scheme: light dark;
      font-family: var(--wcd-property-grid-font-family, system-ui, sans-serif);
      font-size: 13px;
      --_wcd-pg-surface: var(--wcd-property-grid-background, var(--wcd-color-surface, light-dark(#ffffff, #20242b)));
      --_wcd-pg-raised: var(--wcd-color-surface-raised, light-dark(#f6f8fb, #292e37));
      --_wcd-pg-hover: var(--wcd-color-surface-hover, light-dark(#edf3fb, #303c4d));
      --_wcd-pg-text: var(--wcd-property-grid-text-color, var(--wcd-color-text, light-dark(#283344, #e8edf4)));
      --_wcd-pg-muted: var(--wcd-color-text-muted, light-dark(#677489, #a6b3c5));
      --_wcd-pg-border: var(--wcd-color-border, light-dark(#e0e6ed, #3b4452));
      --_wcd-pg-accent: var(--wcd-color-accent, light-dark(#2168cc, #88b6ff));
      background: var(--_wcd-pg-surface);
      color: var(--_wcd-pg-text);
    }
    `;

  static readonly properties = {
    appearance: String,
    serviceContainer: Object,
    instanceServiceContainer: Object,
    selectedItems: Array,
    propertyGroupHover: Function,
    propertyGroupClick: Function,
    propertyContextMenuProvider: Function
  }

  constructor() {
    super();
    this._designerTabControl = new DesignerTabControl();
    this.shadowRoot.appendChild(this._designerTabControl);
    this._restoreCachedInititalValues();
    this._designerTabControl.setAttribute('appearance', this.appearance);
    this.addEventListener('contextmenu', (e) => {
      if ((<HTMLElement>e.composedPath()[0]).localName != 'input')
        e.preventDefault()
    });
  }

  public set serviceContainer(value: ServiceContainer) {
    this._serviceContainer = value;
    this._propertyGridPropertyLists = [];
    this._propertyGridPropertyListsDict = {}
  }
  public get serviceContainer(): ServiceContainer {
    return this._serviceContainer;
  }

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._instanceServiceContainer = value;
    this._selectionChangedHandler?.dispose()
    this._contentChangedHandler?.dispose()
    if (this._instanceServiceContainer) {
      this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
        this.selectedItems = e.selectedElements;
      });
      this._contentChangedHandler = this._instanceServiceContainer.onContentChanged.on(e => {
        this._changeOccured(null, false);
      });
      this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
    } else {
      this.selectedItems = [];
    }
  }

  get selectedItems() {
    return this._selectedItems;
  }
  set selectedItems(items: IDesignItem[]) {
    if (this._selectedItems != items) {
      this._selectedItems = items;
      this._selectedItemsSet();
    }
  }

  async _selectedItemsSet() {
    const pgGroups = this._serviceContainer.propertyGroupService.getPropertygroups(this._selectedItems);
    const visibleDict = new Set<string>()
    for (let p of pgGroups) {
      let lst = this._propertyGridPropertyListsDict[p.name];
      if (!lst) {
        lst = new PropertyGridPropertyList(this.serviceContainer);
        lst.setAttribute('appearance', this.appearance);
        lst.title = p.name;
        lst.propertyGroupHover = this.propertyGroupHover;
        lst.propertyGroupClick = this.propertyGroupClick;
        lst.propertyContextMenuProvider = this.propertyContextMenuProvider;
        this._designerTabControl.appendChild(lst);
        this._propertyGridPropertyLists.push(lst);
        this._propertyGridPropertyListsDict[p.name] = lst;
      }
      lst.setPropertiesService(p.propertiesService);
      if (await lst.createElements(this._selectedItems[0]))
        visibleDict.add(p.name);
    }

    let parentEl: HTMLElement = this._designerTabControl;

    for (const v of visibleDict) {
      const el = this._propertyGridPropertyListsDict[v];
      const scrollTop = el.scrollTop;
      if (parentEl === this._designerTabControl)
        parentEl.insertAdjacentElement('afterbegin', el);
      else
        parentEl.insertAdjacentElement('afterend', el);
      parentEl = el;
      el.scrollTo(0, scrollTop);
    }

    for (let p of this._propertyGridPropertyLists) {
      if (visibleDict.has(p.title))
        p.style.display = 'block';
      else
        p.style.display = 'none';
    }

    this._designerTabControl.refreshItems();
    if (this._designerTabControl.selectedIndex < 0)
      this._designerTabControl.selectedIndex = 0;

    for (const a of this._propertyGridPropertyLists) {
      if (visibleDict.has(a.title))
        a.designItemsChanged(this._selectedItems);
    }

    if (this._selectedItems) {
      if (this._selectedItems.length == 1) {
        for (const a of this._propertyGridPropertyLists) {
          if (visibleDict.has(a.title))
            a.refreshForDesignItems(this._selectedItems);
        }
        this._observePrimarySelectionForChanges();
      }
    } else {
      this._nodeReplacedCb?.dispose();
      this._nodeReplacedCb = null;
    }
  }

  _blockDoubleRun = false;
  async _changeOccured(change: IContentChanged, forceRecreate = false) {
    if (!this._blockDoubleRun) {
      this._blockDoubleRun = true;
      const selItem = this._selectedItems[0];
      if (selItem) {
        for (const a of this._propertyGridPropertyLists) {
          if (a.propertiesService?.getRefreshMode(selItem) == RefreshMode.fullOnValueChange) {
            await a.createElements(selItem);
            a.designItemsChanged(this._selectedItems);
          }
          a.refreshForDesignItems(this._selectedItems);
        }
      }
      this._blockDoubleRun = false;
    }
  }

  private _observePrimarySelectionForChanges() {
    this._nodeReplacedCb?.dispose();
    this._nodeReplacedCb = this._selectedItems[0].nodeReplaced.on(() => {
      this._observePrimarySelectionForChanges();
      this._changeOccured(null, true);
    });
  }
}

customElements.define('node-projects-web-component-designer-property-grid', PropertyGrid);