import { css, html, BaseCustomWebComponentConstructorAppend, Disposable, DomHelper } from '@node-projects/base-custom-webcomponent';
import { NodeType, ITreeView, InstanceServiceContainer, IDesignItem, assetsPath, IContextMenuItem, ContextMenu, switchContainer, ISelectionChangedEvent, DomConverter } from '@node-projects/web-component-designer';
import { WunderbaumNode } from 'wb_node';
import { Wunderbaum } from 'wunderbaum';
import defaultOptions from '../WunderbaumOptions.js'
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' assert { type: 'css' };

export class TreeViewExtended extends BaseCustomWebComponentConstructorAppend implements ITreeView {

  private _treeDiv: HTMLTableElement;
  private _tree: Wunderbaum;
  private _filter: HTMLInputElement;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _selectionChangedHandler: Disposable;
  private _contentChangedHandler: Disposable;

  static override readonly style = css`
      * {
          touch-action: none;
          cursor: default;
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
        padding-right: 2px;
        align-items: center;
        gap: 2px;
        background: #ffffffc9;
        width: 42px;
        justify-content: flex-end;
        background: white;
      }

      .cmd > img {
        width: 10px;
      }

      table.fancytree-ext-table tbody tr.fancytree-selected {
        background-color: #bebebe;
      }
    `;

