import { IElementDefinition } from '../../services/elementsService/IElementDefinition.js';
import { dragDropFormatNameElementDefinition } from '../../../Constants.js';
import { BaseCustomWebComponentLazyAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { NamedTools } from '../designerView/tools/NamedTools.js';

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

  loadElements(serviceContainer: ServiceContainer, elementDefintions: IElementDefinition[], relativeImagePath?: string) {
    for (const elementDefintion of elementDefintions) {
      const tr = document.createElement("tr");

      const tdEl = document.createElement("td");

      const button = document.createElement("button");
      button.setAttribute("part", "button");
      if (elementDefintion.icon && !elementDefintion.displayHtml) {
        let icon = elementDefintion.icon;
        if (!elementDefintion.icon.startsWith('data:')) {
          icon = relativeImagePath + elementDefintion.icon;
        }
        button.innerHTML =
          '<table><tr>' +
          '<td align="left" valign="middle" style="width:20px;"><img style="width:16px;height:16px" src="' + icon + '"></td>' +
          '<td align="left" >' + elementDefintion.tag + '</td>' +
          '</tr></table>\n';
      }
      else if (elementDefintion.displayHtml)
        button.innerHTML = elementDefintion.displayHtml;
      else
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
        else if (!elementDefintion.import) {
          try {
            let elem = document.createElement(elementDefintion.tag);
            if (elementDefintion.defaultContent)
              elem.innerHTML = elementDefintion.defaultContent;
            if (elementDefintion.defaultWidth)
              elem.style.width = elementDefintion.defaultWidth;
            if (elementDefintion.defaultHeight)
              elem.style.height = elementDefintion.defaultHeight;
            if (elementDefintion.defaultAttributes) {
              for (let a in elementDefintion.defaultAttributes) {
                elem.setAttribute(a, elementDefintion.defaultAttributes[a]);
              }
            }
            if (elementDefintion.defaultStyles) {
              for (let s in elementDefintion.defaultStyles) {
                elem.style[s] = elementDefintion.defaultStyles[s];
              }
            }
            elem.style.position = "absolute";
            if (elementDefintion.defaultWidth)
              elem.style.top = "-" + (parseInt(elementDefintion.defaultHeight) + 500) + 'px';
            else
              elem.style.top = "-500px";
            if (elementDefintion.defaultWidth)
              elem.style.left = "-" + (parseInt(elementDefintion.defaultWidth) + 500) + 'px';
            else
              elem.style.left = "-500px";
            document.body.appendChild(elem);

            let rect = elem.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0)
              e.dataTransfer.setDragImage(elem, 0, 0);
            requestAnimationFrame(() => document.body.removeChild(elem));
          }
          catch (err) {
            console.warn("error creating gost elment", err);
          }
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
        let tool = serviceContainer.designerTools.get(elementDefintion.tool ?? NamedTools.DrawElementTool);
        if (typeof tool == 'function')
          tool = new tool(elementDefintion)
        serviceContainer.globalContext.tool = tool;
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