//import '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import { IPoint } from '../interfaces/ipoint';
import { PointerActionType } from "../enums/PointerActionType";
import { EventNames } from "../enums/EventNames";
import { UndoItemType } from "./services/undoService/UndoItemType";
import { ISize } from '../interfaces/ISize';
import { ServiceContainer } from './services/ServiceContainer';
import { IElementDefintion } from './services/elementsService/IElementDefinition';
import { InstanceServiceContainer } from './services/InstanceServiceContainer';
import { UndoService } from './services/undoService/UndoService';
import { SelectionService } from './services/selectionService/SelectionService';
import { ISelectionChangedEvent } from './services/selectionService/ISelectionChangedEvent';
import { DesignItem } from './item/DesignItem';
import { IDesignItem } from './item/IDesignItem';
import { BaseCustomWebComponent, css, html } from './controls/BaseCustomWebComponent';
import { dragDropFormatName } from '../Constants';

export class CanvasView extends BaseCustomWebComponent {
  // Public Properties
  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;

  // Settings
  private _gridSize = 10;
  private _alignOnGrid = true;
  private _resizeOffset = 10;

  // Private Variables
  private _canvas: HTMLDivElement;
  private _selector: HTMLDivElement;

  private _dropTarget: Element;

  private _actionType?: PointerActionType;
  private _initialPoint: IPoint;
  private _initialSizes: ISize[];
  private _clickThroughElements: IDesignItem[] = []
  private _previousEventName: EventNames;

  private _firstConnect: boolean;
  private _ownBoundingRect: ClientRect | DOMRect;

  private _onKeyDownBound: any;
  private _onKeyUpBound: any;

