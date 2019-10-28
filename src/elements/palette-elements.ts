

export class ElementsView extends HTMLElement {
  namesToPackages: Map<string, string>;

  private static _style: CSSStyleSheet;
  private _filter: HTMLInputElement;
  private _datalist: HTMLDataListElement;

  constructor() {
    super();
    if (!ElementsView._style) {
      ElementsView._style = new CSSStyleSheet();
      //@ts-ignore
      ElementsView._style.replaceSync(`
      :host {
        display: block;
        box-sizing: border-box;
        height: 100%;
        overflow: auto;
        padding-bottom: 60px;
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
        background: var(--light-grey);
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
      ::-moz-placeholder { color: white; font-weight: 100; font-size: 14px;  }
      :-ms-input-placeholder { color: white; font-weight: 100; font-size: 14px;  }
      :-moz-placeholder { color: white; font-weight: 100; font-size: 14px;  }
      `);
    }

    const shadow = this.attachShadow({ mode: 'open' });
    //@ts-ignore
    shadow.adoptedStyleSheets = [ElementsView._style];

    this._filter = document.createElement('input');
    this._filter.setAttribute('list', 'list');
    this._filter.placeholder = 'Filter Custom Elements';
    shadow.appendChild(this._filter)

    this._datalist = document.createElement('datalist');
    this._datalist.setAttribute('list', 'list');
    this._datalist.id = 'list';
    shadow.appendChild(this._datalist)
   
    this.addEventListener('click', this._click.bind(this));
    this._filter.addEventListener('input', this._filterInput.bind(this));
    
    this.namesToPackages = new Map();
  }

  /*
  static get template() {
    return html`
      <style include="palette-shared-styles"></style>

      <!-- A typeahead search -->
      <input list="list" placeholder="Filter Custom Elements" id="filter">
      <datalist id="list">
        <dom-repeat items="[[elements]]">
          <template>
            <option value="[[item]]">
          </option></template>
        </dom-repeat>
      </datalist>

      <!-- The list of clickable buttons -->
      <dom-repeat items="[[elements]]">
        <template>
          <button>[[item]]</button>
        </template>
      </dom-repeat>
    `;
  }*/

  _elementsReady(event) {
    

    /*this.elements = event.detail.response.elements;
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

  _doClick(target, kind) {
    // maybe it's a package/subpackage kind of thing.
    let matches = kind.match(/(.*)\/(.*)/);
    if (matches && matches.length === 3) {
      kind = matches[2];
    }
    this.maybeDoHTMLImport(kind, this.namesToPackages[kind]);
  }

  maybeDoHTMLImport(kind, packageName) {
    if (packageName === undefined) {
      // Oof, someone didn't know what element this was. Find it in the list.
      packageName = this.namesToPackages[kind];
    }

    this._fireEvent('new-element', kind, packageName, '');
  }

  _click(event) {
    // Need composed path because the event is coming from a shadow root (the sub-palette).
    let target = event.composedPath()[0];
    let kind = target.textContent;
    if (target.tagName !== 'BUTTON') {
      return;
    }
    this._doClick(target, kind);
  }

  _filterInput(event) {
    if (!this.elements) {
      this._filter.removeEventListener('input', this._filterInput);
      return;
    }
    var selectedValue = event.target.value;
    // Only do something if this is a complete element name, not some
    // partial typing.
    if (this.elements.indexOf(selectedValue) !== -1) {
      this._doClick(null, selectedValue);
    }
  }

  _fireEvent(name, tag, packageName, template) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { type: tag, template: template, package: packageName, node: this } }));
  }
}
