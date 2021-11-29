import { css, html, BaseCustomWebComponentConstructorAppend, Disposable } from '@node-projects/base-custom-webcomponent';
import { ITreeView } from './ITreeView';
import { IDesignItem } from '../../item/IDesignItem';
import { ISelectionChangedEvent } from '../../services/selectionService/ISelectionChangedEvent';
import { NodeType } from '../../item/NodeType';
import { assetsPath } from '../../../Constants';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';

export class TreeViewExtended extends BaseCustomWebComponentConstructorAppend implements ITreeView {

  private _treeDiv: HTMLTableElement;
  private _tree: Fancytree.Fancytree;
  private _filter: HTMLInputElement;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;
  private _contentChangedHandler: Disposable;

  static override readonly style = css`
      * {
          touch-action: none;
      }
      
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
      span.fancytree-title {
        align-items: center;
        flex-direction: row;
        display: inline-flex;
      }
      td {
        white-space: nowrap;
        display: flex;
      }
      td > img {
        vertical-align: middle;
      }

      .cmd {
        display: flex;
        position: sticky;
        right: 0;
        padding-right: 4px;
        align-items: center;
        gap: 2px;
        background: #ffffffc9;
        width: 70px;
        justify-content: flex-end;
      }

      table.fancytree-ext-table tbody tr.fancytree-selected {
        background-color: #bebebe;
      }
    `;

  static override readonly template = html`
  <div style="height: 100%;">
    <input id="input" style="width: 100%; height:21px;" placeholder="Filter..." autocomplete="off">
    <div style="height: calc(100% - 23px); overflow: auto;">
      <table id="treetable" style="min-width: 100%;">
        <colgroup>
          <col width="*">
          <!--<col width="25px">
          <col width="25px">
          <col width="25px">-->
        </colgroup>
        <thead style="display: none;">
          <tr>
            <th></th>
            <!--<th></th>
            <th></th>
            <th></th>-->
          </tr>
        </thead>
      </table>
    </div>
  </div>`;

  constructor() {
    super();

    let externalCss = document.createElement('style');
    externalCss.innerHTML = '@import url("./node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css");';
    this.shadowRoot.appendChild(externalCss);

    this._filter = this._getDomElement<HTMLInputElement>('input');
    this._filter.onkeyup = () => {
      let match = this._filter.value;
      this._tree.filterNodes((node) => {
        return new RegExp(match, "i").test(node.title);
      })
    }

    this._treeDiv = this._getDomElement<HTMLTableElement>('treetable');

    /*this._treeDiv = document.createElement('div');
    this._treeDiv.style.height = 'calc(100% - 21px)'
    this._treeDiv.style.overflow = 'auto';
    this._treeDiv.setAttribute('id', 'tree');
    this.shadowRoot.appendChild(this._treeDiv);*/
  }

  _showHideAtDesignTimeState(img: HTMLImageElement, designItem: IDesignItem) {
    if (designItem.hideAtDesignTime)
      img.src = assetsPath + "images/treeview/eyeclose.png";
    else
      img.src = assetsPath + "images/treeview/eyeopen.png";
  }

  _switchHideAtDesignTimeState(img: HTMLImageElement, designItem: IDesignItem) {
    designItem.hideAtDesignTime = !designItem.hideAtDesignTime;
    this._showHideAtDesignTimeState(img, designItem);
  }

  _showLockAtDesignTimeState(img: HTMLImageElement, designItem: IDesignItem) {
    if (designItem.lockAtDesignTime)
      img.src = assetsPath + "images/treeview/lock.png";
    else
      img.src = assetsPath + "images/treeview/dot.png";
  }

  _switchLockAtDesignTimeState(img: HTMLImageElement, designItem: IDesignItem) {
    designItem.lockAtDesignTime = !designItem.lockAtDesignTime;
    this._showLockAtDesignTimeState(img, designItem);
  }

  _showHideAtRunTimeState(img: HTMLImageElement, designItem: IDesignItem) {
    if (designItem.hideAtRunTime)
      img.src = assetsPath + "images/treeview/eyeclose.png";
    else
      img.src = assetsPath + "images/treeview/eyeopen.png";
  }

  _switchHideAtRunTimeState(img: HTMLImageElement, designItem: IDesignItem) {
    designItem.hideAtRunTime = !designItem.hideAtRunTime;
    this._showHideAtRunTimeState(img, designItem);
  }

  async ready() {
    //this._treeDiv.classList.add('fancytree-connectors');
    $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
      icon: true, //atm, maybe if we include icons for specific elements
      extensions: ['childcounter', 'dnd5', 'multi', 'filter', 'table'],
      quicksearch: true,
      source: [],

      table: {
        indentation: 20,       // indent 20px per node level
        nodeColumnIdx: 0,      // render the node title into the 2nd column
        checkboxColumnIdx: 0,  // render the checkboxes into the 1st column
      },

      activate: (event, data) => {
        let node = data.node;
        let designItem: IDesignItem = node.data.ref;
        if (designItem)
          designItem.instanceServiceContainer.selectionService.setSelectedElements([designItem]);
      },

      createNode: (event, data) => {
        let node = data.node;

        if (node.tr.children[0]) {
          let designItem: IDesignItem = node.data.ref;

          if (designItem && designItem.nodeType === NodeType.Element && designItem !== designItem.instanceServiceContainer.contentService.rootDesignItem) {
            let d = document.createElement("div");
            d.className = "cmd"
            let img = document.createElement('img');
            this._showHideAtDesignTimeState(img, designItem);
            img.onclick = () => this._switchHideAtDesignTimeState(img, designItem);
            img.title = 'hide in designer';
            d.appendChild(img);

            let imgL = document.createElement('img');
            this._showLockAtDesignTimeState(imgL, designItem);
            imgL.onclick = () => this._switchLockAtDesignTimeState(imgL, designItem);
            imgL.title = 'lock';
            d.appendChild(imgL);

            let imgH = document.createElement('img');
            this._showHideAtRunTimeState(imgH, designItem);
            imgH.onclick = () => this._switchHideAtRunTimeState(imgH, designItem);
            imgH.title = 'hide at runtime';
            d.appendChild(imgH);

            node.tr.children[0].appendChild(d)
          }
        }
      },

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
      loadChildren: (event, data) => {
        // update node and parent counters after lazy loading
        //@ts-ignore
        data.node.updateCounters();
      }
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

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._instanceServiceContainer = value;
    this._selectionChangedHandler?.dispose()
    this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
      this.selectionChanged(e);
    });
    this._contentChangedHandler?.dispose()
    this._contentChangedHandler = this._instanceServiceContainer.contentService.onContentChanged.on(e => {
      this.createTree(value.contentService.rootDesignItem);
    });
    this.createTree(value.contentService.rootDesignItem);
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
      title: item.nodeType === NodeType.Element ? item.name + " " + (item.id ? ('#' + item.id) : '') : '<small><small><small>#' + (item.nodeType === NodeType.TextNode ? 'text' : 'comment') + '&nbsp;</small></small></small> ' + item.content,
      folder: item.children.length > 0 ? true : false,
      //@ts-ignore
      ref: item
    });

    for (let i of item.children()) {
      if (i.nodeType !== NodeType.TextNode || i.content?.trim()) {
        this._getChildren(i, newNode);
      }
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