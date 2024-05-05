import { ServiceContainer } from '../../services/ServiceContainer.js';
import { PropertyGridPropertyList } from './PropertyGridPropertyList.js';
import { DesignerTabControl } from '../../controls/DesignerTabControl.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { BaseCustomWebComponentLazyAppend, css, Disposable } from '@node-projects/base-custom-webcomponent';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { RefreshMode } from '../../services/propertiesService/IPropertiesService.js';
import { IPropertyGroup } from '../../services/propertiesService/IPropertyGroup.js';
import { IProperty } from '../../services/propertiesService/IProperty.js';
import { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem.js';

export class PropertyGrid extends BaseCustomWebComponentLazyAppend {

  private _serviceContainer: ServiceContainer;
  private _designerTabControl: DesignerTabControl;
  private _selectedItems: IDesignItem[];
  private _propertyGridPropertyLists: PropertyGridPropertyList[];
  private _propertyGridPropertyListsDict: Record<string, PropertyGridPropertyList>;
  private _itemsObserver: MutationObserver;
  private _nodeReplacedCb: Disposable;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;

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
      box-shadow: inset 0 3px 0 var(--light-grey);
    }
    button:focus {
      box-shadow: inset 0 3px 0 var(--highlight-pink, #e91e63);
    }
    `;

  static readonly properties = {
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
    this.addEventListener('contextmenu', (e) => {
      if ((<HTMLElement>e.composedPath()[0]).localName != 'input')
        e.preventDefault()
    });

    this._itemsObserver = new MutationObserver((m) => this._mutationOccured());
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
    this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
      this.selectedItems = e.selectedElements;
    });
    this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
  }

  get selectedItems() {
    return this._selectedItems;
  }
  set selectedItems(items: IDesignItem[]) {
    if (this._selectedItems != items) {
      this._selectedItems = items;

      const pgGroups = this._serviceContainer.propertyGroupService.getPropertygroups(items);
      const visibleDict = new Set<string>()
      for (let p of pgGroups) {
        let lst = this._propertyGridPropertyListsDict[p.name];
        if (!lst) {
          lst = new PropertyGridPropertyList(this.serviceContainer);
          lst.title = p.name;
          lst.propertyGroupHover = this.propertyGroupHover;
          lst.propertyGroupClick = this.propertyGroupClick;
          lst.propertyContextMenuProvider = this.propertyContextMenuProvider;
          this._designerTabControl.appendChild(lst);
          this._propertyGridPropertyLists.push(lst);
          this._propertyGridPropertyListsDict[p.name] = lst;
        }
        lst.setPropertiesService(p.propertiesService);
        if (lst.createElements(items[0]))
          visibleDict.add(p.name);
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
          a.designItemsChanged(items);
      }

      if (items) {
        if (items.length == 1) {
          for (const a of this._propertyGridPropertyLists) {
            if (visibleDict.has(a.title))
              a.refreshForDesignItems(items);
          }
          this._observePrimarySelectionForChanges();
        }
      } else {
        this._itemsObserver.disconnect();
        this._nodeReplacedCb?.dispose();
        this._nodeReplacedCb = null;
      }
    }
  }

  _mutationOccured() {
    for (const a of this._propertyGridPropertyLists) {
      if (a.propertiesService?.getRefreshMode(this._selectedItems[0]) == RefreshMode.fullOnValueChange) {
        a.createElements(this._selectedItems[0]);
        a.designItemsChanged(this._selectedItems);
      }
      a.refreshForDesignItems(this._selectedItems);
    }
  }

  private _observePrimarySelectionForChanges() {
    this._nodeReplacedCb?.dispose();
    this._itemsObserver.disconnect();
    this._itemsObserver.observe(this._selectedItems[0].element, { attributes: true, childList: false, characterData: false });
    this._nodeReplacedCb = this._selectedItems[0].nodeReplaced.on(() => {
      this._observePrimarySelectionForChanges();
      this._mutationOccured();
    });
  }
}

customElements.define('node-projects-web-component-designer-property-grid', PropertyGrid);