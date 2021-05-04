import { BaseCustomWebComponentLazyAppend, css } from "@node-projects/base-custom-webcomponent"
import { TypedEvent } from '../../basic/TypedEvent';
import { IActivateable } from '../../interfaces/IActivateable';

export type DesignerTabControlIndexChangedEventArgs = { newIndex: number, oldIndex?: number, changedViaClick?: boolean };

export class DesignerTabControl extends BaseCustomWebComponentLazyAppend {

  private _selectedIndex: number = -1;

  private _contentObserver: MutationObserver;
  private _panels: HTMLDivElement;
  private _headerDiv: HTMLDivElement;

  static override readonly style = css`
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
            background-color: var(--dark-grey, #232733);
            overflow-x: auto;
            scrollbar-width: none;  /* Firefox */
        }
        .header::-webkit-scrollbar { 
            display: none;  /* Safari and Chrome */
        }
        .tab-header {
            font-family: Arial;
            display: flex;
            justify-content: center;
            align-items: center;                
            text-transform: uppercase;                
            box-sizing: content-box;                
            padding-left: 5px;
            padding-right: 5px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
            letter-spacing: 1px;
            
        }
        .tab-header:hover {
            background: var(--light-grey, #383f52);
        }
        .selected {
            pointer-events: none;
            background: var(--medium-grey, #2f3545);
            box-shadow: inset 0 3px 0 var(--highlight-pink, #e91e63);
        }
        .panels {
            background: var(--medium-grey, #2f3545);
            height: calc(100% - 30px);
        }
        `;

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
      this.selectedIndex = parseInt(selectedIndexAttribute);
    }
  }

  public get selectedIndex() {
    return this._selectedIndex;
  }
  public set selectedIndex(value: number) {
    let old = this._selectedIndex;
    this._selectedIndex = value;
    if (this._headerDiv.children.length)
      this._selectedIndexChanged(old);
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
        let old = this._selectedIndex;
        this._selectedIndex = j;
        if (this._headerDiv.children.length)
          this._selectedIndexChanged(old, true);
      }
      this._headerDiv.appendChild(tabHeaderDiv);
      i++;
    }

    this._selectedIndexChanged();
  }

  private _selectedIndexChanged(oldIndex?: number, viaClick = false) {
    for (let index = 0; index < this.children.length; index++) {
      const element = this.children[index];
      if (index == this._selectedIndex) {
        element.slot = "panels";
        this._headerDiv.children[index].classList.add('selected');
        if ((<IActivateable><unknown>element).activated)
          (<IActivateable><unknown>element).activated();

        //bugfix sometimes not shown content
        if (!(<HTMLElement>element).clientWidth) {
          let oldDisplay = (<HTMLElement>element).style.display;
          this._bugfixNotShownContent((<HTMLElement>element), oldDisplay);
        }
      } else {
        element.removeAttribute("slot");
        this._headerDiv.children[index].classList.remove('selected');
      }
    }
    this.onSelectedTabChanged.emit({ newIndex: this._selectedIndex, oldIndex: oldIndex, changedViaClick: viaClick });
  }

  private _bugfixNotShownContent(element: HTMLElement, oldDisplay: string) {
    /*requestAnimationFrame(() => {
      element.style.display = 'none';
      element.style.display = oldDisplay;
      if (!(<HTMLElement>element).clientWidth)
        this._bugfixNotShownContent(element, oldDisplay);
    });*/
  }

  public readonly onSelectedTabChanged = new TypedEvent<DesignerTabControlIndexChangedEventArgs>();
}

customElements.define('node-projects-designer-tab-control', DesignerTabControl);
