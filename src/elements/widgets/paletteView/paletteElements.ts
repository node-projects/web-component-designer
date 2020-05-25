import { IElementDefinition } from '../../services/elementsService/IElementDefinition';
import { dragDropFormatName } from '../../../Constants';
import { BaseCustomWebComponent, css } from '../../controls/BaseCustomWebComponent';

export class PaletteElements extends BaseCustomWebComponent {

  namesToPackages: Map<string, string>;

  private _filter: HTMLInputElement;
  private _datalist: HTMLDataListElement;
  private _elementDefintions: IElementDefinition[];

  static get style() {
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

    input {
      display: block;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      margin: 10px;
      border-bottom: 1px solid white;
      width: 90%;
    }

    ::-webkit-input-placeholder { color: white; font-weight: 100; font-size: 14px; }
    `;
  }

  constructor() {
    super();

    this._filter = document.createElement('input');
    this._filter.setAttribute('list', 'list');
    this._filter.placeholder = 'Filter Custom Elements';
    this.shadowRoot.appendChild(this._filter)

    this._datalist = document.createElement('datalist');
    this._datalist.setAttribute('list', 'list');
    this._datalist.id = 'list';
    this.shadowRoot.appendChild(this._datalist)

    this.addEventListener('doubleclick', this._doubleclick.bind(this));
    this._filter.addEventListener('input', this._filterInput.bind(this));

    this.namesToPackages = new Map();
  }

  loadElements(elementDefintions: IElementDefinition[]) {
    this._elementDefintions = elementDefintions;

    for (const elementDefintion of elementDefintions) {
      let option = document.createElement("option");
      option.value = elementDefintion.tag;
      this._datalist.appendChild(option);

      let button = document.createElement("button");
      button.innerText = elementDefintion.name ? elementDefintion.name : elementDefintion.tag;
      button.draggable = true;
      button.ondragstart = (e) => {
        e.dataTransfer.setData(dragDropFormatName, JSON.stringify(elementDefintion));
        (<HTMLElement>e.currentTarget).style.outline = "dashed";

        // todo: Drag Drop Ghost 
        /* var elem = document.createElement("button");
        elem.id = "drag-ghost";
        elem.style.width = "20px";        
        elem.style.height = "40px";
        elem.style.position = "absolute";
        elem.style.top = "-100px";
        this._shadow.appendChild(elem);
        e.dataTransfer.setDragImage(elem, 0, 0);*/
      }
      button.ondragend = (e) => {
        (<HTMLElement>e.currentTarget).style.outline = "none";
      }
      button.ontouchstart = (e) => {
        e.preventDefault();
      }
      this.shadowRoot.appendChild(button);
    }

    /*
    this.elements = event.detail.response.elements;
    // First, some elements have sub-elements in the same package.
    let subElements = event.detail.response.subelements;
    let subelements = [];
    for (let parent in subElements) {
      for (let i = 0; i < subElements[parent].length; i++) {
        subelements.push(`${parent}/${subElements[parent][i]}`);
        let packageName = parent;
        if (parent === 'app-layout') {
          packageName = parent + '/' + subElements[parent][i];
        }
        this.namesToPackages[subElements[parent][i]] = packageName;
      }
    }
    this.elements = subelements.sort();

    this.dispatchEvent(new CustomEvent('package-names-ready', { bubbles: true, composed: true, detail: { list: this.namesToPackages, node: this } }));*/
  }

  private _doClick(target, kind) {
    // maybe it's a package/subpackage kind of thing.
    let matches = kind.match(/(.*)\/(.*)/);
    if (matches && matches.length === 3) {
      kind = matches[2];
    }
  }


  private _doubleclick(event) {
    // Need composed path because the event is coming from a shadow root (the sub-palette).
    let target = event.composedPath()[0];
    let kind = target.textContent;
    if (target.tagName !== 'BUTTON') {
      return;
    }
    this._doClick(target, kind);
  }

  private _filterInput(event) {
    if (!this._elementDefintions) {
      this._filter.removeEventListener('input', this._filterInput);
      return;
    }
    let selectedValue = event.target.value;
    // Only do something if this is a complete element name, not some partial typing.
    if (this._elementDefintions.some(x => x.tag == selectedValue)) {
      this._doClick(null, selectedValue);
    }
  }
}

customElements.define('node-projects-palette-elements', PaletteElements);