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
import { DomConverter } from './DomConverter';
import { IDesignerView } from './IDesignerView';
import { Snaplines } from './Snaplines';
import { IDesignerMousePoint } from '../../../interfaces/IDesignerMousePoint';
import { ContextMenuHelper } from '../../helper/contextMenu/ContextMenuHelper';
import { IPlacementView } from './IPlacementView';
import { DeleteAction } from '../../services/undoService/transactionItems/DeleteAction';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition';
import { CommandType } from '../../../commandHandling/CommandType';
import { MoveElementInDomAction } from '../../services/undoService/transactionItems/MoveElementInDomAction';
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

export class DesignerView extends BaseCustomWebComponentLazyAppend implements IDesignerView, IPlacementView, IUiCommandHandler {
  // Public Properties
  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public containerBoundingRect: DOMRect;

  // IPlacementView
  public gridSize = 10;
  public alignOnGrid = false;
  public alignOnSnap = true;
  public snapLines: Snaplines;
  public overlayLayer: SVGElement;
  public rootDesignItem: IDesignItem;
  private _zoomFactor = 1;

  // Private Variables
  private _canvas: HTMLDivElement;
  private _canvasContainer: HTMLDivElement;
  private _outercanvas2: HTMLDivElement;

  private _lastHoverDesignItem: IDesignItem;