  static get style() {
    return css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      position: relative;
      transform: translateZ(0);
    }
    #canvas {
      background-color: var(--canvas-background);
      /* 10px grid, using http://www.patternify.com/ */
      background-image: url(./assets/images/grid.png);
      background-position: 0px 0px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
    }

    #canvas * {
      cursor: pointer;
      user-select: none;
      -moz-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
    }
    #canvas *:not(.active):hover {
      outline: solid 2px #90CAF9 !important;
      outline-offset: 2px;
    }
    .active, :host(.active) {
      outline: solid 3px var(--highlight-blue) !important;
      outline-offset: 2px;
      transform: translateZ(0);
    }
    :host(.active) {
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
    img {
      width: 16px;
      height: 16px;
      display: block;
      margin-right: 1px;
    }
    img:hover {
      background: white;
    }
    .outer {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .outercanvas1 {
      width: 100%;
      height: 100%;
    }
    .outercanvas2 {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: auto;
    }

    /* Show a resize cursor in the corner */
    .active:after {
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
      background: var(--highlight-blue);
      color: white;
      z-index: 1000000;
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
      outline: dashed 3px var(--highlight-green) !important;
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
      outline: solid 3px var(--highlight-green) !important;
      outline-offset: 2px;
    }
  }`;
  }

  static get template() {
    return html`
        <div class="outer">
          <div class="outercanvas1">
            <div class="outercanvas2">
              <div id="canvas"></div>
              <div id="selector" hidden></div>
            </div>
          </div>
          <div class="lowertoolbar">
            <input id="zoomInput" type="text" value="100%">
            <img id="zoomIncrease" src="./assets/images/zoom_out-24px.svg">
            <img id="zoomDecrease" src="./assets/images/zoom_in-24px.svg">
          </div>
        </div>
          `;
  }

  constructor() {
    super();

    this.instanceServiceContainer = new InstanceServiceContainer();
    this.instanceServiceContainer.register("undoService", new UndoService);
    this.instanceServiceContainer.register("selectionService", new SelectionService);

    this._canvas = this._getDomElement<HTMLDivElement>('canvas');
    this._selector = this._getDomElement<HTMLDivElement>('selector');
    /*let zoomInput = this._getDomElement<HTMLInputElement>('zoomInput');
    let zoomIncrease = this._getDomElement<HTMLImageElement>('zoomIncrease');
    let zoomDecrease = this._getDomElement<HTMLImageElement>('zoomDecrease');*/

    this._onKeyDownBound = this.onKeyDown.bind(this);
    this._onKeyUpBound = this.onKeyUp.bind(this);

    this.instanceServiceContainer.selectionService.onSelectionChanged.on(this._selectedElementsChanged);
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._firstConnect = true;
      this._canvas.addEventListener(EventNames.PointerDown, event => this._pointerDownOnElement(event));
      this._canvas.addEventListener(EventNames.PointerMove, event => this._pointerMoveOnElement(event));
      this._canvas.addEventListener(EventNames.PointerUp, event => this._pointerUpOnElement(event));
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

  private _onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private _onDrop(event: DragEvent) {
    event.preventDefault();

    let transferData = event.dataTransfer.getData(dragDropFormatName);
    let elementDefinition = <IElementDefintion>JSON.parse(transferData)
    let instance = this.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition));
    this._canvas.appendChild(instance);
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
      (event.composedPath()[0].localName == 'body') || event.composedPath()[0].classList.contains('active');

    if (!isOk) {
      return;
    }
    let oldLeft = parseInt(primarySelection.element.style.left);
    let oldTop = parseInt(primarySelection.element.style.top);
    let oldPosition = primarySelection.element.style.position;

    switch (event.key) {
      case 'ArrowUp':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'up', node: this } }));
        } else {
          primarySelection.element.style.top = oldTop - 10 + 'px';
        }
        break;
      case 'ArrowDown':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'down', node: this } }));
        } else {
          primarySelection.element.style.top = oldTop + 10 + 'px';
        }
        break;
      case 'ArrowLeft':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'back', node: this } }));
        } else {
          primarySelection.element.style.left = oldLeft - 10 + 'px';
        }
        break;
      case 'ArrowRight':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', { bubbles: true, composed: true, detail: { type: 'forward', node: this } }));
        } else {
          primarySelection.element.style.left = oldLeft + 10 + 'px';
        }
        break;
    }
    this.instanceServiceContainer.undoService.add(UndoItemType.Move, primarySelection.element,
      {
        new: { left: primarySelection.element.style.left, top: primarySelection.element.style.top, position: primarySelection.element.style.position },
        old: { left: oldLeft, top: oldTop, position: oldPosition }
      });
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
        e.element.classList.remove('active');
    }
    if (selectionChangedEvent.selectedElements) {
      for (let e of selectionChangedEvent.selectedElements)
        e.element.classList.add('active');
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
        if (currentElement === this || currentElement === this._canvas || currentElement == null) {
          this.setSelectedElements(null);
          this._actionType = PointerActionType.DrawSelection;
          return;
        } else {
          let rectCurrentElement = currentElement.getBoundingClientRect();
          this._actionType = this._shouldResize(currentPoint, { x: rectCurrentElement.right - this._ownBoundingRect.left, y: rectCurrentElement.bottom - this._ownBoundingRect.top }) ? PointerActionType.Resize : PointerActionType.DragOrSelect;
        }
      }
    }

    let currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);

    if (this._actionType == PointerActionType.DrawSelection) {
      this._pointerActionTypeDrawSelection(event, currentElement, currentPoint);
    } else if (this._actionType == PointerActionType.Resize) {
      this._pointerActionTypeResize(event, currentElement, currentPoint);
    } else if (this._actionType == PointerActionType.DragOrSelect || this._actionType == PointerActionType.Drag) {
      this._pointerActionTypeDragOrSelect(event, currentDesignItem, currentPoint);
    }
    if (event.type == EventNames.PointerUp) {
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
        backup.push(e.element.style.pointerEvents)
        e.element.style.pointerEvents = 'none';
      }
      let currentElement = this.shadowRoot.elementFromPoint(event.x, event.y) as HTMLElement;
      currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);
      for (const e of this._clickThroughElements) {
        e.element.style.pointerEvents = backup.shift();
      }
    } else {
      this._clickThroughElements = []
    }

    let trackX = currentPoint.x - this._initialPoint.x;
    let trackY = currentPoint.y - this._initialPoint.y;
    if (this._alignOnGrid) {
      trackX = Math.round(trackX / this._gridSize) * this._gridSize;
      trackY = Math.round(trackY / this._gridSize) * this._gridSize;
    }

    switch (event.type) {
      case EventNames.PointerDown:
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
          designItem.element.style.transform = 'translate(' + trackX + 'px, ' + trackY + 'px)';
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
            let oldLeft = parseInt(movedElement.style.left);
            oldLeft = Number.isNaN(oldLeft) ? 0 : oldLeft;
            let oldTop = parseInt(movedElement.style.top);
            oldTop = Number.isNaN(oldTop) ? 0 : oldTop;
            //let oldPosition = movedElement.style.position;

            //todo: move get old Position to a handler
            movedElement.style.transform = null;
            movedElement.style.position = 'absolute';
            movedElement.style.left = (trackX + oldLeft) + "px";
            movedElement.style.top = (trackY + oldTop) + "px";
            //todo
            /*this.serviceContainer.UndoService.add(UndoItemType.Move, movedElement,
              {
                new: { left: movedElement.style.left, top: movedElement.style.top, position: movedElement.style.position },
                old: { left: oldLeft, top: oldTop, position: oldPosition }
              });*/
          }

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
          designItem.element.style.width = this._initialSizes[i].width + trackX + 'px';
          designItem.element.style.height = this._initialSizes[i].height + trackY + 'px';
        }
        break;
      case EventNames.PointerUp:
        //let j = 0;
        for (const designItem of this.instanceServiceContainer.selectionService.selectedElements) {
          //todo
          /*this.serviceContainer.UndoService.add(UndoItemType.Resize, element,
            {
              new: { width: element.style.width, height: element.style.height },
              old: { width: this._initialSizes[j].width + 'px', height: this._initialSizes[j].height + 'px' }
            });*/
          designItem.element.classList.remove('resizing');
          designItem.element.classList.remove('dragging');
        }
        this._initialSizes = null;
        break;
    }
  }

  _shouldResize(pointerPoint: IPoint, bottomPoint: IPoint) {
    const right = bottomPoint.x - pointerPoint.x;
    const bottom = bottomPoint.y - pointerPoint.y;
    return (right < this._resizeOffset && bottom < this._resizeOffset);
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

customElements.define('canvas-view', CanvasView);