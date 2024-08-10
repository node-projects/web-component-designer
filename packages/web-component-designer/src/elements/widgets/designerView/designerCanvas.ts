import { EventNames } from '../../../enums/EventNames.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { SelectionService } from '../../services/selectionService/SelectionService.js';
import { DesignItem, forceHoverAttributeName } from '../../item/DesignItem.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { BaseCustomWebComponentLazyAppend, css, cssFromString, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { dragDropFormatNameBindingObject } from '../../../Constants.js';
import { InsertAction } from '../../services/undoService/transactionItems/InsertAction.js';
import { IDesignerCanvas } from './IDesignerCanvas.js';
import { Snaplines } from './Snaplines.js';
import { IPlacementView } from './IPlacementView.js';
import { DeleteAction } from '../../services/undoService/transactionItems/DeleteAction.js';
import { CommandType } from '../../../commandHandling/CommandType.js';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { DefaultHtmlParserService } from '../../services/htmlParserService/DefaultHtmlParserService.js';
import { ExtensionType } from './extensions/ExtensionType.js';
import { IExtensionManager } from './extensions/IExtensionManger.js';
import { ExtensionManager } from './extensions/ExtensionManager.js';
import { NamedTools } from './tools/NamedTools.js';
import { Screenshot } from '../../helper/Screenshot.js';
import { dataURItoBlob, exportData, sleep } from '../../helper/Helper.js';
import { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem.js';
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper.js';
import { IPoint } from '../../../interfaces/IPoint.js';
import { OverlayLayerView } from './overlayLayerView.js';
import { IDesignerPointerExtension } from './extensions/pointerExtensions/IDesignerPointerExtension.js';
import { IRect } from "../../../interfaces/IRect.js";
import { ISize } from "../../../interfaces/ISize.js";
import { ITool } from "./tools/ITool.js";
import { IPlacementService } from "../../services/placementService/IPlacementService.js";
import { ContextMenu } from '../../helper/contextMenu/ContextMenu.js';
import { NodeType } from '../../item/NodeType.js';
import { StylesheetChangedAction } from '../../services/undoService/transactionItems/StylesheetChangedAction.js';
import { SetDesignItemsAction } from '../../services/undoService/transactionItems/SetDesignItemsAction.js';
import { IDocumentStylesheet } from '../../services/stylesheetService/IStylesheetService.js';
import { filterChildPlaceItems } from '../../helper/LayoutHelper.js';
import { ChangeGroup } from '../../services/undoService/ChangeGroup.js';
import { TouchGestureHelper } from '../../helper/TouchGestureHelper.js';
import { stylesheetFromString } from '../../helper/StylesheetHelper.js';
import { AbstractStylesheetService } from '../../services/stylesheetService/AbstractStylesheetService.js';

const disableAnimationsSheet = cssFromString`
  * {
    animation-play-state: paused !important;
  }`

export class DesignerCanvas extends BaseCustomWebComponentLazyAppend implements IDesignerCanvas, IPlacementView, IUiCommandHandler {
  // Public Properties
  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public containerBoundingRect: DOMRect;
  public outerRect: DOMRect;
  public clickOverlay: HTMLDivElement;

  private _activeTool: ITool;

  // IPlacementView
  private _gridSize = 10;
  public get gridSize() {
    return this._gridSize;
  }
  public set gridSize(value: number) {
    this._gridSize = value;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = value * 2;
    canvas.height = value * 2;
    const patternSize = value;
    for (let x = 0; x < canvas.width; x += patternSize) {
      for (let y = 0; y < canvas.height; y += patternSize) {
        context.fillStyle = (x + y) % (patternSize * 2) === 0 ? "#e5e5e5" : "white";
        context.fillRect(x, y, patternSize, patternSize);
      }
    }
    const dataURL = canvas.toDataURL();
    this._backgroundImage = 'url(' + dataURL + ')';
    if (this._canvas.style.backgroundImage != 'none')
      this._canvas.style.backgroundImage = this._backgroundImage;
  }

  public pasteOffset = 10;
  public alignOnGrid = false;
  public alignOnSnap = true;
  public snapLines: Snaplines;
  public overlayLayer: OverlayLayerView;
  public rootDesignItem: IDesignItem;

  private _currentPasteOffset = this.pasteOffset;
  private _zoomFactor = 1; //if scale or zoom css property is used this needs to be the value
  private _scaleFactor = 1; //if scale css property is used this need to be the scale value
  private _canvasOffset: IPoint = { x: 0, y: 0 };

  private _additionalStyle: CSSStyleSheet[];
  private _backgroundImage: string;

  private _enableSelectTextNodesOnClick = false;

  private _moveGroup: ChangeGroup;
  private _touchGestureHelper: TouchGestureHelper;

  public get zoomFactor(): number {
    return this._zoomFactor;
  }
  public set zoomFactor(value: number) {
    this._zoomFactor = value;
    this._zoomFactorChanged();
  }
  public get scaleFactor(): number {
    return this._scaleFactor;
  }
  public get canvasOffset(): IPoint {
    return this._canvasOffset;
  }
  public set canvasOffset(value: IPoint) {
    this._canvasOffset = value;
    this._zoomFactorChanged();
  }
  public get canvasOffsetUnzoomed(): IPoint {
    return { x: this._canvasOffset.x * this.zoomFactor, y: this._canvasOffset.y * this.zoomFactor };
  }
  public set canvasOffsetUnzoomed(value: IPoint) {
    this.canvasOffset = { x: value.x / this.zoomFactor, y: value.y / this.zoomFactor };
  }

  private _pauseAnimations: boolean;
  public get pauseAnimations() {
    return this._pauseAnimations;
  }
  public set pauseAnimations(value: boolean) {
    this._pauseAnimations = value;
    this.applyAllStyles();
  }

  /** Offset when using an iframe as container */
  public get containerOffset(): IPoint {
    if (this._useIframe) {
      const rect = this._outercanvas2.getBoundingClientRect();
      return rect;
    }
    return { x: 0, y: 0 }
  }

  public onContentChanged = new TypedEvent<void>();
  public onZoomFactorChanged = new TypedEvent<number>();

  public get canvas(): HTMLElement {
    return this._canvas;
  }

  // Private Variables
  private _canvas: HTMLDivElement;
  private _canvasShadowRoot: Document | ShadowRoot;
  private _canvasContainer: HTMLDivElement;
  private _outercanvas2: HTMLDivElement;

  private _lastHoverDesignItem: IDesignItem;

  private _firstConnect: boolean;

  //public static cssprefixConstant = '#node-projects-designer-canvas-canvas ';

  static override readonly style = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      position: relative;
      transform: translateZ(0);
      overflow: hidden;

      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      font-style: inherit;
      line-height: inherit;
    }
    * {
      touch-action: none;
    }
    #node-projects-designer-canvas-canvasContainer {
      background: var(--node-projects-web-component-designer-background, border-box fixed 0px 0px repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAFXmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjIwIgogICBleGlmOlBpeGVsWURpbWVuc2lvbj0iMjAiCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgdGlmZjpJbWFnZVdpZHRoPSIyMCIKICAgdGlmZjpJbWFnZUxlbmd0aD0iMjAiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjMwMC8xIgogICB0aWZmOllSZXNvbHV0aW9uPSIzMDAvMSIKICAgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIKICAgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIgogICB4bXA6TW9kaWZ5RGF0ZT0iMjAyMi0xMi0wOFQwOToxNTo0OCswMTowMCIKICAgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMi0xMi0wOFQwOToxNTo0OCswMTowMCI+CiAgIDxkYzp0aXRsZT4KICAgIDxyZGY6QWx0PgogICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+QmFja2dyb3VuZGdyaWRfMTBweDwvcmRmOmxpPgogICAgPC9yZGY6QWx0PgogICA8L2RjOnRpdGxlPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJwcm9kdWNlZCIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWZmaW5pdHkgRGVzaWduZXIgMS4xMC42IgogICAgICBzdEV2dDp3aGVuPSIyMDIyLTEyLTA4VDA5OjE1OjQ4KzAxOjAwIi8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9InIiPz4fvgn+AAABgWlDQ1BzUkdCIElFQzYxOTY2LTIuMQAAKJF1kc8rRFEUxz8GjRhRLCiLl7BCftTExmLkV2ExnvJr8+bNvBk1b+b13kiyVbaKEhu/FvwFbJW1UkRKlrImNug5b2ZqJplzO/d87vfec7r3XPCpSd10KnrATGXs8FhImZtfUPwvBKjCTx/Nmu5YUzOjKiXt854yL952ebVKn/vXaqIxR4eyKuEh3bIzwuPCk6sZy+Md4UY9oUWFz4Q7bbmg8J2nR3L86nE8x98e22p4GHz1wkq8iCNFrCdsU1heTpuZXNHz9/FeEoilZmcktoq34BBmjBAKE4wwTJBeBmUO0iX96ZYVJfJ7svnTpCVXl9liDZtl4iTI0CnqilSPSTREj8lIsub1/29fHaO/L1c9EILKZ9d9bwf/Nvxsue7Xkev+HEP5E1ymCvnpQxj4EH2roLUdQN0GnF8VtMguXGxC06Ol2VpWKhf3GQa8nULtPDTcQPVirmf5fU4eQF2Xr7qGvX3okPN1S790cWfsRnax1QAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAC9JREFUOI1jfPr0KQNuICUlhUeWCY8cQTCqeWRoZvz//z8e6WfPntHK5lHNI0MzAMChCNMTuPcnAAAAAElFTkSuQmCC));
    }
    #node-projects-designer-canvas-canvas {
      image-rendering: pixelated;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      position: absolute;
    }
    
    #node-projects-designer-canvas-canvas.dragFileActive {
      outline: blue 4px solid;
      outline-offset: -4px;
    }
    
    node-projects-overlay-layer-view {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      overflow: visible;
      user-select: none;
      -webkit-user-select: none;
      z-index: 999999999999;
    }
    
    #node-projects-designer-canvas-canvas * {
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    }

    #node-projects-designer-canvas-canvas iframe {
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      border: none;
      width: 100%;
      height: 100%;
    }
    
    #node-projects-designer-canvas-clickOverlay {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
    }
    
    #node-projects-designer-canvas-helper-element {
      height: 0;
      width: 0;
    }

    #node-projects-designer-search-container {
      position:absolute;
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      justify-content: left;
      gap: 8px;
      width: auto;
      right: 10px;
      top: 0;
      background:rgb(242, 242, 242);
      padding: 5px 6px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
    
    #node-projects-designer-search-container > #node-projects-designer-search-bar {
      border: 1px solid black;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      background-color: white;
      padding: 1px 2px;
    }
    
    #node-projects-designer-search-container > div > input {
      height:20px;
      padding-left: 6px;
      font-size: 13px;
      border: none;
      outline: none;
    }
    
    #node-projects-designer-search-container > div > #node-projects-designer-search-start {
      height:22px;
      border: none;
      background-color: white;
      font-size: 13px;
    }
    
    #node-projects-designer-search-container > div > #node-projects-designer-search-start:hover {
      background-color: #D3D3D3;
      transition: 0.9s;
      border-radius: 2px;
    }
    
    #node-projects-designer-search-container > #node-projects-designer-search-close {
      position: relative;
      width: 20px;
      height: 20px;
      border: none;
      background-color: transparent;
    }
    
    #node-projects-designer-search-container > span {
      font-family:sans-serif;
      font-size: 12px;
    }
    
    #node-projects-designer-search-container > #node-projects-designer-search-close::before,
    #node-projects-designer-search-container > #node-projects-designer-search-close::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60%;
      background-color: black;
      height: 1px;
    }
    
    #node-projects-designer-search-container > #node-projects-designer-search-close::before {
      transform: translate(-50%, -50%) rotate(45deg);
    }
    
    #node-projects-designer-search-container > #node-projects-designer-search-close::after {
      transform: translate(-50%, -50%) rotate(-45deg);
    }
  `;

  static override readonly template = html`
    <div style="display: flex;flex-direction: column;width: 100%;height: 100%; margin: 0 !important; padding: 0 !important; border: none !important;">
      <div style="width: 100%;height: 100%; margin: 0 !important; padding: 0 !important; border: none !important;">
        <div id="node-projects-designer-canvas-outercanvas2" style="width:100%;height:100%;position:relative; margin: 0 !important; padding: 0 !important; border: none !important; isolation: isolate !important;">
          <div id="node-projects-designer-canvas-canvasContainer"
          style="width: 100%;height: 100%;position: absolute;top: 0;left: 0;user-select: none; margin: 0 !important; padding: 0 !important; border: none !important;">
          <div title="" id="node-projects-designer-canvas-canvas" part="canvas"></div>
        </div>
      </div>
      <div id="node-projects-designer-canvas-clickOverlay" title="" tabindex="0" style="pointer-events: auto;  margin: 0 !important; padding: 0 !important; border: none !important;"></div>
      </div>
      
      <div id="node-projects-designer-search-container" style="display: none;">
        <div id="node-projects-designer-search-bar">
          <input id="node-projects-designer-search-input">
          <button id="node-projects-designer-search-start">&darr;</button>
        </div>
        <span id="node-projects-designer-search-result">0 selected</span>
        <button id="node-projects-designer-search-close"></button>
      </div>
    </div>`;

  public extensionManager: IExtensionManager;
  private _pointerextensions: IDesignerPointerExtension[];

  private _lastCopiedPrimaryItem: IDesignItem;
  private _ignoreEvent: Event;

  private _useIframe = true;
  private _iframe: HTMLIFrameElement;
  private _window: Window;

  constructor(useIframe: boolean = false) {
    super();
    this._useIframe = useIframe;

    this._restoreCachedInititalValues();

    this._canvas = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-canvas');
    if (this._useIframe) {
      this._iframe = document.createElement('iframe');
      this._iframe.setAttribute("sandbox", "allow-same-origin");
      this._iframe.setAttribute("scrolling", "no");
      //TODO: add option to allow scripts in iframes...
      //this._iframe.setAttribute("sandbox", "allow-same-origin allow-scripts");
      this._canvas.appendChild(this._iframe);
      requestAnimationFrame(() => {
        this._window = this._iframe.contentWindow;
        this._canvasShadowRoot = this._iframe.contentWindow.document;
      })
    } else {
      this._window = window;
      this._canvasShadowRoot = this._canvas.attachShadow({ mode: 'open' });
    }

    this._canvasContainer = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-canvasContainer');
    this._outercanvas2 = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-outercanvas2');
    this.clickOverlay = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-clickOverlay');

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._pointerEventHandler = this._pointerEventHandler.bind(this);
    this._onWheel = this._onWheel.bind(this);

    this._getDomElement<HTMLElement>('node-projects-designer-search-close').onclick = () => this._searchHideOverlay();
    this._getDomElement<HTMLElement>('node-projects-designer-search-start').onclick = () => this._searchRun();
    this._getDomElement<HTMLElement>('node-projects-designer-search-container').onkeydown = (event) => {
      if (event.key === "Enter")
        this._searchRun();
    };
    this.clickOverlay.oncontextmenu = (e) => e.preventDefault();
  }

  get designerWidth(): string {
    return this._canvasContainer.style.width;
  }
  set designerWidth(value: string) {
    this._canvasContainer.style.width = value;
    this._zoomFactorChanged();
  }
  get designerHeight(): string {
    return this._canvasContainer.style.height;
  }

  set designerHeight(value: string) {
    this._canvasContainer.style.height = value;
    this._zoomFactorChanged();
  }

  getDesignSurfaceDimensions(): ISize {
    let ret: ISize = { width: null, height: null };
    const cs = getComputedStyle(this._canvasContainer);
    if (this._canvasContainer.style.width)
      ret.width = parseFloat(cs.width);
    if (this._canvasContainer.style.height)
      ret.height = parseFloat(cs.height);
    return ret;
  }

  get designerOffsetWidth(): number {
    return this._canvasContainer.offsetWidth;
  }
  get designerOffsetHeight(): number {
    return this._canvasContainer.offsetHeight;
  }

  set additionalStyles(value: CSSStyleSheet[]) {
    this._additionalStyle = value;
    this.applyAllStyles();
  }

  get additionalStyles(): CSSStyleSheet[] {
    return this._additionalStyle;
  }

  private applyAllStyles() {
    if (this._window) {
      let styles: CSSStyleSheet[] = []
      if (this._additionalStyle)
        styles.push(...this._additionalStyle);
      if (this.instanceServiceContainer.stylesheetService) {
        styles.push(...this.instanceServiceContainer.stylesheetService
          .getStylesheets()
          .map(x => stylesheetFromString(this._window, AbstractStylesheetService.patchStylesheetSelectorForDesigner(x.content))));
      }

      if (this._pauseAnimations) {
        styles.push(disableAnimationsSheet);
      }

      if (this._useIframe) {
        this._iframe.contentWindow.document.adoptedStyleSheets = styles;
      } else {
        this._canvasShadowRoot.adoptedStyleSheets = styles;
      }
    } else {
      requestAnimationFrame(() => this.applyAllStyles());
    }
  }

  ignoreEvent(event: Event) {
    this._ignoreEvent = event;
  }

  /* --- start IUiCommandHandler --- */

  canExecuteCommand(command: IUiCommand) {
    const modelCommandService = this.serviceContainer.modelCommandService;
    if (modelCommandService) {
      let handeled = modelCommandService.canExecuteCommand(this, command)
      if (handeled !== null)
        return handeled;
    }

    if (command.type === CommandType.undo) {
      return this.instanceServiceContainer.undoService.canUndo();
    }
    if (command.type === CommandType.redo) {
      return this.instanceServiceContainer.undoService.canRedo();
    }
    if (command.type === CommandType.setTool) {
      return this.serviceContainer.designerTools.has(command.parameter);
    }

    if (command.type === CommandType.paste) {
      return true;
    }
    if (command.type === CommandType.copy || command.type === CommandType.cut || command.type === CommandType.delete) {
      return this.instanceServiceContainer.selectionService.primarySelection != null && !this.instanceServiceContainer.selectionService.primarySelection.isRootItem;
    }

    return true;
  }

  async executeCommand(command: IUiCommand) {
    const modelCommandService = this.serviceContainer.modelCommandService;
    if (modelCommandService) {
      let handeled = await modelCommandService.executeCommand(this, command)
      if (handeled != null)
        return;
    }
    switch (command.type) {
      case CommandType.screenshot: {
        if (!Screenshot.screenshotsEnabled) {
          alert("you need to select current tab in next browser dialog, or screenshots will not work correctly");
        }
        if (!this.instanceServiceContainer.selectionService.primarySelection) {
          this.zoomToFit();
          this.disableBackgroud();
          try {
            const el = this.rootDesignItem.element;
            const sel = this.instanceServiceContainer.selectionService.selectedElements;
            this.instanceServiceContainer.selectionService.setSelectedElements(null);
            await sleep(100);
            const screenshot = await Screenshot.takeScreenshot(el, el.clientWidth, el.clientHeight);
            await exportData(dataURItoBlob(screenshot), "screenshot.png");
            this.instanceServiceContainer.selectionService.setSelectedElements(sel);
          } catch (err) {
            console.error(err);
          }
          this.enableBackground();
        }
        else {
          this.disableBackgroud();
          try {
            const el = this.instanceServiceContainer.selectionService.primarySelection.element;
            const sel = this.instanceServiceContainer.selectionService.selectedElements;
            this.instanceServiceContainer.selectionService.setSelectedElements(null);
            await sleep(100);
            const screenshot = await Screenshot.takeScreenshot(el, el.clientWidth, el.clientHeight);
            await exportData(dataURItoBlob(screenshot), "screenshot.png");
            this.instanceServiceContainer.selectionService.setSelectedElements(sel);
          } catch (err) {
            console.error(err);
          }
          this.enableBackground();
        }
      }
        break;
      case CommandType.setTool: {
        this.serviceContainer.globalContext.tool = <ITool>this.serviceContainer.designerTools.get(command.parameter);
      }
        break;
      case CommandType.setStrokeColor: {
        this.serviceContainer.globalContext.strokeColor = command.parameter;
      }
        break;
      case CommandType.setFillBrush: {
        this.serviceContainer.globalContext.fillBrush = command.parameter;
      }
        break;
      case CommandType.setStrokeThickness: {
        this.serviceContainer.globalContext.strokeThickness = command.parameter;
      }
        break;
      case CommandType.delete:
        this.handleDeleteCommand();
        break;
      case CommandType.undo:
        this.instanceServiceContainer.undoService.undo();
        break;
      case CommandType.holdUndo:
        let undoEntries = this.instanceServiceContainer.undoService.getUndoEntryNames(20);
        let undoMnu: IContextMenuItem[] = Array.from(undoEntries).map((x, idx) => ({ title: 'undo: ' + x, action: () => { for (let i = 0; i <= idx; i++) this.instanceServiceContainer.undoService.undo() } }));
        if (undoMnu.length > 0)
          ContextMenu.show(undoMnu, <MouseEvent>command.event, { mode: 'undo' });
        break;
      case CommandType.redo:
        this.instanceServiceContainer.undoService.redo();
        break;
      case CommandType.holdRedo:
        let redoEntries = this.instanceServiceContainer.undoService.getRedoEntryNames(20);
        let redoMnu: IContextMenuItem[] = Array.from(redoEntries).map((x, idx) => ({ title: 'redo: ' + x, action: () => { for (let i = 0; i <= idx; i++) this.instanceServiceContainer.undoService.redo() } }));
        if (redoMnu.length > 0)
          ContextMenu.show(redoMnu, <MouseEvent>command.event, { mode: 'undo' });
        break;
      case CommandType.copy:
        this.handleCopyCommand();
        break;
      case CommandType.cut:
        this.handleCopyCommand();
        this.handleDeleteCommand();
        break;
      case CommandType.paste:
        this.handlePasteCommand(command.altKey == true);
        break;
      case CommandType.selectAll:
        this.handleSelectAll();
        break;
    }
  }

  public disableBackgroud() {
    this._canvasContainer.style.background = 'var(--node-projects-web-component-designer-screenshot-background, white)';
  }

  public enableBackground() {
    this._canvasContainer.style.background = '';
  }

  public zoomToFit() {
    const autoZomOffset = 10;
    let maxX = 0, maxY = 0, minX = 0, minY = 0;

    this.canvasOffset = { x: 0, y: 0 };
    this.zoomFactor = 1;

    for (let n of this.rootDesignItem.querySelectorAll('*')) {
      if (n instanceof (n.ownerDocument.defaultView ?? window).Element) {
        const rect = n.getBoundingClientRect();
        minX = minX < rect.x ? minX : rect.x;
        minY = minY < rect.y ? minY : rect.y;
        maxX = maxX > rect.x + rect.width + autoZomOffset ? maxX : rect.x + rect.width + autoZomOffset;
        maxY = maxY > rect.y + rect.height + autoZomOffset ? maxY : rect.y + rect.height + autoZomOffset;
      }
    }

    const cvRect = this.getBoundingClientRect();
    maxX -= cvRect.x;
    maxY -= cvRect.y;

    let scaleX = cvRect.width / (maxX / this.zoomFactor);
    let scaleY = cvRect.height / (maxY / this.zoomFactor);

    const dimensions = this.getDesignSurfaceDimensions();
    if (dimensions.width)
      scaleX = cvRect.width / dimensions.width;
    if (dimensions.height)
      scaleY = cvRect.height / dimensions.height;

    let fak = scaleX < scaleY ? scaleX : scaleY;
    if (!isNaN(fak))
      this.zoomFactor = fak;
    //this._zoomInput.value = Math.round(this.zoomFactor * 100) + '%';
  }

  /* --- end IUiCommandHandler --- */

  handleSelectAll() {
    const selection = Array.from(this.rootDesignItem.children(true));
    const primary = this.instanceServiceContainer.selectionService.primarySelection;
    if (primary) {
      const idx = selection.indexOf(primary);
      if (idx >= 0) {
        selection.splice(idx, 1);
        selection.unshift(primary);
      }
    }
    this.instanceServiceContainer.selectionService.setSelectedElements(selection);
  }

  async handleCopyCommand() {
    this._currentPasteOffset = this.pasteOffset;
    this._lastCopiedPrimaryItem = this.instanceServiceContainer.selectionService.primarySelection;
    await this.serviceContainer.copyPasteService.copyItems(this.instanceServiceContainer.selectionService.selectedElements);
  }

  async handlePasteCommand(disableRestoreOfPositions: boolean) {
    const [designItems, positions] = await this.serviceContainer.copyPasteService.getPasteItems(this.serviceContainer, this.instanceServiceContainer);

    let grp = this.rootDesignItem.openGroup("Insert");
    let lastCopiedPrimaryItemBackup = this._lastCopiedPrimaryItem;
    let nextPasteOffset = this._currentPasteOffset + this.pasteOffset;
    let pasteContainer = this.rootDesignItem;
    let pCon = lastCopiedPrimaryItemBackup?.parent ?? this.instanceServiceContainer.selectionService.primarySelection;
    while (pCon != null) {
      const containerStyle = getComputedStyle(pCon.element);
      let newContainerService: IPlacementService;
      newContainerService = this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(pCon, containerStyle));
      if (newContainerService) {
        if (newContainerService.canEnter(pCon, designItems)) {
          pasteContainer = pCon;
          break;
        } else {
          pCon = pCon.parent;
          continue;
        }
      }
    }

    if (designItems) {
      let containerPos = this.getNormalizedElementCoordinates(pasteContainer.element);
      for (let i = 0; i < designItems.length; i++) {
        let di = designItems[i];
        let pos = positions ? positions[i] : null;
        this.instanceServiceContainer.undoService.execute(new InsertAction(pasteContainer, pasteContainer.childCount, di));
        if (!disableRestoreOfPositions && pos && di.nodeType == NodeType.Element) {
          di.setStyle('left', (pos.x - containerPos.x + this._currentPasteOffset) + 'px');
          di.setStyle('top', (pos.y - containerPos.y + this._currentPasteOffset) + 'px');
        }
      }

      const intializationService = this.serviceContainer.intializationService;
      if (intializationService) {
        for (let di of designItems)
          intializationService.init(di);
      }
      this.instanceServiceContainer.selectionService.setSelectedElements(designItems);
    }
    grp.commit();

    this.snapLines.clearSnaplines();
    this._lastCopiedPrimaryItem = lastCopiedPrimaryItemBackup;
    this._currentPasteOffset = nextPasteOffset;
  }

  handleDeleteCommand() {
    let items = this.instanceServiceContainer.selectionService.selectedElements;
    this.instanceServiceContainer.undoService.execute(new DeleteAction(items));
    this.instanceServiceContainer.selectionService.setSelectedElements(null);
  }

  initialize(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;

    this.instanceServiceContainer = new InstanceServiceContainer(this);
    const undoService = this.serviceContainer.getLastService('undoService')
    if (undoService)
      this.instanceServiceContainer.register("undoService", undoService(this));
    const selectionService = this.serviceContainer.getLastService('selectionService')
    if (selectionService) {
      this.instanceServiceContainer.register("selectionService", selectionService(this));
      this.instanceServiceContainer.selectionService.onSelectionChanged.on(() => {
        this._lastCopiedPrimaryItem = null;
        this._currentPasteOffset = this.pasteOffset;
      });
    }
    const designItemDocumentPositionService = this.serviceContainer.getLastService('designItemDocumentPositionService')
    if (designItemDocumentPositionService) {
      this.instanceServiceContainer.register("designItemDocumentPositionService", designItemDocumentPositionService(this));
    }
    if (this._useIframe) {
      this.rootDesignItem = DesignItem.GetOrCreateDesignItem(this._iframe, this._iframe, this.serviceContainer, this.instanceServiceContainer);
      requestAnimationFrame(() => {
        this.rootDesignItem.updateChildrenFromNodesChildren();
      });
    } else {
      this.rootDesignItem = DesignItem.GetOrCreateDesignItem(this._canvas, this._canvas, this.serviceContainer, this.instanceServiceContainer);
    }
    const contentService = this.serviceContainer.getLastService('contentService')
    if (contentService) {
      this.instanceServiceContainer.register("contentService", contentService(this));
    }

    const stylesheetService = this.serviceContainer.getLastService('stylesheetService')
    if (stylesheetService) {
      const instance = stylesheetService(this);
      this.instanceServiceContainer.register("stylesheetService", instance);
      this.instanceServiceContainer.stylesheetService.stylesheetChanged.on((ss) => {
        if (ss.changeSource != 'undo') {
          const ssca = new StylesheetChangedAction(this.instanceServiceContainer.stylesheetService, ss.name, ss.newStyle, ss.oldStyle);
          this.instanceServiceContainer.undoService.execute(ssca);
          this.applyAllStyles();
        } else {
          this.applyAllStyles();
        }
      });
      this.instanceServiceContainer.stylesheetService.stylesheetsChanged.on(() => {
        this.applyAllStyles();
      });
    }

    this.extensionManager = new ExtensionManager(this);
    this.overlayLayer = new OverlayLayerView(serviceContainer);
    this.overlayLayer.style.pointerEvents = 'none';
    this.overlayLayer.style.setProperty('margin', '0', 'important');
    this.overlayLayer.style.setProperty('padding', '0', 'important');
    this.overlayLayer.style.setProperty('border', 'none', 'important');
    this.clickOverlay.appendChild(this.overlayLayer);
    this.snapLines = new Snaplines(this.overlayLayer);
    this.snapLines.initialize(this.rootDesignItem);

    if (this.serviceContainer.designerPointerExtensions)
      for (let pe of this.serviceContainer.designerPointerExtensions) {
        if (!this._pointerextensions)
          this._pointerextensions = [];
        this._pointerextensions.push(pe.getExtension(this));
      }

    if (this.children) {
      let children = this.children;
      if (this.children.length == 1 && this.children[0] instanceof HTMLSlotElement) {
        children = <any>this.children[0].assignedElements();
      }
      const parser = this.serviceContainer.getLastServiceWhere('htmlParserService', x => x.constructor == DefaultHtmlParserService) as DefaultHtmlParserService;
      this.addDesignItems(parser.createDesignItems(children, this.serviceContainer, this.instanceServiceContainer));
    }

    if (!this.serviceContainer.options.zoomDesignerBackground) {
      requestAnimationFrame(() => {
        this._resizeBackgroundGrid();
      });
    }

    if (this.isConnected)
      this.extensionManager.connected();
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._firstConnect = true;
      this._touchGestureHelper = TouchGestureHelper.addTouchEvents(this.clickOverlay);
      this.clickOverlay.addEventListener(EventNames.PointerDown, this._pointerEventHandler);
      this.clickOverlay.addEventListener(EventNames.PointerMove, this._pointerEventHandler);
      this.clickOverlay.addEventListener(EventNames.PointerUp, this._pointerEventHandler);
      this.clickOverlay.addEventListener(EventNames.DragEnter, event => this._onDragEnter(event));
      this.clickOverlay.addEventListener(EventNames.DragLeave, event => this._onDragLeave(event));
      this.clickOverlay.addEventListener(EventNames.DragOver, event => this._onDragOver(event));
      this.clickOverlay.addEventListener(EventNames.Drop, event => this._onDrop(event));
      this.clickOverlay.addEventListener(EventNames.KeyDown, this.onKeyDown);
      this.clickOverlay.addEventListener(EventNames.KeyUp, this.onKeyUp);
      this.clickOverlay.addEventListener(EventNames.DblClick, this._onDblClick, true);
      this.clickOverlay.addEventListener(EventNames.Wheel, this._onWheel);
      this.clickOverlay.addEventListener('zoom', (e: CustomEvent) => {
        this.zoomFactor = this.zoomFactor + (e.detail.diff / 10);
      });
      this.clickOverlay.addEventListener('pan', (e: CustomEvent) => {
        const newCanvasOffset = {
          x: (this.canvasOffset.x) - e.detail.deltaX,
          y: (this.canvasOffset.y) - e.detail.deltaY
        }
        this.canvasOffset = newCanvasOffset
      });
    }
    if (this.extensionManager)
      this.extensionManager.connected();
  }

  disconnectedCallback() {
    this.extensionManager.disconnected();
  }

  private _zoomFactorChanged() {
    this._canvasContainer.style.bottom = this._outercanvas2.offsetHeight >= this._canvasContainer.offsetHeight ? '0' : '';
    this._canvasContainer.style.right = this._outercanvas2.offsetWidth >= this._canvasContainer.offsetWidth ? '0' : '';
    this._updateTransform();
    this.fillCalculationrects();
    this.onZoomFactorChanged.emit(this._zoomFactor);
    if (!this.serviceContainer.options.zoomDesignerBackground)
      this._resizeBackgroundGrid();
  }

  private _resizeBackgroundGrid() {
    const backgroundGridSize = 10;
    const backgroundGridFactor = backgroundGridSize * 100 * 2;
    let canvasWidth = this.canvas.getBoundingClientRect().width;
    let backgroundGridZoom = backgroundGridFactor / canvasWidth;
    this.canvas.style.backgroundSize = backgroundGridZoom.toString() + '%';
  }

  private _updateTransform() {
    this._scaleFactor = this._zoomFactor;
    if (this._useIframe) {
      let offX = this._canvasOffset.x;
      let offY = this._canvasOffset.y;
      this._iframe.contentWindow.scrollTo(offX * -1, offY * -1);
      offX += this._iframe.contentWindow.scrollX;
      offY += this._iframe.contentWindow.scrollY;
      this._canvasContainer.style.transform = 'scale(' + this._zoomFactor + ') translate(' + offX + 'px, ' + offY + 'px)'

    } else {
      this._canvasContainer.style.transform = 'scale(' + this._zoomFactor + ') translate(' + (isNaN(this._canvasOffset.x) ? '0' : this._canvasOffset.x) + 'px, ' + (isNaN(this._canvasOffset.y) ? '0' : this._canvasOffset.y) + 'px)';
    }
    this._canvasContainer.style.transformOrigin = '0 0';
    this.overlayLayer.style.transform = this._canvasContainer.style.transform;
    this.overlayLayer.style.transformOrigin = '0 0';
    this.snapLines.clearSnaplines();
  }

  public setDesignItems(designItems: IDesignItem[]) {
    this.instanceServiceContainer.undoService.clearTransactionstackIfNotEmpty();
    const setItemsAction = new SetDesignItemsAction(designItems, [...this.rootDesignItem.children()]);
    this.instanceServiceContainer.undoService.execute(setItemsAction);
  }

  public _internalSetDesignItems(designItems: IDesignItem[]) {
    this.fillCalculationrects();
    this.overlayLayer.removeAllOverlays();
    DomHelper.removeAllChildnodes(this.overlayLayer);
    for (let i of [...this.rootDesignItem.children()])
      this.rootDesignItem._removeChildInternal(i);
    this.addDesignItems(designItems);

    this.lazyTriggerReparseDocumentStylesheets();

    this.instanceServiceContainer.contentService.onContentChanged.emit({ changeType: 'parsed' });
    (<SelectionService>this.instanceServiceContainer.selectionService)._withoutUndoSetSelectedElements(null);
    setTimeout(() => this.extensionManager.refreshAllAppliedExtentions(), 50);
  }

  reparseTimeout: NodeJS.Timeout | null;
  public lazyTriggerReparseDocumentStylesheets() {
    if (this.reparseTimeout) {
      clearTimeout(this.reparseTimeout);
    }
    this.reparseTimeout = setTimeout(async () => {
      await this.reparseDocumentStylesheets();
      clearTimeout(this.reparseTimeout);
    }, 20);
  }

  private async reparseDocumentStylesheets() {
    if (this.instanceServiceContainer.stylesheetService) {
      const styleElements = this.rootDesignItem.querySelectorAll('style');
      let i = 1;
      const intStyleSheets: IDocumentStylesheet[] = [...styleElements].map(x => ({ name: '&lt;style&gt; #' + (x.id ? x.id + '(' + i++ + ')' : i++), content: DesignItem.GetDesignItem(x).content, designItem: DesignItem.GetDesignItem(x) }));
      await this.instanceServiceContainer.stylesheetService.setDocumentStylesheets(intStyleSheets);
    }
  }

  public addDesignItems(designItems: IDesignItem[]) {
    if (designItems) {
      for (let di of designItems) {
        this.rootDesignItem._insertChildInternal(di);
      }
    }

    const intializationService = this.serviceContainer.intializationService;
    if (intializationService) {
      for (let di of designItems)
        intializationService.init(di);
    }

    this.snapLines.clearSnaplines();
  }

  private _onDragEnter(event: DragEvent) {
    this.fillCalculationrects();
    event.preventDefault();

    const hasTransferDataBindingObject = event.dataTransfer.types.indexOf(dragDropFormatNameBindingObject) >= 0;
    if (hasTransferDataBindingObject) {
      const ddService = this.serviceContainer.bindableObjectDragDropService;
      if (ddService) {
        const el = this.getElementAtPoint({ x: event.x, y: event.y });
        if (this._lastDdElement != el) {
          ddService.dragLeave(this, event, this._lastDdElement);
          ddService.dragEnter(this, event, el);
          this._lastDdElement = el;
        }
      } else {
        this._lastDdElement = null;
      }
    } else {
      this._lastDdElement = null;

      const dragDropService = this.serviceContainer.dragDropService;
      if (dragDropService) {
        dragDropService.dragEnter(this, event);
      }
    }
  }

  private _onDragLeave(event: DragEvent) {
    this.fillCalculationrects();
    event.preventDefault();
    this._canvas.classList.remove('dragFileActive');

    const dragDropService = this.serviceContainer.dragDropService;
    if (dragDropService) {
      dragDropService.dragLeave(this, event);
    }
  }

  private _lastDdElement = null;
  private _onDragOver(event: DragEvent) {
    event.preventDefault();

    this.fillCalculationrects();

    if (event.dataTransfer.types.length > 0 && event.dataTransfer.types[0] == 'Files') {
      const ddService = this.serviceContainer.externalDragDropService;
      if (ddService) {
        const effect = ddService.dragOver(event);
        event.dataTransfer.dropEffect = effect;
        if (effect !== 'none')
          this._canvas.classList.add('dragFileActive');
      }
    } else {
      const hasTransferDataBindingObject = event.dataTransfer.types.indexOf(dragDropFormatNameBindingObject) >= 0;
      if (hasTransferDataBindingObject) {
        const bindableDdService = this.serviceContainer.bindableObjectDragDropService;
        if (bindableDdService) {
          const el = this.getElementAtPoint({ x: event.x, y: event.y });
          if (this._lastDdElement != el) {
            bindableDdService.dragLeave(this, event, this._lastDdElement);
            bindableDdService.dragEnter(this, event, el);
            this._lastDdElement = el;
          }
          const effect = bindableDdService.dragOver(this, event, el);
          event.dataTransfer.dropEffect = effect;
        }
      } else {
        const dragDropService = this.serviceContainer.dragDropService;
        if (dragDropService) {
          dragDropService.dragOver(this, event);
        }
      }
    }
  }


  private async _onDrop(event: DragEvent) {
    this.serviceContainer.globalContext.tool = <ITool>this.serviceContainer.designerTools.get(NamedTools.Pointer);
    this._lastDdElement = null;
    event.preventDefault();
    this._canvas.classList.remove('dragFileActive');

    this.fillCalculationrects();

    if (event.dataTransfer.files?.length > 0) {
      const ddService = this.serviceContainer.externalDragDropService;
      if (ddService) {
        ddService.drop(this, event);
      }
    }
    else {
      const transferDataBindingObject = event.dataTransfer.getData(dragDropFormatNameBindingObject)
      if (transferDataBindingObject) {
        const bo = JSON.parse(transferDataBindingObject);
        const ddService = this.serviceContainer.bindableObjectDragDropService;
        if (ddService) {
          const el = this.getElementAtPoint({ x: event.x, y: event.y });
          ddService.drop(this, event, bo, el);
        }
      }
      else {
        const dragDropService = this.serviceContainer.dragDropService;
        if (dragDropService) {
          this.fillCalculationrects();
          dragDropService.drop(this, event);
        }
      }
    }
  }

  public showDesignItemContextMenu(designItem: IDesignItem, event: MouseEvent) {
    const mnuItems: IContextMenuItem[] = [];
    for (let cme of this.serviceContainer.designerContextMenuExtensions) {
      if (cme.shouldProvideContextmenu(event, this, designItem, 'designer')) {
        mnuItems.push(...cme.provideContextMenuItems(event, this, designItem, 'designer'));
      }
    }
    let ctxMenu = new ContextMenu(mnuItems, null)
    ctxMenu.display(event);

    return ctxMenu;
  }

  private _onDblClick(event: MouseEvent) {
    event.preventDefault();
    if (event.target === this.overlayLayer)
      return;
    if (event.altKey)
      return;
    if (this.serviceContainer.globalContext.tool == null || this.serviceContainer.globalContext.tool === this.serviceContainer.designerTools.get(NamedTools.Pointer)) {
      this.extensionManager.removeExtension(this.instanceServiceContainer.selectionService.primarySelection, ExtensionType.PrimarySelectionRefreshed);
      this.extensionManager.applyExtension(this.instanceServiceContainer.selectionService.primarySelection, ExtensionType.Doubleclick, event);
    }
  }

  private _searchShowOverlay() {
    let divElement = this._getDomElement('node-projects-designer-search-container') as HTMLDivElement;
    divElement.style.display = '';
    this._getDomElement<HTMLInputElement>('node-projects-designer-search-input').focus();
  }
  private _searchHideOverlay() {
    let divElement = this._getDomElement('node-projects-designer-search-container') as HTMLDivElement;
    divElement.style.display = 'none';
  }

  private _searchRun() {
    let input = this._getDomElement<HTMLInputElement>('node-projects-designer-search-input');
    this._getDomElement<HTMLSpanElement>('node-projects-designer-search-result').innerHTML = "0 selected";
    if (input.value != "") {
      let selectedElements = this._canvasShadowRoot.querySelectorAll(input.value);
      let designItems = [];
      for (let i = 0; i <= selectedElements.length; i++) {
        if (this._canvasShadowRoot.contains(selectedElements[i]))
          designItems.push(DesignItem.GetDesignItem(selectedElements[i]));
      }
      if (designItems.length > 0) {
        this.instanceServiceContainer.selectionService.setSelectedElements(designItems);
        this._getDomElement<HTMLSpanElement>('node-projects-designer-search-result').innerHTML = designItems.length.toString() + " selected";
      }
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    if (this._ignoreEvent === event)
      return;

    if (this._moveGroup) {
      this._moveGroup.commit()
      this._moveGroup = null;
    }

    event.preventDefault();
  }

  private onKeyDown(event: KeyboardEvent) {
    if (this._ignoreEvent === event)
      return;

    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey)
      this.executeCommand({ type: CommandType.undo, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey)
      this.executeCommand({ type: CommandType.redo, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'y')
      this.executeCommand({ type: CommandType.redo, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'a')
      this.executeCommand({ type: CommandType.selectAll, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'c')
      this.executeCommand({ type: CommandType.copy, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'v')
      this.executeCommand({ type: CommandType.paste, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'x')
      this.executeCommand({ type: CommandType.cut, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'f')
      this._searchShowOverlay();
    else {
      let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
      if (!primarySelection) {
        return;
      }

      let moveOffset = 1;
      if (event.shiftKey)
        moveOffset = 10;
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          this.executeCommand({ type: CommandType.delete, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey });
          break;
        case 'ArrowDown':
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'ArrowRight':
          {
            if (!this._moveGroup)
              this._moveGroup = this.rootDesignItem.openGroup("move items");

            let offset = { x: 0, y: 0 };
            if (event.key == 'ArrowDown')
              offset.y = -moveOffset;
            if (event.key == 'ArrowUp')
              offset.y = moveOffset;
            if (event.key == 'ArrowRight')
              offset.x = -moveOffset;
            if (event.key == 'ArrowLeft')
              offset.x = moveOffset;

            for (let x of filterChildPlaceItems(this.instanceServiceContainer.selectionService.selectedElements)) {
              const containerStyle = getComputedStyle(x.parent.element);
              x.serviceContainer.getLastServiceWhere('containerService', y => y.serviceForContainer(x.parent, containerStyle)).moveElements([x], offset, false);
            };
          }
          break;
      }
    }

    event.preventDefault();
  }

  /**
   * Converts the Event x/y coordinates, to the mouse position on the canvas
   */
  public getNormalizedEventCoordinates(event: MouseEvent): IPoint {
    const offsetOfOuterX = (event.clientX - this.outerRect.x) / this.zoomFactor;
    const offsetOfCanvasX = this.containerBoundingRect.x - this.outerRect.x;

    const offsetOfOuterY = (event.clientY - this.outerRect.y) / this.zoomFactor;
    const offsetOfCanvasY = this.containerBoundingRect.y - this.outerRect.y;

    return {
      x: offsetOfOuterX - offsetOfCanvasX / this.zoomFactor,
      y: offsetOfOuterY - offsetOfCanvasY / this.zoomFactor
    };
  }

  /**
   * Converts the Event x/y coordinates, to the mouse position in the viewport
   */
  public getViewportCoordinates(event: MouseEvent): IPoint {
    return {
      x: (event.clientX - this.outerRect.x),
      y: (event.clientY - this.outerRect.y)
    };
  }

  public getNormalizedTextNodeCoordinates(element: Text, ignoreScalefactor?: boolean): IRect {
    let range = document.createRange();
    range.selectNodeContents(element);
    let targetRect = range.getBoundingClientRect();
    const offset = this.containerOffset;
    return { x: offset.x + (targetRect.x - this.containerBoundingRect.x) / (ignoreScalefactor ? 1 : this.scaleFactor), y: offset.y + (targetRect.y - this.containerBoundingRect.y) / (ignoreScalefactor ? 1 : this.scaleFactor), width: targetRect.width / (ignoreScalefactor ? 1 : this.scaleFactor), height: targetRect.height / (ignoreScalefactor ? 1 : this.scaleFactor) };
  }

  public getNormalizedElementCoordinates(element: Element, ignoreScalefactor?: boolean): IRect {
    if (element.nodeType == NodeType.TextNode) {
      return this.getNormalizedTextNodeCoordinates(<Text><any>element, ignoreScalefactor)
    }
    const targetRect = element.getBoundingClientRect();
    const offset = this.containerOffset;
    return { x: offset.x + (targetRect.x - this.containerBoundingRect.x) / (ignoreScalefactor ? 1 : this.scaleFactor), y: offset.y + (targetRect.y - this.containerBoundingRect.y) / (ignoreScalefactor ? 1 : this.scaleFactor), width: targetRect.width / (ignoreScalefactor ? 1 : this.scaleFactor), height: targetRect.height / (ignoreScalefactor ? 1 : this.scaleFactor) };
  }

  public getNormalizedElementCoordinatesAndRealSizes(element: Element): IRect & { realWidth: number, realHeight: number } {
    let ret = this.getNormalizedElementCoordinates(element);
    const st = getComputedStyle(element);
    let realWidth = ret.width;
    let realHeight = ret.height;
    if (st.boxSizing != 'border-box') {
      realWidth = realWidth - (parseFloat(st.borderLeft) + parseFloat(st.paddingLeft) + parseFloat(st.paddingRight) + parseFloat(st.borderRight));
      realHeight = realHeight - (parseFloat(st.borderTop) + parseFloat(st.paddingTop) + parseFloat(st.paddingBottom) + parseFloat(st.borderBottom));
    }
    return { ...ret, realWidth, realHeight };
  }

  public getNormalizedOffsetInElement(event: MouseEvent, element: Element): IPoint {
    const normEvt = this.getNormalizedEventCoordinates(event);
    const normEl = this.getNormalizedElementCoordinates(element);
    return { x: normEvt.x - normEl.x, y: normEvt.y - normEl.y };
  }

  private transformPoint(point: IPoint) {
    if (this._useIframe) {
      const rect = this._canvasContainer.getBoundingClientRect();
      return { x: point.x - rect.x, y: point.y - rect.y };
    }
    return point;
  }

  public elementsFromPoint(x: number, y: number): Element[] {
    let retVal: Element[] = [];
    const t = this.transformPoint({ x, y });
    const elements = this._canvasShadowRoot.elementsFromPoint(t.x, t.y);
    for (let e of elements) {
      if (e.getRootNode() !== this._canvasShadowRoot)
        continue;
      retVal.push(e);
    }
    return retVal;
  }

  public getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean) {
    const t = this.transformPoint(point);
    const elements = this._canvasShadowRoot.elementsFromPoint(t.x, t.y);
    let currentElement: HTMLElement = null;

    for (let i = 0; i < elements.length; i++) {
      currentElement = <HTMLElement>elements[i];
      if (ignoreElementCallback && ignoreElementCallback(currentElement)) {
        currentElement = null;
        continue;
      }
      if (currentElement.getRootNode() !== this._canvasShadowRoot) {
        currentElement = null;
        continue;
      }
      if (!this.instanceServiceContainer.designContext.extensionOptions.selectUnhitableElements && DesignItem.GetDesignItem(currentElement).getStyleFromSheetOrLocal('pointer-events') == 'none') {
        currentElement = null;
        continue;
      }
      break;
    }

    return currentElement;
  }

  private _hoverElement: Element;
  public showHoverExtension(element: Element, event: Event) {
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(element, element, this.serviceContainer, this.instanceServiceContainer);
    if (this._lastHoverDesignItem != currentDesignItem) {
      if (this._lastHoverDesignItem)
        this.extensionManager.removeExtension(this._lastHoverDesignItem, ExtensionType.MouseOver);
      if (currentDesignItem && currentDesignItem != this.rootDesignItem && (!element.parentNode || DomHelper.getHost(element.parentNode) !== this.overlayLayer))
        this.extensionManager.applyExtension(currentDesignItem, ExtensionType.MouseOver, event);
      this._lastHoverDesignItem = currentDesignItem;
    }

    if (this.instanceServiceContainer.designContext.extensionOptions.simulateHoverOnHover && this._hoverElement !== element) {
      let el = this._hoverElement;
      while (el && el !== this._canvas) {
        el.removeAttribute(forceHoverAttributeName);
        el = el.parentElement;
      }
      this._hoverElement = null;
      if (element) {
        if (element.nodeType == NodeType.TextNode)
          element = element.parentElement;
        el = element;
        while (el && el !== this._canvas) {
          el.setAttribute(forceHoverAttributeName, '');
          el = el.parentElement;
        }
        this._hoverElement = element;
      }
    }
  }

  private _onWheel(event: WheelEvent) {
    let el = this.getElementAtPoint({ x: event.clientX, y: event.clientY });
    while (el) {
      const cs = getComputedStyle(el);
      if (cs.overflowY === 'scroll' || cs.overflowY === 'auto') {
        const target = el;
        if (target.scrollBy)
          target.scrollBy(event.deltaX, event.deltaY);
        else {
          target.scrollLeft += event.deltaX;
          target.scrollTop += event.deltaY;
        }

        event.stopPropagation();
        break;
      }
      el = el.parentElement;
    }
  }

  private _pointerEventHandler(event: PointerEvent, forceElement: Node = null) {
    if (this._ignoreEvent === event)
      return;

    if (!this.serviceContainer)
      return;

    if (this._touchGestureHelper.multitouchEventActive)
      return;

    this.fillCalculationrects();

    if (this._pointerextensions) {
      for (let pe of this._pointerextensions)
        pe.refresh(event);
    }

    let currentElement: Node;
    if (forceElement)
      currentElement = forceElement;
    else {
      currentElement = this.serviceContainer.elementAtPointService.getElementAtPoint(this, { x: event.x, y: event.y });
      if (!currentElement) {
        currentElement = this._canvas;
      } else if (this._enableSelectTextNodesOnClick) {
        const norm = this.getNormalizedEventCoordinates(event);
        for (let n of currentElement.childNodes) {
          if (n.nodeType == NodeType.TextNode) {
            let nc = this.getNormalizedElementCoordinates(<Element>n);
            if (nc.x <= norm.x && nc.x + nc.width >= norm.x && nc.y <= norm.y && nc.y + nc.height >= norm.y) {
              currentElement = n;
              break;
            }
          }
        }
      }
    }

    if (this._activeTool) {
      this._activeTool.pointerEventHandler(this, event, <Element>currentElement);
      return;
    }

    this.clickOverlay.style.cursor = this._canvas.style.cursor;

    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, currentElement, this.serviceContainer, this.instanceServiceContainer);
    this.showHoverExtension(currentDesignItem.element, event);

    //TODO: needed ??
    if (currentElement && DomHelper.getHost(currentElement.parentNode) === this.overlayLayer) {
      currentElement = this.instanceServiceContainer.selectionService.primarySelection?.element ?? this._canvas;
    }

    let tool = this.serviceContainer.globalContext.tool ?? <ITool>this.serviceContainer.designerTools.get(NamedTools.Pointer);

    tool.pointerEventHandler(this, event, <Element>currentElement);
    this._canvas.style.cursor = tool.cursor;
  }

  public captureActiveTool(tool: ITool) {
    this._activeTool = tool;
  }

  public releaseActiveTool() {
    this._activeTool = null;
  }

  public fillCalculationrects() {
    this.containerBoundingRect = this._canvasContainer.getBoundingClientRect();
    this.outerRect = this._outercanvas2.getBoundingClientRect();
  }

  public removeOverlay(element: SVGGraphicsElement) {
    this.overlayLayer.removeOverlay(element);
  }

  public zoomOntoRectangle(startPoint: IPoint, endPoint: IPoint) {
    let rect: IRect = {
      x: startPoint.x < endPoint.x ? startPoint.x : endPoint.x,
      y: startPoint.y < endPoint.y ? startPoint.y : endPoint.y,
      width: Math.abs(startPoint.x - endPoint.x),
      height: Math.abs(startPoint.y - endPoint.y),
    }

    let zFactorWidth = this.outerRect.width / rect.width;
    let zFactorHeight = this.outerRect.height / rect.height;

    let zoomFactor = zFactorWidth >= zFactorHeight ? zFactorHeight : zFactorWidth;

    let rectCenter: IPoint = {
      x: (rect.width / 2) + rect.x,
      y: (rect.height / 2) + rect.y
    }

    this.zoomPoint(rectCenter, zoomFactor);
  }

  public zoomPoint(canvasPoint: IPoint, newZoom: number) {
    this.zoomFactor = newZoom;

    const newCanvasOffset = {
      x: -(canvasPoint.x) + this.outerRect.width / this.zoomFactor / 2,
      y: -(canvasPoint.y) + this.outerRect.height / this.zoomFactor / 2
    }

    this.canvasOffset = newCanvasOffset;
  }

  private zoomConvertEventToViewPortCoordinates(point: IPoint): IPoint {
    const offsetOfCanvasX = this.containerBoundingRect.x - this.outerRect.x;
    const offsetOfCanvasY = this.containerBoundingRect.y - this.outerRect.y;

    return {
      x: (point.x + offsetOfCanvasX / this.zoomFactor) * this.zoomFactor,
      y: (point.y + offsetOfCanvasY / this.zoomFactor) * this.zoomFactor
    };
  }

  public zoomTowardsPoint(canvasPoint: IPoint, newZoom: number) {
    const scaleChange = newZoom / this.zoomFactor;

    const point = this.zoomConvertEventToViewPortCoordinates(canvasPoint);

    const newCanvasOffset = {
      x: -(point.x * (scaleChange - 1) + scaleChange * -this.canvasOffsetUnzoomed.x),
      y: -(point.y * (scaleChange - 1) + scaleChange * -this.canvasOffsetUnzoomed.y)
    }

    this.zoomFactor = newZoom;
    this.canvasOffsetUnzoomed = newCanvasOffset;
  }
}

customElements.define('node-projects-designer-canvas', DesignerCanvas);