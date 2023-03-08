import { EventNames } from '../../../enums/EventNames.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { IElementDefinition } from '../../services/elementsService/IElementDefinition.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { SelectionService } from '../../services/selectionService/SelectionService.js';
import { DesignItem } from '../../item/DesignItem.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { BaseCustomWebComponentLazyAppend, css, html, TypedEvent, cssFromString } from '@node-projects/base-custom-webcomponent';
import { dragDropFormatNameElementDefinition, dragDropFormatNameBindingObject } from '../../../Constants.js';
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
import { OverlayLayer } from './extensions/OverlayLayer.js';
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
import { AbstractStylesheetService } from '../../services/stylesheetService/AbstractStylesheetService.js';

export class DesignerCanvas extends BaseCustomWebComponentLazyAppend implements IDesignerCanvas, IPlacementView, IUiCommandHandler {
  // Public Properties
  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public containerBoundingRect: DOMRect;
  public outerRect: DOMRect;
  public clickOverlay: HTMLDivElement;

  private _activeTool: ITool;

  // IPlacementView
  public gridSize = 10;
  public alignOnGrid = false;
  public alignOnSnap = true;
  public snapLines: Snaplines;
  public overlayLayer: OverlayLayerView;
  public rootDesignItem: IDesignItem;
  public eatEvents: Element;

  private _zoomFactor = 1; //if scale or zoom css property is used this needs to be the value
  private _scaleFactor = 1; //if scale css property is used this need to be the scale value
  private _canvasOffset: IPoint = { x: 0, y: 0 };

  private _additionalStyle: CSSStyleSheet[];
  private _currentContextMenu: ContextMenu
  private _backgroundImage: string;

