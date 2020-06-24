import { ServiceContainer } from '../../services/ServiceContainer';
import { PropertyGridPropertyList } from './PropertyGridPropertyList';
import { DesignerTabControl } from '../../controls/DesignerTabControl';
import { IDesignItem } from '../../item/IDesignItem';
import { BaseCustomWebComponent, css } from '@node-projects/base-custom-webcomponent';
import { CssPropertiesService } from '../../services/propertiesService/services/CssPropertiesService';

export class PropertyGrid extends BaseCustomWebComponent {

  private _serviceContainer: ServiceContainer;
  private _designerTabControl: DesignerTabControl;
  private _selectedItems : IDesignItem[];
  private _propertyGridPropertyLists: PropertyGridPropertyList[];
  private _itemsObserver: MutationObserver;

  static readonly style = css`
    :host {
      display: block;
      height: 100%;
    }
    iron-pages {
      overflow: hidden;
      height: 250px;
      background: var(--medium-grey, #2f3545);
      color: white;
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
    this._designerTabControl = new DesignerTabControl();
    this.shadowRoot.appendChild(this._designerTabControl);

    this._itemsObserver = new MutationObserver((m) => {
      for (const a of this._propertyGridPropertyLists) {
        a.refreshForDesignItems(this._selectedItems);
      } 
    });
  }

  public set serviceContainer(value: ServiceContainer) {
    this._serviceContainer = value;
    this._propertyGridPropertyLists = [];

    let attributeEditorAttributeList = new PropertyGridPropertyList(value, new CssPropertiesService("styles"));
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "styles";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value, new CssPropertiesService("flex"));
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "flex";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    attributeEditorAttributeList = new PropertyGridPropertyList(value, new CssPropertiesService("grid"));
    attributeEditorAttributeList.createElements(null);
    attributeEditorAttributeList.title = "grid";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
    this._propertyGridPropertyLists.push(attributeEditorAttributeList);

    this._designerTabControl.selectedIndex = 0;
  }

  public get serviceContainer(): ServiceContainer {
    return this._serviceContainer;
  }

  get selectedItems() {
    return this._selectedItems;
  }
  set selectedItems(items: IDesignItem[]) {
    this._selectedItems = items;
    if (items) {
      if (items.length == 1) {
        for (const a of this._propertyGridPropertyLists) {
          a.refreshForDesignItems(items);
        }

        this._observeItems();
        /*let properties = serviceContainer.forSomeServicesTillResult("propertyService", x => x.getProperties(element));

        if (properties) {
          let attributeEditorAttributeList = new PropertyGridPropertyList();
          attributeEditorAttributeList.serviceContainer = this.serviceContainer;
          // attributeEditorAttributeList.title = 
          attributeEditorAttributeList.createElements(properties);
          this._designerTabControl.appendChild(attributeEditorAttributeList);
        }*/
      }
    } else {
      this._itemsObserver.disconnect();
    }
  }

  private _observeItems() {
    this._itemsObserver.disconnect();
    this._itemsObserver.observe(this._selectedItems[0].element, { attributes: true, childList: false, characterData: false });
  }

  /*
    display(el) {
      let computedStyle = window.getComputedStyle(el);
      (this.$.propertiesContainer as ElementProperties).display(el);
      (this.$.stylesContainer as ElementStyles).display(computedStyle, el);
      (this.$.flexContainer as ElementFlex).display(computedStyle);
    }
  
    displayPosition(top, left) {
      (this.$.stylesContainer as ElementStyles).display('', { top: top + 'px', left: left + 'px' });
    }
  */
}

customElements.define('node-projects-property-grid', PropertyGrid);