import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { NamedTools } from '../NamedTools.js';
import { DesignerToolbar } from './DesignerToolbar.js';

export class DesignerToolbarButton extends BaseCustomWebComponentConstructorAppend {

  static override style = css`
    :host {
      display: block;
      flex: 0 0 24px;
      width: 24px;
      height: 24px;
    }

    button {
      box-sizing: border-box;
      width: 24px;
      height: 24px;
      padding: 4px;
      border: 0;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    button[aria-pressed="true"] {
      background-color: var(--wcd-designer-view-tool-selected-background, deepskyblue);
    }

    button:hover {
      background-color: var(--wcd-designer-view-tool-hover-background, rgba(164,206,249,.6));
    }

    button:focus-visible {
      outline: 2px solid var(--wcd-color-focus, #47977c);
      outline-offset: -2px;
    }

    img {
      width: 16px;
      height: 16px;
      pointer-events: none;
      -webkit-user-drag: none;
    }
    `;

  static override template = html`<button id="div" type="button" aria-pressed="false"><img id="img" alt=""></button>`;

  public tools: Record<string | NamedTools, { icon: string }>;

  public popup: string | (new (designerCanvas?: IDesignerCanvas) => HTMLElement);
  public currentToolOnButton: string;

  private _img: HTMLImageElement;
  private _div: HTMLButtonElement;
  private _longPress;

  constructor(designerCanvas: IDesignerCanvas, tools: Record<string | NamedTools, { icon: string }>) {
    super();

    this.tools = tools;
    this._img = this._getDomElement<HTMLImageElement>('img');
    this._div = this._getDomElement<HTMLButtonElement>('div');
    this._div.onclick = (e) => {
      if (e.detail === 0) {
        const toolbar = <DesignerToolbar>(<ShadowRoot>this.getRootNode()).host;
        if (this.currentToolOnButton)
          toolbar.setTool(this.currentToolOnButton);
        else if (this.popup)
          toolbar.showPopup(this);
      }
    };
    this._div.onpointerdown = () => {
      if (this.currentToolOnButton) {
        (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setTool(this.currentToolOnButton);
        setTimeout(() => {
          designerCanvas.clickOverlay.focus();
        }, 50);
        if (this.popup) {
          this._longPress = setTimeout(() => {
            this._longPress = null;
            (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).showPopup(this);
          }, 200)
        }
      }
      else if (this.popup)
        (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).showPopup(this);
    };

    this._div.onpointerup = () => {
      if (this._longPress) {
        clearTimeout(this._longPress);
        this._longPress = null;
      }
    };


    this.showTool(Object.getOwnPropertyNames(tools)[0])
  }

  public showTool(name: string) {
    const tool = this.tools[name];
    if (tool) {
      this._div.title = name || 'Transform';
      this._div.setAttribute('aria-label', name || 'Transform');
      this._img.src = tool.icon;
      this.currentToolOnButton = name;
    }
  }

  public setActiveTool(name: string) {
    this.showTool(name);
    const tool = this.tools[name];
    this._div.setAttribute('aria-pressed', String(!!tool));
  }
}

customElements.define('node-projects-designer-toolbar-button', DesignerToolbarButton);