import { css, html, BaseCustomWebComponentConstructorAppend, cssFromString } from '@node-projects/base-custom-webcomponent';
import { IElementDefinition, IElementsService, NamedTools, ServiceContainer, dragDropFormatNameElementDefinition } from '@node-projects/web-component-designer';
import { Wunderbaum } from 'wunderbaum';
import { defaultOptions, defaultStyle } from '../WunderbaumOptions.js';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' with { type: 'css' };
import { WbNodeData } from 'types';

export class PaletteTreeView extends BaseCustomWebComponentConstructorAppend {
  private _treeDiv: HTMLTableElement;
  private _tree: Wunderbaum;
  private _filter: HTMLInputElement;

  static override readonly style = css`
        :host {
          display: block;
        }

        * {
            touch-action: none;
        }`;

  static override readonly template = html`
      <div style="height: 100%;">
        <input id="input" style="width: 100%; height: 25px; box-sizing: border-box;" placeholder="Filter..." autocomplete="off">
        <div style="height: calc(100% - 26px);">
          <div id="treetable" class="wb-alternate" style="min-width: 100%; box-sizing: border-box;"></div>
        </div>
      </div>`;

  public serviceContainer: ServiceContainer;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this.shadowRoot.adoptedStyleSheets = [cssFromString(wunderbaumStyle), defaultStyle, PaletteTreeView.style];

    this._filter = this._getDomElement<HTMLInputElement>('input');
    this._filter.onkeyup = () => {
      let match = this._filter.value;
      this._tree.filterNodes((node) => {
        return new RegExp(match, "i").test(node.title);
      }, {});
    }

    this._treeDiv = this._getDomElement<HTMLTableElement>('treetable')

    this._tree = new Wunderbaum({
      ...defaultOptions,
      element: this._treeDiv,
      filter: {
        autoExpand: true,
        mode: 'hide',
        highlight: true
      },
      click: (e) => {
        if (e.event) { // only for clicked items, not when elements selected via code.
          let node = e.node;
          let elDef: IElementDefinition = node.data.ref;
          if (elDef) {
            let tool = this.serviceContainer.designerTools.get(elDef.tool ?? NamedTools.DrawElementTool);
            if (typeof tool == 'function')
              tool = new tool(elDef)
            this.serviceContainer.globalContext.tool = tool;
          }
        }
      },
      dnd: {
        guessDropEffect: true,
        preventRecursion: true, // Prevent dropping nodes on own descendants
        preventVoidMoves: false,
        serializeClipboardData: false,
        dragStart: (e) => {
          e.event.dataTransfer.effectAllowed = "all";
          e.event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(e.node.data.ref));
          e.event.dataTransfer.dropEffect = "copy";
          return true;
        },
        dragEnter: (e) => {
          return false;
        }
      }
    });
  }

  public async loadControls(serviceContainer: ServiceContainer, elementsServices: IElementsService[]) {
    this.serviceContainer = serviceContainer;

    let rootNode = this._tree.root;
    rootNode.removeChildren();

    for (const s of elementsServices) {
      const newNode = rootNode.addChildren({
        title: s.name
      });

      try {
        let elements = await s.getElements();
        for (let e of elements) {
          let node: WbNodeData = {
            title: e.name ?? e.tag,
            //@ts-ignore
            ref: e
          };
          if (e.icon)
            node.icon = e.icon;
          newNode.addChildren(node);
        }
      } catch (err) {
        console.warn('Error loading elements', err);
      }
    }
  }
}

customElements.define('node-projects-palette-tree-view', PaletteTreeView);