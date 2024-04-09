import { BaseCustomWebComponentLazyAppend, TypedEvent, css, cssFromString } from '@node-projects/base-custom-webcomponent';
import { IBindableObject, IBindableObjectsService, ServiceContainer, dragDropFormatNameBindingObject } from '@node-projects/web-component-designer';

export class BindableObjectsBrowser extends BaseCustomWebComponentLazyAppend {
  private _treeDiv: HTMLDivElement;
  private _tree: Fancytree.Fancytree;

  public selectedObject: IBindableObject<any>;

  public objectDoubleclicked = new TypedEvent<void>;

  static override readonly style = css`
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
    this._restoreCachedInititalValues();

    //@ts-ignore
    import("jquery.fancytree/dist/skin-win8/ui.fancytree.css", { with: { type: 'css' } }).then(x => this.shadowRoot.adoptedStyleSheets = [cssFromString(x), this.constructor.style]);

    this._treeDiv = document.createElement('div');
    this._treeDiv.style.height = '100%'
    this._treeDiv.style.overflow = 'auto';
    this._treeDiv.setAttribute('id', 'tree');
    this.shadowRoot.appendChild(this._treeDiv);

    $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
      debugLevel: 0,
      icon: false,
      extensions: ['dnd5', 'filter'],
      quicksearch: true,
      source: [],
      lazyLoad: this.lazyLoad,
      dblclick: (e) => {
        this.objectDoubleclicked.emit();
        return true;
      },
      activate: (event, data) => {
        this.deselectNodes()
        let node = data.node;
        this.selectedObject = node.data.bindable;
      },
      filter: {
        autoApply: true,   // Re-apply last filter if lazy data is loaded
        autoExpand: false, // Expand all branches that contain matches while filtered
        counter: true,     // Show a badge with number of matching child nodes near parent icons
        fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
        hideExpandedCounter: true,  // Hide counter badge if parent is expanded
        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
        highlight: true,   // Highlight matches by wrapping inside <mark> tags
        leavesOnly: false, // Match end nodes only
        nodata: true,      // Display a 'no data' status node if result is empty
        mode: "dimm"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
      },
      dnd5: {
        dropMarkerParent: this.shadowRoot,
        preventRecursion: true,
        preventVoidMoves: false,
        dropMarkerOffsetX: -24,
        dropMarkerInsertOffsetX: -16,

        dragStart: (node, data) => {
          data.effectAllowed = "all";
          data.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(node.data.bindable));
          data.dropEffect = "copy";
          return true;
        },
        dragEnter: (node, data) => {
          return false;
        }
      }
    });

    this._tree = $.ui.fancytree.getTree(this._treeDiv);
    this._treeDiv.children[0].classList.add('fancytree-connectors');
  }

  public async initialize(serviceContainer: ServiceContainer) {
    let rootNode = this._tree.getRootNode();
    rootNode.removeChildren();

    const services = serviceContainer.bindableObjectsServices;
    for (const s of services) {
      const newNode = rootNode.addChildren({
        title: s.name,
        folder: true,
        lazy: true,
        data: {
          service: s
        }
      });
      rootNode.addNode(newNode);
    }
  }

  private deselectNodes() {
    let nodes = this._tree.getSelectedNodes()
    nodes.forEach(node => {
      node.setSelected(false)
      node.setActive(false)
    })
  }

  private lazyLoad(event: any, data: any) {
    data.result = new Promise(async resolve => {
      const service: IBindableObjectsService = data.node.data.service;
      const bindable: IBindableObject<any> = data.node.data.bindable;
      let children: IBindableObject<any>[];
      if (bindable?.children)
        children = bindable.children;
      else
        children = await service.getBindableObjects(bindable);
      resolve(children.map(x => ({
        service,
        title: x.name,
        bindable: x,
        folder: x.children !== false,
        lazy: x.children !== false
      })));
    });
  }
}

customElements.define('node-projects-bindable-objects-browser', BindableObjectsBrowser);