  private _zoomInput: HTMLInputElement;
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
    #canvasContainer {
      width: 100%;
      height: 100%;
      margin: auto;
      position: absolute;
      top: 0;
      /* bottom: 0; does not work with fixed sized when size is bigger then view */
      left: 0;
      /* right: 0; */
      user-select: none;
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
      overflow: visible;
      user-select: none;
      z-index: 999999999999;
    }

    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-snapline { stroke: purple; stroke-dasharray: 4; fill: transparent; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-selection { stroke: #3899ec; fill: transparent; stroke-width: 2; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-selector { stroke: black; fill: transparent; stroke-width: 1; stroke-dasharray: 2; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-primary-selection-move { stroke: #3899ec; fill: #3899ec; cursor: move; pointer-events: all }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-text { stroke: none; fill: white; stroke-width: 1; font-size: 10px; font-family: monospace; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-primary-resizer { stroke: #3899ec; fill: white; pointer-events: all }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-primary-rotate { stroke: #3899ec; fill: #3899ec; pointer-events: all }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-grid { stroke: orange; stroke-dasharray: 5; fill: #ff944722; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-grid-area { font-size: 8px; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-grid-gap { stroke: orange; stroke-dasharray: 5; fill: #0000ff22; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-transform-origin { stroke: #3899ec; fill: black; pointer-events: all }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-margin { fill: #ff944722; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-position  { stroke: black; stroke-dasharray: 2; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-path { stroke: #3899ec; fill: orange; pointer-events: all }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-path-line { stroke: #3899ec; stroke-dasharray: 2; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-hover { stroke: #90caf9; fill: none; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-gray-out { stroke: transparent; fill: rgba(211, 211, 211, 0.8); pointer-events: none }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-text-enter-container { stroke: none; fill: black; stroke-width: 1; font-size: 14px; font-weight:800; font-family: monospace; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-rect-enter-container { stroke: none; fill: #aa00ff2e; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-draw-new-element { stroke: black; fill: transparent; stroke-width: 1; }
    #outercanvas1>#outercanvas2>#canvasContainer>#svg>.svg-invisible-div { stroke: lightgray; fill: transparent; stroke-width: 1; }
    
    #canvas * {
      cursor: pointer;
      user-select: none;
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
    #outercanvas1 {
      width: 100%;
      height: calc(100% - 17px);
    }
    #outercanvas2 {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: auto;
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
  }`;

  static override readonly template = html`
        <div class="outer">
          <div id="outercanvas1">
            <div id="outercanvas2">
              <div id="canvasContainer">
                <!-- <div id="zoomHelper" style="width: 10px; height: 10px; position: absolute; top: 0; left: 0; pointer-events: none;"></div> -->
                <div id="canvas" tabindex="0"></div>
                <svg id="svg" style="pointer-events: none;"></svg>
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
            <div title="snap to grid" id="alignGrid" class="toolbar-control snap-grid"></div>
            <div title="snap to elements" id="alignSnap" class="toolbar-control snap-guide"></div>
          </div>
        </div>`;

  public extensionManager: IExtensionManager;

  constructor() {
    super();

    this._canvas = this._getDomElement<HTMLDivElement>('canvas');
    this._canvasContainer = this._getDomElement<HTMLDivElement>('canvasContainer');
    this._outercanvas2 = this._getDomElement<HTMLDivElement>('outercanvas2');

    this._zoomInput = this._getDomElement<HTMLInputElement>('zoomInput');
    this._zoomInput.onchange = () => { this._zoomFactor = parseFloat(this._zoomInput.value) / 100; this.zoomFactorChanged(); }
    this._zoomInput.onclick = this._zoomInput.select
    let zoomIncrease = this._getDomElement<HTMLDivElement>('zoomIncrease');
    zoomIncrease.onclick = () => { this._zoomFactor += 0.1; this.zoomFactorChanged(); }
    let zoomDecrease = this._getDomElement<HTMLDivElement>('zoomDecrease');
    zoomDecrease.onclick = () => { this._zoomFactor -= 0.1; this.zoomFactorChanged(); }
    let zoomReset = this._getDomElement<HTMLDivElement>('zoomReset');
    zoomReset.onclick = () => { this._zoomFactor = 1; this.zoomFactorChanged(); }
    let zoomFit = this._getDomElement<HTMLDivElement>('zoomFit');
    zoomFit.onclick = () => { this._zoomFactor = 7.7; this.zoomFactorChanged(); }

    let alignSnap = this._getDomElement<HTMLDivElement>('alignSnap');
    alignSnap.onclick = () => { this.alignOnSnap = !this.alignOnSnap; alignSnap.style.backgroundColor = this.alignOnSnap ? 'deepskyblue' : ''; }
    alignSnap.style.backgroundColor = this.alignOnSnap ? 'deepskyblue' : '';
    let alignGrid = this._getDomElement<HTMLDivElement>('alignGrid');
    alignGrid.onclick = () => { this.alignOnGrid = !this.alignOnGrid; alignGrid.style.backgroundColor = this.alignOnGrid ? 'deepskyblue' : ''; }
    alignGrid.style.backgroundColor = this.alignOnGrid ? 'deepskyblue' : '';

    this.instanceServiceContainer = new InstanceServiceContainer();
    this.instanceServiceContainer.register("undoService", new UndoService);
    this.instanceServiceContainer.register("selectionService", new SelectionService);

    this.extensionManager = new ExtensionManager(this);

    this._onKeyDownBound = this.onKeyDown.bind(this);
    this._onKeyUpBound = this.onKeyUp.bind(this);
    this._onContextMenuBound = this._onContextMenu.bind(this);
    this._pointerEventHandlerBound = this._pointerEventHandler.bind(this);

    this._canvas.oncontextmenu = this._onContextMenuBound;

    this.overlayLayer = this._getDomElement<SVGElement>('svg')
    this.snapLines = new Snaplines(this.overlayLayer);
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
          r.selectorText = '';
          for (let p of parts) {
            if (r.selectorText)
              r.selectorText += ',';
            r.selectorText += '#canvas ' + p;
          }
        }
      }

      this.shadowRoot.adoptedStyleSheets = [this.constructor.style, value];
    }
    else
      this.shadowRoot.adoptedStyleSheets = [this.constructor.style];
  }

  /* --- start IUiCommandHandler --- */

  async executeCommand(command: IUiCommand) {
    switch (command.type) {
      case CommandType.screenshot: {
        if (!this.instanceServiceContainer.selectionService.primarySelection)
          alert("you need to select an elment!")
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
      case CommandType.moveToFront:
      case CommandType.moveForward:
      case CommandType.moveBackward:
      case CommandType.moveToBack:
        this.handleMoveCommand(command.type);
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
    }
  }
  canExecuteCommand(command: IUiCommand) {
    if (command.type === CommandType.undo) {
      return this.instanceServiceContainer.undoService.canUndo();
    }
    if (command.type === CommandType.redo) {
      return this.instanceServiceContainer.undoService.canRedo();
    }
    return true;
  }

  /* --- end IUiCommandHandler --- */

  handleCopyCommand() {
    const copyText = DomConverter.ConvertToString(this.instanceServiceContainer.selectionService.selectedElements, null);
    navigator.clipboard.writeText(copyText);
  }

  async handlePasteCommand() {
    const text = await navigator.clipboard.readText()
    const parserService = this.serviceContainer.htmlParserService;
    let grp = this.rootDesignItem.openGroup("Insert");
    const designItems = await parserService.parse(text, this.serviceContainer, this.instanceServiceContainer);
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

  handleMoveCommand(command: CommandType) {
    //TODO: -> via undo redo service
    let sel = this.instanceServiceContainer.selectionService.primarySelection;
    if (command == CommandType.moveBackward)
      this.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).previousElementSibling), 'beforebegin', DesignItem.GetDesignItem((<HTMLElement>sel.element).previousElementSibling), 'afterend'));
    else if (command == CommandType.moveForward)
      this.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).nextElementSibling), 'afterend', DesignItem.GetDesignItem((<HTMLElement>sel.element).nextElementSibling), 'beforebegin'));
    else if (command == CommandType.moveToBack)
      this.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).parentElement), 'afterbegin', DesignItem.GetDesignItem((<HTMLElement>sel.element).previousElementSibling), 'afterend'));
    else if (command == CommandType.moveToFront)
      this.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).parentElement), 'beforeend', DesignItem.GetDesignItem((<HTMLElement>sel.element).nextElementSibling), 'beforebegin'));
  }

  initialize(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;
    this.rootDesignItem = DesignItem.GetOrCreateDesignItem(this._canvas, this.serviceContainer, this.instanceServiceContainer);
    this.instanceServiceContainer.register("contentService", new ContentService(this.rootDesignItem));
    this.snapLines.initialize(this.rootDesignItem);

    if (this.children) {
      const parser = this.serviceContainer.getLastServiceWhere('htmlParserService', x => x.constructor == DefaultHtmlParserService) as DefaultHtmlParserService;
      this._addDesignItems(parser.createDesignItems(this.children, this.serviceContainer, this.instanceServiceContainer))
    }
  }

  elementFromPoint(x: number, y: number): Element {
    return this.shadowRoot.elementFromPoint(x, y);
  }
  static wrapInDesigner(elements: HTMLCollection | HTMLElement[], serviceContainer: ServiceContainer): DesignerView {
    let designerView = new DesignerView();
    designerView.initialize(serviceContainer);
    const parser = designerView.serviceContainer.getLastServiceWhere('htmlParserService', x => x.constructor == DefaultHtmlParserService) as DefaultHtmlParserService;
    designerView._addDesignItems(parser.createDesignItems(elements, designerView.serviceContainer, designerView.instanceServiceContainer))
    return designerView;
  }

  connectedCallback() {
    if (!this._firstConnect) {
      this._firstConnect = true;
      this._outercanvas2.addEventListener(EventNames.PointerDown, this._pointerEventHandlerBound);
      this._outercanvas2.addEventListener(EventNames.PointerMove, this._pointerEventHandlerBound);
      this._outercanvas2.addEventListener(EventNames.PointerUp, this._pointerEventHandlerBound);
      this._canvas.addEventListener(EventNames.DragEnter, event => this._onDragEnter(event))
      this._canvas.addEventListener(EventNames.DragOver, event => this._onDragOver(event));
      this._canvas.addEventListener(EventNames.Drop, event => this._onDrop(event));
      this._canvas.addEventListener('keydown', this._onKeyDownBound, true);
      this._canvas.addEventListener('keyup', this._onKeyUpBound, true);
      this.addEventListener(EventNames.Wheel, event => this._onWheel(event));
    }
  }

  zoomFactorChanged() {
    this._canvasContainer.style.zoom = <any>this._zoomFactor;
    this._zoomInput.value = (this._zoomFactor * 100).toFixed(0) + '%';
    this._canvasContainer.style.bottom = this._outercanvas2.offsetHeight >= this._canvasContainer.offsetHeight ? '0' : '';
    this._canvasContainer.style.right = this._outercanvas2.offsetWidth >= this._canvasContainer.offsetWidth ? '0' : '';
    this.snapLines.clearSnaplines();
  }

  public getHTML(designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    this.instanceServiceContainer.selectionService.setSelectedElements(null);
    return DomConverter.ConvertToString([...this.rootDesignItem.children()], designItemsAssignmentList);
  }

  public async parseHTML(html: string) {
    this.instanceServiceContainer.undoService.clear();
    DomHelper.removeAllChildnodes(this.overlayLayer);
    const parserService = this.serviceContainer.htmlParserService;
    if (!html)
      this.rootDesignItem.clearChildren();
    else {
      const designItems = await parserService.parse(html, this.serviceContainer, this.instanceServiceContainer);
      this.rootDesignItem.clearChildren();
      this._addDesignItems(designItems);
    }
  }

  private _addDesignItems(designItems: IDesignItem[]) {
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
  }

  private _onDragEnter(event: DragEvent) {
    event.preventDefault();
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
  }

  private async _onDrop(event: DragEvent) {
    event.preventDefault();

    this._fillCalculationrects();
    let transferData = event.dataTransfer.getData(dragDropFormatName);
    let elementDefinition = <IElementDefinition>JSON.parse(transferData);
    let di = await this.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, this.serviceContainer, this.instanceServiceContainer));
    let grp = di.openGroup("Insert");
    di.setStyle('position', 'absolute')
    const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
    di.setStyle('top', event.offsetY + targetRect.top - this.containerBoundingRect.y + 'px')
    di.setStyle('left', event.offsetX + targetRect.left - this.containerBoundingRect.x + 'px')
    this.instanceServiceContainer.undoService.execute(new InsertAction(this.rootDesignItem, this.rootDesignItem.childCount, di));
    grp.commit();
    requestAnimationFrame(() => this.instanceServiceContainer.selectionService.setSelectedElements([di]));
  }

  private _onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      this._zoomFactor += event.deltaY * -0.001; //deltamode = 0
      if (this._zoomFactor < 0.1)
        this._zoomFactor = 0.1;
      this.zoomFactorChanged();
      //TODO: we should zoom on the current cursor position, so it stays the center
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

  private onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        //this._resetPointerEventsForClickThrough();
        break;
    }

    event.preventDefault();
  }


  private onKeyDown(event: KeyboardEvent) {
    //TODO: keyboard events maybe should also be handeled by tools 

    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey)
      this.executeCommand({ type: CommandType.undo });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey)
      this.executeCommand({ type: CommandType.redo });
    else if ((event.ctrlKey || event.metaKey) && event.key === 'y')
      this.executeCommand({ type: CommandType.redo });
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

  public getDesignerMousepoint(event: MouseEvent, target: Element, startPoint?: IDesignerMousePoint): IDesignerMousePoint {
    let targetRect = target.getBoundingClientRect();
    return {
      originalX: event.x - this.containerBoundingRect.x,
      //containerOriginalX: event.x - this._ownBoundingRect.x,
      x: (event.x - this.containerBoundingRect.x) / this._zoomFactor,
      originalY: event.y - this.containerBoundingRect.y,
      //containerOriginalY: event.y - this._ownBoundingRect.y,
      y: (event.y - this.containerBoundingRect.y) / this._zoomFactor,
      offsetInControlX: (startPoint ? startPoint.offsetInControlX : event.x - targetRect.x),
      offsetInControlY: (startPoint ? startPoint.offsetInControlY : event.y - targetRect.y),
      zoom: this._zoomFactor
    };
  }

  private _pointerEventHandler(event: PointerEvent) {
    if (event.button == 2)
      return;
    let currentElement = this.shadowRoot.elementFromPoint(event.x, event.y) as Element;
    if (currentElement === this._outercanvas2 || currentElement === this.overlayLayer) {
      currentElement = this._canvas;
    }

    //TODO: remove duplication when tool refactoring starts
    this._fillCalculationrects();
    const currentDesignItem = DesignItem.GetOrCreateDesignItem(currentElement, this.serviceContainer, this.instanceServiceContainer);
    if (this._lastHoverDesignItem != currentDesignItem) {
      if (this._lastHoverDesignItem)
        this.extensionManager.removeExtension(this._lastHoverDesignItem, ExtensionType.MouseOver);
      if (currentDesignItem && currentDesignItem != this.rootDesignItem && currentElement.parentNode !== this.overlayLayer)
        this.extensionManager.applyExtension(currentDesignItem, ExtensionType.MouseOver);
      this._lastHoverDesignItem = currentDesignItem;
    }

    if (currentElement && currentElement.parentNode == this.overlayLayer)
      currentElement = this.instanceServiceContainer.selectionService.primarySelection.element ?? this._canvas;

    this._fillCalculationrects();

    let tool = this.serviceContainer.globalContext.tool ?? this.serviceContainer.designerTools.get(NamedTools.Pointer);
    this._canvas.style.cursor = tool.cursor;
    tool.pointerEventHandler(this, event, currentElement);
  }

  private _fillCalculationrects() {
    this.containerBoundingRect = this._canvasContainer.getBoundingClientRect();
  }
}

customElements.define('node-projects-designer-view', DesignerView);