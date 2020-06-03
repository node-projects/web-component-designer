//import '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import { IPoint } from '../../../interfaces/ipoint';
import { PointerActionType } from "../../../enums/PointerActionType";
import { EventNames } from "../../../enums/EventNames";
import { ISize } from '../../../interfaces/ISize';
import { ServiceContainer } from '../../services/ServiceContainer';
import { IElementDefinition } from '../../services/elementsService/IElementDefinition';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer';
import { UndoService } from '../../services/undoService/UndoService';
import { SelectionService } from '../../services/selectionService/SelectionService';
import { ISelectionChangedEvent } from '../../services/selectionService/ISelectionChangedEvent';
import { DesignItem } from '../../item/DesignItem';
import { IDesignItem } from '../../item/IDesignItem';
import { BaseCustomWebComponent, css, html } from '../../controls/BaseCustomWebComponent';
import { dragDropFormatName } from '../../../Constants';
import { ContentService } from '../../services/contentService/ContentService';
import { InsertAction } from '../../services/undoService/transactionItems/InsertAction';
import { DomConverter } from './DomConverter';
import { IDesignerView } from './IDesignerView';
import { Snaplines } from './Snaplines';

export class DesignerView extends BaseCustomWebComponent implements IDesignerView {
  // Public Properties
  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public rootDesignItem: IDesignItem;

  // Settings
  private _gridSize = 10;
  private _alignOnGrid = false;
  private _alignOnSnap = true;

  private _resizeOffset = 10;

  private _zoomFactor = 100;

  // Private Variables
  private _canvas: HTMLDivElement;
  private _canvasContainer: HTMLDivElement;
  private _selector: HTMLDivElement;

  private _dropTarget: Element;
  private _snaplines: Snaplines;
  
  private _actionType?: PointerActionType;
  private _initialPoint: IPoint;
  private _initialSizes: ISize[];
  private _clickThroughElements: IDesignItem[] = []
  private _previousEventName: EventNames;

  private _firstConnect: boolean;
  private _ownBoundingRect: ClientRect | DOMRect;

  private _onKeyDownBound: any;
  private _onKeyUpBound: any;

  private static _designerClassPrefix = 'node-projects-wcdesigner-';

