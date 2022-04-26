import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { NamedTools } from '../NamedTools.js';
import { DesignerToolbar } from './DesignerToolbar.js';

export class DesignerToolbarButton extends BaseCustomWebComponentConstructorAppend {

  static override style = css`
    div {
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center; 
      align-items: center;
      background-color: inherit;
    }

    div:hover {
      background-color: darkgray;
    }

    img {
      width: calc(100% - 4px);
      height: calc(100% - 4px);
    }    
    `;

  static override template = html`<div id="div"><img id="img"></div>`;

  public tools: Record<string | NamedTools, { icon: string }>;

  public popup: string | (new (...args: any[]) => HTMLElement);
  public currentToolOnButton: string;

  private _img: HTMLImageElement;
  private _div: HTMLImageElement;

  constructor(designerCanvas: IDesignerCanvas, tools: Record<string | NamedTools, { icon: string }>) {
    super();

    this.tools = tools;
    this._img = this._getDomElement<HTMLImageElement>('img');
    this._div = this._getDomElement<HTMLImageElement>('div');
    this._img.onclick = () => {
      if (this.popup) {
        (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).showPopup(this);
      } else {
        (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setTool(this.currentToolOnButton);
      }
    }

    this.showTool(Object.getOwnPropertyNames(tools)[0])
  }

  public showTool(name: string) {
    const tool = this.tools[name];
    if (tool) {
      this._img.title = name
      this._img.src = tool.icon;
      this.currentToolOnButton = name;
    }
  }

  public setActiveTool(name: string) {
    this.showTool(name);
    const tool = this.tools[name];
    if (tool) {
      this._div.style.backgroundColor = 'lightgreen';
    } else {
      this._div.style.backgroundColor = '';
    }
  }
}

customElements.define('node-projects-designer-toolbar-button', DesignerToolbarButton);