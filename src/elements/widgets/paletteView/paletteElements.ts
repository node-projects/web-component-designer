import { IElementDefinition } from '../../services/elementsService/IElementDefinition.js';
import { dragDropFormatNameElementDefinition } from '../../../Constants.js';
import { BaseCustomWebComponentLazyAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { DrawElementTool } from '../designerView/tools/DrawElementTool.js';

export class PaletteElements extends BaseCustomWebComponentLazyAppend {

  static override readonly style = css`
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

    table {
      width: 100%
    }

    td {
      color: white;
      font-size: 13px;
    }

    div {
      text-transform: uppercase;
      font-size: 12px;
      font-weight: bold;
      padding: 4px 14px;
    }
    `;

  static override readonly template = html`
    <table id="table">
    </table>
  `;

  private _table: HTMLTableElement;

  constructor() {
    super();

    this._table = this._getDomElement<HTMLTableElement>('table');
  }

  loadElements(serviceContainer: ServiceContainer, elementDefintions: IElementDefinition[]) {
    for (const elementDefintion of elementDefintions) {
      let option = document.createElement("option");
      option.value = elementDefintion.tag;

      const tr = document.createElement("tr");

      const tdEl = document.createElement("td");

      const button = document.createElement("button");
      button.innerText = elementDefintion.name ? elementDefintion.name : elementDefintion.tag;
      button.draggable = true;
      button.ondragstart = (e) => {
        e.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(elementDefintion));
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
        serviceContainer.globalContext.tool = new DrawElementTool(elementDefintion);
      }
      tdEl.appendChild(button);
      tr.appendChild(tdEl);

      const tdDesc = document.createElement("td");
      tdDesc.innerText = elementDefintion.description ?? "";
      tr.appendChild(tdDesc);

      this._table.appendChild(tr);
    }
  }
}

customElements.define('node-projects-palette-elements', PaletteElements);