  private _enableSelectTextNodesOnClick = false;

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
    this._zoomFactorChanged(false);
  }
  public get canvasOffsetUnzoomed(): IPoint {
    return { x: this._canvasOffset.x * this.zoomFactor, y: this._canvasOffset.y * this.zoomFactor };
  }
  public set canvasOffsetUnzoomed(value: IPoint) {
    this.canvasOffset = { x: value.x / this.zoomFactor, y: value.y / this.zoomFactor };
  }

  public onContentChanged = new TypedEvent<void>();
  public onZoomFactorChanged = new TypedEvent<number>();

  public get canvas(): HTMLElement {
    return this._canvas;
  }

  // Private Variables
  private _canvas: HTMLDivElement;
  private _canvasContainer: HTMLDivElement;
  private _outercanvas2: HTMLDivElement;

  private _lastHoverDesignItem: IDesignItem;

  private _firstConnect: boolean;

  public static cssprefixConstant = '#node-projects-designer-canvas-canvas ';

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
    #node-projects-designer-canvas-canvas {
      background-color: var(--canvas-background, white);
      /* 10px grid, using http://www.patternify.com/ */
      //background-image: url(data:image/png;base64,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);
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAFXmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjIwIgogICBleGlmOlBpeGVsWURpbWVuc2lvbj0iMjAiCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgdGlmZjpJbWFnZVdpZHRoPSIyMCIKICAgdGlmZjpJbWFnZUxlbmd0aD0iMjAiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjMwMC8xIgogICB0aWZmOllSZXNvbHV0aW9uPSIzMDAvMSIKICAgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIKICAgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIgogICB4bXA6TW9kaWZ5RGF0ZT0iMjAyMi0xMi0wOFQwOToxNTo0OCswMTowMCIKICAgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMi0xMi0wOFQwOToxNTo0OCswMTowMCI+CiAgIDxkYzp0aXRsZT4KICAgIDxyZGY6QWx0PgogICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+QmFja2dyb3VuZGdyaWRfMTBweDwvcmRmOmxpPgogICAgPC9yZGY6QWx0PgogICA8L2RjOnRpdGxlPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJwcm9kdWNlZCIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWZmaW5pdHkgRGVzaWduZXIgMS4xMC42IgogICAgICBzdEV2dDp3aGVuPSIyMDIyLTEyLTA4VDA5OjE1OjQ4KzAxOjAwIi8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9InIiPz4fvgn+AAABgWlDQ1BzUkdCIElFQzYxOTY2LTIuMQAAKJF1kc8rRFEUxz8GjRhRLCiLl7BCftTExmLkV2ExnvJr8+bNvBk1b+b13kiyVbaKEhu/FvwFbJW1UkRKlrImNug5b2ZqJplzO/d87vfec7r3XPCpSd10KnrATGXs8FhImZtfUPwvBKjCTx/Nmu5YUzOjKiXt854yL952ebVKn/vXaqIxR4eyKuEh3bIzwuPCk6sZy+Md4UY9oUWFz4Q7bbmg8J2nR3L86nE8x98e22p4GHz1wkq8iCNFrCdsU1heTpuZXNHz9/FeEoilZmcktoq34BBmjBAKE4wwTJBeBmUO0iX96ZYVJfJ7svnTpCVXl9liDZtl4iTI0CnqilSPSTREj8lIsub1/29fHaO/L1c9EILKZ9d9bwf/Nvxsue7Xkev+HEP5E1ymCvnpQxj4EH2roLUdQN0GnF8VtMguXGxC06Ol2VpWKhf3GQa8nULtPDTcQPVirmf5fU4eQF2Xr7qGvX3okPN1S790cWfsRnax1QAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAC9JREFUOI1jfPr0KQNuICUlhUeWCY8cQTCqeWRoZvz//z8e6WfPntHK5lHNI0MzAMChCNMTuPcnAAAAAElFTkSuQmCC);
      image-rendering: pixelated;
      background-position: 0px 0px;
      background-attachment: fixed;
      background-origin: -box;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      position: relative
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
  `;

  static override readonly template = html`
    <div style="display: flex;flex-direction: column;width: 100%;height: 100%; margin: 0 !important; padding: 0 !important; border: none !important;">
      <div style="width: 100%;height: 100%; margin: 0 !important; padding: 0 !important; border: none !important;">
        <div id="node-projects-designer-canvas-outercanvas2" style="width:100%;height:100%;position:relative; margin: 0 !important; padding: 0 !important; border: none !important;">
          <div id="node-projects-designer-canvas-canvasContainer"
          style="width: 100%;height: 100%;position: absolute;top: 0;left: 0;user-select: none; margin: 0 !important; padding: 0 !important; border: none !important;">
          <div id="node-projects-designer-canvas-canvas" part="canvas" style=" margin: 0 !important; padding: 0 !important; border: none !important;"></div>
        </div>
      </div>
      <div id="node-projects-designer-canvas-clickOverlay" tabindex="0" style="pointer-events: auto;  margin: 0 !important; padding: 0 !important; border: none !important;"></div>
      </div>
    </div>`;

  public extensionManager: IExtensionManager;
  private _pointerextensions: IDesignerPointerExtension[];

  private _lastCopiedPrimaryItem: IDesignItem;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._canvas = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-canvas');
    this._canvasContainer = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-canvasContainer');
    this._outercanvas2 = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-outercanvas2');
    this.clickOverlay = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-clickOverlay');

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._pointerEventHandler = this._pointerEventHandler.bind(this);

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
    let styles = [this.constructor.style]
    if (this._additionalStyle)
      styles.push(cssFromString(AbstractStylesheetService.buildPatchedStyleSheet(this._additionalStyle)));
    if (this.instanceServiceContainer.stylesheetService) {
      styles.push(...this.instanceServiceContainer.stylesheetService
        .getStylesheets()
        .map(x => cssFromString(AbstractStylesheetService.buildPatchedStyleSheet([cssFromString(x.content)]))));
    }
    this.shadowRoot.adoptedStyleSheets = styles;
  }


  /* --- start IUiCommandHandler --- */

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
          const el = this.rootDesignItem.element;
          const sel = this.instanceServiceContainer.selectionService.selectedElements;
          this.instanceServiceContainer.selectionService.setSelectedElements(null);
          await sleep(100);
          const screenshot = await Screenshot.takeScreenshot(el, el.clientWidth, el.clientHeight);
          await exportData(dataURItoBlob(screenshot), "screenshot.png");
          this.instanceServiceContainer.selectionService.setSelectedElements(sel);
          this.enableBackground();
        }
        else {
          this.disableBackgroud();
          const el = this.instanceServiceContainer.selectionService.primarySelection.element;
          const sel = this.instanceServiceContainer.selectionService.selectedElements;
          this.instanceServiceContainer.selectionService.setSelectedElements(null);
          await sleep(100);
          const screenshot = await Screenshot.takeScreenshot(el, el.clientWidth, el.clientHeight);
          await exportData(dataURItoBlob(screenshot), "screenshot.png");
          this.instanceServiceContainer.selectionService.setSelectedElements(sel);
          this.enableBackground();
        }
      }
        break;
      case CommandType.setTool: {
        this.serviceContainer.globalContext.tool = this.serviceContainer.designerTools.get(command.parameter);
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
      case CommandType.redo:
        this.instanceServiceContainer.undoService.redo();
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
    this._backgroundImage = this._canvas.style.backgroundImage;
    this._canvas.style.backgroundImage = 'none';
  }

  public enableBackground() {
    this._canvas.style.backgroundImage = this._backgroundImage;
  }

  public zoomToFit() {
    const autoZomOffset = 10;
    let maxX = 0, maxY = 0, minX = 0, minY = 0;

    this.canvasOffset = { x: 0, y: 0 };
    this.zoomFactor = 1;

    for (let n of DomHelper.getAllChildNodes(this.rootDesignItem.element)) {
      if (n instanceof Element) {
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


    return true;
  }

  /* --- end IUiCommandHandler --- */

  handleSelectAll() {
    this.instanceServiceContainer.selectionService.setSelectedElements(Array.from(this.rootDesignItem.children()));
  }

  async handleCopyCommand() {
    this._lastCopiedPrimaryItem = this.instanceServiceContainer.selectionService.primarySelection;
    await this.serviceContainer.copyPasteService.copyItems(this.instanceServiceContainer.selectionService.selectedElements);
  }

  async handlePasteCommand(disableRestoreOfPositions: boolean) {
    const [designItems, positions] = await this.serviceContainer.copyPasteService.getPasteItems(this.serviceContainer, this.instanceServiceContainer);

    let grp = this.rootDesignItem.openGroup("Insert");

    let pasteContainer = this.rootDesignItem;
    let pCon = this._lastCopiedPrimaryItem?.parent ?? this.instanceServiceContainer.selectionService.primarySelection;
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
          di.setStyle('left', (pos.x - containerPos.x) + 'px');
          di.setStyle('top', (pos.y - containerPos.y) + 'px');
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
      })
    }

    this.rootDesignItem = DesignItem.GetOrCreateDesignItem(this._canvas, this.serviceContainer, this.instanceServiceContainer);
    const contentService = this.serviceContainer.getLastService('contentService')
    if (contentService) {
      this.instanceServiceContainer.register("contentService", contentService(this));
    }

    const stylesheetService = this.serviceContainer.getLastService('stylesheetService')
    if (stylesheetService) {
      const instance = stylesheetService(this);
      this.instanceServiceContainer.register("stylesheetService", instance);
      this.instanceServiceContainer.stylesheetService.stylesheetChanged.on((ss) => {
        if (ss.changeSource == 'extern') {
          const ssca = new StylesheetChangedAction(this.instanceServiceContainer.stylesheetService, ss.name, ss.newStyle, ss.oldStyle);
          this.instanceServiceContainer.undoService.execute(ssca);
        }
        this.applyAllStyles();
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
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._firstConnect = true;
      this.clickOverlay.addEventListener(EventNames.PointerDown, this._pointerEventHandler);
      this.clickOverlay.addEventListener(EventNames.PointerMove, this._pointerEventHandler);
      this.clickOverlay.addEventListener(EventNames.PointerUp, this._pointerEventHandler);
      this.clickOverlay.addEventListener(EventNames.DragEnter, event => this._onDragEnter(event));
      this.clickOverlay.addEventListener(EventNames.DragLeave, event => this._onDragLeave(event));
      this.clickOverlay.addEventListener(EventNames.DragOver, event => this._onDragOver(event));
      this.clickOverlay.addEventListener(EventNames.Drop, event => this._onDrop(event));
      this.clickOverlay.addEventListener(EventNames.KeyDown, this.onKeyDown, true);
      this.clickOverlay.addEventListener(EventNames.KeyUp, this.onKeyUp, true);
      this.clickOverlay.addEventListener(EventNames.DblClick, this._onDblClick, true);
    }
  }

  private _zoomFactorChanged(refreshExtensions = true) {
    //a@ts-ignore
    //this._canvasContainer.style.zoom = <any>this._zoomFactor;
    //this._canvasContainer.style.transform = 'scale(' + this._zoomFactor+') translate(' + this._translate.x + ', '+this._translate.y+')';
    //this._canvasContainer.style.transformOrigin = '0 0';
    this._canvasContainer.style.bottom = this._outercanvas2.offsetHeight >= this._canvasContainer.offsetHeight ? '0' : '';
    this._canvasContainer.style.right = this._outercanvas2.offsetWidth >= this._canvasContainer.offsetWidth ? '0' : '';
    this._updateTransform();
    this._fillCalculationrects();
    this.onZoomFactorChanged.emit(this._zoomFactor);
    if (refreshExtensions) {
      this.extensionManager.refreshAllAppliedExtentions();
      setTimeout(() => this.extensionManager.refreshAllAppliedExtentions(), 200);
    }
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
    this._canvasContainer.style.transform = 'scale(' + this._zoomFactor + ') translate(' + (isNaN(this._canvasOffset.x) ? '0' : this._canvasOffset.x) + 'px, ' + (isNaN(this._canvasOffset.y) ? '0' : this._canvasOffset.y) + 'px)';
    this._canvasContainer.style.transformOrigin = '0 0';
    this.overlayLayer.style.transform = this._canvasContainer.style.transform;
    this.overlayLayer.style.transformOrigin = '0 0';
    this.snapLines.clearSnaplines();
  }

  public setDesignItems(designItems: IDesignItem[]) {
    const setItemsAction = new SetDesignItemsAction(designItems, [...this.rootDesignItem.children()]);
    this.instanceServiceContainer.undoService.execute(setItemsAction);
  }

  public _internalSetDesignItems(designItems: IDesignItem[]) {
    this._fillCalculationrects();
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
      const styleElements = this.rootDesignItem.element.querySelectorAll('style');
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

  _dragOverExtensionItem: IDesignItem;
  private _onDragEnter(event: DragEvent) {
    this._fillCalculationrects();
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
    }
  }

  private _onDragLeave(event: DragEvent) {
    this._fillCalculationrects();
    event.preventDefault();
    this._canvas.classList.remove('dragFileActive');

    if (this._dragOverExtensionItem) {
      this.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOver);
      this._dragOverExtensionItem = null;
    }
  }

  private _lastDdElement = null;
  private _onDragOver(event: DragEvent) {
    event.preventDefault();
    /*if (this.alignOnSnap) {
      this.snapLines.calculateSnaplines(this.instanceServiceContainer.selectionService.selectedElements);
      //TODO: fix this following code...
      const currentPoint = this.getDesignerMousepoint(event);
      let containerService = this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.rootDesignItem))
      containerService.finishPlace(this, this.rootDesignItem, this._initialPoint, currentPoint, this.instanceServiceContainer.selectionService.selectedElements);
    }*/

    this._fillCalculationrects();

    if (event.dataTransfer.types.length > 0 && event.dataTransfer.types[0] == 'Files') {
      const ddService = this.serviceContainer.dragDropService;
      if (ddService) {
        const effect = ddService.dragOver(event);
        event.dataTransfer.dropEffect = effect;
        if (effect !== 'none')
          this._canvas.classList.add('dragFileActive');
      }
    } else {
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
          const effect = ddService.dragOver(this, event, el);
          event.dataTransfer.dropEffect = effect;
        }
      } else {
        let [newContainer] = this._getPossibleContainerForDrop(event);
        if (this._dragOverExtensionItem != newContainer) {
          this.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOver);
          this.extensionManager.applyExtension(newContainer, ExtensionType.ContainerExternalDragOver, event);
          this._dragOverExtensionItem = newContainer;
        } else {
          this.extensionManager.refreshExtension(newContainer, ExtensionType.ContainerExternalDragOver, event);
        }
      }
    }
  }

  private _getPossibleContainerForDrop(event: DragEvent): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService] {
    let newContainerElementDesignItem: IDesignItem = null;
    let newContainerService: IPlacementService = null;

    const elementsFromPoint = this.elementsFromPoint(event.x, event.y);
    for (let e of elementsFromPoint) {
      if (e == this.rootDesignItem.element) {
        newContainerElementDesignItem = this.rootDesignItem;
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        break;
      } else if (false) {
        //check we don't try to move a item over one of its children..
      } else {
        newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(e, this.serviceContainer, this.instanceServiceContainer);
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        if (newContainerService) {
          if (newContainerService.canEnterByDrop(newContainerElementDesignItem)) {
            break;
          } else {
            newContainerElementDesignItem = null;
            newContainerService = null;
            continue;
          }
        }
      }
    }
    return [newContainerElementDesignItem, newContainerService];
  }

  private async _onDrop(event: DragEvent) {
    this._lastDdElement = null;
    event.preventDefault();
    this._canvas.classList.remove('dragFileActive');

    this._fillCalculationrects();

    if (event.dataTransfer.files?.length > 0) {
      const ddService = this.serviceContainer.dragDropService;
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
          const effect = ddService.drop(this, event, bo, el);
          event.dataTransfer.dropEffect = effect;
        }
      }
      else {
        if (this._dragOverExtensionItem) {
          this.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOver);
          this._dragOverExtensionItem = null;
        }

        let [newContainer] = this._getPossibleContainerForDrop(event);
        if (!newContainer)
          newContainer = this.rootDesignItem;

        this._fillCalculationrects();

        //TODO : we need to use container service for adding to element, so also grid and flexbox work correct
        const transferData = event.dataTransfer.getData(dragDropFormatNameElementDefinition);
        const elementDefinition = <IElementDefinition>JSON.parse(transferData);
        const di = await this.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, this.serviceContainer, this.instanceServiceContainer));
        const grp = di.openGroup("Insert of &lt;" + di.name + "&gt;");
        di.setStyle('position', 'absolute');
        const containerService = this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainer, getComputedStyle(newContainer.element)))
        containerService.enterContainer(newContainer, [di]);

        const containerPos = this.getNormalizedElementCoordinates(newContainer.element);
        const evCoord = this.getNormalizedEventCoordinates(event);
        const pos = { x: evCoord.x - containerPos.x, y: evCoord.y - containerPos.y };
        containerService.place(event, this, newContainer, { x: 0, y: 0 }, { x: 0, y: 0 }, pos, [di]);
        containerService.finishPlace(event, this, newContainer, { x: 0, y: 0 }, { x: 0, y: 0 }, pos, [di]);
        this.instanceServiceContainer.undoService.execute(new InsertAction(newContainer, newContainer.childCount, di));
        requestAnimationFrame(() => {
          this.instanceServiceContainer.selectionService.setSelectedElements([di]);
          grp.commit();
        });
      }
    }
  }

  public showDesignItemContextMenu(designItem: IDesignItem, event: MouseEvent) {
    this._currentContextMenu?.close();
    const mnuItems: IContextMenuItem[] = [];
    for (let cme of this.serviceContainer.designerContextMenuExtensions) {
      if (cme.shouldProvideContextmenu(event, this, designItem, 'designer')) {
        mnuItems.push(...cme.provideContextMenuItems(event, this, designItem));
      }
    }
    let ctxMenu = new ContextMenu(mnuItems, null)
    ctxMenu.display(event);
    return ctxMenu;
  }

  private _onDblClick(event: KeyboardEvent) {
    event.preventDefault();
    this.extensionManager.applyExtension(this.instanceServiceContainer.selectionService.primarySelection, ExtensionType.Doubleclick, event);
  }

  private onKeyUp(event: KeyboardEvent) {
    if (event.composedPath().indexOf(this.eatEvents) >= 0)
      return;

    event.preventDefault();
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.composedPath().indexOf(this.eatEvents) >= 0)
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
        case 'ArrowUp':
          {
            this.instanceServiceContainer.selectionService.selectedElements.forEach(x => x.setStyle('top', parseInt((<HTMLElement>x.element).style.top) - moveOffset + 'px'));
            this.extensionManager.refreshExtensions(this.instanceServiceContainer.selectionService.selectedElements);
          }
          break;
        case 'ArrowDown':
          {
            this.instanceServiceContainer.selectionService.selectedElements.forEach(x => x.setStyle('top', parseInt((<HTMLElement>x.element).style.top) + moveOffset + 'px'));
            this.extensionManager.refreshExtensions(this.instanceServiceContainer.selectionService.selectedElements);
          }
          break;
        case 'ArrowLeft':
          {
            this.instanceServiceContainer.selectionService.selectedElements.forEach(x => x.setStyle('left', parseInt((<HTMLElement>x.element).style.left) - moveOffset + 'px'));
            this.extensionManager.refreshExtensions(this.instanceServiceContainer.selectionService.selectedElements);
          }
          break;
        case 'ArrowRight':
          {
            this.instanceServiceContainer.selectionService.selectedElements.forEach(x => x.setStyle('left', parseInt((<HTMLElement>x.element).style.left) + moveOffset + 'px'));
            this.extensionManager.refreshExtensions(this.instanceServiceContainer.selectionService.selectedElements);
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
    return { x: (targetRect.x - this.containerBoundingRect.x) / (ignoreScalefactor ? 1 : this.scaleFactor), y: (targetRect.y - this.containerBoundingRect.y) / (ignoreScalefactor ? 1 : this.scaleFactor), width: targetRect.width / (ignoreScalefactor ? 1 : this.scaleFactor), height: targetRect.height / (ignoreScalefactor ? 1 : this.scaleFactor) };
  }

  public getNormalizedElementCoordinates(element: Element, ignoreScalefactor?: boolean): IRect {
    if (element.nodeType == NodeType.TextNode) {
      return this.getNormalizedTextNodeCoordinates(<Text><any>element, ignoreScalefactor)
    }
    const targetRect = element.getBoundingClientRect();

    return { x: (targetRect.x - this.containerBoundingRect.x) / (ignoreScalefactor ? 1 : this.scaleFactor), y: (targetRect.y - this.containerBoundingRect.y) / (ignoreScalefactor ? 1 : this.scaleFactor), width: targetRect.width / (ignoreScalefactor ? 1 : this.scaleFactor), height: targetRect.height / (ignoreScalefactor ? 1 : this.scaleFactor) };
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

  //todo: remove
  public elementFromPoint(x: number, y: number): Element {
    let elements = this.shadowRoot.elementsFromPoint(x, y);
    let element = elements[0];
    if (element === this.clickOverlay)
      element = elements[1];
    if (element === this.clickOverlay)
      element = this._canvas;
    return element;
  }

  public elementsFromPoint(x: number, y: number): Element[] {
    let retVal: Element[] = [];
    let elements = this.shadowRoot.elementsFromPoint(x, y);
    for (let e of elements) {
      if (e == this.clickOverlay)
        continue;
      if (e == this.overlayLayer)
        continue;
      if (e.getRootNode() !== this.shadowRoot)
        continue;
      if (e == this._outercanvas2)
        break;
      retVal.push(e);
      if (e === this._canvas)
        break;
    }
    return retVal;
  }

  public getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean) {
    const elements = this.shadowRoot.elementsFromPoint(point.x, point.y);
    let currentElement: HTMLElement = null;

    for (let i = 0; i < elements.length; i++) {
      currentElement = <HTMLElement>elements[i];
      if (currentElement == this._outercanvas2) {
        currentElement = null;
        break;
      }
      if (currentElement == this.clickOverlay) {
        currentElement = null;
        continue;
      }
      if (currentElement == this.overlayLayer) {
        currentElement = null;
        continue;
      }
      if (ignoreElementCallback && ignoreElementCallback(currentElement)) {
        currentElement = null;
        continue;
      }
      if (currentElement.getRootNode() !== this.shadowRoot) {
        currentElement = null;
        continue;
      }
      break;
    }

    return currentElement;
  }

  public showHoverExtension(element: Element, event: Event) {
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(element, this.serviceContainer, this.instanceServiceContainer);
    if (this._lastHoverDesignItem != currentDesignItem) {
      if (this._lastHoverDesignItem)
        this.extensionManager.removeExtension(this._lastHoverDesignItem, ExtensionType.MouseOver);
      if (currentDesignItem && currentDesignItem != this.rootDesignItem && DomHelper.getHost(element.parentNode) !== this.overlayLayer)
        this.extensionManager.applyExtension(currentDesignItem, ExtensionType.MouseOver, event);
      this._lastHoverDesignItem = currentDesignItem;
    }
  }

  private _pointerEventHandler(event: PointerEvent, forceElement: Node = null) {
    if (!this.serviceContainer)
      return;

    this._fillCalculationrects();

    if (this._pointerextensions) {
      for (let pe of this._pointerextensions)
        pe.refresh(event);
    }

    if (event.composedPath().indexOf(this.eatEvents) >= 0)
      return;

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

    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);
    this.showHoverExtension(currentDesignItem.element, event);

    //TODO: needed ??
    if (currentElement && DomHelper.getHost(currentElement.parentNode) === this.overlayLayer) {
      if (this.eatEvents)
        return;
      currentElement = this.instanceServiceContainer.selectionService.primarySelection?.element ?? this._canvas;
    }

    let tool = this.serviceContainer.globalContext.tool ?? this.serviceContainer.designerTools.get(NamedTools.Pointer);

    tool.pointerEventHandler(this, event, <Element>currentElement);
    this._canvas.style.cursor = tool.cursor;
  }

  public captureActiveTool(tool: ITool) {
    this._activeTool = tool;
  }

  public releaseActiveTool() {
    this._activeTool = null;
  }

  private _fillCalculationrects() {
    this.containerBoundingRect = this._canvasContainer.getBoundingClientRect();
    this.outerRect = this._outercanvas2.getBoundingClientRect();
  }

  public addOverlay(element: SVGGraphicsElement, overlayLayer: OverlayLayer = OverlayLayer.Normal) {
    this.overlayLayer.addOverlay(element, overlayLayer);
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