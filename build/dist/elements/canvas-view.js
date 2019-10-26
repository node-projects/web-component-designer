import { PointerActionType } from "../enums/PointerActionType.js";
import { EventNames } from "../enums/EventNames.js";
import { ActionHistoryType } from "../enums/ActionHistoryType.js";
export class CanvasView extends HTMLElement {
  constructor() {
    super();
    this.selectedElements = []; // Settings

    this._gridSize = 10;
    this._alignOnGrid = true;
    this._clickThroughElements = [];

    if (!CanvasView._sheet) {
      CanvasView._sheet = new CSSStyleSheet(); //@ts-ignore

      CanvasView._sheet.replaceSync(`
      :host {
        display: block;
        box-sizing: border-box;
        width: 100%;
        position: relative;
        background-color: var(--canvas-background);
        /* 10px grid, using http://www.patternify.com/ */
        background-image: url(./assets/images/grid.png);
        background-position: 0px 0px;
        transform: translateZ(0);
      }
      #canvas {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
      }

      #canvas > dom-repeat {
        height: 20px;
        width: 20px;
        display: inline-block;
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
      #selector {
        border: 1px dotted #000;
        position: absolute;
        pointer-events: none;
      }
    }`);
    }

    const shadow = this.attachShadow({
      mode: 'open'
    }); //@ts-ignore

    shadow.adoptedStyleSheets = [CanvasView._sheet];
    this._canvas = document.createElement('div');
    this._canvas.id = 'canvas';
    shadow.appendChild(this._canvas);
    this._selector = document.createElement('div');
    this._selector.id = 'selector';
    this._selector.hidden = true;
    shadow.appendChild(this._selector);
    this._onKeyDownBound = this.onKeyDown.bind(this);
    this._onKeyUpBound = this.onKeyUp.bind(this);
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._canvas.addEventListener(EventNames.PointerDown, event => this._pointerDownOnElement(event));

      this._canvas.addEventListener(EventNames.PointerMove, event => this._pointerMoveOnElement(event));

      this._canvas.addEventListener(EventNames.PointerUp, event => this._pointerUpOnElement(event));

      window.addEventListener('keydown', this._onKeyDownBound, true); //we need to find a way to check wich events are for our control

      window.addEventListener('keyup', this._onKeyUpBound, true);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._onKeyDownBound, true);
    window.removeEventListener('keyup', this._onKeyUpBound, true);
  }

  onKeyUp(event) {
    switch (event.key) {
      case 'ArrowUp':
        this._resetPointerEventsForClickThrough();

        break;
    }
  }

  _resetPointerEventsForClickThrough() {
    if (this._clickThroughElements.length == 0) return;
    this._clickThroughElements = [];
  }

  onKeyDown(event) {
    let el = this.selectedElements[0];

    if (!el) {
      return;
    } // This is a global window handler, so clicks can come from anywhere
    // We only care about keys that come after you've clicked on an element,
    // or keys after you've selected something from the tree view.
    // TODO: can this be less bad since it's p horrid?


    let isOk = //@ts-ignore
    event.composedPath()[0].localName === 'button' && event.composedPath()[2].localName == 'tree-view' || //@ts-ignore
    event.composedPath()[0].localName == 'body' || event.composedPath()[0].classList.contains('active');

    if (!isOk) {
      return;
    }

    let oldLeft = parseInt(el.style.left);
    let oldTop = parseInt(el.style.top);
    let oldPosition = el.style.position;

    switch (event.key) {
      case 'ArrowUp':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', {
            bubbles: true,
            composed: true,
            detail: {
              type: 'up',
              node: this
            }
          }));
        } else {
          el.style.top = oldTop - 10 + 'px';
        }

        break;

      case 'ArrowDown':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', {
            bubbles: true,
            composed: true,
            detail: {
              type: 'down',
              node: this
            }
          }));
        } else {
          el.style.top = oldTop + 10 + 'px';
        }

        break;

      case 'ArrowLeft':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', {
            bubbles: true,
            composed: true,
            detail: {
              type: 'back',
              node: this
            }
          }));
        } else {
          el.style.left = oldLeft - 10 + 'px';
        }

        break;

      case 'ArrowRight':
        if (event.shiftKey) {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('move', {
            bubbles: true,
            composed: true,
            detail: {
              type: 'forward',
              node: this
            }
          }));
        } else {
          el.style.left = oldLeft + 10 + 'px';
        }

        break;
    }

    this.actionHistory.add(ActionHistoryType.Move, el, {
      new: {
        left: el.style.left,
        top: el.style.top,
        position: el.style.position
      },
      old: {
        left: oldLeft,
        top: oldTop,
        position: oldPosition
      }
    });
  } // Access canvas API


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
  } // end


  setSelectedElements(elements) {
    if (this.selectedElements) {
      for (let e of this.selectedElements) e.classList.remove('active');
    } //this.selectedElement = elements[0];


    this.selectedElements = elements;

    if (this.selectedElements) {
      for (let e of this.selectedElements) e.classList.add('active');
    }

    this.dispatchEvent(new CustomEvent('selected-element-changed', {
      bubbles: true,
      composed: true,
      detail: {
        target: this.selectedElements[0],
        node: this
      }
    }));
    this.dispatchEvent(new CustomEvent('refresh-view', {
      bubbles: true,
      composed: true,
      detail: {
        node: this
      }
    }));
  }

  _pointerDownOnElement(event) {
    this._canvas.setPointerCapture(event.pointerId);

    this._pointerEventHandler(event);

    this._previousEventName = event.type;
  }

  _pointerMoveOnElement(event) {
    this._pointerEventHandler(event);

    this._previousEventName = event.type;
  }

  _pointerUpOnElement(event) {
    this._canvas.releasePointerCapture(event.pointerId);

    this._pointerEventHandler(event);

    this._previousEventName = event.type;
  }

  _pointerEventHandler(event) {
    if (!event.altKey) this._resetPointerEventsForClickThrough(); //const currentElement = event.target as HTMLElement;

    const currentElement = this.shadowRoot.elementFromPoint(event.x, event.y);
    this._ownBoundingRect = this.getBoundingClientRect();
    const currentPoint = {
      x: event.x - this._ownBoundingRect.left,
      y: event.y - this._ownBoundingRect.top
    };

    if (this._actionType == null) {
      this._initialPoint = currentPoint;

      if (event.type == EventNames.PointerDown) {
        if (currentElement === this || currentElement === this._canvas || currentElement == null) {
          this._actionType = PointerActionType.DrawSelection;
          return;
        } else {
          let rectCurrentElement = currentElement.getBoundingClientRect();
          this._actionType = this._shouldResize(currentPoint, {
            x: rectCurrentElement.right - this._ownBoundingRect.left,
            y: rectCurrentElement.bottom - this._ownBoundingRect.top
          }) ? PointerActionType.Resize : PointerActionType.DragOrSelect; //el.classList.add('resizing');
        }
      }
    }

    if (this._actionType == PointerActionType.DrawSelection) {
      this._pointerActionTypeDrawSelection(event, currentElement, currentPoint);
    } else if (this._actionType == PointerActionType.Resize) {
      this._pointerActionTypeResize(event, currentElement, currentPoint);
    } else if (this._actionType == PointerActionType.DragOrSelect || this._actionType == PointerActionType.Drag) {
      this._pointerActionTypeDragOrSelect(event, currentElement, currentPoint);
    }

    if (event.type == EventNames.PointerUp) {
      this._actionType = null;
    }
  }

  _pointerActionTypeDrawSelection(event, currentElement, currentPoint) {
    let x1 = Math.min(this._initialPoint.x, currentPoint.x);
    let x2 = Math.max(this._initialPoint.x, currentPoint.x);
    let y1 = Math.min(this._initialPoint.y, currentPoint.y);
    let y2 = Math.max(this._initialPoint.y, currentPoint.y);
    let selector = this._selector;
    selector.style.left = x1 + 'px';
    selector.style.top = y1 + 'px';
    selector.style.width = x2 - x1 + 'px';
    selector.style.height = y2 - y1 + 'px';
    selector.hidden = false;

    if (event.type == EventNames.PointerUp) {
      selector.hidden = true;

      let elements = this._canvas.querySelectorAll('*');

      let inSelectionElements = [];

      for (let e of elements) {
        let elementRect = e.getBoundingClientRect();

        if (elementRect.top - this._ownBoundingRect.top >= y1 && elementRect.left - this._ownBoundingRect.left >= x1 && elementRect.top - this._ownBoundingRect.top + elementRect.height <= y2 && elementRect.left - this._ownBoundingRect.left + elementRect.width <= x2) {
          inSelectionElements.push(e);
        }
      }

      this.setSelectedElements(inSelectionElements);
    }
  }

  _pointerActionTypeDragOrSelect(event, currentElement, currentPoint) {
    if (event.altKey) {
      let backup = [];
      if (event.type == EventNames.PointerDown) this._clickThroughElements.push(currentElement);

      for (const e of this._clickThroughElements) {
        backup.push(e.style.pointerEvents);
        e.style.pointerEvents = 'none';
      }

      currentElement = this.shadowRoot.elementFromPoint(event.x, event.y);

      for (const e of this._clickThroughElements) {
        e.style.pointerEvents = backup.shift();
      }
    } else {
      this._clickThroughElements = [];
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
          const index = this.selectedElements.indexOf(currentElement);

          if (index >= 0) {
            let newSelectedList = this.selectedElements.slice(0);
            newSelectedList.splice(index, 1);
            this.setSelectedElements(newSelectedList);
          } else {
            let newSelectedList = this.selectedElements.slice(0);
            newSelectedList.push(currentElement);
            this.setSelectedElements(newSelectedList);
          }
        } else {
          if (this.selectedElements.indexOf(currentElement) < 0) this.setSelectedElements([currentElement]);
        }

        break;

      case EventNames.PointerMove:
        if (trackX != 0 || trackY != 0) this._actionType = PointerActionType.Drag;
        if (this._actionType != PointerActionType.Drag) return; //todo -> what is if a transform already exists -> backup existing style.?

        for (const element of this.selectedElements) {
          element.style.transform = 'translate(' + trackX + 'px, ' + trackY + 'px)';
        } // See if it's over anything.


        this._dropTarget = null;

        let targets = this._canvas.querySelectorAll('*');

        for (let i = 0; i < targets.length; i++) {
          let possibleTarget = targets[i];
          possibleTarget.classList.remove('over');
          if (this.selectedElements.indexOf(possibleTarget) >= 0) continue; // todo put following a extenable function ...
          // in IContainerHandler ...
          // Only some native elements and things with slots can be drop targets.

          let slots = possibleTarget ? possibleTarget.querySelectorAll('slot') : []; // input is the only native in this app that doesn't have a slot

          let canDrop = possibleTarget.localName.indexOf('-') === -1 && possibleTarget.localName !== 'input' || possibleTarget.localName === 'dom-repeat' || slots.length !== 0;

          if (!canDrop) {
            continue;
          } // Do we actually intersect this child?


          const possibleTargetRect = possibleTarget.getBoundingClientRect();

          if (possibleTargetRect.top - this._ownBoundingRect.top <= currentPoint.y && possibleTargetRect.left - this._ownBoundingRect.left <= currentPoint.x && possibleTargetRect.top - this._ownBoundingRect.top + possibleTargetRect.height >= currentPoint.y && possibleTargetRect.left - this._ownBoundingRect.left + possibleTargetRect.width >= currentPoint.x) {
            // New target! Remove the other target indicators.
            var previousTargets = this._canvas.querySelectorAll('.over');

            for (var j = 0; j < previousTargets.length; j++) {
              previousTargets[j].classList.remove('over');
            }

            if (currentElement != possibleTarget && this._dropTarget != possibleTarget) {
              possibleTarget.classList.add('over');

              if (event.altKey) {
                if (this._dropTarget != null) this._dropTarget.classList.remove('over-enter');
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
          if (this._previousEventName == EventNames.PointerDown) this.setSelectedElements([currentElement]);
          return;
        } //todo this needs also to get info from container handler, cause position is dependent of container


        for (const movedElement of this.selectedElements) {
          if (this._dropTarget && this._dropTarget != movedElement.parentElement) {
            let oldParent = movedElement.parentElement;
            movedElement.parentElement.removeChild(currentElement); // If there was a textContent nuke it, or else you'll
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
            let oldLeft = movedElement.style.left;
            let oldTop = movedElement.style.top;
            let oldPosition = movedElement.style.position; //todo: move get old Position to a handler

            movedElement.style.transform = null;
            movedElement.style.position = 'absolute';
            movedElement.style.left = trackX + parseInt(oldLeft) + "px";
            movedElement.style.top = trackY + parseInt(oldTop) + "px";
            this.actionHistory.add(ActionHistoryType.Move, movedElement, {
              new: {
                left: movedElement.style.left,
                top: movedElement.style.top,
                position: movedElement.style.position
              },
              old: {
                left: oldLeft,
                top: oldTop,
                position: oldPosition
              }
            });
          }

          if (this._dropTarget != null) this._dropTarget.classList.remove('over-enter');
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
    } //todo this.dispatchEvent(new CustomEvent('refresh-view', { bubbles: true, composed: true, detail: { whileTracking: true, node: this } }));

  }

  _pointerActionTypeResize(event, currentElement, currentPoint) {
    switch (event.type) {
      case EventNames.PointerDown:
        this._initialSizes = [];

        for (const element of this.selectedElements) {
          let rect = element.getBoundingClientRect();

          this._initialSizes.push({
            width: rect.width,
            height: rect.height
          });
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

        for (const element of this.selectedElements) {
          element.style.width = this._initialSizes[i].width + trackX + 'px';
          element.style.height = this._initialSizes[i].height + trackY + 'px';
        }

        break;

      case EventNames.PointerUp:
        let j = 0;

        for (const element of this.selectedElements) {
          this.actionHistory.add(ActionHistoryType.Resize, element, {
            new: {
              width: element.style.width,
              height: element.style.height
            },
            old: {
              width: this._initialSizes[j].width + 'px',
              height: this._initialSizes[j].height + 'px'
            }
          });
          element.classList.remove('resizing');
          element.classList.remove('dragging');
        }

        this._initialSizes = null;
        break;
    }
  }

  _shouldResize(pointerPoint, bottomPoint) {
    const right = bottomPoint.x - pointerPoint.x;
    const bottom = bottomPoint.y - pointerPoint.y;
    return right < 8 && bottom < 8;
  }

  deepTargetFind(x, y, notThis) {
    let node = document.elementFromPoint(x, y);
    let next = node; // this code path is only taken when native ShadowDOM is used
    // if there is a shadowroot, it may have a node at x/y
    // if there is not a shadowroot, exit the loop

    while (next !== notThis && next && next.shadowRoot) {
      // if there is a node at x/y in the shadowroot, look deeper
      let oldNext = next;
      next = next.shadowRoot.elementFromPoint(x, y); // on Safari, elementFromPoint may return the shadowRoot host

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