import { ServiceContainer } from '../../services/ServiceContainer';
import { BaseCustomWebComponentLazyAppend, css, Disposable, html } from '@node-projects/base-custom-webcomponent';
import { PropertyGrid } from './PropertyGrid';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer';
import { IDesignItem } from '../../item/IDesignItem.js';
import { sleep } from '../../helper/Helper.js';

export class PropertyGridWithHeader extends BaseCustomWebComponentLazyAppend {

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      user-select: none;
      background: var(--medium-grey, #2f3545);
      color: white;
    }
    div {
      display: grid;
      grid-template-columns: auto 1fr;
      padding: 6px;
      font-family: monospace; 
      align-items: center;
    }
    .desc {
      font-weight: 700;
      font-size: 10px;
      margin-right: 5px;
    }
    input {
      background: var(--medium-grey, #2f3545);
      border: solid 1px gray;
      color: white;
      width: calc(100% - 6px);
    }
    #type {
      color: wheat;
      white-space: nowrap;
      overflow: hidden;
      font-size: 12px;
      height: 20px;
    }
    `;

  static override readonly template = html`
  <div>
    <span class="desc">Type:</span><span id="type"></span>
    <span class="desc">Id:</span><input type="text" id="id">
  </div>
  <node-projects-property-grid id="pg"></node-projects-property-grid>
  `
  private _type: HTMLSpanElement;
  private _id: HTMLInputElement;
  private _pg: PropertyGrid;
  private _selectionChangedHandler: Disposable;
  private _instanceServiceContainer: InstanceServiceContainer;

  constructor() {
    super();
    this._type = this._getDomElement<HTMLSpanElement>('type');
    this._id = this._getDomElement<HTMLInputElement>('id');
    this._pg = this._getDomElement<PropertyGrid>('pg');

    this._id.onkeydown = e => {
      if (e.key == 'Enter')
        this._instanceServiceContainer.selectionService.primarySelection.id = this._id.value;
      else if (e.key == 'Escape') {
        this._id.value = this._instanceServiceContainer.selectionService.primarySelection?.id ?? '';
        e.preventDefault();
        e.stopPropagation();
      }
    }
    let pSel: IDesignItem
    this._id.onfocus = e => {
      pSel = this._instanceServiceContainer.selectionService.primarySelection;
    }
    this._id.onblur = e => {
      pSel.id = this._id.value;
    }
  }

  public set serviceContainer(value: ServiceContainer) {
    this._pg.serviceContainer = value;
  }

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._instanceServiceContainer = value;
    this._selectionChangedHandler?.dispose()
    this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(async e => {
      this._pg.instanceServiceContainer = value;
      await sleep(20); // delay assignment a little bit, so onblur above could still set the value.
      this._type.innerText = this._instanceServiceContainer.selectionService.primarySelection?.name ?? '';
      this._id.value = this._instanceServiceContainer.selectionService.primarySelection?.id ?? '';

    });
  }
}

customElements.define('node-projects-property-grid-with-header', PropertyGridWithHeader);