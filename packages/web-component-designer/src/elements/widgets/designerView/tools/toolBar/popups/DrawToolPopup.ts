import { html, css } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { DesignerToolbar } from '../DesignerToolbar.js';
import { AbstractBaseToolPopup } from './AbstractBaseToolPopup.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';
import { CommandType } from '../../../../../../commandHandling/CommandType.js';

export class DrawToolPopup extends AbstractBaseToolPopup {

  static override style = [<CSSStyleSheet>super.style, css`
      .container {
          width: 220px;
          min-height: 300px;
      }
      .inputs{
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin: 5px;
        align-items: center;
      }
      .text {
        margin-left: 5px;
        font-size: 14px;
      }
      `]

  static override template = html`
        <div class="container">
          <header><h2 id="title" style="margin: 0;">Draw</h2></header>
          <main id="content-area">
            <div class="tools">
              <div class="tool" data-command="setTool" data-command-parameter="DrawLine" title="Draw Line" style="background-image: url('${assetsPath}images/tools/DrawLineTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Pointer Tool" style="background-image: url('${assetsPath}images/tools/DrawPathTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="background-image: url('${assetsPath}images/tools/DrawRectTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipsis" style="background-image: url('${assetsPath}images/tools/DrawEllipTool.svg');"></div>
              <div class="tool" data-command="setTool" data-command-parameter="PickColor" title="Pick Color" style="background-image: url('${assetsPath}images/tools/ColorPickerTool.svg');"></div>
            </div>
            <div class="inputs">   
                <text class="text">Stroke Color</text>
                [[this.getEditor('setStrokeColor', 'color', {}, this.designerCanvas.serviceContainer.globalContext.strokeColor)]] 
                <text class="text">Fill Brush</text>
                [[this.getEditor('setFillBrush', 'color', {}, this.designerCanvas.serviceContainer.globalContext.fillBrush)]] 
                <text class="text">Stroke Thickness</text>
                [[this.getEditor('setStrokeThickness', 'range', { min: 1, max: 20, step: 1 }, this.designerCanvas.serviceContainer.globalContext.strokeThickness)]] 
            </div>
          </main>
        </div>`;

  constructor(private designerCanvas: IDesignerCanvas) {
    super();
  }

  ready() {
    this._bindingsParse();
    this.designerCanvas.serviceContainer.globalContext.strokeColor
  }

  //todo currentvalue
  getEditor(commandType: CommandType, type: string, additional: { [key: string]: any }, currentValue: any) {
    const res = this.designerCanvas.serviceContainer.forSomeServicesTillResult('editorTypeService',
      x => x.getEditor(type, {
        changedCallback: (newValue) => this.designerCanvas.executeCommand({ type: commandType, parameter: newValue }),
        ...additional
      }));
    res.setValue(currentValue);
    return res.element;
  }
}

customElements.define('node-projects-designer-draw-tool-popup', DrawToolPopup);