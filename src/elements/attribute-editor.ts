import { ServiceContainer } from './services/ServiceContainer';
import serviceContainer from './services/DefaultServiceBootstrap';
import { AttributeEditorAttributeList } from './attribute-editor-attribute-list';
import { DesignerTabControl } from './controls/designer-tab-control';
import { CssPropertiesService } from './services/propertiesService/CssPropertiesService';
import { IDesignItem } from './item/IDesignItem';
import { BaseCustomWebComponent, css } from './controls/BaseCustomWebComponent';

export class AttributeEditor extends BaseCustomWebComponent {

  private _serviceContainer: ServiceContainer;
  private _designerTabControl: DesignerTabControl;

  static get style() {
    return css`
    :host {
      display: block;
    }
    iron-pages {
      overflow: hidden;
      height: 250px;
      background: var(--medium-grey);
      color: white;
    }
    button:hover {
      box-shadow: inset 0 3px 0 var(--light-grey);
    }
    button:focus {
      box-shadow: inset 0 3px 0 var(--highlight-pink);
    }
    `;
  }

  constructor() {
    super();
    this._designerTabControl = new DesignerTabControl();
    this._shadow.appendChild(this._designerTabControl);
  }

  public set serviceContainer(value: ServiceContainer) {
    this._serviceContainer = value;

    let attributeEditorAttributeList = new AttributeEditorAttributeList();
    attributeEditorAttributeList.serviceContainer = value;
    attributeEditorAttributeList.createElements((new CssPropertiesService("styles")).getProperties(null));
    attributeEditorAttributeList.title = "styles";
    this._designerTabControl.appendChild(attributeEditorAttributeList);

    attributeEditorAttributeList = new AttributeEditorAttributeList();
    attributeEditorAttributeList.serviceContainer = value;
    attributeEditorAttributeList.createElements((new CssPropertiesService("flex")).getProperties(null));
    attributeEditorAttributeList.title = "flex";
    this._designerTabControl.appendChild(attributeEditorAttributeList);
  }

  public get serviceContainer(): ServiceContainer {
    return this._serviceContainer;
  }

  set selectedElements(value: IDesignItem[]) {
    if (value) {
      if (value.length == 1) {
        let element = value[0];
        let properties = serviceContainer.forSomeServicesTillResult("propertyService", x => x.getProperties(element));

        if (properties) {
          let attributeEditorAttributeList = new AttributeEditorAttributeList();
          attributeEditorAttributeList.serviceContainer = this.serviceContainer;
          // attributeEditorAttributeList.title = 
          attributeEditorAttributeList.createElements(properties);
          this._designerTabControl.appendChild(attributeEditorAttributeList);
        }
      }
    } else {
      //todo
    }
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

customElements.define('attribute-editor', AttributeEditor);