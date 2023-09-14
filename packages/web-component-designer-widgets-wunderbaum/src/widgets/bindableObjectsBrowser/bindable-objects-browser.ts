import { BaseCustomWebComponentLazyAppend, TypedEvent, css } from '@node-projects/base-custom-webcomponent';
import { IBindableObject, IBindableObjectsService, ServiceContainer, dragDropFormatNameBindingObject } from '@node-projects/web-component-designer';
import { WbNodeData } from 'types';
import { Wunderbaum } from 'wunderbaum'
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' assert { type: 'css'}

type serviceNode = { service: IBindableObjectsService, bindable: IBindableObject<any> }

export class BindableObjectsBrowser extends BaseCustomWebComponentLazyAppend {
  private _treeDiv: HTMLDivElement;
  private _tree: Wunderbaum;

  public selectedObject: IBindableObject<any>;

  public objectDoubleclicked = new TypedEvent<void>;

  /*static override readonly style = css`
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
    `;*/

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle];

    this._treeDiv = document.createElement('div');
    this._treeDiv.style.height = '100%'
    this._treeDiv.style.overflow = 'auto';
    this._treeDiv.setAttribute('id', 'tree');
    this.shadowRoot.appendChild(this._treeDiv);

    new Wunderbaum({
      element: this._treeDiv,
      lazyLoad: (event) => {
        return new Promise(async resolve => {
          const service: IBindableObjectsService = (<serviceNode>event.node.data).service;
          const bindable: IBindableObject<any> = (<serviceNode>event.node.data).bindable;
          let children: IBindableObject<any>[];
          if (bindable?.children)
            children = bindable.children;
          else
            children = await service.getBindableObjects(bindable);
          resolve(children.map(x => ({
            service,
            title: x.name,
            bindable: x,
            lazy: x.children !== false
          })));
        });
      },
      dblclick: (e) => {
        this.objectDoubleclicked.emit();
        return true;
      },
      activate: (event) => {
        this.deselectNodes()
        this.selectedObject = event.node.data.bindable;
      },
      dnd: {
        dropMarkerParent: this.shadowRoot,
        preventRecursion: true,
        preventVoidMoves: false,
        dropMarkerOffsetX: -24,
        dropMarkerInsertOffsetX: -16,
        //@ts-ignore
        dragStart: (event) => {
          event.effectAllowed = "all";
          event.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(event.node.data.bindable));
          event.dropEffect = "copy";
          return true
        },
        //@ts-ignore
        dragEnter: (event) => {
          return "over";
        }
      }
    });
  }

  public async initialize(serviceContainer: ServiceContainer) {
    let rootNode = this._tree.root;
    rootNode.removeChildren();

    const services = serviceContainer.bindableObjectsServices;
    for (const s of services) {
      const newNode = rootNode.addChildren(<WbNodeData>{
        title: s.name,
        lazy: true,
        service: s
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
}

customElements.define('node-projects-bindable-objects-browser', BindableObjectsBrowser);