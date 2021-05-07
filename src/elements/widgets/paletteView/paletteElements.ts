import { IElementDefinition } from '../../services/elementsService/IElementDefinition';
import { dragDropFormatName } from '../../../Constants';
import { BaseCustomWebComponentLazyAppend, css } from '@node-projects/base-custom-webcomponent';
import { ServiceContainer } from '../../services/ServiceContainer';
import { DrawElementTool } from '../designerView/tools/DrawElementTool';

export class PaletteElements extends BaseCustomWebComponentLazyAppend {

  namesToPackages: Map<string, string>;

  static override get style() {
    return css`
    :host {
      display: block;
      box-sizing: border-box;
      height: 100%;
      overflow: auto;        
    }

    button {
      background-color: transparent;
      color: white;
      border: none;
      font-size: 13px;
      display: block;
      cursor: pointer;
      width: 100%;
      text-align: left;
      padding: 8px 14px;
    }
    button:hover {
      background: var(--light-grey, #383f52);
    }

    div {
      text-transform: uppercase;
      font-size: 12px;
      font-weight: bold;
      padding: 4px 14px;
    }
    `;
  }

  constructor() {
    super();

    this.namesToPackages = new Map();
  }

  disconnectedCallback() {
    console.log('Custom square element removed from page.');
  }

  loadElements(serviceContainer: ServiceContainer, elementDefintions: IElementDefinition[]) {
    for (const elementDefintion of elementDefintions) {
      let option = document.createElement("option");
      option.value = elementDefintion.tag;

      let button = document.createElement("button");
      button.innerText = elementDefintion.name ? elementDefintion.name : elementDefintion.tag;
      button.draggable = true;
      //todo: onclick set tool to draw new element
      button.ondragstart = (e) => {
        e.dataTransfer.setData(dragDropFormatName, JSON.stringify(elementDefintion));
        (<HTMLElement>e.currentTarget).style.outline = "dashed";

        if (elementDefintion.ghostElement) {
          if (typeof elementDefintion.ghostElement === 'string') {

            const range = document.createRange();
            range.selectNode(document.body);
            const fragment = range.createContextualFragment(elementDefintion.ghostElement);
            let elem = fragment.firstChild as HTMLElement;
            elem.style.position = "absolute";
            elem.style.top = "-1000px";
            document.body.appendChild(elem);
            e.dataTransfer.setDragImage(elem, 0, 0);
            requestAnimationFrame(() => document.body.removeChild(elem));
          } else {
            e.dataTransfer.setDragImage(elementDefintion.ghostElement, 0, 0);
          }
        }
        else if (elementDefintion.defaultWidth && elementDefintion.defaultHeight && !elementDefintion.import) {
          let elem = document.createElement(elementDefintion.tag);
          if (elementDefintion.defaultContent)
            elem.innerHTML = elementDefintion.defaultContent;
          elem.style.width = elementDefintion.defaultWidth;
          elem.style.height = elementDefintion.defaultHeight;
          elem.style.position = "absolute";
          elem.style.top = "-" + elementDefintion.defaultHeight;
          document.body.appendChild(elem);
          e.dataTransfer.setDragImage(elem, 0, 0);
          requestAnimationFrame(() => document.body.removeChild(elem));
        }
      }
      button.ondragend = (e) => {
        elementDefintion.import = null;
        (<HTMLElement>e.currentTarget).style.outline = "none";
      }
      button.ontouchstart = (e) => {
        e.preventDefault();
      }
      button.onclick = (x) => {
        serviceContainer.tool = new DrawElementTool(elementDefintion);
      }

      this.shadowRoot.appendChild(button);
    }
  }
}

customElements.define('node-projects-palette-elements', PaletteElements);