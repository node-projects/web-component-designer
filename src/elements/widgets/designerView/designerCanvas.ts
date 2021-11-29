import { EventNames } from "../../../enums/EventNames";
import { ServiceContainer } from '../../services/ServiceContainer';
import { IElementDefinition } from '../../services/elementsService/IElementDefinition';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer';
import { UndoService } from '../../services/undoService/UndoService';
import { SelectionService } from '../../services/selectionService/SelectionService';
import { DesignItem } from '../../item/DesignItem';
import { IDesignItem } from '../../item/IDesignItem';
import { BaseCustomWebComponentLazyAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { dragDropFormatName } from '../../../Constants';
import { ContentService } from '../../services/contentService/ContentService';
import { InsertAction } from '../../services/undoService/transactionItems/InsertAction';
import { IDesignerCanvas } from './IDesignerCanvas';
import { Snaplines } from './Snaplines';
import { ContextMenuHelper } from '../../helper/contextMenu/ContextMenuHelper';
import { IPlacementView } from './IPlacementView';
import { DeleteAction } from '../../services/undoService/transactionItems/DeleteAction';
import { CommandType } from '../../../commandHandling/CommandType';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler';
import { IUiCommand } from '../../../commandHandling/IUiCommand';
import { DefaultHtmlParserService } from "../../services/htmlParserService/DefaultHtmlParserService";
import { ExtensionType } from "./extensions/ExtensionType";
import { IExtensionManager } from "./extensions/IExtensionManger";
import { ExtensionManager } from "./extensions/ExtensionManager";
import { NamedTools } from "./tools/NamedTools";
import { Screenshot } from '../../helper/Screenshot';
import { dataURItoBlob, exportData } from "../../helper/Helper";
import { IContextMenuItem } from "../../helper/contextMenu/IContextmenuItem";
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper';
import { IPoint } from "../../../interfaces/IPoint";
import { OverlayLayer } from "./extensions/OverlayLayer";
import { OverlayLayerView } from './overlayLayerView';
import { IDesignerPointerExtension } from './extensions/pointerExtensions/IDesignerPointerExtension';

export class DesignerCanvas extends BaseCustomWebComponentLazyAppend implements IDesignerCanvas, IPlacementView, IUiCommandHandler {
  // Public Properties
  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public containerBoundingRect: DOMRect;
  public outerRect: DOMRect;

  // IPlacementView
  public gridSize = 10;
  public alignOnGrid = false;
  public alignOnSnap = true;
  public snapLines: Snaplines;
  public overlayLayer: OverlayLayerView;
  public rootDesignItem: IDesignItem;
  public eatEvents: Element;

  private _zoomFactor = 1;
  public get zoomFactor(): number {
    return this._zoomFactor;
  }
  public set zoomFactor(value: number) {
    this._zoomFactor = value;
    this.zoomFactorChanged();
  }

  // Private Variables
  private _canvas: HTMLDivElement;
  private _canvasContainer: HTMLDivElement;
  private _outercanvas2: HTMLDivElement;

  private _lastHoverDesignItem: IDesignItem;

  private _onContextMenuBound: () => void;

  private _pointerEventHandlerBound: (event: PointerEvent) => void;

  private _firstConnect: boolean;

  private _onKeyDownBound: any;
  private _onKeyUpBound: any;

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
    #node-projects-designer-canvas-canvas {
      background-color: var(--canvas-background, white);
      /* 10px grid, using http://www.patternify.com/ */
      background-image: url(data:image/png;base64,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);
      background-position: 0px 0px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
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
      z-index: 999999999999;
    }
    
    #node-projects-designer-canvas-canvas * {
      cursor: pointer;
      user-select: none;
    }`;

  static override readonly template = html`
        <div style="display: flex;flex-direction: column;width: 100%;height: 100%;">
          <div style="width: 100%;height: 100%;">
            <div id="node-projects-designer-canvas-outercanvas2" style="width: 100%;height: 100%;position: relative;overflow: auto;">
              <div id="node-projects-designer-canvas-canvasContainer" style="width: 100%;height: 100%;margin: auto;position: absolute;top: 0;/* bottom: 0; does not work with fixed sized when size is bigger then view */left: 0;user-select: none;">
                <div id="node-projects-designer-canvas-canvas" part="canvas" tabindex="0"></div>
              </div>
            </div>
          </div>
        </div>`;

  public extensionManager: IExtensionManager;
  private _pointerextensions: IDesignerPointerExtension[];
  private _onDblClickBound: any;

  constructor() {
    super();

    this._canvas = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-canvas');
    this._canvasContainer = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-canvasContainer');
    this._outercanvas2 = this._getDomElement<HTMLDivElement>('node-projects-designer-canvas-outercanvas2');

    this.instanceServiceContainer = new InstanceServiceContainer(this);
    this.instanceServiceContainer.register("undoService", new UndoService(this));
    this.instanceServiceContainer.register("selectionService", new SelectionService);

    this.extensionManager = new ExtensionManager(this);

    this._onKeyDownBound = this.onKeyDown.bind(this);
    this._onKeyUpBound = this.onKeyUp.bind(this);
    this._onDblClickBound = this._onDblClick.bind(this);
    this._onContextMenuBound = this._onContextMenu.bind(this);
    this._pointerEventHandlerBound = this._pointerEventHandler.bind(this);

    this._canvas.oncontextmenu = this._onContextMenuBound;
  }

  get designerWidth(): string {
    return this._canvasContainer.style.width;
  }
  set designerWidth(value: string) {
    this._canvasContainer.style.width = value;
    this.zoomFactorChanged();
  }
  get designerHeight(): string {
    return this._canvasContainer.style.height;
  }
  set designerHeight(value: string) {
    this._canvasContainer.style.height = value;
    this.zoomFactorChanged();
  }

  set additionalStyle(value: CSSStyleSheet) {
    if (value) {
      for (let r of value.rules) {
        if (r instanceof CSSStyleRule) {
          let parts = r.selectorText.split(',');
          let t = '';
          for (let p of parts) {
            if (r.selectorText)
              t += ',';
            t += '#canvas ' + p;
          }
          r.selectorText = t;
        }
      }

      this.shadowRoot.adoptedStyleSheets = [this.constructor.style, value];
    }
    else
      this.shadowRoot.adoptedStyleSheets = [this.constructor.style];
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
        if (!this.instanceServiceContainer.selectionService.primarySelection)
          alert("you need to select an element!")
        else {
          if (!Screenshot.screenshotsEnabled) {
            alert("you need to select current tab in next browser dialog, or screenshots will not work correctly");
          }
          const el = this.instanceServiceContainer.selectionService.primarySelection.element;
          const sel = this.instanceServiceContainer.selectionService.selectedElements;
          this.instanceServiceContainer.selectionService.setSelectedElements(null);
          const screenshot = await Screenshot.takeScreenshot(el, el.clientWidth, el.clientHeight);
          await exportData(dataURItoBlob(screenshot), "screenshot.png");
          this.instanceServiceContainer.selectionService.setSelectedElements(sel);
        }
      }
        break;
      case CommandType.setTool: {
        this.serviceContainer.globalContext.tool = this.serviceContainer.designerTools.get(command.parameter);
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
        this.handlePasteCommand();
        break;
      case CommandType.selectAll:
        this.handleSelectAll();
        break;
    }
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
    await this.serviceContainer.copyPasteService.copyItems(this.instanceServiceContainer.selectionService.selectedElements);
  }

  async handlePasteCommand() {
    const designItems = await this.serviceContainer.copyPasteService.getPasteItems(this.serviceContainer, this.instanceServiceContainer);

    let grp = this.rootDesignItem.openGroup("Insert");
    if (designItems) {
      for (let di of designItems) {
        this.instanceServiceContainer.undoService.execute(new InsertAction(this.rootDesignItem, this.rootDesignItem.childCount, di));
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
    this.instanceServiceContainer.undoService.execute(new DeleteAction(items, this.extensionManager));
    this.instanceServiceContainer.selectionService.setSelectedElements(null);
  }

  initialize(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;
    this.rootDesignItem = DesignItem.GetOrCreateDesignItem(this._canvas, this.serviceContainer, this.instanceServiceContainer);
    this.instanceServiceContainer.register("contentService", new ContentService(this.rootDesignItem));

    this.overlayLayer = new OverlayLayerView(serviceContainer);
    this.overlayLayer.style.pointerEvents = 'none';
    this._canvasContainer.appendChild(this.overlayLayer);
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
  }

  elementFromPoint(x: number, y: number): Element {
    //@ts-ignore
    return this.shadowRoot.elementFromPoint(x, y);
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._firstConnect = true;
      this._outercanvas2.addEventListener(EventNames.PointerDown, this._pointerEventHandlerBound);
      this._outercanvas2.addEventListener(EventNames.PointerMove, this._pointerEventHandlerBound);
      this._outercanvas2.addEventListener(EventNames.PointerUp, this._pointerEventHandlerBound);
      this._outercanvas2.addEventListener(EventNames.DragEnter, event => this._onDragEnter(event));
      this._outercanvas2.addEventListener(EventNames.DragLeave, event => this._onDragLeave(event));
      this._outercanvas2.addEventListener(EventNames.DragOver, event => this._onDragOver(event));
      this._outercanvas2.addEventListener(EventNames.Drop, event => this._onDrop(event));
      this._canvas.addEventListener(EventNames.KeyDown, this._onKeyDownBound, true);
      this._canvas.addEventListener(EventNames.KeyUp, this._onKeyUpBound, true);
      this._canvas.addEventListener(EventNames.DblClick, this._onDblClickBound, true);
    }
  }

  zoomFactorChanged() {
    //@ts-ignore
    this._canvasContainer.style.zoom = <any>this._zoomFactor;
    //this._canvasContainer.style.transform = 'scale(' + this._zoomFactor+')';
    //this._canvasContainer.style.transformOrigin = '0 0';
    this._canvasContainer.style.bottom = this._outercanvas2.offsetHeight >= this._canvasContainer.offsetHeight ? '0' : '';
    this._canvasContainer.style.right = this._outercanvas2.offsetWidth >= this._canvasContainer.offsetWidth ? '0' : '';
    this.snapLines.clearSnaplines();
  }

  public setDesignItems(designItems: IDesignItem[]) {
    this.instanceServiceContainer.undoService.clear();
    DomHelper.removeAllChildnodes(this.overlayLayer);
    this.rootDesignItem.clearChildren();
    this.addDesignItems(designItems);
  }

  public addDesignItems(designItems: IDesignItem[]) {
    if (designItems) {
      for (let di of designItems) {
        this.rootDesignItem.insertChild(di);
      }
    }

    const intializationService = this.serviceContainer.intializationService;
    if (intializationService) {
      for (let di of designItems)
        intializationService.init(di);
    }

    this.snapLines.clearSnaplines();

    const prepService = this.serviceContainer.prepareElementsForDesignerService;
    if (prepService)
      requestAnimationFrame(() => prepService.prepareElementsForDesigner(this.rootDesignItem));
  }

  private _onDragEnter(event: DragEvent) {
    event.preventDefault();
  }

  private _onDragLeave(event: DragEvent) {
    event.preventDefault();
    this._canvas.classList.remove('dragFileActive');
  }

  private _onDragOver(event: DragEvent) {
    event.preventDefault();
    /*if (this.alignOnSnap) {
      this.snapLines.calculateSnaplines(this.instanceServiceContainer.selectionService.selectedElements);
      //TODO: fix this following code...
      const currentPoint = this.getDesignerMousepoint(event);
      let containerService = this.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(this.rootDesignItem))
      containerService.finishPlace(this, this.rootDesignItem, this._initialPoint, currentPoint, this.instanceServiceContainer.selectionService.selectedElements);
    }*/
    if (event.dataTransfer.types.length > 0 && event.dataTransfer.types[0] == 'Files') {
      const ddService = this.serviceContainer.dragDropService;
      if (ddService) {
        const effect = ddService.dragOver(event);
        event.dataTransfer.dropEffect = effect;
        if (effect !== 'none')
          this._canvas.classList.add('dragFileActive');
      }
    }
  }

  private async _onDrop(event: DragEvent) {
    event.preventDefault();
    this._canvas.classList.remove('dragFileActive');

    if (event.dataTransfer.files.length > 0) {
      const ddService = this.serviceContainer.dragDropService;
      if (ddService) {
        ddService.drop(this, event);
      }
    }
    else {
      this._fillCalculationrects();
      const position = this.getNormalizedEventCoordinates(event);

      const transferData = event.dataTransfer.getData(dragDropFormatName);
      const elementDefinition = <IElementDefinition>JSON.parse(transferData);
      const di = await this.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, this.serviceContainer, this.instanceServiceContainer));
      const grp = di.openGroup("Insert");
      di.setStyle('position', 'absolute');
      di.setStyle('left', position.x + 'px');
      di.setStyle('top', position.y + 'px');
      this.instanceServiceContainer.undoService.execute(new InsertAction(this.rootDesignItem, this.rootDesignItem.childCount, di));
      grp.commit();
      requestAnimationFrame(() => this.instanceServiceContainer.selectionService.setSelectedElements([di]));
    }
  }

  private _onContextMenu(event: MouseEvent) {
    event.preventDefault();
    const designItem = DesignItem.GetOrCreateDesignItem(<Node>event.target, this.serviceContainer, this.instanceServiceContainer);
    if (!this.instanceServiceContainer.selectionService.isSelected(designItem)) {
      this.instanceServiceContainer.selectionService.setSelectedElements([designItem]);
    }
    this.showDesignItemContextMenu(designItem, event);
  }

  public showDesignItemContextMenu(designItem: IDesignItem, event: MouseEvent) {
    const mnuItems: IContextMenuItem[] = [];
    for (let cme of this.serviceContainer.designerContextMenuExtensions) {
      if (cme.shouldProvideContextmenu(event, this, designItem)) {
        mnuItems.push(...cme.provideContextMenuItems(event, this, designItem));
      }
    }
    let ctxMnu = ContextMenuHelper.showContextMenu(null, event, null, mnuItems);
    return ctxMnu;
  }

  private _onDblClick(event: KeyboardEvent) {
    event.preventDefault();
    this.extensionManager.applyExtension(this.instanceServiceContainer.selectionService.primarySelection, ExtensionType.Doubleclick);
  }

  private onKeyUp(event: KeyboardEvent) {
    if (event.composedPath().indexOf(this.eatEvents) >= 0)
      return;

    switch (event.key) {
      case 'ArrowUp':
        //this._resetPointerEventsForClickThrough();
        break;
    }

    event.preventDefault();
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.composedPath().indexOf(this.eatEvents) >= 0)
      return;
    //TODO: keyboard events maybe should also be handeled by tools 

    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey)
      this.executeCommand({ type: CommandType.undo });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey)
      this.executeCommand({ type: CommandType.redo });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'y')
      this.executeCommand({ type: CommandType.redo });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'a')
      this.executeCommand({ type: CommandType.selectAll });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'c')
      this.executeCommand({ type: CommandType.copy });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'v')
      this.executeCommand({ type: CommandType.paste });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'x')
      this.executeCommand({ type: CommandType.cut });
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
          this.executeCommand({ type: CommandType.delete });
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

  public getNormalizedEventCoordinates(event: MouseEvent): IPoint {
    const offsetOfOuterX = (event.clientX - this.outerRect.x) / this.zoomFactor;
    const offsetOfCanvasX = this.containerBoundingRect.x - this.outerRect.x / this.zoomFactor;

    const offsetOfOuterY = (event.clientY - this.outerRect.y) / this.zoomFactor;
    const offsetOfCanvasY = this.containerBoundingRect.y - this.outerRect.y / this.zoomFactor;

    return {
      x: offsetOfOuterX - offsetOfCanvasX,
      y: offsetOfOuterY - offsetOfCanvasY
    };
  }

  public getNormalizedElementCoordinates(element: Element): IPoint {
    const targetRect = element.getBoundingClientRect();
    return { x: targetRect.x - this.containerBoundingRect.x, y: targetRect.y - this.containerBoundingRect.y };
  }

  public getNormalizedOffsetInElement(event: MouseEvent, element: Element): IPoint {
    const normEvt = this.getNormalizedEventCoordinates(event);
    const normEl = this.getNormalizedElementCoordinates(element);
    return { x: normEvt.x - normEl.x, y: normEvt.y - normEl.y };
  }

  //todo remove, is in base custom webcomp domhelper
  static getHost(node: Node) {
    while (node.parentElement)
      node = node.parentElement;
    if ((<ShadowRoot>node).host)
      return (<ShadowRoot>node).host
    return (<ShadowRoot>node.parentNode).host;
  }

  public getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean) {
    let backupPEventsMap: Map<HTMLElement, string> = new Map();
    let currentElement = this.elementFromPoint(point.x, point.y) as HTMLElement;
    let lastElement: HTMLElement = null;
    try {
      while (currentElement != null) {
        if (currentElement == lastElement) {
          currentElement = null;
          break;
        }
        lastElement = currentElement;
        if (currentElement == this._canvas) {
          break;
        }
        if (currentElement === this.overlayLayer) {
          currentElement = this.overlayLayer.elementFromPoint(point.x, point.y) as HTMLElement;
          break;
        }
        if (!ignoreElementCallback || !ignoreElementCallback(currentElement)) {
          break;
        }
        backupPEventsMap.set(currentElement, currentElement.style.pointerEvents);
        currentElement.style.pointerEvents = 'none';
        if (currentElement.shadowRoot) {
          for (let e of currentElement.shadowRoot.querySelectorAll('*')) {
            if (!backupPEventsMap.has((<HTMLElement>e))) {
              if ((<HTMLElement>e).style)
                backupPEventsMap.set((<HTMLElement>e), (<HTMLElement>e).style.pointerEvents);
              (<HTMLElement>e).style.pointerEvents = 'none';
            }
          }
        }
        currentElement = this.elementFromPoint(point.x, point.y) as HTMLElement;

      }
    }
    finally {
      for (let e of backupPEventsMap.entries()) {
        e[0].style.pointerEvents = e[1];
      }
    }

    return currentElement;
  }

  _rect: SVGRectElement
  private _pointerEventHandler(event: PointerEvent) {
    this._fillCalculationrects();
    if (this._pointerextensions) {
      for (let pe of this._pointerextensions)
        pe.refresh(event);
    }

    if (event.composedPath().indexOf(this.eatEvents) >= 0)
      return;

    if (event.button == 2)
      return;

    let currentElement = this.serviceContainer.elementAtPointService.getElementAtPoint(this, { x: event.x, y: event.y });
    if (currentElement === this._outercanvas2 || currentElement === this.overlayLayer || !currentElement) {
      currentElement = this._canvas;
    }

    //TODO: remove duplication when tool refactoring starts
    this._fillCalculationrects();
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);
    if (this._lastHoverDesignItem != currentDesignItem) {
      if (this._lastHoverDesignItem)
        this.extensionManager.removeExtension(this._lastHoverDesignItem, ExtensionType.MouseOver);
      if (currentDesignItem && currentDesignItem != this.rootDesignItem && DesignerCanvas.getHost(currentElement.parentNode) !== this.overlayLayer)
        this.extensionManager.applyExtension(currentDesignItem, ExtensionType.MouseOver);
      this._lastHoverDesignItem = currentDesignItem;
    }

    if (currentElement && DesignerCanvas.getHost(currentElement.parentNode) === this.overlayLayer) {
      if (this.eatEvents)
        return;
      currentElement = this.instanceServiceContainer.selectionService.primarySelection?.element ?? this._canvas;
    }

    this._fillCalculationrects();

    let tool = this.serviceContainer.globalContext.tool ?? this.serviceContainer.designerTools.get(NamedTools.Pointer);
    this._canvas.style.cursor = tool.cursor;
    tool.pointerEventHandler(this, event, currentElement);
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
}

customElements.define('node-projects-designer-canvas', DesignerCanvas);