import { BaseCustomWebComponent, css } from '@node-projects/base-custom-webcomponent';
import { ITreeView } from './ITreeView';
import { IDesignItem } from '../../item/IDesignItem';
import { ISelectionChangedEvent } from '../../services/selectionService/ISelectionChangedEvent';

export class TreeViewExtended extends BaseCustomWebComponent implements ITreeView {
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
      extensions: ['dnd5', 'multi', 'filter', 'childcounter'],
      quicksearch: true,
      source: [],




      dnd5: {
        dropMarkerParent: this.shadowRoot,
        preventRecursion: true, // Prevent dropping nodes on own descendants
        preventVoidMoves: false,
        dropMarkerOffsetX: -24,
        dropMarkerInsertOffsetX: -16,

        dragStart: (node, data) => {
          /* This function MUST be defined to enable dragging for the tree.
            *
            * Return false to cancel dragging of node.
            * data.dataTransfer.setData() and .setDragImage() is available
            * here.
            */
          // Set the allowed effects (i.e. override the 'effectAllowed' option)
          data.effectAllowed = "all";

          // Set a drop effect (i.e. override the 'dropEffectDefault' option)
          // data.dropEffect = "link";
          data.dropEffect = "copy";

          // We could use a custom image here:
          // data.dataTransfer.setDragImage($("<div>TEST</div>").appendTo("body")[0], -10, -10);
          // data.useDefaultImage = false;

          // Return true to allow the drag operation
          return true;
        },
        // dragDrag: function(node, data) {
        //   logLazy("dragDrag", null, 2000,
        //     "T1: dragDrag: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
        //     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed );
        // },
        // dragEnd: function(node, data) {
        //   node.debug( "T1: dragEnd: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
        //     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
        //     alert("T1: dragEnd")
        // },

        // --- Drop-support:

        dragEnter: (node, data) => {
          // data.dropEffect = "copy";
          return true;
        },
        dragOver: (node, data) => {
          // Assume typical mapping for modifier keys
          data.dropEffect = data.dropEffectSuggested;
          // data.dropEffect = "move";
        },
        dragDrop: (node, data) => {
          /* This function MUST be defined to enable dropping of items on
            * the tree.
            */
          let newNode,
            transfer = data.dataTransfer,
            sourceNodes = data.otherNodeList,
            mode = data.dropEffect;

          if (data.hitMode === "after") {
            // If node are inserted directly after tagrget node one-by-one,
            // this would reverse them. So we compensate:
            sourceNodes.reverse();
          }
          if (data.otherNode) {
            // Drop another Fancytree node from same frame (maybe a different tree however)
            //let sameTree = (data.otherNode.tree === data.tree);

            if (mode === "move") {
              data.otherNode.moveTo(node, data.hitMode);
            } else {
              newNode = data.otherNode.copyTo(node, data.hitMode);
              if (mode === "link") {
                newNode.setTitle("Link to " + newNode.title);
              } else {
                newNode.setTitle("Copy of " + newNode.title);
              }
            }
          } else if (data.otherNodeData) {
            // Drop Fancytree node from different frame or window, so we only have
            // JSON representation available
            //@ts-ignore
            node.addChild(data.otherNodeData, data.hitMode);
          } else if (data.files.length) {
            // Drop files
            for (let i = 0; i < data.files.length; i++) {
              let file = data.files[i];
              node.addNode({ title: "'" + file.name + "' (" + file.size + " bytes)" }, data.hitMode);
              // var url = "'https://example.com/upload",
              //     formData = new FormData();

              // formData.append("file", transfer.files[0])
              // fetch(url, {
              //   method: "POST",
              //   body: formData
              // }).then(function() { /* Done. Inform the user */ })
              // .catch(function() { /* Error. Inform the user */ });
            }
          } else {
            // Drop a non-node
            node.addNode({ title: transfer.getData("text") }, data.hitMode);
          }
          node.setExpanded();
        },
      },




      multi: {
        mode: ""
      },
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
      },
      childcounter: {
        deep: true,
        hideZeros: true,
        hideExpanded: true
      },
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
    this._tree.expandAll();
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

customElements.define('node-projects-tree-view-extended', TreeViewExtended);