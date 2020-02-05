export const html = function html(strings, ...values) {
  const template = document.createElement('template');
  template.innerHTML = strings.raw[0];
  return template;
};
export const css = function html(strings, ...values) {
  const cssStyleSheet = new CSSStyleSheet(); //@ts-ignore

  cssStyleSheet.replace(strings.raw[0]);
  return cssStyleSheet;
};
export class BaseCustomWebComponent extends HTMLElement {
  constructor() {
    super(); //if (brk)
    //debugger;

    this.attachShadow({
      mode: 'open'
    }); //@ts-ignore

    if (this.constructor.template) {
      //@ts-ignore
      if (!this.constructor._template) {
        //@ts-ignore
        this.constructor._template = this.constructor.template;
      } //@ts-ignore


      this.shadowRoot.appendChild(this.constructor._template.content.cloneNode(true));
    } //@ts-ignore


    if (this.constructor.astyle) {
      //@ts-ignore
      if (!this.constructor._style) {
        //@ts-ignore
        this.constructor._style = this.constructor.astyle;
      } //@ts-ignore


      this.shadowRoot.adoptedStyleSheets = [this.constructor._style];
    }
  }

  _getDomElement(id) {
    return this.shadowRoot.getElementById(id);
  }

}