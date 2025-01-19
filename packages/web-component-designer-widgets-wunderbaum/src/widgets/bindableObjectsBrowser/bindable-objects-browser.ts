import { BaseCustomWebComponentConstructorAppend, TypedEvent, css, cssFromString, html } from '@node-projects/base-custom-webcomponent';
import { IBindableObject, IBindableObjectsBrowser, IBindableObjectsService, InstanceServiceContainer, ServiceContainer, dragDropFormatNameBindingObject } from '@node-projects/web-component-designer';
import { WbNodeData } from 'types';
import { Wunderbaum } from 'wunderbaum';
import { defaultOptions, defaultStyle } from '../WunderbaumOptions.js';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' with { type: 'css' };
import { BindableObjectsTarget } from '@node-projects/web-component-designer/src/elements/services/bindableObjectsService/BindableObjectsTarget.js';

type serviceNode = { service: IBindableObjectsService, bindable: IBindableObject<any> }

export class BindableObjectsBrowser extends BaseCustomWebComponentConstructorAppend implements IBindableObjectsBrowser {
  private _treeDiv: HTMLDivElement;
  private _tree: Wunderbaum;

  public selectedObject: IBindableObject<any>;

  public objectDoubleclicked = new TypedEvent<void>;

  static override readonly style = css``;

  static override template = html`
      <div id="tree" style="height: 100%; overflow: auto; box-sizing: border-box;" class="wb-skeleton wb-initializing wb-no-select wb-alternate">
      </div>`

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this.shadowRoot.adoptedStyleSheets = [cssFromString(wunderbaumStyle), defaultStyle, BindableObjectsBrowser.style];

    this._treeDiv = this._getDomElement<HTMLDivElement>('tree');
    this.shadowRoot.appendChild(this._treeDiv);

    this._tree = new Wunderbaum({
      ...defaultOptions,
      element: this._treeDiv,
      iconBadge: null,
      lazyLoad: (event) => {
        return new Promise(async resolve => {
          const service: IBindableObjectsService = (<serviceNode>event.node.data).service;
          const bindable: IBindableObject<any> = (<serviceNode>event.node.data).bindable;
          let children: IBindableObject<any>[];
          if (bindable?.children)
            children = bindable.children;
          else
            children = await service.getBindableObjects(bindable, this._instanceServiceContainer);
          resolve(children.map(x => ({
            title: x.name,
            service,
            bindable: x,
            lazy: x.children !== false
          })));
        });
      },
      //@ts-ignore
      dblclick: (e) => {
        this.objectDoubleclicked.emit();
        return true;
      },
      activate: (event) => {
        this.selectedObject = event.node.data.bindable;
      },
      dnd: {
        guessDropEffect: true,
        preventRecursion: true,
        preventVoidMoves: false,
        serializeClipboardData: false,
        dragStart: (e) => {
          e.event.dataTransfer.effectAllowed = "all";
          e.event.dataTransfer.setData(dragDropFormatNameBindingObject, JSON.stringify(e.node.data.bindable));
          e.event.dataTransfer.dropEffect = "copy";
          return true
        },
        dragEnter: (e) => {
          return true;
        }
      }
    });
  }

  private _instanceServiceContainer;

  public async initialize(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, bindableObjectsTarget: BindableObjectsTarget) {
    this._instanceServiceContainer = instanceServiceContainer;
    let rootNode = this._tree.root;
    rootNode.removeChildren();
    const services = serviceContainer.bindableObjectsServices;
    for (const s of services) {
      if (!s.hasObjectsForInstanceServiceContainer(this._instanceServiceContainer, bindableObjectsTarget))
        continue;
      this._tree.root.addChildren(<WbNodeData>{
        title: s.name,
        lazy: true,
        service: s
      });
    }
  }
}

customElements.define('node-projects-bindable-objects-browser', BindableObjectsBrowser);