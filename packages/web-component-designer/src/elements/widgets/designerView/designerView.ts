import { ServiceContainer } from '../../services/ServiceContainer.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { css, DomHelper, html, BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { DesignerCanvas } from "./designerCanvas.js";
import { DomConverter } from './DomConverter.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { DefaultHtmlParserService } from '../../services/htmlParserService/DefaultHtmlParserService.js';
import { EventNames } from '../../../enums/EventNames.js';
import { PlainScrollbar } from '../../controls/PlainScrollbar.js';
import { DesignerToolbar } from './tools/toolBar/DesignerToolbar.js';
import { getCanvasPointAtViewportCenter, ZoomHoldRepeater } from './ZoomHelper.js';

export class DesignerView extends BaseCustomWebComponentConstructorAppend implements IUiCommandHandler {
  private _sVert: PlainScrollbar;
  private _sHor: PlainScrollbar;

  public get serviceContainer(): ServiceContainer {
    return this._designerCanvas.serviceContainer;
  }
  public set serviceContainer(value: ServiceContainer) {
    this._designerCanvas.serviceContainer = value;
  }

  public get instanceServiceContainer(): InstanceServiceContainer {
    return this._designerCanvas.instanceServiceContainer;
  }
  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._designerCanvas.instanceServiceContainer = value;
  }

  private _designerCanvas: DesignerCanvas;

  public get designerCanvas() {
    return this._designerCanvas;
  }

  get readOnly() {
    return this._designerCanvas.readOnly;
  }
  set readOnly(v) {
    this._designerCanvas.readOnly = v;
  }

  private _zoomInput: HTMLInputElement;
  private _lowertoolbar: HTMLDivElement;
  private _toolbar: DesignerToolbar;
  private _zoomHoldRepeater = new ZoomHoldRepeater();
  private _zoomPointerId: number;
  private _zoomPointerTarget: HTMLElement;

  static override readonly style = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      position: relative;
      transform: translateZ(0);
      overflow: hidden;
    }
    * {
      touch-action: none;
    }
    #lowertoolbar {
      height: var(--wcd-designer-view-statusbar-height, 28px);
      box-sizing: border-box;
      background: var(--wcd-designer-view-statusbar-background, #787f82);
      color: var(--wcd-designer-view-statusbar-color, #354348);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      overflow-x: auto;
      scrollbar-width: none;
      padding: 2px 6px;
      bottom: 0;
      position: absolute;
      width: 100%;
    }
    #zoomInput {
      flex: 0 0 52px;
      box-sizing: border-box;
      width: 52px;
      height: 24px;
      padding: 0 4px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: 11px;
      text-align: center;
    }
    .toolbar-control {
      box-sizing: border-box;
      font: inherit;
      flex: 0 0 24px;
      width: 24px;
      height: 24px;
      padding: 4px;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .toolbar-control-input {
      flex-basis: 52px;
      width: 52px;
      padding: 0;
    }
    .toolbar-control-input input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      height: 24px;
      padding: 0 4px;
      border: 1px solid var(--wcd-color-border, #596c7a);
      border-radius: 4px;
      font: inherit;
      color: inherit;
      background: var(--wcd-input-background-color, white);
    }
    .toolbar-control svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }
    #zoomInput:focus-visible, .toolbar-control:focus-visible, .toolbar-control-input input:focus-visible {
      outline: 2px solid var(--wcd-color-focus, #47977c);
      outline-offset: -2px;
    }
    .toolbar-separator {
      height: 14px;
      margin: 0 2px;
      border-left: 1px solid var(--wcd-color-border, #596c7a);
    }
    .selected {
      background-color: var(--wcd-designer-view-tool-selected-background, deepskyblue);
    }
    .toolbar-control:hover {
      background-color: var(--wcd-designer-view-tool-hover-background, rgba(164,206,249,.6));
    }
    #outer {
      user-select: none;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    #canvas {
      left: 24px;
      width: calc(100% - 24px - 16px);
      height: calc(100% - var(--wcd-designer-view-statusbar-height, 28px) - 16px);
    }

    #tool-bar {
      width: 24px;
      height: calc(100% - var(--wcd-designer-view-statusbar-height, 28px) - 16px);
      position: absolute;
      background-color: var(--wcd-designer-view-toolbar-background, lightgray);      
    }
  
    .bottom-scroll {
      width: calc(100% - 16px);
      position: absolute;
      bottom: var(--wcd-designer-view-statusbar-height, 28px);
      height: 16px;
      box-sizing: border-box;
      z-index: 1;
    }
    .right-scroll {
      height: calc(100% - var(--wcd-designer-view-statusbar-height, 28px) - 16px);
      position: absolute;
      right: 0;
      top: 0;
      width: 16px;
      box-sizing: border-box;
      z-index: 1;
    }
    .bottom-right {
      width: 16px;
      height: 16px;
      bottom: var(--wcd-designer-view-statusbar-height, 28px);
      right: 0;
      position: absolute;
      background: var(--wcd-designer-view-corner-background, #f0f0f0);
    }`;

  static override readonly template = html`
    <div id="outer">
      <node-projects-plain-scrollbar id="s-hor" value="0.5" class="bottom-scroll"></node-projects-plain-scrollbar>
      <node-projects-plain-scrollbar id="s-vert" value="0.5" orientation="vertical" class="right-scroll">
      </node-projects-plain-scrollbar>
      <div class="bottom-right"></div>
      <div id="lowertoolbar" role="group" aria-label="Canvas controls">
        <input id="zoomInput" type="text" value="100%" aria-label="Zoom percentage">
        <button type="button" title="Zoom out" aria-label="Zoom out" id="zoomDecrease" class="toolbar-control">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>
        </button>
        <button type="button" title="Zoom in" aria-label="Zoom in" id="zoomIncrease" class="toolbar-control">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>
        </button>
        <button type="button" title="Reset zoom to 100%" aria-label="Reset zoom to 100%" id="zoomReset" class="toolbar-control">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l2-2v10M15 9l2-2v10"/><path d="M11 10h.01M11 14h.01" stroke-width="2.5"/></svg>
        </button>
        <button type="button" title="Zoom to fit" aria-label="Zoom to fit" id="zoomFit" class="toolbar-control">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
        </button>
        <span class="toolbar-separator" aria-hidden="true"></span>
        <button type="button" title="Snap to grid (right-click to set grid size)" aria-label="Snap to grid" aria-pressed="false" id="alignGrid" class="toolbar-control">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/></svg>
        </button>
        <button type="button" title="Snap to elements" aria-label="Snap to elements" aria-pressed="false" id="alignSnap" class="toolbar-control">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4v9a3 3 0 0 0 6 0V4h4v9a7 7 0 0 1-14 0V4Z"/><path d="M5 8h4m6 0h4"/></svg>
        </button>
      </div>
    </div>`;

  constructor(useIframe: boolean = false) {
    super();
    this._restoreCachedInititalValues();

    this._sVert = this._getDomElement<PlainScrollbar>('s-vert');
    this._sHor = this._getDomElement<PlainScrollbar>('s-hor');

    const outer = this._getDomElement<DesignerCanvas>('outer');
    this._designerCanvas = new DesignerCanvas(useIframe);
    this._designerCanvas.id = "canvas";
    this._designerCanvas.appendChild(document.createElement("slot"));
    outer.insertAdjacentElement('afterbegin', this._designerCanvas);

    this._toolbar = new DesignerToolbar();
    this._toolbar.id = 'tool-bar';
    this._sVert.insertAdjacentElement('afterend', this._toolbar);

    this._designerCanvas.onZoomFactorChanged.on(() => {
      this._zoomInput.value = Math.round(this._designerCanvas.zoomFactor * 100) + '%';

      const pos = this.designerCanvas.canvasOffset;

      const w = this.designerCanvas.designerOffsetWidth > this.designerCanvas.offsetWidth ? this.designerCanvas.designerOffsetWidth : this.designerCanvas.offsetWidth;
      const h = this.designerCanvas.designerOffsetHeight > this.designerCanvas.offsetHeight ? this.designerCanvas.designerOffsetHeight : this.designerCanvas.offsetHeight;
      this._sHor.value = (pos.x / (-2 * w)) + 0.5;
      this._sVert.value = (pos.y / (-2 * h)) + 0.5;
    });

    this._zoomInput = this._getDomElement<HTMLInputElement>('zoomInput');
    this._zoomInput.onkeydown = (e) => {
      if (e.key == 'Enter')
        this._zoomAroundViewportCenter(parseFloat(this._zoomInput.value) / 100);
    }
    this._zoomInput.onblur = () => {
      this._zoomAroundViewportCenter(parseFloat(this._zoomInput.value) / 100);
    }
    this._zoomInput.onclick = this._zoomInput.select
    let zoomIncrease = this._getDomElement<HTMLButtonElement>('zoomIncrease');
    this._configureZoomButton(zoomIncrease, 1);
    let zoomDecrease = this._getDomElement<HTMLButtonElement>('zoomDecrease');
    this._configureZoomButton(zoomDecrease, -1);
    let zoomReset = this._getDomElement<HTMLButtonElement>('zoomReset');
    zoomReset.onclick = () => {
      this.zoomReset();
    }
    let zoomFit = this._getDomElement<HTMLButtonElement>('zoomFit');
    zoomFit.onclick = () => {
      this.zoomToFit();
    }
    this.addEventListener(EventNames.Wheel, event => this._onWheel(event));

    const updateSnapButton = (button: HTMLButtonElement, active: boolean) => {
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    };
    const alignSnap = this._getDomElement<HTMLButtonElement>('alignSnap');
    alignSnap.onclick = () => {
      this._designerCanvas.alignOnSnap = !this._designerCanvas.alignOnSnap;
      updateSnapButton(alignSnap, this._designerCanvas.alignOnSnap);
    };
    updateSnapButton(alignSnap, this._designerCanvas.alignOnSnap);
    alignSnap.oncontextmenu = e => { e.preventDefault(); }
    const alignGrid = this._getDomElement<HTMLButtonElement>('alignGrid');
    alignGrid.onclick = () => {
      this._designerCanvas.alignOnGrid = !this._designerCanvas.alignOnGrid;
      updateSnapButton(alignGrid, this._designerCanvas.alignOnGrid);
    };
    updateSnapButton(alignGrid, this._designerCanvas.alignOnGrid);
    alignGrid.oncontextmenu = e => {
      e.preventDefault();
      let res = prompt("raster size", this.designerCanvas.gridSize.toString());
      if (res) {
        let r = parseInt(res);
        if (r > 0)
          this.designerCanvas.gridSize = r;
      }
    }

    this._lowertoolbar = this._getDomElement<HTMLDivElement>('lowertoolbar');
    this._lowertoolbar.onwheel = event => event.stopPropagation();

    this._sVert.addEventListener('scrollbar-input', (e) => this._onScrollbar(e));
    this._sHor.addEventListener('scrollbar-input', (e) => this._onScrollbar(e));
  }

  public zoomReset() {
    this._designerCanvas.canvasOffset = { x: 0, y: 0 };
    this._designerCanvas.zoomFactor = 1;
    this._sVert.value = 0.5;
    this._sHor.value = 0.5;
    this._zoomInput.value = Math.round(this._designerCanvas.zoomFactor * 100) + '%';
  }

  public zoomToFit() {
    this._designerCanvas.zoomToFit()
  }

  private _zoomAroundViewportCenter(newZoom: number) {
    if (!Number.isFinite(newZoom) || newZoom <= 0)
      return;

    const viewport = this._designerCanvas.outerRect;
    const centerPoint = getCanvasPointAtViewportCenter(
      viewport.width,
      viewport.height,
      this._designerCanvas.zoomFactor,
      this._designerCanvas.canvasOffset
    );
    this._designerCanvas.zoomPoint(centerPoint, newZoom);
  }

  private _configureZoomButton(button: HTMLElement, direction: 1 | -1) {
    // Pointer presses already zoom on pointerdown; keyboard activation emits a click with detail 0.
    button.onclick = event => {
      if (event.detail === 0)
        this._zoomStep(direction);
    };
    button.onpointerdown = event => {
      if (!event.isPrimary || event.button != 0)
        return;

      this._stopZoomRepeat();
      this._zoomPointerId = event.pointerId;
      this._zoomPointerTarget = button;
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
      }
      this._zoomHoldRepeater.start(
        () => this._zoomStep(direction),
        () => this._zoomStep(direction, 4)
      );
      event.preventDefault();
    };
    button.onpointerup = event => this._stopZoomRepeat(event.pointerId);
    button.onpointercancel = event => this._stopZoomRepeat(event.pointerId);
    button.onlostpointercapture = event => this._stopZoomRepeat(event.pointerId);
    button.oncontextmenu = event => event.preventDefault();
  }

  private _zoomStep(direction: 1 | -1, stepDivisor = 1) {
    const currentZoom = this._designerCanvas.zoomFactor;
    if (direction > 0) {
      const zoomStep = (currentZoom > 0.1 ? 0.1 : 0.01) / stepDivisor;
      this._zoomAroundViewportCenter(currentZoom + zoomStep);
    } else {
      const zoomStep = (currentZoom > 0.11 ? 0.1 : 0.01) / stepDivisor;
      this._zoomAroundViewportCenter(Math.max(currentZoom - zoomStep, 0.001));
    }
  }

  private _stopZoomRepeat(pointerId?: number) {
    if (pointerId != null && pointerId !== this._zoomPointerId)
      return;

    const activePointerId = this._zoomPointerId;
    const activeTarget = this._zoomPointerTarget;
    this._zoomPointerId = null;
    this._zoomPointerTarget = null;
    this._zoomHoldRepeater.stop();
    if (activeTarget && activePointerId != null) {
      try {
        if (activeTarget.hasPointerCapture(activePointerId))
          activeTarget.releasePointerCapture(activePointerId);
      } catch {
      }
    }
  }

  private _onScrollbar(e) {
    if (e?.detail == 'incrementLarge')
      e.target.value += 0.25;
    else if (e?.detail == 'decrementLarge')
      e.target.value -= 0.25;
    else if (e?.detail == 'incrementSmall')
      e.target.value += 0.05;
    else if (e?.detail == 'decrementSmall')
      e.target.value -= 0.05;
    const w = this.designerCanvas.designerOffsetWidth > this.designerCanvas.offsetWidth ? this.designerCanvas.designerOffsetWidth : this.designerCanvas.offsetWidth;
    const h = this.designerCanvas.designerOffsetHeight > this.designerCanvas.offsetHeight ? this.designerCanvas.designerOffsetHeight : this.designerCanvas.offsetHeight;
    const x = w * (this._sHor.value - 0.5) * -2;
    const y = h * (this._sVert.value - 0.5) * -2;
    this.designerCanvas.canvasOffset = { x, y };
  }

  private _onWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.ctrlKey) {
      let zf = this._designerCanvas.zoomFactor;
      const wheel = event.deltaY < 0 ? 1 : (-1);
      zf *= Math.exp(wheel * 0.2);
      if (zf < 0.02)
        zf = 0.02;
      const vp = this.designerCanvas.getNormalizedEventCoordinates(event)
      this.designerCanvas.zoomTowardsPoint(vp, zf);
    }
    else if (event.shiftKey) {
      this._sHor.value += event.deltaY / 10000;
      this._onScrollbar(null);
    }
    else {
      this._sVert.value += event.deltaY / 10000;
      this._onScrollbar(null);
      this._sHor.value += event.deltaX / 10000;
      this._onScrollbar(null);
    }
  }

  get designerWidth(): string {
    return this._designerCanvas.designerWidth;
  }
  set designerWidth(value: string) {
    this._designerCanvas.designerWidth = value;
  }
  get designerHeight(): string {
    return this._designerCanvas.designerHeight;
  }
  set designerHeight(value: string) {
    this._designerCanvas.designerHeight = value;
  }

  set additionalStyles(value: CSSStyleSheet[]) {
    this._designerCanvas.additionalStyles = value;
  }

  public setDesignItems(designItems: IDesignItem[]) {
    this._designerCanvas.setDesignItems(designItems);
  }

  /* --- start IUiCommandHandler --- */

  async executeCommand(command: IUiCommand) {
    this._designerCanvas.executeCommand(command);
  }
  canExecuteCommand(command: IUiCommand) {
    return this._designerCanvas.canExecuteCommand(command);
  }

  /* --- end IUiCommandHandler --- */


  initialize(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;
    this._designerCanvas.initialize(serviceContainer);
    if (serviceContainer.designViewConfigButtons) {
      for (let provider of serviceContainer.designViewConfigButtons) {
        for (let btn of provider.provideButtons(this, this._designerCanvas))
          this._lowertoolbar.appendChild(btn);
      }
    }
    this._toolbar.initialize(this.serviceContainer, this);
  }

  public getDesignerHTML() {
    if (this._designerCanvas.rootDesignItem.childCount > 0) {
      return DomConverter.ConvertToString(Array.from(this._designerCanvas.rootDesignItem.children()), true, true);
    }
    if (this.serviceContainer.htmlWriterService.supportsRootItemWrite) {
      return DomConverter.ConvertToString([this._designerCanvas.rootDesignItem], true, true);
    }
    return '';
  }

  public async parseDesignerHTML(html: string, disableUndo: boolean = false) {
    const parserService = this.serviceContainer.htmlParserService;
    if (!html) {
      this._designerCanvas.overlayLayer.removeAllOverlays();
      DomHelper.removeAllChildnodes(this._designerCanvas.overlayLayer);
      this._designerCanvas.rootDesignItem.clearChildren();
    }
    else {
      const designItems = await parserService.parse(html, this.serviceContainer, this.instanceServiceContainer, false);
      if (disableUndo) {
        this._designerCanvas._internalSetDesignItems(designItems);
      } else {
        this._designerCanvas.setDesignItems(designItems);
      }
    }
  }

  static wrapInDesigner(elements: HTMLCollection | HTMLElement[], serviceContainer: ServiceContainer): DesignerCanvas {
    const designerCanvas = new DesignerCanvas();
    designerCanvas.initialize(serviceContainer);
    const parser = designerCanvas.serviceContainer.getLastServiceWhere('htmlParserService', x => x.constructor == DefaultHtmlParserService) as DefaultHtmlParserService;
    designerCanvas.addDesignItems(parser.createDesignItems(elements, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer))
    return designerCanvas;
  }
}

customElements.define('node-projects-designer-view', DesignerView);