  static override readonly template = html`
      <div style="height: 100%;">
        <input id="input" style="width: 100%; box-sizing: border-box; height:27px;" placeholder="Filter... (regex)" autocomplete="off">
        <div style="height: calc(100% - 23px); overflow: auto;">
        <div id="treetable" style="min-width: 100%;"></div>
        </div>
      </div>`;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, TreeViewExtended.style];

    this._filter = this._getDomElement<HTMLInputElement>('input');
    this._filter.onkeyup = () => {
      this._filterNodes();
    }

    this._treeDiv = this._getDomElement<HTMLTableElement>('treetable');
  }

  _filterNodes() {
    let match = this._filter.value;
    if (match) {
      const regEx = new RegExp(match, "i");
      this._tree.filterNodes((node) => {
        const di: IDesignItem = node.data.ref
        return regEx.test(di.name) || regEx.test(di.id) || regEx.test(di.content);
      }, {});
    }
    else {
      this._tree.clearFilter();
    }
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

  public showDesignItemContextMenu(designItem: IDesignItem, event: MouseEvent) {
    event.preventDefault();
    const mnuItems: IContextMenuItem[] = [];
    for (let cme of designItem.serviceContainer.designerContextMenuExtensions) {
      if (cme.shouldProvideContextmenu(event, designItem.instanceServiceContainer.designerCanvas, designItem, 'treeView')) {
        mnuItems.push(...cme.provideContextMenuItems(event, designItem.instanceServiceContainer.designerCanvas, designItem));
      }
    }
    let ctxMnu = ContextMenu.show(mnuItems, event);
    return ctxMnu;
  }

  async ready() {
    this._tree = new Wunderbaum({
      ...defaultOptions,
      element: this._treeDiv,
      click: (e) => {
        if (e.event) { // only for clicked items, not when elements selected via code.
          let node = e.node;
          let designItem: IDesignItem = node.data.ref;
          if (designItem) {
            if (e.event.ctrlKey) {
              const sel = [...designItem.instanceServiceContainer.selectionService.selectedElements];
              const idx = sel.indexOf(designItem);
              if (idx >= 0) {
                sel.splice(idx, 1);
                designItem.instanceServiceContainer.selectionService.setSelectedElements(sel);
              } else {
                designItem.instanceServiceContainer.selectionService.setSelectedElements([...sel, designItem]);
              }
            }
            else {
              designItem.instanceServiceContainer.selectionService.setSelectedElements([designItem]);
            }
          }
        }
        const disableExpand = (<MouseEvent>e.event).ctrlKey || (<MouseEvent>e.event).shiftKey;
        return !disableExpand;
      },
      columns: [
        { id: "*", title: "element", width: "*" },
        { id: "buttons", title: "buttons", width: "50px" }
      ],
      dnd: {
        dropMarkerParent: this.shadowRoot,
        preventRecursion: true, // Prevent dropping nodes on own descendants
        preventVoidMoves: false,
        dropMarkerOffsetX: -24,
        dropMarkerInsertOffsetX: -16,
        //@ts-ignore
        dragStart: (e) => {
          e.event.effectAllowed = "all";
          e.event.dropEffect = "move";
          return true;
        },
        //@ts-ignore
        dragEnter: (e) => {
          e.event.dropEffect = e.event.ctrlKey ? 'copy' : 'move';
          return true;
        },
        //@ts-ignore
        dragOver: (e) => {
          e.event.dropEffect = e.event.ctrlKey ? 'copy' : 'move';
          return true;
        },
        //@ts-ignore
        dragDrop: async (e) => {
          let sourceDesignitems: IDesignItem[] = e.event.otherNodeList.map(x => x.data.ref);
          if (e.event.dropEffectSuggested == 'copy') {
            let newSourceDesignitems: IDesignItem[] = [];
            for (let d of sourceDesignitems)
              newSourceDesignitems.push(await d.clone());
            sourceDesignitems = newSourceDesignitems;
          }
          const targetDesignitem: IDesignItem = e.data.ref;
          let grp = targetDesignitem.openGroup("drag/drop in treeview");

          if (e.event.hitMode == 'over') {
            switchContainer(sourceDesignitems, targetDesignitem);
          } else if (e.event.hitMode == 'after' || e.event.hitMode == 'before') {
            for (let d of sourceDesignitems) {
              if (d.parent != targetDesignitem.parent) {
                switchContainer([d], targetDesignitem.parent);
              }
              if (e.event.hitMode == 'before')
                targetDesignitem.insertAdjacentElement(d, 'beforebegin');
              else
                targetDesignitem.insertAdjacentElement(d, 'afterend');
            }
          }

          grp.commit();
        },
      },
      filter: {
        autoApply: true,   // Re-apply last filter if lazy data is loaded
        autoExpand: true, // Expand all branches that contain matches while filtered
        counter: true,     // Show a badge with number of matching child nodes near parent icons
        fuzzy: true,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
        hideExpandedCounter: true,  // Hide counter badge if parent is expanded
        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
        highlight: true,   // Highlight matches by wrapping inside <mark> tags
        leavesOnly: false, // Match end nodes only
        nodata: true,      // Display a 'no data' status node if result is empty
        mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
      },
      render: (e) => {
        const node = e.node;
        let item = node.data.ref;
        e.nodeElem.querySelector("span.wb-title").innerHTML = e.node.title;
        e.nodeElem.oncontextmenu = (e) => this.showDesignItemContextMenu(item, e);
        e.nodeElem.onmouseenter = (e) => item.instanceServiceContainer.designerCanvas.showHoverExtension(item.element, e);
        e.nodeElem.onmouseleave = (e) => item.instanceServiceContainer.designerCanvas.showHoverExtension(null, e);

        for (const col of Object.values(e.renderColInfosById)) {
          switch (col.id) {
            case 'buttons': {
              DomHelper.removeAllChildnodes(col.elem);

              let designItem = node.data.ref;
              let d = document.createElement("div");
              d.className = "cmd"

              let imgL = document.createElement('img');
              this._showLockAtDesignTimeState(imgL, designItem);
              imgL.onclick = () => this._switchLockAtDesignTimeState(imgL, designItem);
              imgL.title = 'lock';
              d.appendChild(imgL);

              let img = document.createElement('img');
              this._showHideAtDesignTimeState(img, designItem);
              img.onclick = () => this._switchHideAtDesignTimeState(img, designItem);
              img.title = 'hide in designer';
              d.appendChild(img);

              let imgH = document.createElement('img');
              this._showHideAtRunTimeState(imgH, designItem);
              imgH.onclick = () => this._switchHideAtRunTimeState(imgH, designItem);
              imgH.title = 'hide at runtime';
              d.appendChild(imgH);

              col.elem.appendChild(d)
              break;
            }
          }
        }
      },
    });
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
    this._highlight(event.selectedElements);
  }

  private _recomputeTree(rootItem: IDesignItem): void {
    this._tree.root.removeChildren();

    this._getChildren(rootItem, null);
    this._tree.expandAll();
    this._filterNodes();
  }

  private _getChildren(item: IDesignItem, currentNode: WunderbaumNode): any {
    if (currentNode == null) {
      currentNode = this._tree.root;
    }

    const newNode = currentNode.addChildren({
      title: item.isRootItem ? '-root-' : item.nodeType === NodeType.Element ? item.name + " " + (item.id ? ('#' + item.id) : '') : '<small><small><small>#' + (item.nodeType === NodeType.TextNode ? 'text' : 'comment') + '&nbsp;</small></small></small> ' + DomConverter.normalizeContentValue(item.content),
      //@ts-ignore
      ref: item
    });

    for (let i of item.children()) {
      if (!i.isEmptyTextNode) {
        this._getChildren(i, newNode);
      }
    }
  }

  private _highlight(activeElements: IDesignItem[]) {
    this._tree.visit((node) => {
      if (activeElements && activeElements.indexOf(node.data.ref) >= 0) {
        node.setSelected(true);
        node.setActive(true);
        node.makeVisible({ scrollIntoView: true });
      } else {
        node.setSelected(false);
        node.setActive(false);
      }
    });
  }
}

customElements.define('node-projects-tree-view-extended', TreeViewExtended);