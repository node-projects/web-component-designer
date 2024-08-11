import { css, html, BaseCustomWebComponentConstructorAppend, Disposable, cssFromString } from '@node-projects/base-custom-webcomponent';
import { NodeType, ITreeView, InstanceServiceContainer, IDesignItem, assetsPath, IContextMenuItem, ContextMenu, switchContainer, ISelectionChangedEvent, DomConverter, ForceCssContextMenu } from '@node-projects/web-component-designer';
import { Wunderbaum } from 'wunderbaum';
import { defaultOptions, defaultStyle } from '../WunderbaumOptions.js'
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' with { type: 'css' };

type WunderbaumNode = {
  getColElem(n:number);
  addChildren({}: any);
}
const wbNodeSymbol = Symbol.for('wunderbaumnode');

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
    
      .cmd {
        display: flex;
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
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
      
      div.wunderbaum div.wb-row {
        display: block;
      }
      span.wb-node.wb-col {
        width: unset !important;
        display: inline-block;
      }
      div.wunderbaum span.wb-node span.wb-title {
        text-overflow: unset;
        width: unset !important;
      }
      div.forced {
        border-radius: 50%;
        width: 10px;
        height: 10px;
        background: transparent;
        pointer-events: none;
        top: 5px;
        left: 5px;
        position: relative;
      }
      div.isforced {
        background: orange;
        pointer-events: all;
      }`;

  static override readonly template = html`
      <div style="height: 100%;">
        <input id="input" style="width: 100%; box-sizing: border-box; height:27px;" placeholder="Filter... (regex)" autocomplete="off">
        <div style="height: 18px; border: solid black 1px; padding-left:2px; background: gray;">
          <svg id="expandAll" style="width: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 80a16 16 0 0 0-16 16v320a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM0 96a64 64 0 0 1 64-64h320a64 64 0 0 1 64 64v320a64 64 0 0 1-64 64H64a64 64 0 0 1-64-64zm200 248v-64h-64a24 24 0 1 1 0-48h64v-64a24 24 0 1 1 48 0v64h64a24 24 0 1 1 0 48h-64v64a24 24 0 1 1-48 0"></path></svg>
          <svg id="collapseAll" style="width: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 80a16 16 0 0 0-16 16v320a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM0 96a64 64 0 0 1 64-64h320a64 64 0 0 1 64 64v320a64 64 0 0 1-64 64H64a64 64 0 0 1-64-64zm152 136h144a24 24 0 1 1 0 48H152a24 24 0 1 1 0-48"></path></svg>
        </div>
        <div style="height: calc(100% - 46px);">
        <div id="treetable" class="wb-alternate" style="min-width: 100%; box-sizing: border-box;"></div>
        </div>
      </div>`;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this.shadowRoot.adoptedStyleSheets = [cssFromString(wunderbaumStyle), defaultStyle, TreeViewExtended.style];

    this._filter = this._getDomElement<HTMLInputElement>('input');
    this._filter.onkeyup = () => {
      this._filterNodes();
    }

    this._treeDiv = this._getDomElement<HTMLTableElement>('treetable');
    this._treeDiv.onscroll = () => {
      for (let e of this._treeDiv.querySelectorAll('.cmd')) {
        (<HTMLElement>e).style.right = '-' + this._treeDiv.scrollLeft + 'px';
      }
    }

    const expand = this._getDomElement<SVGSVGElement>('expandAll');
    expand.onclick = () => {
      this._tree.root
        .visit((node) => {
          if (!node.isExpanded())
            node.setExpanded(true);
        });
    }

    const collapse = this._getDomElement<SVGSVGElement>('collapseAll');
    collapse.onclick = () => {
      this._tree.root
        .visit((node) => {
          if (node.isExpanded())
            node.setExpanded(false);
        });
    }
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
        mnuItems.push(...cme.provideContextMenuItems(event, designItem.instanceServiceContainer.designerCanvas, designItem, 'treeView', this));
      }
    }
    let ctxMnu = ContextMenu.show(mnuItems, event);
    return ctxMnu;
  }

  selectedFromTree = false;

  async ready() {
    this._tree = new Wunderbaum({
      ...defaultOptions,
      element: this._treeDiv,
      //@ts-ignore
      click: (e) => {
        if (e.event) { // only for clicked items, not when elements selected via code.
          let node = e.node;
          let designItem: IDesignItem = node.data.ref;
          if (designItem) {
            this.selectedFromTree = true;
            setTimeout(() => {
              this.selectedFromTree = false;
            }, 50);
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
      dnd: {
        guessDropEffect: true,
        preventRecursion: true,
        preventVoidMoves: false,
        serializeClipboardData: false,
        dragStart: (e) => {
          e.event.dataTransfer.effectAllowed = "all";
          e.event.dataTransfer.dropEffect = "move";
          return true;
        },
        dragEnter: (e) => {
          e.event.dataTransfer.dropEffect = e.event.ctrlKey ? 'copy' : 'move';
          return true;
        },
        dragOver: (e) => {
          e.event.dataTransfer.dropEffect = e.event.ctrlKey ? 'copy' : 'move';
          //return true;
        },
        drop: async (e) => {
          let sourceDesignitems: IDesignItem[] = [e.sourceNode].map(x => x.data.ref);
          if (e.event.dataTransfer.dropEffect == 'copy') {
            let newSourceDesignitems: IDesignItem[] = [];
            for (let d of sourceDesignitems)
              newSourceDesignitems.push(await d.clone());
            sourceDesignitems = newSourceDesignitems;
          }
          const targetDesignitem: IDesignItem = e.node.data.ref;

          let grp = targetDesignitem.openGroup("drag/drop in treeview");

          if (e.region == 'over') {
            switchContainer(sourceDesignitems, targetDesignitem);
          } else if (e.region == 'after' || e.region == 'before') {
            for (let d of sourceDesignitems) {
              if (d.parent != targetDesignitem.parent) {
                switchContainer([d], targetDesignitem.parent);
              }
              if (e.region == 'before')
                targetDesignitem.insertAdjacentElement(d, 'beforebegin');

              else
                targetDesignitem.insertAdjacentElement(d, 'afterend');
            }
          }

          grp.commit();
        }
      },
      filter: {
        autoApply: true,   // Re-apply last filter if lazy data is loaded
        autoExpand: true, // Expand all branches that contain matches while filtered
        fuzzy: true,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
        highlight: true,   // Highlight matches by wrapping inside <mark> tags
        leavesOnly: false, // Match end nodes only
        mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
      },
      render: (e) => {
        if (e.isNew) {
          const node = e.node;
          const rowElem = e.nodeElem.parentElement;
          let item: IDesignItem = node.data.ref;

          e.nodeElem.oncontextmenu = (e) => this.showDesignItemContextMenu(item, e);
          e.nodeElem.onmouseenter = (e) => item.instanceServiceContainer.designerCanvas.showHoverExtension(item.element, e);
          e.nodeElem.onmouseleave = (e) => item.instanceServiceContainer.designerCanvas.showHoverExtension(null, e);

          let sp = document.createElement("span");
          sp.style.display = "inline-block";
          sp.style.width = "42px";
          e.nodeElem.appendChild(sp);
          if (item && item.nodeType === NodeType.Element && item !== item.instanceServiceContainer.contentService.rootDesignItem) {
            const d = document.createElement("div");
            d.className = "cmd";

            const imgL = document.createElement('img');
            this._showLockAtDesignTimeState(imgL, item);
            imgL.onclick = () => this._switchLockAtDesignTimeState(imgL, item);
            imgL.title = 'lock';
            d.appendChild(imgL);

            const img = document.createElement('img');
            this._showHideAtDesignTimeState(img, item);
            img.onclick = () => this._switchHideAtDesignTimeState(img, item);
            img.title = 'hide in designer';
            d.appendChild(img);

            const imgH = document.createElement('img');
            this._showHideAtRunTimeState(imgH, item);
            imgH.onclick = () => this._switchHideAtRunTimeState(imgH, item);
            imgH.title = 'hide at runtime';
            d.appendChild(imgH);

            rowElem.appendChild(d);

            const f = document.createElement("div");
            f.className = "forced";
            f.title = "has forced style";
            rowElem.appendChild(f);
            f.addEventListener('click', (event) => {
              const items = new ForceCssContextMenu().provideContextMenuItems(event, item.instanceServiceContainer.designerCanvas, item);
              let ctxMenu = new ContextMenu(items, null);
              ctxMenu.display(event);
            });

            if (item.hasForcedCss) {
              f.className = "forced isforced";
            }
          }
        }
        e.nodeElem.querySelector("span.wb-title").innerHTML = e.node.title;
      },
    });
  }

  _recomputeRunning;
  _recomputeRequestedAgain;

  private async refreshNode(node: WunderbaumNode, item: IDesignItem) {
    const el = node.getColElem(0).parentElement;
    const f = el.querySelector('.forced')
    if (item.hasForcedCss)
      f.classList.add('isforced');
    else
      f.classList.remove('isforced');
  }

  public async createTree(rootItem: IDesignItem) {
    if (this._tree) {
      if (!this._recomputeRunning) {
        this._recomputeRunning = true;
        setTimeout(async () => {
          this._recomputeRequestedAgain = false;
          await this._recomputeTree(rootItem);
          this._recomputeRunning = false;
          if (this._recomputeRequestedAgain) {
            this._recomputeRequestedAgain = false;
            this.createTree(rootItem);
          }
        }, 20);
      } else {
        this._recomputeRequestedAgain = true;
      }
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
      if (e.changeType === 'changed') {
        for (const d of e.designItems) {
          this.refreshNode(d[wbNodeSymbol], d);
        }
      } else {
        this.createTree(value.contentService.rootDesignItem);
        setTimeout(() => {
          this._highlight(this._instanceServiceContainer.selectionService.selectedElements);
        }, 20);
      }
    });
    this.createTree(value.contentService.rootDesignItem);
  }

  public selectionChanged(event: ISelectionChangedEvent) {
    this._highlight(event.selectedElements);
  }

  private async _recomputeTree(rootItem: IDesignItem) {
    try {
      this._tree.root.removeChildren();

      this._getChildren(rootItem, null);
      await this._tree.expandAll();
      this._filterNodes();
    }
    catch (err) {
      console.error(err);
    }
  }


  private _getChildren(item: IDesignItem, currentNode: WunderbaumNode): any {
    if (currentNode == null) {
      currentNode = this._tree.root;
    }

    const newNode = currentNode.addChildren({
      title: item.isRootItem ? '-root-' : item.nodeType === NodeType.Element ? item.name + " " + (item.id ? ('#' + item.id) : '') : '<small><small><small>#' + (item.nodeType === NodeType.TextNode ? 'text' : 'comment') + '&nbsp;</small></small></small> ' + DomConverter.normalizeContentValue(item.content),
      ref: item
    });
    //@ts-ignore
    item[wbNodeSymbol] = newNode;

    for (let i of item.children()) {
      if (!i.isEmptyTextNode) {
        this._getChildren(i, newNode);
      }
    }
  }

  private _highlight(activeElements: IDesignItem[]) {
    let scrolled = false;
    this._tree.runWithDeferredUpdate(() => {
      this._tree.visit((node) => {
        const flag = activeElements && activeElements.includes(node.data.ref);
        if (flag != node.selected)
          node.setSelected(flag);
        if (flag != node.isActive())
          node.setActive(flag);
        if (!this.selectedFromTree) {
          if (flag)
            node.setFocus(true);
          if (flag && !scrolled) {
            scrolled = true;
            requestAnimationFrame(() => {
              node.scrollIntoView();
            });
          }
        }
      });
    });
  }

  public collapseChildren(designItem: IDesignItem) {
    const node = this._tree.findFirst(x => designItem == x.data.ref);
    if (node) {
      node.visit(x => {
        x.setExpanded(false);
      });
    }
  }

  public expandChildren(designItem: IDesignItem) {
    const node = this._tree.findFirst(x => designItem == x.data.ref);
    if (node) {
      node.visit(x => {
        x.setExpanded(true);
      });
    }
  }
}

customElements.define('node-projects-tree-view-extended', TreeViewExtended);