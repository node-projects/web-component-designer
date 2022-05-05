import { ServiceContainer } from '../../services/ServiceContainer';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer';
import { css, DomHelper, html, BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler';
import { IUiCommand } from '../../../commandHandling/IUiCommand';
import { DesignerCanvas } from "./designerCanvas.js";
import { DomConverter } from './DomConverter.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition.js';
import { DefaultHtmlParserService } from '../../services/htmlParserService/DefaultHtmlParserService.js';
import { EventNames } from '../../../enums/EventNames.js';
import { PlainScrollbar } from '../../controls/PlainScrollbar';
import { DesignerToolbar } from './tools/toolBar/DesignerToolbar.js';


const autoZomOffset = 10;

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

  private _zoomInput: HTMLInputElement;
  private _lowertoolbar: HTMLDivElement;
  private _toolbar: DesignerToolbar;

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
      height: 16px;
      background: #787f82;
      display: flex;
      bottom: 0;
      position: absolute;
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
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .selected {
      background-color: deepskyblue;
    }
    .toolbar-control:hover {
      background-color:rgba(164,206,249,.6);
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
      height: calc(100% - 32px);
    }

    #tool-bar {
      width: 24px;
      height: calc(100% - 32px);
      position: absolute;
      background-color: lightgray;      
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
    
    .bottom-scroll {
      width: calc(100% - 16px);
      position: absolute;
      bottom: 16px;
      height: 16px;
      box-sizing: border-box;
    }
    .right-scroll {
      height: calc(100% - 32px);
      position: absolute;
      right: 0;
      top: 0;
      width: 16px;
      box-sizing: border-box;
    }
    .bottom-right {
      width: 16px;
      height: 16px;
      bottom: 16px;
      right: 0;
      position: absolute;
      background: #f0f0f0;
    }`;

  static override readonly template = html`
    <div id="outer">
      <node-projects-plain-scrollbar id="s-hor" value="0.5" class="bottom-scroll"></node-projects-plain-scrollbar>
      <node-projects-plain-scrollbar id="s-vert" value="0.5" orientation="vertical" class="right-scroll">
      </node-projects-plain-scrollbar>
      <div class="bottom-right"></div>
      <div id="lowertoolbar">
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

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._sVert = this._getDomElement<PlainScrollbar>('s-vert');
    this._sHor = this._getDomElement<PlainScrollbar>('s-hor');

    const outer = this._getDomElement<DesignerCanvas>('outer');
    this._designerCanvas = new DesignerCanvas();
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
        this._designerCanvas.zoomFactor = parseFloat(this._zoomInput.value) / 100;
    }
    this._zoomInput.onblur = () => {
      this._designerCanvas.zoomFactor = parseFloat(this._zoomInput.value) / 100;
    }
    this._zoomInput.onclick = this._zoomInput.select
    let zoomIncrease = this._getDomElement<HTMLDivElement>('zoomIncrease');
    zoomIncrease.onclick = () => {
      if (this._designerCanvas.zoomFactor > 0.1)
        this._designerCanvas.zoomFactor += 0.1;
      else
        this._designerCanvas.zoomFactor += 0.01;
    }
    let zoomDecrease = this._getDomElement<HTMLDivElement>('zoomDecrease');
    zoomDecrease.onclick = () => {
      if (this._designerCanvas.zoomFactor > 0.11)
        this._designerCanvas.zoomFactor -= 0.1;
      else
        this._designerCanvas.zoomFactor -= 0.01;

      if (this._designerCanvas.zoomFactor < 0.001)
        this._designerCanvas.zoomFactor = 0.001

      this._zoomInput.value = Math.round(this._designerCanvas.zoomFactor * 100) + '%';
    }
    let zoomReset = this._getDomElement<HTMLDivElement>('zoomReset');
    zoomReset.onclick = () => {
      this.zoomReset();
    }
    let zoomFit = this._getDomElement<HTMLDivElement>('zoomFit');
    zoomFit.onclick = () => {
      this.zoomToFit();
    }
    this.addEventListener(EventNames.Wheel, event => this._onWheel(event));

    let alignSnap = this._getDomElement<HTMLDivElement>('alignSnap');
    alignSnap.onclick = () => { this._designerCanvas.alignOnSnap = !this._designerCanvas.alignOnSnap; alignSnap.style.backgroundColor = this._designerCanvas.alignOnSnap ? 'deepskyblue' : ''; }
    alignSnap.style.backgroundColor = this._designerCanvas.alignOnSnap ? 'deepskyblue' : '';
    let alignGrid = this._getDomElement<HTMLDivElement>('alignGrid');
    alignGrid.onclick = () => { this._designerCanvas.alignOnGrid = !this._designerCanvas.alignOnGrid; alignGrid.style.backgroundColor = this._designerCanvas.alignOnGrid ? 'deepskyblue' : ''; }
    alignGrid.style.backgroundColor = this._designerCanvas.alignOnGrid ? 'deepskyblue' : '';

    this._lowertoolbar = this._getDomElement<HTMLDivElement>('lowertoolbar');

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
    let maxX = 0, maxY = 0, minX = 0, minY = 0;

    this._designerCanvas.canvasOffset = { x: 0, y: 0 };
    this._designerCanvas.zoomFactor = 1;

    for (let n of DomHelper.getAllChildNodes(this.designerCanvas.rootDesignItem.element)) {
      if (n instanceof Element) {
        const rect = n.getBoundingClientRect();
        minX = minX < rect.x ? minX : rect.x;
        minY = minY < rect.y ? minY : rect.y;
        maxX = maxX > rect.x + rect.width + autoZomOffset ? maxX : rect.x + rect.width + autoZomOffset;
        maxY = maxY > rect.y + rect.height + autoZomOffset ? maxY : rect.y + rect.height + autoZomOffset;
      }
    }

    const cvRect = this.designerCanvas.getBoundingClientRect();
    maxX -= cvRect.x;
    maxY -= cvRect.y;

    let scaleX = cvRect.width / (maxX / this._designerCanvas.zoomFactor);
    let scaleY = cvRect.height / (maxY / this._designerCanvas.zoomFactor);

    const dimensions = this.designerCanvas.getDesignSurfaceDimensions();
    if (dimensions.width)
      scaleX = cvRect.width / dimensions.width;
    if (dimensions.height)
      scaleY = cvRect.height / dimensions.height;

    let fak = scaleX < scaleY ? scaleX : scaleY;
    if (!isNaN(fak))
      this._designerCanvas.zoomFactor = fak;
    this._zoomInput.value = Math.round(this._designerCanvas.zoomFactor * 100) + '%';
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

  set additionalStyle(value: CSSStyleSheet) {
    this._designerCanvas.additionalStyle = value;
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

  public getHTML(designItemsAssignmentList?: Map<IDesignItem, IStringPosition>) {
    //this.instanceServiceContainer.selectionService.setSelectedElements(null);
    if (this._designerCanvas.rootDesignItem.childCount > 0)
      return DomConverter.ConvertToString(Array.from(this._designerCanvas.rootDesignItem.children()), designItemsAssignmentList);
    return '';
  }

  public async parseHTML(html: string) {
    const parserService = this.serviceContainer.htmlParserService;
    if (!html) {
      this.instanceServiceContainer.undoService.clear();
      this._designerCanvas.overlayLayer.removeAllOverlays();
      DomHelper.removeAllChildnodes(this._designerCanvas.overlayLayer);
      this._designerCanvas.rootDesignItem.clearChildren();
    }
    else {
      const designItems = await parserService.parse(html, this.serviceContainer, this.instanceServiceContainer);
      this._designerCanvas.setDesignItems(designItems)
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