  static readonly style = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      position: relative;
      transform: translateZ(0);
      overflow: hidden;
    }
    #canvasContainer {
      width: 100%;
      height: 100%;
      margin: auto;
      position: relative;
    }
    #canvas {
      background-color: var(--canvas-background, white);
      /* 10px grid, using http://www.patternify.com/ */
      background-image: url(data:image/png;base64,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);
      background-position: 0px 0px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
    }
    #svg {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    .svg-snapline {
      stroke: purple;
      fill: transparent;
    }
    #canvas * {
      cursor: pointer;
      user-select: none;
    }
    #canvas *:not(.node-projects-wcdesigner-active):hover {
      outline: solid 2px #90CAF9 !important;
      outline-offset: 2px;
    }
    :host(.node-projects-wcdesigner-active) {
      outline-offset: -3px;
    }
    #selector {
      border: 1px dotted #000;
      position: absolute;
      pointer-events: none;
    }
    .lowertoolbar {
      height: 16px;
      background: #787f82;
      display: flex;
    }
    input {
      width: 40px;
      height: 16px;
      padding: 0;
      border: 0;
      font-size: 12px;
      text-align: center;
      margin-right: 1px;
    }
    .toolbar-control {
      width: 16px;
      height: 16px;
      display: block;
      margin-right: 1px;
      cursor: default;
    }
    .toolbar-control:hover {
      background-color:rgba(164,206,249,.6);
    }
    .outer {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .outercanvas1 {
      width: 100%;
      height: calc(100% - 17px);
    }
    .outercanvas2 {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: auto;
    }

    .dragging, .resizing {
      user-select: none;
    }
    .dragging {
      /*opacity: 0.6;*/
      z-index: 1000;
      cursor: move;
    }
    .dragging.active:after {
      display: none;
    }
    .resizing {
      cursor: se-resize;
    }
    .over {
      outline: dashed 3px var(--highlight-green, #99ff33) !important;
      outline-offset: 2px;
    }
    .over::before {
      content: 'press "alt" to enter container';
      top: 5px;
      left: 5px;
      position: absolute;
      opacity: 0.5;
    }
    .over-enter {
      outline: solid 3px var(--highlight-green, #99ff33) !important;
      outline-offset: 2px;
    }
  
    .zoom-in {
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAn9JREFUeNqkU11o01AUTtI06U/6tzHWbnNVS+k67FAG/gwfZEOcCrpNEBwEH2Q+Otqxh+5VEaHYV18UwQd9sk4Q+6CUKogbtSoM10qftJS2iGuT/iRpshvvDZu4DHHggY+TnHu+795zz7m4qqrYxfA6pjerlcHMZvMQQRCL8Hccoh+iBJECAMQEQci3Wk2MxP5iqgqmJUmIB3xkdTRoKgQG6Wr1JxBX1oTQx3UxCdcjMO2ZJiCK4g4y3HUIACV+bsL5dSRAWfwe636z0WBzWEFzn5vku5xyIZGsx2UF5AhEaDYbO8Dz3KLPi1X9B2iTy0pRiDx5/Z2bJgmGwDH8WMhuDxzEf6A8TYDneT3GR4JMzcVQThNlcCtANaM48pICutodxXTkkI1HeVslSPor6B/wWL7B3Z1n2KR3O3h05rkDOkd2eYoSxM025PVrAgAQeoFSuSLI3Q66jpJNRsIWPLvM5JJTTUkGGsqVtgJ5JU3AaLTqBVKZT9xh7yDT2Gh05G4bNQBzGETkBbkMVAxbzdadMJbSBDzCHXgKgKGZQJCp0IP32dnEaKhd6nOZAay7mXk6UUGeIHDDh88NKb0qumjaHiN391/1GjtrJ6ZPSb33H9eJYomuTJ601Qf7SKVYVlqplZblxRvOThrtEaC28qSOPAwncCYSWbzJsrO3XP4br9KZa1fTmcaOSTQYLDFFaeURh/yDfLynp/fCwkI0yrKX79ZqG49sUr2A44a3u+d08/fXVhfAeZ8vcDocjs6z7KV7xeL3JzBcwPZgmoAkScGlpdvzc3NXHuZyXxIwlMX2aJoAfFkvx8aGnRzH5WEpr7cXuerKPwVw1Lb/sV8CDACbf0U37X3NqwAAAABJRU5ErkJggg==);
    }
    .zoom-out {
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmVJREFUeNqkU01oE0EUnv3Nf0xsS01jEzWUNCUplh7U4kEiVVEQqyBYWDxor5am5JBeFRGCuXpRBA8KHqIHMYISohdTYlQo2kguaghJUNvd/O1udjvr7NKWZHuw4IMHM/v9zHu8t5iiKCAYDAKi/xQ4MHEdbIXFYgUmk2kUx/EouoZRulGWUaYhhHGe5wutVhOQKtk3/RToQ1HgjCjyCb+PrE0GjEW/x1Cr/YFCdoUPffwqpBAeQbRnmoEgCD1i9OoohHLi7EnHt3E/bfb0m/pwDGBeF04P77Mpex1SMZliE5IMV3FV0Gw2erJe56I+L6iNHDQYnRaaVsXb5uh8JGS3+w9hv1SeVkG9Xtd3EB4PDBecVtplpAmHKMMesN2R2Ymg7fer9PfwZgui3sC932X+gV53nGZSXj2Yf36B5oWNNtK5NQMIcT2nXKnyUt8eA6uSUf1YNyhKsFmptmWkK2sGFGXRG6Rzn7jDXo+1sdboSBSJEd0gVABYzrMOpEtrBi7+DqoCAnUn1JTo0IP3+dnkZKhdHnKaIEUSXRPCiA+fG2JmWXAaDPY4uXP+ipfqrBybOSEO3n/M4qWyoXrmuE30DJHWUkVupbMt44u3nJ2k7BGotAqkTjyGNvBiJBK9yTCzt5wjN15ncteuZnKNnk0kCHNcllsFVUN2iY8ODAyeX1yMxRjm8t319bVHNpEtYhjxbseago3t0+YU4Dmfzz+9sBCbZ5hL90qln0/Q5yLYRWgGoigGlpZuz8/NXXm4uvolqY4a7DI0A/RnvZyaGnNwHFdArbzZArla9p8GmDq2/4m/AgwATHQSD48kJDUAAAAASUVORK5CYII=);
    }
    .snap-grid {
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAblJREFUeNqkUjtLA0EQnntFyKNKJdiFgIlGC5G0FlaaIsYgiKAgKIKdjbV/wM7GImBhI6JFMFWKK3yBimBAhJDuUEgimMSYS0hunbncHRtFjLjw7X7z7ezszM4KjDEQRRG+jnlEgvYAAgLAJpoT1tYdA9gzAAqLuC/DD4N1EZC87v1IYnZ0MBj0k/6Szw/nTs7GO+8f62gWBCuDHTRG+ABxgGScsd3JlYWlJogu9TSjkT41NzM0AEbr5uDocJmxLTv3CCJpgbRkAKcWpq14vP7scVqrVKsbBOKktayS7BL4RzB5uxvAo7++SfV6vYnmBenESaM9/qCESFt4pPUJJzrlLpe/vQ9pTeex8A0EQcggwILJo9EohMPhNVW9ZqFQaJvsWCzWozGuCxJ3gck1TYNGo+Hy+XxQKpXalUoFisUi1Go1RyM/uwtZLsADYkxRlGnMZLXT6QQkSSqglsIV0HY0XddTdgkqV4LD6YPJsgwYzLSJEygQraz70YDvRg9Hh3O8DdptM1uTEwzDMDnvTHVfWfy+D8592W4Jt1wJfXOnC0h8XMw/cbuEHOKZc/iNX9qC2cb/jE8BBgAvhdOb37HVsgAAAABJRU5ErkJggg==);
    }
    .snap-guide {
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAYVJREFUeNqkU7tKA1EQnbs3CnlVqbQNARMjFilS+AnZQhIbW0ER/AA/wlYbhXR2wUKx0iKNYGMKDViEdEIgieBujGvCPpyz7sK6iWLIwJk798zsuXsfIxzHoXksAqcoij+vMbYq7MoszGxaEB3wtODlH3i5E5uojck210RCgq7SJie4MC0TsdO1cim/lMmkwHdarZWni+t16/1jz/FElJBAGc5imLzyakXNG0IuVo+OnwHE4JCzgisG7BJu/I3CQjyRuq1dvWi6vg8gBofcOHgGAZO+AFv88/VNDofDEcd3IBCD43ycfhEowY28Sazfnzh1cKMggWsUQvi4waiqKuVyud16/d7JZrOHxWJxKudMuQV3C81mk3RdX0wmk9Tr9UxN06jb7dJgMPjBwQRUAu/AtWg0SpZl7TDSUso2/1UVNWHOMIwJARzWBhcQwMXu1oJb9Ufbtsk0zYktPLrvgD8E/mWeYoNxxlj2xoZ3qI2/YrePQs10PksjTRPozCog5m3nLwEGABrLzseuHT6IAAAAAElFTkSuQmCC);
    }

    .node-projects-wcdesigner-active, :host(.node-projects-wcdesigner-active) {
      outline: solid 3px var(--highlight-blue, #2196f3) !important;
      outline-offset: 2px;
      transform: translateZ(0);
      cursor: pointer !important;
    }
    /* Show a resize cursor in the corner */
    .node-projects-wcdesigner-active:after {
      position: absolute;
      bottom: -5px;
      right: -5px;
      height: 14px;
      width: 14px;
      content: '↘';
      cursor: se-resize;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      background: var(--highlight-blue, #2196f3);
      color: white;
      z-index: 1000000;
    }
    /* Show a move cursor in the corner */
    .node-projects-wcdesigner-active:before {
      position: absolute;
      top: -15px;
      left: -15px;
      height: 14px;
      width: 14px;
      content: '⤨';
      cursor: move;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      background: var(--highlight-blue, #2196f3);
      color: white;
      z-index: 1000000;
    }
  }`;

  static readonly template = html`
        <div class="outer">
          <div class="outercanvas1">
            <div class="outercanvas2">
              <div id="canvasContainer">
                <div id="canvas"></div>
                <div id="selector" hidden></div>
                <svg id="svg"></svg>
              </div>
            </div>
          </div>
          <div class="lowertoolbar">
            <input id="zoomInput" type="text" value="100%">
            <div title="decrease zoom" id="zoomIncrease" class="toolbar-control zoom-in"></div>
            <div title="increase zoom" id="zoomDecrease" class="toolbar-control zoom-out"></div>
            <div title="reset zoom" id="zoomReset" class="toolbar-control"
              style="width: 16px; height: 16px; font-size: 14px; display: flex; align-items: center; justify-content: center;">1
            </div>
            <div title="zoom to fit" id="zoomFit" class="toolbar-control"
              style="width: 16px; height: 16px; font-size: 8px; display: flex; align-items: center; justify-content: center;">
              100%</div>
            <div title="snap to grid" id="alignSnap" class="toolbar-control snap-grid"></div>
            <div title="snap to elements" id="alignGrid" class="toolbar-control snap-guide"></div>
          </div>
        </div>
          `;

  constructor() {
    super();

    this._canvas = this._getDomElement<HTMLDivElement>('canvas');
    this._canvasContainer = this._getDomElement<HTMLDivElement>('canvasContainer');
 
    this._selector = this._getDomElement<HTMLDivElement>('selector');
    let zoomInput = this._getDomElement<HTMLInputElement>('zoomInput');
    zoomInput.onchange = () => { this._zoomFactor = parseInt(zoomInput.value); zoomInput.value = <any>this._zoomFactor + '%'; this.zoomFactorChanged(); }
    zoomInput.onclick = zoomInput.select
    let zoomIncrease = this._getDomElement<HTMLDivElement>('zoomIncrease');
    zoomIncrease.onclick = () => { this._zoomFactor += 10; zoomInput.value = <any>this._zoomFactor + '%'; this.zoomFactorChanged(); }
    let zoomDecrease = this._getDomElement<HTMLDivElement>('zoomDecrease');
    zoomDecrease.onclick = () => { this._zoomFactor -= 10; zoomInput.value = <any>this._zoomFactor + '%'; this.zoomFactorChanged(); }
    let zoomReset = this._getDomElement<HTMLDivElement>('zoomReset');
    zoomReset.onclick = () => { this._zoomFactor = 100; zoomInput.value = <any>this._zoomFactor + '%'; this.zoomFactorChanged(); }
    let zoomFit = this._getDomElement<HTMLDivElement>('zoomFit');
    zoomFit.onclick = () => { this._zoomFactor = 77; zoomInput.value = <any>this._zoomFactor + '%'; this.zoomFactorChanged(); }

    let alignSnap = this._getDomElement<HTMLDivElement>('alignSnap');
    alignSnap.onclick = () => { this._alignOnSnap = !this._alignOnSnap; }
    let alignGrid = this._getDomElement<HTMLDivElement>('alignGrid');
    alignGrid.onclick = () => { this._alignOnGrid = !this._alignOnGrid; }

    this.instanceServiceContainer = new InstanceServiceContainer();
    this.instanceServiceContainer.register("undoService", new UndoService);
    this.instanceServiceContainer.register("selectionService", new SelectionService);

    this._onKeyDownBound = this.onKeyDown.bind(this);
    this._onKeyUpBound = this.onKeyUp.bind(this);

    this.instanceServiceContainer.selectionService.onSelectionChanged.on(this._selectedElementsChanged.bind(this));

    this._snaplines = new Snaplines(this._getDomElement<SVGElement>('svg'));
  }

  get designerWidth(): string {
    return this._canvasContainer.style.width;
  }
  set designerWidth(value: string) {
    this._canvasContainer.style.width = value;
  }
  get designerHeight(): string {
    return this._canvasContainer.style.height;
  }
  set designerHeight(value: string) {
    this._canvasContainer.style.height = value;
  }

  initialize(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;
    this.rootDesignItem = DesignItem.GetOrCreateDesignItem(this._canvas, this.serviceContainer, this.instanceServiceContainer);
    this.instanceServiceContainer.register("contentService", new ContentService(this.rootDesignItem));
    this._snaplines.initialize(this.rootDesignItem);
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._firstConnect = true;
      this._canvas.addEventListener(EventNames.PointerDown, event => this._pointerDownOnElement(event));
      this._canvas.addEventListener(EventNames.PointerMove, event => this._pointerMoveOnElement(event));
      this._canvas.addEventListener(EventNames.PointerUp, event => this._pointerUpOnElement(event));
      this._canvas.addEventListener(EventNames.DragEnter, event => this._onDragEnter(event))
      this._canvas.addEventListener(EventNames.DragOver, event => this._onDragOver(event));
      this._canvas.addEventListener(EventNames.Drop, event => this._onDrop(event));
    }
    window.addEventListener('keydown', this._onKeyDownBound, true); //we need to find a way to check wich events are for our control
    window.addEventListener('keyup', this._onKeyUpBound, true);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._onKeyDownBound, true);
    window.removeEventListener('keyup', this._onKeyUpBound, true);
  }

  zoomFactorChanged() {
    this._canvasContainer.style.transform = "scale(" + (this._zoomFactor / 100) + ")";
  }

  public getHTML() {
    this.instanceServiceContainer.selectionService.setSelectedElements(null);
    return DomConverter.ConvertToString(this.rootDesignItem);
  }

  public parseHTML(html: string) {
    this.rootDesignItem.element.innerHTML = html;
    this.instanceServiceContainer.undoService.clear();
    this._createDesignItemsRecursive(this.rootDesignItem.element);
    this._snaplines.clearSnaplines();
  }

  private _createDesignItemsRecursive(element: Element) {
    DesignItem.GetOrCreateDesignItem(element, this.serviceContainer, this.instanceServiceContainer);
    for (let e of element.children) {
      this._createDesignItemsRecursive(e);
    }
  }

  private _onDragEnter(event: DragEvent) {
    event.preventDefault();
  }

  private _onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private async _onDrop(event: DragEvent) {
    event.preventDefault();

    let transferData = event.dataTransfer.getData(dragDropFormatName);
    let elementDefinition = <IElementDefinition>JSON.parse(transferData);
    let di = await this.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, this.serviceContainer, this.instanceServiceContainer));
    this.instanceServiceContainer.undoService.execute(new InsertAction(this.rootDesignItem, this._canvas.children.length, di));
  }

  private onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        this._resetPointerEventsForClickThrough();
        break;
    }
  }

  private _resetPointerEventsForClickThrough() {
    if (this._clickThroughElements.length == 0)
      return;
    this._clickThroughElements = [];
  }

  private onKeyDown(event: KeyboardEvent) {
    //todo redo this
    let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
    if (!primarySelection) {
      return;
    }

    // This is a global window handler, so clicks can come from anywhere
    // We only care about keys that come after you've clicked on an element,
    // or keys after you've selected something from the tree view.
    // TODO: can this be less bad since it's p horrid?
    let isOk =
      //@ts-ignore
      (event.composedPath()[0].localName === 'button' && event.composedPath()[2].localName == 'tree-view') ||
      //@ts-ignore
      (event.composedPath()[0].localName == 'body') || event.composedPath()[0].classList.contains(DesignerView._activeClassName);

    if (!isOk) {
      return;
    }
    let oldLeft = parseInt((<HTMLElement>primarySelection.element).style.left);
    let oldTop = parseInt((<HTMLElement>primarySelection.element).style.top);
    //let oldPosition = (<HTMLElement>primarySelection.element).style.position;

    switch (event.key) {
      case 'ArrowUp':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'up', node: this } }));
        } else {
          primarySelection.setStyle('top', oldTop - 1 + 'px');
        }
        break;
      case 'ArrowDown':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'down', node: this } }));
        } else {
          primarySelection.setStyle('top', oldTop + 1 + 'px');
        }
        break;
      case 'ArrowLeft':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'back', node: this } }));
        } else {
          primarySelection.setStyle('left', oldLeft - 1 + 'px');
        }
        break;
      case 'ArrowRight':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'forward', node: this } }));
        } else {
          primarySelection.setStyle('left', oldLeft + 1 + 'px');
        }
        break;
    }

    /*this.instanceServiceContainer.undoService.add(UndoItemType.Move, primarySelection.element,
      {
        new: { left: primarySelection.element.style.left, top: primarySelection.element.style.top, position: primarySelection.element.style.position },
        old: { left: oldLeft, top: oldTop, position: oldPosition }
      });*/
  }

  // Access canvas API

  add(el) {
    this._canvas.appendChild(el);
  }

  removes(el) {
    this._canvas.removeChild(el);
  }

  has(query) {
    return this._canvas.querySelector(query);
  }

  setInnerHTML(thing) {
    this._canvas.innerHTML = thing;
  }

  getInnerHTML() {
    return this._canvas.innerHTML;
  }

  get children() {
    return this._canvas.children;
  }

  // end

  private _selectedElementsChanged(selectionChangedEvent: ISelectionChangedEvent) {
    if (selectionChangedEvent.oldSelectedElements) {
      for (let e of selectionChangedEvent.oldSelectedElements)
        this._toggleDesignerClass(e, 'active', false);
    }
    if (selectionChangedEvent.selectedElements) {
      for (let e of selectionChangedEvent.selectedElements)
        this._toggleDesignerClass(e, 'active', true);
    }
  }

  private _toggleDesignerClass(designItem: IDesignItem, className: 'active', state: boolean) {
    if (state) {
      designItem.element.classList.add(DesignerView._designerClassPrefix + className);
    } else {
      if (designItem.element.classList.contains(DesignerView._designerClassPrefix + className)) {
        designItem.element.classList.remove(DesignerView._designerClassPrefix + className);
        if (designItem.element.classList.length === 0)
          designItem.element.removeAttribute('class');
      }
    }
  }

  setSelectedElements(elements: HTMLElement[]) {
    if (elements) {
      let diArray: IDesignItem[] = [];
      for (let e of elements) {
        diArray.push(DesignItem.GetOrCreateDesignItem(e, this.serviceContainer, this.instanceServiceContainer));
        this.instanceServiceContainer.selectionService.setSelectedElements(diArray)
      }
    } else {
      this.instanceServiceContainer.selectionService.setSelectedElements(null);
    }
  }

  private _pointerDownOnElement(event: PointerEvent) {
    this._canvas.setPointerCapture(event.pointerId);
    this._pointerEventHandler(event);
    this._previousEventName = <EventNames>event.type;
  }

  private _pointerMoveOnElement(event: PointerEvent) {
    this._pointerEventHandler(event);
    this._previousEventName = <EventNames>event.type;
  }

  private _pointerUpOnElement(event: PointerEvent) {
    this._canvas.releasePointerCapture(event.pointerId);
    this._pointerEventHandler(event);
    this._previousEventName = <EventNames>event.type;
  }

  private _pointerEventHandler(event: PointerEvent) {
    if (!event.altKey)
      this._resetPointerEventsForClickThrough();

    // zoomfactor of canvas
    let zoom = parseFloat(window.getComputedStyle(this).transform.split(',')[3])

    //const currentElement = event.target as HTMLElement;
    const currentElement = this.shadowRoot.elementFromPoint(event.x, event.y) as HTMLElement;

    this._ownBoundingRect = this.getBoundingClientRect();
    const currentPoint = { x: event.x * zoom - this._ownBoundingRect.left, y: event.y * zoom - this._ownBoundingRect.top, zoom: zoom };

    if (this._actionType == null) {
      this._initialPoint = currentPoint;
      if (event.type == EventNames.PointerDown) {
        let composedPath = event.composedPath();
        let rectCurrentElement = currentElement.getBoundingClientRect();
        if (this._forceMove(currentPoint, { x: rectCurrentElement.left - this._ownBoundingRect.left, y: rectCurrentElement.top - this._ownBoundingRect.top })) {
          this._actionType = PointerActionType.Drag;
        } else if (composedPath && composedPath[0] === currentElement && (currentElement.children.length > 0 || currentElement.innerText == '') &&
          currentElement.style.background == '' && (currentElement.localName === 'div')) { // todo: maybe check if some element in the composedPath till the designer div has a background. If not, selection mode
          this.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
        } else if (currentElement === this || currentElement === this._canvas || currentElement == null) {
          this.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
          return;
        } else {
          this._actionType = this._shouldResize(currentPoint, { x: rectCurrentElement.right - this._ownBoundingRect.left, y: rectCurrentElement.bottom - this._ownBoundingRect.top }) ? PointerActionType.Resize : PointerActionType.DragOrSelect;
        }
      }
    }

    let currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);

    if (event.type === EventNames.PointerMove) {
      if (this._actionType == PointerActionType.DrawSelection)
        this._actionType = PointerActionType.DrawingSelection;
    }

    if (this._actionType == PointerActionType.DrawSelection || this._actionType == PointerActionType.DrawingSelection) {
      this._pointerActionTypeDrawSelection(event, currentElement, currentPoint);
    } else if (this._actionType == PointerActionType.Resize) {
      this._pointerActionTypeResize(event, currentElement, currentPoint);
    } else if (this._actionType == PointerActionType.DragOrSelect || this._actionType == PointerActionType.Drag) {
      this._pointerActionTypeDragOrSelect(event, currentDesignItem, currentPoint);
    }
    if (event.type == EventNames.PointerUp) {
      if (this._actionType == PointerActionType.DrawSelection) {
        this.setSelectedElements([currentElement]);
      }
      this._actionType = null;
    }
  }

  private _pointerActionTypeDrawSelection(event: MouseEvent, currentElement: HTMLElement, currentPoint: IPoint & { zoom: number }) {
    let x1 = Math.min(this._initialPoint.x, currentPoint.x);
    let x2 = Math.max(this._initialPoint.x, currentPoint.x);
    let y1 = Math.min(this._initialPoint.y, currentPoint.y);
    let y2 = Math.max(this._initialPoint.y, currentPoint.y);

    let selector = this._selector as HTMLDivElement;
    selector.style.left = x1 + 'px';
    selector.style.top = y1 + 'px';
    selector.style.width = x2 - x1 + 'px';
    selector.style.height = y2 - y1 + 'px';
    selector.hidden = false;

    if (event.type == EventNames.PointerUp) {
      selector.hidden = true;
      let elements = this._canvas.querySelectorAll('*');
      let inSelectionElements: HTMLElement[] = [];
      for (let e of elements) {
        let elementRect = e.getBoundingClientRect();
        if (elementRect.top - this._ownBoundingRect.top >= y1 &&
          elementRect.left - this._ownBoundingRect.left >= x1 &&
          elementRect.top - this._ownBoundingRect.top + elementRect.height <= y2 &&
          elementRect.left - this._ownBoundingRect.left + elementRect.width <= x2) {
          inSelectionElements.push(e as HTMLElement);
        }
      }
      this.setSelectedElements(inSelectionElements);
    }
  }

  _pointerActionTypeDragOrSelect(event: MouseEvent, currentDesignItem: IDesignItem, currentPoint: IPoint & { zoom: number }) {
    if (event.altKey) {
      let backup: string[] = [];
      if (event.type == EventNames.PointerDown)
        this._clickThroughElements.push(currentDesignItem);
      for (const e of this._clickThroughElements) {
        backup.push((<HTMLElement>e.element).style.pointerEvents);
        (<HTMLElement>e.element).style.pointerEvents = 'none';
      }
      let currentElement = this.shadowRoot.elementFromPoint(event.x, event.y) as HTMLElement;
      currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);
      for (const e of this._clickThroughElements) {
        (<HTMLElement>e.element).style.pointerEvents = backup.shift();
      }
    } else {
      this._clickThroughElements = []
    }

    let trackX = currentPoint.x - this._initialPoint.x;
    let trackY = currentPoint.y - this._initialPoint.y;
    if (event.type !== EventNames.PointerDown) {
      if (this._alignOnGrid) {
        trackX = Math.round(trackX / this._gridSize) * this._gridSize;
        trackY = Math.round(trackY / this._gridSize) * this._gridSize;
      }
      else if (this._alignOnSnap) {
        //let rect = this.instanceServiceContainer.selectionService.primarySelection.element.getBoundingClientRect();
        let newPos = this._snaplines.snapToPosition({ x: currentPoint.x, y: currentPoint.y }, { x: 0, y: 0 })
        trackX = newPos.x - this._initialPoint.x;
        trackY = newPos.y - this._initialPoint.y;
      }
    }

    switch (event.type) {
      case EventNames.PointerDown:
        if (this._alignOnSnap)
          this._snaplines.calculateSnaplines(this.instanceServiceContainer.selectionService.selectedElements);
        this._dropTarget = null;
        if (event.shiftKey || event.ctrlKey) {
          const index = this.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem);
          if (index >= 0) {
            let newSelectedList = this.instanceServiceContainer.selectionService.selectedElements.slice(0);
            newSelectedList.splice(index, 1);
            this.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList);
          }
          else {
            let newSelectedList = this.instanceServiceContainer.selectionService.selectedElements.slice(0);
            newSelectedList.push(currentDesignItem);
            this.instanceServiceContainer.selectionService.setSelectedElements(newSelectedList);
          }
        } else {
          if (this.instanceServiceContainer.selectionService.selectedElements.indexOf(currentDesignItem) < 0)
            this.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
        }
        break;
      case EventNames.PointerMove:
        if (trackX != 0 || trackY != 0)
          this._actionType = PointerActionType.Drag;

        if (this._actionType != PointerActionType.Drag)
          return;


        //todo -> what is if a transform already exists -> backup existing style.?
        for (const designItem of this.instanceServiceContainer.selectionService.selectedElements) {
          (<HTMLElement>designItem.element).style.transform = 'translate(' + trackX + 'px, ' + trackY + 'px)';
        }

        // See if it's over anything.
        this._dropTarget = null;
        let targets = this._canvas.querySelectorAll('*');
        for (let i = 0; i < targets.length; i++) {
          let possibleTarget = targets[i] as HTMLElement;
          possibleTarget.classList.remove('over');

          let possibleTargetDesignItem = DesignItem.GetOrCreateDesignItem(possibleTarget, this.serviceContainer, this.instanceServiceContainer);
          if (this.instanceServiceContainer.selectionService.selectedElements.indexOf(possibleTargetDesignItem) >= 0)
            continue;

          // todo put following a extenable function ...
          // in IContainerHandler ...

          // Only some native elements and things with slots can be drop targets.
          let slots = possibleTarget ? possibleTarget.querySelectorAll('slot') : [];
          // input is the only native in this app that doesn't have a slot
          let canDrop = (possibleTarget.localName.indexOf('-') === -1 && possibleTarget.localName !== 'input') || possibleTarget.localName === 'dom-repeat' || slots.length !== 0;

          if (!canDrop) {
            continue;
          }

          // Do we actually intersect this child?
          const possibleTargetRect = possibleTarget.getBoundingClientRect();
          if (possibleTargetRect.top - this._ownBoundingRect.top <= currentPoint.y &&
            possibleTargetRect.left - this._ownBoundingRect.left <= currentPoint.x &&
            possibleTargetRect.top - this._ownBoundingRect.top + possibleTargetRect.height >= currentPoint.y &&
            possibleTargetRect.left - this._ownBoundingRect.left + possibleTargetRect.width >= currentPoint.x) {

            // New target! Remove the other target indicators.
            var previousTargets = this._canvas.querySelectorAll('.over');
            for (var j = 0; j < previousTargets.length; j++) {
              previousTargets[j].classList.remove('over');
            }
            if (currentDesignItem != possibleTargetDesignItem && this._dropTarget != possibleTarget) {
              possibleTarget.classList.add('over');

              if (event.altKey) {
                if (this._dropTarget != null)
                  this._dropTarget.classList.remove('over-enter');
                this._dropTarget = possibleTarget;
                this._dropTarget.classList.remove('over');
                this._dropTarget.classList.add('over-enter');
              }
            }
          }
        }
        break;
      case EventNames.PointerUp:
        if (this._actionType == PointerActionType.DragOrSelect) {
          if (this._previousEventName == EventNames.PointerDown)
            this.instanceServiceContainer.selectionService.setSelectedElements([currentDesignItem]);
          return;
        }

        let cg = this.rootDesignItem.openGroup("Move Elements", this.instanceServiceContainer.selectionService.selectedElements);
        //todo this needs also to get info from container handler, cause position is dependent of container
        for (const designItem of this.instanceServiceContainer.selectionService.selectedElements) {
          let movedElement = designItem.element;
          if (this._dropTarget && this._dropTarget != movedElement.parentElement) {
            //let oldParent = movedElement.parentElement;
            movedElement.parentElement.removeChild(currentDesignItem.element);

            // If there was a textContent nuke it, or else you'll
            // never be able to again.
            /*if (this._dropTarget.children.length === 0) {
              this._dropTarget.textContent = '';
            }
            this._dropTarget.appendChild(currentElement);

            this.actionHistory.add(ActionHistoryType.Reparent, currentElement,
              {
                new: {
                  parent: this._dropTarget,
                  left: currentElement.style.left, top: currentElement.style.top, position: currentElement.style.position
                },
                old: {
                  parent: oldParent,
                  left: oldLeft, top: oldTop, position: oldPosition
                }
              });*/
          } else {
            let oldLeft = parseInt((<HTMLElement>movedElement).style.left);
            oldLeft = Number.isNaN(oldLeft) ? 0 : oldLeft;
            let oldTop = parseInt((<HTMLElement>movedElement).style.top);
            oldTop = Number.isNaN(oldTop) ? 0 : oldTop;
            //let oldPosition = movedElement.style.position;

            //todo: move this to handler wich is specific depeding on the container (e.g. canvasHandler, gridHandler, flexboxHandler...)
            //todo: designitem set properties undo...
            (<HTMLElement>designItem.element).style.transform = null;
            designItem.setStyle('position', 'absolute');
            designItem.setStyle('left', (trackX + oldLeft) + "px");
            designItem.setStyle('top', (trackY + oldTop) + "px");
            //todo
            /*this.serviceContainer.UndoService.add(UndoItemType.Move, movedElement,
              {
                new: { left: movedElement.style.left, top: movedElement.style.top, position: movedElement.style.position },
                old: { left: oldLeft, top: oldTop, position: oldPosition }
              });*/
          }
          cg.commit();

          if (this._dropTarget != null)
            this._dropTarget.classList.remove('over-enter');
          this._dropTarget = null;
        }





        /* let oldParent = currentElement.parentElement;
         let newParent;
         // Does this need to be added to a new parent?
         if (this._dropTarget) {
           reparented = true;
           oldParent.removeChild(currentElement);
 
           // If there was a textContent nuke it, or else you'll
           // never be able to again.
           if (this._dropTarget.children.length === 0) {
             this._dropTarget.textContent = '';
           }
           this._dropTarget.appendChild(currentElement);
           newParent = this._dropTarget;
           this._dropTarget = null;
         } else if (currentElement.parentElement && (currentElement.parentElement !== this._canvas)) {
           reparented = true;
           // If there's no drop target and the el used to be in a different
           // parent, move it to the main view.
           newParent = this._canvas;
           currentElement.parentElement.removeChild(currentElement);
           this.add(currentElement);
         }
         let parent = currentElement.parentElement.getBoundingClientRect();
 
         let oldLeft = currentElement.style.left;
         let oldTop = currentElement.style.top;
         let oldPosition = currentElement.style.position;
         if (reparented) {
           currentElement.style.position = 'relative';
           currentElement.style.left = currentElement.style.top = '0px';
           this.actionHistory.add(ActionHistoryType.Reparent, currentElement,
             {
               new: {
                 parent: newParent,
                 left: currentElement.style.left, top: currentElement.style.top, position: currentElement.style.position
               },
               old: {
                 parent: oldParent,
                 left: oldLeft, top: oldTop, position: oldPosition
               }
             });
         } else {
           currentElement.style.position = 'absolute';
           currentElement.style.left = rekt.left - parent.left + 'px';
           currentElement.style.top = rekt.top - parent.top + 'px';
           this.actionHistory.add(ActionHistoryType.Move, el,
             {
               new: { left: currentElement.style.left, top: currentElement.style.top, position: currentElement.style.position },
               old: { left: oldLeft, top: oldTop, position: oldPosition }
             });
         }
 
         if (newParent)
           newParent.classList.remove('over');
         if (oldParent)
           oldParent.classList.remove('over');
         currentElement.classList.remove('dragging');
         currentElement.classList.remove('resizing');
         currentElement.style.transform = 'none'; */
        break;
    }
    //todo this.dispatchEvent(new CustomEvent('refresh-view', { bubbles: true, composed: true, detail: { whileTracking: true, node: this } }));
  }

  _pointerActionTypeResize(event: MouseEvent, currentElement: HTMLElement, currentPoint: IPoint) {
    switch (event.type) {
      case EventNames.PointerDown:
        this._initialSizes = [];
        for (const designItem of this.instanceServiceContainer.selectionService.selectedElements) {
          let rect = designItem.element.getBoundingClientRect();
          this._initialSizes.push({ width: rect.width, height: rect.height });
        }
        break;
      case EventNames.PointerMove:
        let trackX = currentPoint.x - this._initialPoint.x;
        let trackY = currentPoint.y - this._initialPoint.y;
        if (this._alignOnGrid) {
          trackX = Math.round(trackX / this._gridSize) * this._gridSize;
          trackY = Math.round(trackY / this._gridSize) * this._gridSize;
        }
        let i = 0;
        for (const designItem of this.instanceServiceContainer.selectionService.selectedElements) {
          (<HTMLElement>designItem.element).style.width = this._initialSizes[i].width + trackX + 'px';
          (<HTMLElement>designItem.element).style.height = this._initialSizes[i].height + trackY + 'px';
        }
        break;
      case EventNames.PointerUp:
        let cg = this.rootDesignItem.openGroup("Resize Elements", this.instanceServiceContainer.selectionService.selectedElements);

        for (const designItem of this.instanceServiceContainer.selectionService.selectedElements) {
          designItem.setStyle('width', (<HTMLElement>designItem.element).style.width);
          designItem.setStyle('height', (<HTMLElement>designItem.element).style.height);

          designItem.element.classList.remove('resizing');
          designItem.element.classList.remove('dragging');
        }
        cg.commit();
        this._initialSizes = null;
        break;
    }
  }

  _shouldResize(pointerPoint: IPoint, bottomPoint: IPoint) {
    const right = bottomPoint.x - pointerPoint.x;
    const bottom = bottomPoint.y - pointerPoint.y;
    return (right < this._resizeOffset && right >= -4 && bottom < this._resizeOffset && bottom >= -4);
  }

  _forceMove(pointerPoint: IPoint, elementPoint: IPoint) {
    return (pointerPoint.x < elementPoint.x && pointerPoint.y < elementPoint.y);
  }

  deepTargetFind(x, y, notThis) {
    let node = document.elementFromPoint(x, y);
    let next = node;
    // this code path is only taken when native ShadowDOM is used
    // if there is a shadowroot, it may have a node at x/y
    // if there is not a shadowroot, exit the loop
    while (next !== notThis && next && next.shadowRoot) {
      // if there is a node at x/y in the shadowroot, look deeper
      let oldNext = next;
      next = next.shadowRoot.elementFromPoint(x, y);
      // on Safari, elementFromPoint may return the shadowRoot host
      if (oldNext === next) {
        break;
      }
      if (next) {
        node = next;
      }
    }
    return node;
  }
}

customElements.define('node-projects-designer-view', DesignerView);