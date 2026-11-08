import { createSvgStrokeStyleControl } from '../../../../../controls/SvgStrokeStyleControl.js';
import { html, css } from '@node-projects/base-custom-webcomponent';
import { assetsPath } from "../../../../../../Constants.js";
import { AbstractBaseToolPopup } from './AbstractBaseToolPopup.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';
import { CommandType } from '../../../../../../commandHandling/CommandType.js';
import { SvgShapeLibraryPopup } from './SvgShapeLibraryPopup.js';

export class DrawToolPopup extends AbstractBaseToolPopup {

  static override style = [<CSSStyleSheet>super.style, css`
      .container {
          width: 280px;
      }
      .inputs {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          grid-auto-rows: 24px;
          gap: 8px;
          padding-top: 8px;
          margin-top: 8px;
          border-top: 1px solid var(--wcd-tool-popup-border-color, var(--wcd-color-border, #596c7a));
          align-items: center;
      }
      .inputs > * {
          min-width: 0;
      }
      .inputs > span:not(.text) {
          height: 24px;
          display: flex;
          align-items: center;
      }
      .inputs node-projects-color-input {
          padding: 0;
      }
      .inputs input {
          box-sizing: border-box;
          width: 100%;
          height: 24px;
          margin: 0;
          accent-color: var(--wcd-designer-view-tool-selected-background, deepskyblue);
      }
      .text {
          font-size: 11px;
      }
      `]

  static override template = html`
        <div class="container">
          <header><h2 id="title">Drawing tools</h2></header>
          <main id="content-area">
            <div class="tools">
              <button type="button" class="tool" data-command="setTool" data-command-parameter="DrawLine" title="Draw Line" style="--tool-icon: url('${assetsPath}images/tools/DrawLineTool.svg');"></button>
              <button type="button" class="tool" data-command="setTool" data-command-parameter="DrawPath" title="Draw Path" style="--tool-icon: url('${assetsPath}images/tools/DrawPathTool.svg');"></button>
              <button type="button" class="tool" data-command="setTool" data-command-parameter="DrawRect" title="Draw Rectangle" style="--tool-icon: url('${assetsPath}images/tools/DrawRectTool.svg');"></button>
              <button type="button" class="tool" data-command="setTool" data-command-parameter="DrawEllipsis" title="Draw Ellipse" style="--tool-icon: url('${assetsPath}images/tools/DrawEllipTool.svg');"></button>
              <button type="button" class="tool" data-command="setTool" data-command-parameter="PickColor" title="Pick Color" style="--tool-icon: url('${assetsPath}images/tools/ColorPickerTool.svg');"></button>
            </div>
            <button type="button" id="shapes" style="margin-top:8px;width:100%;height:28px">Shape library…</button>
            <div class="inputs">   
                <span class="text">Stroke Color</span>
                [[this.getEditor('setStrokeColor', 'color', { allowNone: true }, this.designerCanvas.serviceContainer.globalContext.strokeColor)]]
                <span class="text">Fill Brush</span>
                [[this.getEditor('setFillBrush', 'color', { allowNone: true }, this.designerCanvas.serviceContainer.globalContext.fillBrush)]]
                <span class="text">Stroke Thickness</span>
                [[this.getEditor('setStrokeThickness', 'number', { min: 0, step: 0.5 }, parseFloat(this.designerCanvas.serviceContainer.globalContext.strokeThickness))]]
                <span>Stroke style</span><span id="dash"></span>
                <span>Line cap</span><span id="cap"></span>
                <span>Line join</span><span id="join"></span>
            </div>
            <p style="font-size:11px;line-height:1.5">Path: click nodes or drag to sketch. Double-click or Enter finishes; click the first node to close. Escape cancels. Shift constrains angles; Alt bypasses snapping.</p>
          </main>
        </div>`;

  constructor(private designerCanvas: IDesignerCanvas) {
    super();
  }

  ready() {
    this._bindingsParse();
    this._getDomElement<HTMLButtonElement>('shapes').onclick = () => this.replaceWith(new SvgShapeLibraryPopup(this.designerCanvas));
    const context = this.designerCanvas.serviceContainer.globalContext;
    for (const [id, property, style] of [['dash', 'strokeDasharray', 'stroke-dasharray'], ['cap', 'strokeLinecap', 'stroke-linecap'], ['join', 'strokeLinejoin', 'stroke-linejoin']] as const) {
      const control = createSvgStrokeStyleControl(style, value => {
        (context as unknown as Record<string, string>)[property] = value;
        control.setValue(value);
      });
      control.setValue(context[property]);
      this._getDomElement(id).append(control.element);
    }
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