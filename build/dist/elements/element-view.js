export class ElementView extends HTMLElement {
  constructor() {
    super();

    if (!ElementView._style) {
      ElementView._style = new CSSStyleSheet(); //@ts-ignore

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

    const shadow = this.attachShadow({
      mode: 'open'
    }); //@ts-ignore

    shadow.adoptedStyleSheets = [ElementView._style];
  }

}