import { BaseCustomWebComponent, css } from '@node-projects/base-custom-webcomponent';
import { IDesignItem } from '../../item/IDesignItem';
import { ISelectionChangedEvent } from '../../services/selectionService/ISelectionChangedEvent';

export class BindableObjectsBrowser extends BaseCustomWebComponent {
  private _treeDiv: HTMLDivElement;
  private _tree: Fancytree.Fancytree;
  private _filter: HTMLInputElement;

  static readonly style = css`
      span.drag-source {
        border: 1px solid grey;
        border-radius: 3px;
        padding: 2px;
        background-color: silver;
      }

      span.fancytree-node.fancytree-drag-source {
        outline: 1px dotted grey;
      }
      span.fancytree-node.fancytree-drop-accept {
        outline: 1px dotted green;
      }
      span.fancytree-node.fancytree-drop-reject {
        outline: 1px dotted red;
      }
      #tree ul {
        border: none;
      }
      #tree ul:focus {
        outline: none;
      }
    `;

  constructor() {
    super();

    let externalCss = document.createElement('style');
    externalCss.innerHTML = '@import url("./node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css");';
    this.shadowRoot.appendChild(externalCss);

    this._filter = document.createElement('input');
    this._filter.style.width = '100%'
    this._filter.placeholder = 'Filter...';
    this._filter.autocomplete = 'off';
    this._filter.onkeyup = () => {
      let match = this._filter.value;
      this._tree.filterNodes((node) => {
        return new RegExp(match, "i").test(node.title);
      })
    }
    this.shadowRoot.appendChild(this._filter);

    this._treeDiv = document.createElement('div');
    this._treeDiv.style.height = '100%'
    this._treeDiv.style.overflow = 'auto';
    this._treeDiv.setAttribute('id', 'tree');
    this.shadowRoot.appendChild(this._treeDiv);
  }


  async ready() {
    //this._treeDiv.classList.add('fancytree-connectors');
    $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
      icon: false, //atm, maybe if we include icons for specific elements
      extensions: ['filter'],
      quicksearch: true,
      source: [],
      filter: {
        autoApply: true,   // Re-apply last filter if lazy data is loaded
        autoExpand: false, // Expand all branches that contain matches while filtered
        counter: true,     // Show a badge with number of matching child nodes near parent icons
        fuzzy: true,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
        hideExpandedCounter: true,  // Hide counter badge if parent is expanded
        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
        highlight: true,   // Highlight matches by wrapping inside <mark> tags
        leavesOnly: false, // Match end nodes only
        nodata: true,      // Display a 'no data' status node if result is empty
        mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
      }
      /*loadChildren: (event, data) => {
        // update node and parent counters after lazy loading
        data.node.updateCounters();
      }*/
    });

    //@ts-ignore
    this._tree = $.ui.fancytree.getTree(this._treeDiv);
    this._treeDiv.children[0].classList.add('fancytree-connectors');
  }

  public createTree(rootItem: IDesignItem): void {
    if (this._tree) {
      this._recomputeTree(rootItem);
    }
  }

  public selectionChanged(event: ISelectionChangedEvent) {
    if (event.selectedElements.length > 0) {
      this._highlight(event.selectedElements);
    }
  }

  private _recomputeTree(rootItem: IDesignItem): void {
    this._tree.getRootNode().removeChildren();

    this._getChildren(rootItem, null);
    //@ts-ignore
    this._tree.getRootNode().updateCounters();
  }

  private _getChildren(item: IDesignItem, currentNode: Fancytree.FancytreeNode): any {
    if (currentNode == null) {
      currentNode = this._tree.getRootNode();
    }

    const newNode = currentNode.addChildren({
      title: item.name + " " + (item.id ? ('#' + item.id) : ''),
      folder: item.children.length > 0 ? true : false,
      //@ts-ignore
      ref: item
    });

    for (let i of item.children()) {
      this._getChildren(i, newNode);
    }
  }

  private _highlight(activeElements: IDesignItem[]) {
    if (activeElements != null) {
      this._tree.visit((node) => {
        //@ts-ignore
        if (activeElements.indexOf(node.data.ref) >= 0) {
          node.setSelected(true);
        } else {
          node.setSelected(false);
        }
      });
    }
  }
}

customElements.define('node-projects-bindable-objects-browser', BindableObjectsBrowser);