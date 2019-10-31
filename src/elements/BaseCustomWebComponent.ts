export class BaseCustomWebComponent extends HTMLElement {

    protected static _style: CSSStyleSheet;
    protected _shadow: ShadowRoot;

    constructor(template: string, style: string) {
        super();

        // todo :
        // template could be template, template should be cached...
        // css should be...
        
        if (!BaseCustomWebComponent._style) {
            BaseCustomWebComponent._style = new CSSStyleSheet();
            //@ts-ignore
            BaseCustomWebComponent._style.replaceSync(style);
        }

        this._shadow = this.attachShadow({ mode: 'open' });
        //@ts-ignore
        this._shadow.adoptedStyleSheets = [BaseCustomWebComponent._style];

        if (template) {
            let range = document.createRange();
            range.selectNode(this._shadow);
            let documentFragment = range.createContextualFragment(template);
            if (documentFragment.children.length == 1 && documentFragment.firstElementChild.nodeName == "template") {
                let templateElement = <HTMLTemplateElement>documentFragment.firstElementChild;
                this._shadow.appendChild(document.importNode(templateElement.content, true));
            }
            else
                this._shadow.appendChild(documentFragment);
        }
    }
}