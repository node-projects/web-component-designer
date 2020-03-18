export const html = function html(strings: TemplateStringsArray, ...values: any[]): HTMLTemplateElement {
    const template = (document.createElement('template'));
    template.innerHTML = strings.raw[0];
    return template;
};

export const css = function html(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const cssStyleSheet = new CSSStyleSheet()
    //@ts-ignore
    cssStyleSheet.replace(strings.raw[0]);
    return cssStyleSheet;
};

export abstract class BaseCustomWebComponent extends HTMLElement {
    public static readonly style: CSSStyleSheet;
    //@ts-ignore
    private static _style: CSSStyleSheet;
    public static readonly template: HTMLTemplateElement;
    //@ts-ignore
    private static  _template: HTMLTemplateElement;

    protected _getDomElement<T extends HTMLElement>(id: string): T {
        return <T><any>this.shadowRoot.getElementById(id);
    }
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        //@ts-ignore
        if (this.constructor.template) {
             //@ts-ignore
            if (!this.constructor._template) {
                //@ts-ignore
                this.constructor._template = this.constructor.template;
            }
            //@ts-ignore
            this.shadowRoot.appendChild(this.constructor._template.content.cloneNode(true));
        }
        
        //@ts-ignore
        if (this.constructor.style) {
          //@ts-ignore
          if (!this.constructor._style) {
              //@ts-ignore
              this.constructor._style = this.constructor.style;
          }
          //@ts-ignore
          this.shadowRoot.adoptedStyleSheets = [this.constructor._style]
      }
    }
}