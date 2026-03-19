import { BaseCustomWebComponentConstructorAppend, css, html, Disposable } from "@node-projects/base-custom-webcomponent";
import { IMiniatureView } from "./IMiniatureView.js";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer.js";
import { DesignerCanvas } from "../designerView/designerCanvas.js";

export class MiniatureView extends BaseCustomWebComponentConstructorAppend implements IMiniatureView {

  static override readonly style = css`
        :host {
          overflow:hidden;
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
        }
        #outerDiv {
          width: 100%;
          height: 100%;
        }
        #innerDiv {
          transform-origin: top left;
          height: 100%;
          width: 100%;
          image-rendering: pixelated;
        }
        #above {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: auto;
          background: transparent;
          cursor: pointer;
        }
        #viewRect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 1px solid black;
          pointer-events: none;
        }`;

  static override readonly template = html`
        <div id="outerDiv">
          <div id="innerDiv"></div> 
        </div>
        <div id="above">
          <div id="viewRect"></div>
        </div>`;

  private _innerDiv: HTMLDivElement;
  private _outerDiv: HTMLDivElement;
  private _above: HTMLDivElement;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _contentChangedHandler: Disposable;
  private _maxX = 0;
  private _maxY = 0;
  private _resizeObserver: ResizeObserver;
  private _innerShadow: ShadowRoot;
  private _zoomFactorChangedHandler: Disposable;
  private _viewRect: HTMLDivElement;
  private _minatureScaleX = 1;
  private _minatureScaleY = 1;
  private _reRenderFlag = false;
  private _isDragging = false;
  private _boundMouseMove: (e: MouseEvent) => void;
  private _boundMouseUp: (e: MouseEvent) => void;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._outerDiv = this._getDomElement<HTMLDivElement>('outerDiv');
    this._innerDiv = this._getDomElement<HTMLDivElement>('innerDiv');
    this._viewRect = this._getDomElement<HTMLDivElement>('viewRect');
    this._above = this._getDomElement<HTMLDivElement>('above');
    this._innerShadow = this._innerDiv.attachShadow({ mode: 'open' });

    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);

    this._above.addEventListener('mousedown', (e) => this._onMouseDown(e));

    this._resizeObserver = new ResizeObserver(() => {
      this._reSize();
    });
  }

  ready() {
    this._resizeObserver.observe(this);
  }

  private _reSize() {
    const outerRect = this._outerDiv.getBoundingClientRect();
    this._minatureScaleX = outerRect.width / this._maxX;
    this._minatureScaleY = outerRect.height / this._maxY;
    this._innerDiv.style.scale = this._minatureScaleX + ' ' + this._minatureScaleY;
  }

  private async _reRender() {
    if (this._instanceServiceContainer) {
      const designerCanvas = this._instanceServiceContainer?.designerCanvas;
      this._innerShadow.adoptedStyleSheets = [...designerCanvas.rootDesignItem.element.shadowRoot.adoptedStyleSheets];

      const pixelSize = designerCanvas.designerPixelSize;
      this._maxX = pixelSize.width;
      this._maxY = pixelSize.height;

      const miniatureViewContent = await this._instanceServiceContainer.designerCanvas.serviceContainer.miniatureViewService.provideMiniatureView(designerCanvas);
      this._innerShadow.replaceChildren(miniatureViewContent);
      
      this._reSize();
      this._reDrawRect();
      this._reRenderFlag = false;
    }
  }

  private _reDrawRect() {
    const designerCanvas = this._instanceServiceContainer?.designerCanvas;
    const offset = designerCanvas.canvasOffset;
    const zoom = designerCanvas.zoomFactor;

    this._viewRect.style.left = (-offset.x / this._maxX * 100) + '%';
    this._viewRect.style.top = (-offset.y / this._maxY * 100) + '%';
    this._viewRect.style.width = (designerCanvas.clientWidth / zoom / this._maxX * 100) + '%';
    this._viewRect.style.height = (designerCanvas.clientHeight / zoom / this._maxY * 100) + '%';
  }

  private _onMouseDown(e: MouseEvent) {
    if (!this._instanceServiceContainer) return;
    this._isDragging = true;
    this._moveCanvasToMousePosition(e);
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mouseup', this._boundMouseUp);
    e.preventDefault();
  }

  private _onMouseMove(e: MouseEvent) {
    if (!this._isDragging) return;
    this._moveCanvasToMousePosition(e);
    e.preventDefault();
  }

  private _onMouseUp(e: MouseEvent) {
    this._isDragging = false;
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mouseup', this._boundMouseUp);
  }

  private _moveCanvasToMousePosition(e: MouseEvent) {
    const designerCanvas = this._instanceServiceContainer.designerCanvas;
    const zoom = designerCanvas.zoomFactor;
    const aboveRect = this._above.getBoundingClientRect();

    const mouseX = e.clientX - aboveRect.left;
    const mouseY = e.clientY - aboveRect.top;

    const contentX = (mouseX / aboveRect.width) * this._maxX;
    const contentY = (mouseY / aboveRect.height) * this._maxY;

    const halfViewW = designerCanvas.clientWidth / zoom / 2;
    const halfViewH = designerCanvas.clientHeight / zoom / 2;

    designerCanvas.canvasOffset = {
      x: -(contentX - halfViewW),
      y: -(contentY - halfViewH)
    };
  }

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._contentChangedHandler?.dispose()
    this._zoomFactorChangedHandler?.dispose();
    this._instanceServiceContainer = value;
    if (this._instanceServiceContainer) {
      this._zoomFactorChangedHandler = (<DesignerCanvas>this._instanceServiceContainer.designerCanvas).onZoomFactorChanged.on(() => {
        this._reDrawRect();
      });
      this._contentChangedHandler = this._instanceServiceContainer.contentService.onContentChanged.on(e => {
        if (this._reRenderFlag === false) {
          this._reRenderFlag = true;
          setTimeout(() => this._reRender(), 50);
        }
      });
      if (this._reRenderFlag === false) {
        this._reRenderFlag = true;
        setTimeout(() => this._reRender(), 50);
      }
    } else {
      this._innerShadow.innerHTML = "";
    }
  }
}

customElements.define('node-projects-web-component-designer-miniature-view', MiniatureView);