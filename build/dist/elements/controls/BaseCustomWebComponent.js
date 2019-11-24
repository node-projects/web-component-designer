export const html = function html(strings, ...values) {
  const template = document.createElement('template');
  template.innerHTML = strings.raw[0];
  return template;
};
export const css = function html(strings, ...values) {
  const cssStyleSheet = new CSSStyleSheet(); //@ts-ignore

  cssStyleSheet.replaceSync(strings.raw[0]);
  return cssStyleSheet;
};
export class BaseCustomWebComponent extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({
      mode: 'open'
    }); //@ts-ignore

    if (this.constructor.style) {
      //@ts-ignore
      if (!this.constructor._style) {
        //@ts-ignore
        this.constructor._style = this.constructor.style;
      } //@ts-ignore


      this._shadow.adoptedStyleSheets = [this.constructor._style];
    } //@ts-ignore


    if (this.constructor.template) {
      //@ts-ignore
      if (!this.constructor._template) {
        //@ts-ignore
        this.constructor._template = this.constructor.template;
      } //@ts-ignore


      this._shadow.appendChild(this.constructor._template.content.cloneNode(true));
    }
  }

  _getDomElement(id) {
    return this._shadow.getElementById(id);
  }

}