export class ElementView extends HTMLElement {

  private static _style: CSSStyleSheet;
  
  constructor() {
    super();
    if (!ElementView._style) {
      ElementView._style = new CSSStyleSheet();
      //@ts-ignore
      ElementView._style.replaceSync(`
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
      `);
    }

    const shadow = this.attachShadow({ mode: 'open' });
    //@ts-ignore
    shadow.adoptedStyleSheets = [ElementView._style];
  }

/*
      <designer-tabs attr-for-selected="name" selected="{{selected}}">
        <designer-tab name="properties">
          <button>Properties</button>
        </designer-tab>
        <designer-tab name="styles">
          <button>Styles</button>
        </designer-tab>
        <designer-tab name="flex">
          <button>Flex</button>
        </designer-tab>
      </designer-tabs>

      <iron-pages attr-for-selected="name" selected-attribute="visible" selected="[[selected]]">
        <element-stuff-properties name="properties" id="propertiesContainer"></element-stuff-properties>
        <element-stuff-styles name="styles" id="stylesContainer"></element-stuff-styles>
        <element-stuff-flex name="flex" id="flexContainer"></element-stuff-flex>
      </iron-pages>
   */
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
