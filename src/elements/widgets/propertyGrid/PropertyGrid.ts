import { ServiceContainer } from '../../services/ServiceContainer';
import { PropertyGridPropertyList } from './PropertyGridPropertyList';
import { DesignerTabControl } from '../../controls/DesignerTabControl';
import { IDesignItem } from '../../item/IDesignItem';
import { BaseCustomWebComponentLazyAppend, css, Disposable } from '@node-projects/base-custom-webcomponent';
import { CssPropertiesService } from '../../services/propertiesService/services/CssPropertiesService';
import { CommonPropertiesService } from '../../services/propertiesService/services/CommonPropertiesService';
import { AttributesPropertiesService } from '../../services/propertiesService/services/AttributesPropertiesService';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';

export class PropertyGrid extends BaseCustomWebComponentLazyAppend {

  private _serviceContainer: ServiceContainer;
  private _designerTabControl: DesignerTabControl;
  private _selectedItems: IDesignItem[];
  private _propertyGridPropertyLists: PropertyGridPropertyList[];
  private _itemsObserver: MutationObserver;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;

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

  constructor() {
    super();
    this._restoreCachedInititalValues();
    
    this._designerTabControl = new DesignerTabControl();
    this.shadowRoot.appendChild(this._designerTabControl);
    this.addEventListener('contextmenu', (e) => {
      if ((<HTMLElement>e.composedPath()[0]).localName != 'input')
        e.preventDefault()
    });

    this._itemsObserver = new MutationObserver((m) => {
      for (const a of this._propertyGridPropertyLists) {
        a.refreshForDesignItems(this._selectedItems);
      }
    });
  }

  public set serviceContainer(value: ServiceContainer) {
    this._serviceContainer = value;
    this._propertyGridPropertyLists = [];

    let elementPropertyEditorAttributeList = new PropertyGridPropertyList(value);
    elementPropertyEditorAttributeList.setPropertiesService(new CssPropertiesService("styles")) //This is replace in selectedItems
    elementPropertyEditorAttributeList.title = "properties";
    this._designerTabControl.appendChild(elementPropertyEditorAttributeList);
    this._propertyGridPropertyLists.push(elementPropertyEditorAttributeList);

    let attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new AttributesPropertiesService())
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "attributes";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new CommonPropertiesService())
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "common";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new CssPropertiesService("set-styles"))
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "set-styles";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new CssPropertiesService("styles"))
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "styles";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new CssPropertiesService("alignment"))
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "alignment";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new CssPropertiesService("grid"))
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "grid";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value);
    attributeEditorAttributeList.setPropertiesService(new CssPropertiesService("flex"))
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "flex";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    this._designerTabControl.selectedIndex = 0;
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
    this._selectedItems = items;

    if (this.selectedItems && this.selectedItems.length > 0) {
      const propService = this._serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(this.selectedItems[0]));
      this._propertyGridPropertyLists[0].setPropertiesService(propService)
      this._propertyGridPropertyLists[0].createElements(this.selectedItems[0]);
      this._propertyGridPropertyLists[1].createElements(this.selectedItems[0]);
      this._propertyGridPropertyLists[3].createElements(this.selectedItems[0]);
    }

    for (const a of this._propertyGridPropertyLists) {
      a.designItemsChanged(items);
    }

    if (items) {
      if (items.length == 1) {
        for (const a of this._propertyGridPropertyLists) {
          a.designItemsChanged(items);
          a.refreshForDesignItems(items);
        }

        this._observeItems();
      }
    } else {
      this._itemsObserver.disconnect();
    }
  }

  private _observeItems() {
    this._itemsObserver.disconnect();
    this._itemsObserver.observe(this._selectedItems[0].element, { attributes: true, childList: false, characterData: false });
  }
}

customElements.define('node-projects-property-grid', PropertyGrid);