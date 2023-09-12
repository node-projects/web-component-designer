import { html, BaseCustomWebComponentConstructorAppend, css } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { DesignerToolbar } from '../DesignerToolbar.js';

export class DrawToolPopup extends BaseCustomWebComponentConstructorAppend {

  static override style = css`
      .container {
          width: 220px;
          min-height: 200px;
          color: white;
          background-color: rgb(64, 64, 64);
          border: 1px solid black;
      }
      header {
          text-align: center;
      }
      .tool {
          height: 32px;
          width: 32px;
          background-color: rgb(255, 255, 255);
          background-size: 65%;
          background-repeat: no-repeat;
          background-position: center center;
          flex-shrink: 0;
          border-bottom: 1px solid black;
      }
      .tools {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 5px;
      }
      .inputs{
        float: left;
        margin-top: 5px;
        align-items: center;
      }
      .input {
        display: flex;
        align-items: center; 
        margin-top: 5px;
      }
      .text {
        margin-left: 5px;
        font-size: 14px;
      }
      .strokecolor{ 
        float: both;
      }
      .fillbrush{
        float: both;
      }
      .strokethickness{
        float: both;
      }
      
      `

  static override template = html`
        <div class="container">
          <header><h2 id="title" style="margin: 0;">Draw</h2></header>
          <main id="content-area">
            <div class="tools">
              <div class="tool" data-command="setTool" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/layout/DrawLineTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/layout/DrawPathTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/layout/DrawRectTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/layout/DrawEllipTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="PickColor" title="Pick Color" style="background-image: url('${assetsPath}images/layout/ColorPickerTool.svg');"></div>
            </div>
            <div class="inputs">
              <div class="input">
                <input id="strokecolor" class="strokecolor" type="color" title="stroke color" value="#000000" style="padding: 0; width:31px; height:31px;">
                <text class="text">Stroke Color</text>
              </div>
              <div class="input">
                <input id="fillbrush" class="fillbrush" type="color" title="fill brush" value="#ffffff" style="padding: 0; width:31px; height:31px;">
                <text class="text">Fill Brush</text>
              </div>
              <div class="input">
                <input id="strokethickness" class="strokethickness" type="range" title="stroke thickness" min="1" max="20" value="3" style="padding: 0; width:80px; height:20px; margin-right: 5px;">
                <text class="text">Stroke Thickness</text>
              </div>
            </div>
          </main>
        </div>`;

  constructor() {
    super();

    for (let e of [...this.shadowRoot.querySelectorAll("div.tool")]) {
      let div = (<HTMLDivElement>e);
      div.onclick = () => (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setTool(div.dataset['commandParameter']);
    }

    if(this.shadowRoot.querySelector("input.strokecolor")) {
      let input = <HTMLInputElement>this._getDomElement("strokecolor");
      input.onchange = () => (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setStrokeColor(input.value);
    }

    if(this.shadowRoot.querySelector("input.fillbrush")) {
      let input = <HTMLInputElement>this._getDomElement("fillbrush");
      input.onchange = () => (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setFillBrush(input.value);
    }

    if(this.shadowRoot.querySelector("input.strokethickness")) {
      let input = <HTMLInputElement>this._getDomElement("strokethickness");
      input.onchange = () => (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).setStrokeThickness(input.value);
    }
  }
}

customElements.define('node-projects-designer-drawtool-popup', DrawToolPopup);