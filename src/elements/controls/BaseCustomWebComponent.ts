export const html = function (strings: TemplateStringsArray, ...values: any[]): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = strings.raw[0];
  return template;
};

export const css = function (strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
  const cssStyleSheet = new CSSStyleSheet();
  //@ts-ignore
  cssStyleSheet.replaceSync(strings.raw[0]);
  return cssStyleSheet;
};

/* @import could not be used in asyncStyles any more https://www.chromestatus.com/feature/4735925877735424 */
export const cssAsync = async function (strings: TemplateStringsArray, ...values: any[]): Promise<CSSStyleSheet> {
  const cssStyleSheet = new CSSStyleSheet();
  //@ts-ignore
  await cssStyleSheet.replace(strings.raw[0]);
  return cssStyleSheet;
};

export class BaseCustomWebComponent extends HTMLElement {
  static readonly style: CSSStyleSheet | Promise<CSSStyleSheet>;
  static readonly template: HTMLTemplateElement;

  protected _getDomElement<T extends Element>(id: string): T {
    if (this.shadowRoot.children.length > 0)
      return <T>(<any>this.shadowRoot.getElementById(id));
    return <T>(<any>this._rootDocumentFragment.getElementById(id));
  }

  protected _getDomElements<T extends Element>(selector: string): T[] {
    if (this.shadowRoot.children.length > 0)
      return <T[]>(<any>this.shadowRoot.querySelectorAll(selector));
    return <T[]>(<any>this._rootDocumentFragment.querySelectorAll(selector));
  }

  //@ts-ignore
  private static _propertiesDictionary: Map<string, string>;
  protected _parseAttributesToProperties() {
    //@ts-ignore
    if (!this.constructor._propertiesDictionary) {
      //@ts-ignore
      this.constructor._propertiesDictionary = new Map<string, [string, any]>();
      //@ts-ignore
      for (let i in this.constructor.properties) {
        //@ts-ignore
        this.constructor._propertiesDictionary.set(i.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`), [i, this.constructor.properties[i]]);
      }
    }
    for (const a of this.attributes) {
      //@ts-ignore
      let pair = this.constructor._propertiesDictionary.get(a.name);
      if (pair) {
        if (pair[1] === Boolean)
          this[pair[0]] = true;
        else if (pair[1] === Object)
          this[pair[0]] = JSON.parse(a.value);
        else
          this[pair[0]] = a.value;
      }
    }
  }

  /*attributeChangedCallback(name, oldValue, newValue) {
    //@ts-ignore
    if (this.constructor._propertiesDictionary) {
      this._parseAttributesToProperties();
    }
  }*/

  private _rootDocumentFragment: DocumentFragment;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    //@ts-ignore
    if (this.constructor.template) {
      //@ts-ignore
      this._rootDocumentFragment = this.constructor.template.content.cloneNode(true);
    }

    //@ts-ignore
    if (this.constructor.style) {
      //@ts-ignore
      if (this.constructor.style instanceof Promise)
        //@ts-ignore
        this.constructor.style.then((style) => this.shadowRoot.adoptedStyleSheets = [style]);
      else
        //@ts-ignore
        this.shadowRoot.adoptedStyleSheets = [this.constructor.style];
    }

    queueMicrotask(() => {
      if (this._rootDocumentFragment)
        this.shadowRoot.appendChild(this._rootDocumentFragment);
      //@ts-ignore
      if (this.oneTimeSetup && !this.constructor._oneTimeSetup) {
        //@ts-ignore
        this.constructor._oneTimeSetup = true;
        //@ts-ignore
        this.oneTimeSetup();
      }
      //@ts-ignore
      if (this.ready)
        //@ts-ignore
        this.ready();
    })
  }
}
