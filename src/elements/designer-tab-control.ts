export class DesignerTabControl extends HTMLElement {

    selectedIndex: number;

    private _boundHeaderClick: any;
    private _contentObserver: MutationObserver;
    private _ready: boolean;
    private _oldIndex: number;

    private static _style: CSSStyleSheet;
    private _tabs: HTMLDivElement;
    private _panels: HTMLDivElement;
    _headerDiv: HTMLDivElement;

    constructor() {
        super();
        if (!DesignerTabControl._style) {
            DesignerTabControl._style = new CSSStyleSheet();
            //@ts-ignore
            DesignerTabControl._style.replaceSync(`
            :host {
                height: 100%;
            }
            .outer {
                display: flex; 
                flex-direction: column; 
                height: 100%;
            }
            .header {
                display: inline-flex; 
                user-select: none; 
                flex-direction: row; 
                cursor: pointer; 
                height: 30px;
            }
            .tab-header {
                font-family: Arial;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: var(--dark-grey);
                text-transform: uppercase;                
                box-sizing: content-box;
                height: 30px;
                padding-left: 10px;
                padding-right: 10px;
                color: white;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.5;
                letter-spacing: 1px;
            }
            .tab-header:hover {
                background: var(--medium-grey);
            }
            .selected {
                pointer-events: none;
                background: var(--medium-grey);
                box-shadow: inset 0 3px 0 var(--highlight-pink);
            }
            .panels {
                box-shadow: 0 2px 2px rgba(0, 0, 0, .3); 
                border-radius: 3px; 
                height: calc(100% - 30px);
            }
      `);
        }

        this._contentObserver = new MutationObserver(() => {
            this._createItems();
        });

        const shadow = this.attachShadow({ mode: 'open' });
        //@ts-ignore
        shadow.adoptedStyleSheets = [DesignerTabControl._style];

        let outerDiv = document.createElement("div")
        outerDiv.className = 'outer';
        shadow.appendChild(outerDiv);
        this._headerDiv = document.createElement("div")
        this._headerDiv.className = 'header';
        outerDiv.appendChild(this._headerDiv);
        this._tabs = document.createElement("div")
        this._tabs.className = 'tabs';
        //headerDiv.appendChild(this._tabs);
        this._panels = document.createElement("div")
        this._panels.className = 'panels';
        outerDiv.appendChild(this._panels);
        let _slot = document.createElement("slot")
        _slot.name = 'panels';
        this._panels.appendChild(_slot);
    }

    connectedCallback() {
        this._createItems();

        this._ready = true;
        this._selectedIndexChanged();

        this._contentObserver.observe(this, { childList: true });
        this._oldIndex = -1;
    }

    disconnectedCallback() {
        this._contentObserver.disconnect();
    }

    private _createItems() {
        this._headerDiv.innerHTML = "";
        let i = 0;
        for (let item of this.children) {
            let htmlItem = item as HTMLElement;
            let tabHeaderDiv = document.createElement("div")
            tabHeaderDiv.innerText = htmlItem.title;
            tabHeaderDiv.className = 'tab-header';
            let j = i;
            tabHeaderDiv.onclick = () => {
                this.selectedIndex = j;
                this._selectedIndexChanged()
            }
            this._headerDiv.appendChild(tabHeaderDiv);
            i++;
        }
    }

    private _selectedIndexChanged() {        
        for (let index = 0; index < this.children.length; index++) {
            const element = this.children[index];
            if (index == this.selectedIndex) {                
                element.slot = "panels";
                this._headerDiv.children[index].classList.add('selected');
            } else {
                element.removeAttribute("slot");
                this._headerDiv.children[index].classList.remove('selected');
            }
        }
    }
}

customElements.define('designer-tab-control', DesignerTabControl);
