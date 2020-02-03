import serviceContainer from "./services/DefaultServiceBootstrap.js";
import { AttributeEditorAttributeList } from "./attribute-editor-attribute-list.js";
import { DesignerTabControl } from "./controls/DesignerTabControl.js";
import { CssPropertiesService } from "./services/propertiesService/CssPropertiesService.js";
import { BaseCustomWebComponent, css } from "./controls/BaseCustomWebComponent.js";
export class AttributeEditor extends BaseCustomWebComponent {
  constructor() {
    super();
    this._designerTabControl = new DesignerTabControl();
    this.shadowRoot.appendChild(this._designerTabControl);
  }

  static get style() {
    return css`
    :host {
      display: block;
      height: 100%;
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

  set serviceContainer(value) {
    this._serviceContainer = value;
    let attributeEditorAttributeList = new AttributeEditorAttributeList();
    attributeEditorAttributeList.serviceContainer = value;
    attributeEditorAttributeList.createElements(new CssPropertiesService("styles").getProperties(null));
    attributeEditorAttributeList.title = "styles";

    this._designerTabControl.appendChild(attributeEditorAttributeList);

    attributeEditorAttributeList = new AttributeEditorAttributeList();
    attributeEditorAttributeList.serviceContainer = value;
    attributeEditorAttributeList.createElements(new CssPropertiesService("flex").getProperties(null));
    attributeEditorAttributeList.title = "flex";

    this._designerTabControl.appendChild(attributeEditorAttributeList);
  }

  get serviceContainer() {
    return this._serviceContainer;
  }

  set selectedElements(value) {
    if (value) {
      if (value.length == 1) {
        let element = value[0];
        let properties = serviceContainer.forSomeServicesTillResult("propertyService", x => x.getProperties(element));

        if (properties) {
          let attributeEditorAttributeList = new AttributeEditorAttributeList();
          attributeEditorAttributeList.serviceContainer = this.serviceContainer; // attributeEditorAttributeList.title = 

          attributeEditorAttributeList.createElements(properties);

          this._designerTabControl.appendChild(attributeEditorAttributeList);
        }
      }
    } else {//todo
    }
  }

}
customElements.define('node-projects-attribute-editor', AttributeEditor);