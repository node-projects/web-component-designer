export class DesignerTabControl extends HTMLElement {
  constructor() {
    super();

    if (!DesignerTabControl._style) {
      DesignerTabControl._style = new CSSStyleSheet(); //@ts-ignore

      DesignerTabControl._style.replaceSync(`
            .outer {
                display: flex; 
                flex-direction: column; 
                height: 100%;
            }
            .header {
                height: 30px;
            }
            .tab-header {
                box-sizing: content-box;
                height: 30px;
                padding-left: 10px;
                padding-right: 10px;
            }
            .tabs {
                display: inline-flex; 
                user-select: none; 
                flex-direction: row; 
                cursor: pointer; 
                background: lightgray;
            }
            .panels {
                box-shadow: 0 2px 2px rgba(0, 0, 0, .3); 
                border-radius: 3px; 
                height: calc(100% - 30px);
            }
      `);
    }

    this._boundHeaderClick = this._headerClick.bind(this);
    this._contentObserver = new MutationObserver(() => {
      this._selectedIndexChanged();
    });
    const shadow = this.attachShadow({
      mode: 'open'
    }); //@ts-ignore

    shadow.adoptedStyleSheets = [ElementsView._style];
    let outerDiv = document.createElement("div");
    outerDiv.className = 'outer';
    shadow.appendChild(outerDiv);
    let headerDiv = document.createElement("div");
    headerDiv.className = 'header';
    outerDiv.appendChild(headerDiv);
    this._tabs = document.createElement("div");
    this._tabs.className = 'tabs';
    this._tabs.onclick = this._boundHeaderClick;
    headerDiv.appendChild(this._tabs);
    this._panels = document.createElement("div");
    this._panels.className = 'panels';
    outerDiv.appendChild(this._panels);

    let _slot = document.createElement("slot");

    _slot.name = 'panels';
    outerDiv.appendChild(_slot);
  }

  connectedCallback() {
    this._tabs.innerHTML = "";

    for (let item of this.children) {
      let htmlItem = item;
      let tabHeaderDiv = document.createElement("div");
      tabHeaderDiv.innerText = htmlItem.title;
      tabHeaderDiv.className = 'tab-header';

      this._tabs.appendChild(tabHeaderDiv);
    }

    this._ready = true;

    this._selectedIndexChanged();

    this._contentObserver.observe(this, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });

    this._oldIndex = -1;
  }

  disconnectedCallback() {
    this._contentObserver.disconnect();
  }

  _headerClick(e) {
    if (e.target.slot === 'titles') {
      // @ts-ignore
      this.selectedIndex = this._index(this.$.titlesSlot.assignedNodes(), e.target);
      e.target.focus();
    }
  }

  _selectedIndexChanged() {
    if (this._ready) {
      if (this._oldIndex != this.selectedIndex) {
        this._oldIndex = this.selectedIndex;
        let i = 0;
        let o = 0;

        for (let item of this.children) {
          let htmlItem = item;

          if (item.slot == 'panels') {
            if (i == this.selectedIndex) {
              htmlItem.style.display = "block";
            } else {
              htmlItem.style.display = "none";
            }

            i++;
          } else if (item.slot == "titles") {
            if (o == this.selectedIndex) {
              htmlItem.style.background = "white";
            } else {
              htmlItem.style.background = "";
            }

            o++;
          }
        }

        ;
      }
    }
  }

  _index(lst, el) {
    var children = lst,
        i = 0;

    for (; i < children.length; i++) {
      if (children[i] == el) {
        return i;
      }
    }

    return -1;
  }

}
customElements.define('designer-tab-control', DesignerTabControl);