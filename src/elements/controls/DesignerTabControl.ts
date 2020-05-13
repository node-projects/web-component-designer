import { BaseCustomWebComponent, css } from './BaseCustomWebComponent';

export class DesignerTabControl extends BaseCustomWebComponent {

    public selectedIndex: number = -1;

    private _contentObserver: MutationObserver;
    private _panels: HTMLDivElement;
    private _headerDiv: HTMLDivElement;

    static get style() {
        return css`
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
            background-color: var(--dark-grey);
        }
        .tab-header {
            font-family: Arial;
            display: flex;
            justify-content: center;
            align-items: center;                
            text-transform: uppercase;                
            box-sizing: content-box;                
            padding-left: 10px;
            padding-right: 10px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
            letter-spacing: 1px;
        }
        .tab-header:hover {
            background: var(--light-grey);
        }
        .selected {
            pointer-events: none;
            background: var(--medium-grey);
            box-shadow: inset 0 3px 0 var(--highlight-pink);
        }
        .panels {
            background: var(--medium-grey);
            height: calc(100% - 30px);
        }
        `;}

    constructor() {
        super();
        
        this._contentObserver = new MutationObserver(() => {
            this._createItems();
        });

        let outerDiv = document.createElement("div")
        outerDiv.className = 'outer';
        this.shadowRoot.appendChild(outerDiv);
        this._headerDiv = document.createElement("div")
        this._headerDiv.className = 'header';
        outerDiv.appendChild(this._headerDiv);
        this._panels = document.createElement("div")
        this._panels.className = 'panels';
        outerDiv.appendChild(this._panels);
        let _slot = document.createElement("slot")
        _slot.name = 'panels';
        this._panels.appendChild(_slot);
    }

    connectedCallback() {
        this._createItems();
        this._selectedIndexChanged();
        this._contentObserver.observe(this, { childList: true });

        let selectedIndexAttribute = this.getAttribute("selected-index")
        if (selectedIndexAttribute) {
            this.selectedIndex = <number><any>selectedIndexAttribute;
            this._selectedIndexChanged();
        }
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
            tabHeaderDiv.onpointerdown = () => {
                this.selectedIndex = j;
                this._selectedIndexChanged()
            }
            this._headerDiv.appendChild(tabHeaderDiv);
            i++;
        }

        this._selectedIndexChanged();
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

customElements.define('node-projects-designer-tab-control', DesignerTabControl);
