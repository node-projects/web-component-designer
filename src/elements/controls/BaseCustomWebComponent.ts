export const html = function html(strings: TemplateStringsArray, ...values: any[]): HTMLTemplateElement {
    const template = (document.createElement('template'));
    template.innerHTML = strings.raw[0];
    return template;
};

export const css = function html(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const cssStyleSheet = new CSSStyleSheet()
    //@ts-ignore
    cssStyleSheet.replaceSync(strings.raw[0]);
    return cssStyleSheet;
};


export abstract class BaseCustomWebComponent extends HTMLElement {
    protected _shadow: ShadowRoot;

    static readonly style: CSSStyleSheet;
    static readonly template: HTMLTemplateElement;

    constructor() {
        super();

        this._shadow = this.attachShadow({ mode: 'open' });
        //@ts-ignore
        if (this.constructor.style) {
            //@ts-ignore
            this._shadow.adoptedStyleSheets = [this.constructor.style];
        }

        //@ts-ignore
        if (this.constructor.template) {
            //@ts-ignore
            this._shadow.appendChild(this.constructor.template.content.cloneNode(true));
        }
    }
}