import { css } from '@node-projects/base-custom-webcomponent';
import { DraggableToolWindow } from './DraggableToolWindow.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';
import { filterChildPlaceItems } from '../../../../../helper/LayoutHelper.js';
import { IRect } from '../../../../../../interfaces/IRect.js';
import { IPoint } from '../../../../../../interfaces/IPoint.js';
import { calculateOuterRect } from '../../../../../helper/ElementHelper.js';
import { IDesignItem } from '../../../../../item/IDesignItem.js';

export class TransformToolPopup extends DraggableToolWindow {
  private _designerCanvas: IDesignerCanvas;
  private _previousSelectionRect: IRect;
  private _selectionChanged: boolean;

  private _relativeButton: HTMLButtonElement;
  private _absoluteButton: HTMLButtonElement;
  private _applyButton: HTMLButtonElement;

  private _inputX: HTMLInputElement;
  private _inputY: HTMLInputElement;
  private _inputR: HTMLInputElement;
  private _inputSpacingX: HTMLInputElement;
  private _inputSpacingY: HTMLInputElement;

  private _originTopLeft: HTMLInputElement;
  private _originTopMid: HTMLInputElement;
  private _originTopRight: HTMLInputElement;
  private _originMidLeft: HTMLInputElement;
  private _originMidMid: HTMLInputElement;
  private _originMidRight: HTMLInputElement;
  private _originBotLeft: HTMLInputElement;
  private _originBotMid: HTMLInputElement;
  private _originBotRight: HTMLInputElement;

  private _transformMode: "relative" | "absolute";
  private _transformOrigin: "topLeft" | "topMid" | "topRight" | "midLeft" | "midMid" | "midRight" | "botLeft" | "botMid" | "botRight";

  protected override get windowTitle(): string { return 'Transform'; }

  protected override get windowContentStyle(): CSSStyleSheet {
    return css`
      :host {
        width: 232px;
        font: 12px system-ui, sans-serif;
        color: var(--wcd-designer-view-statusbar-color, #354348);
      }
      .window-frame {
        background: var(--wcd-tool-popup-background, var(--wcd-designer-view-statusbar-background, #787f82));
        border: 1px solid var(--wcd-tool-popup-border-color, var(--wcd-color-border, #596c7a));
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, .25);
      }
      .title-bar {
        height: 29px;
        padding: 6px 8px;
        background: var(--wcd-tool-popup-title-background, rgba(255, 255, 255, .08));
        border-bottom: 1px solid var(--wcd-tool-popup-border-color, var(--wcd-color-border, #596c7a));
      }
      .title-text {
        font: 600 11px/16px system-ui, sans-serif;
        color: inherit;
      }
      .close-btn {
        color: inherit;
        width: 20px;
        height: 20px;
        border-radius: 4px;
      }
      .window-content {
        padding: 8px;
      }
      #input-div, #spacing-div {
        display: grid;
        gap: 6px 8px;
        align-items: center;
        font-size: 11px;
      }
      #input-div {
        grid-template-columns: auto minmax(0, 1fr);
      }
      #spacing-div {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--wcd-tool-popup-border-color, var(--wcd-color-border, #596c7a));
      }
      input[type="number"] {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        height: 24px;
        padding: 0 4px;
        border: 1px solid var(--wcd-color-border, #596c7a);
        border-radius: 4px;
        background: var(--wcd-input-background-color, white);
        color: inherit;
        font: inherit;
      }
      #button-div {
        display: flex;
        gap: 4px;
        margin-top: 8px;
      }
      #button-div button {
        flex: 1;
      }
      .window-content button {
        height: 24px;
        border: 0;
        border-radius: 4px;
        padding: 0 8px;
        font: inherit;
        color: inherit;
        background: rgba(255, 255, 255, .12);
        cursor: pointer;
      }
      .window-content button[aria-pressed="true"], #transform-button-apply {
        background: var(--wcd-designer-view-tool-selected-background, deepskyblue);
      }
      .window-content button:hover, .close-btn:hover {
        background: var(--wcd-designer-view-tool-hover-background, rgba(164,206,249,.6));
        color: inherit;
      }
      button:focus-visible, input:focus-visible {
        outline: 2px solid var(--wcd-color-focus, #47977c);
        outline-offset: -2px;
      }
      #origin-div {
        display: grid;
        justify-items: center;
        gap: 8px;
        margin: 12px 0;
        font-size: 11px;
      }
      #cube {
        display: grid;
        grid-template-columns: repeat(3, 16px);
        gap: 8px;
        padding: 8px;
        border: 1px solid var(--wcd-tool-popup-border-color, var(--wcd-color-border, #596c7a));
        border-radius: 4px;
        background: rgba(255, 255, 255, .08);
      }
      #cube input {
        width: 16px;
        height: 16px;
        margin: 0;
        accent-color: var(--wcd-designer-view-tool-selected-background, deepskyblue);
      }
      #apply-div {
        display: flex;
        justify-content: flex-end;
      }
    `;
  }

  protected override get windowTemplate(): string {
    return `
      <div id="input-div">
        <label for="transform-input-x">X</label>
        <input type="number" id="transform-input-x">
        <label for="transform-input-y">Y</label>
        <input type="number" id="transform-input-y">
        <label for="transform-input-r">Rotation</label>
        <input type="number" id="transform-input-r">
      </div>
      <div id="button-div">
        <button id="transform-button-absolute">Absolute</button>
        <button id="transform-button-relative">Relative</button>
      </div>

      <div id="spacing-div">
          <label for="spacing-input-x">X spacing</label>
          <label for="spacing-input-y">Y spacing</label>
          <input type="number" id="spacing-input-x">
          <input type="number" id="spacing-input-y">
      </div>

      <div id="origin-div">
        <span id="origin-label">Transform origin</span>
          <div id="cube" role="group" aria-labelledby="origin-label">
            <input id="origin-top-left" aria-label="Top left" type="radio" name="origin-radio">
            <input id="origin-top-mid" aria-label="Top center" type="radio" name="origin-radio">
            <input id="origin-top-right" aria-label="Top right" type="radio" name="origin-radio">
            <input id="origin-mid-left" aria-label="Middle left" type="radio" name="origin-radio">
            <input id="origin-mid-mid" aria-label="Center" type="radio" name="origin-radio" checked>
            <input id="origin-mid-right" aria-label="Middle right" type="radio" name="origin-radio">
            <input id="origin-bot-left" aria-label="Bottom left" type="radio" name="origin-radio">
            <input id="origin-bot-mid" aria-label="Bottom center" type="radio" name="origin-radio">
            <input id="origin-bot-right" aria-label="Bottom right" type="radio" name="origin-radio">
          </div>
      </div>

      <div id="apply-div">
        <button id="transform-button-apply" style="width:100px;">Apply</button>
      </div>`;
  }

  constructor(designerCanvas?: IDesignerCanvas) {
    super();
    this._designerCanvas = designerCanvas;

    this._relativeButton = this._getDomElement<HTMLButtonElement>("transform-button-relative");
    this._absoluteButton = this._getDomElement<HTMLButtonElement>("transform-button-absolute");
    this._applyButton = this._getDomElement<HTMLButtonElement>("transform-button-apply");

    this._inputX = this._getDomElement<HTMLInputElement>("transform-input-x");
    this._inputY = this._getDomElement<HTMLInputElement>("transform-input-y");
    this._inputR = this._getDomElement<HTMLInputElement>("transform-input-r");
    this._inputSpacingX = this._getDomElement<HTMLInputElement>("spacing-input-x");
    this._inputSpacingY = this._getDomElement<HTMLInputElement>("spacing-input-y");

    this._originTopLeft = this._getDomElement<HTMLInputElement>("origin-top-left");
    this._originTopMid = this._getDomElement<HTMLInputElement>("origin-top-mid");
    this._originTopRight = this._getDomElement<HTMLInputElement>("origin-top-right");
    this._originMidLeft = this._getDomElement<HTMLInputElement>("origin-mid-left");
    this._originMidMid = this._getDomElement<HTMLInputElement>("origin-mid-mid");
    this._originMidRight = this._getDomElement<HTMLInputElement>("origin-mid-right");
    this._originBotLeft = this._getDomElement<HTMLInputElement>("origin-bot-left");
    this._originBotMid = this._getDomElement<HTMLInputElement>("origin-bot-mid");
    this._originBotRight = this._getDomElement<HTMLInputElement>("origin-bot-right");

    this._relativeButton.onclick = () => this._changePositionMode("relative");
    this._absoluteButton.onclick = () => this._changePositionMode("absolute");
    this._applyButton.onclick = () => this._applyTransform();

    this._transformMode = "relative";
    this._changePositionMode(this._transformMode);
  }

  private _changePositionMode(mode: "relative" | "absolute") {
    this._relativeButton.setAttribute('aria-pressed', String(mode === 'relative'));
    this._absoluteButton.setAttribute('aria-pressed', String(mode === 'absolute'));
    this._transformMode = mode;
  }

  private _applyTransform() {
    this._checkOrigin();
    if (!this._designerCanvas) return;
    let selection = this._designerCanvas.instanceServiceContainer.selectionService.selectedElements;
    selection = filterChildPlaceItems(selection);

    this._selectionChanged = false;
    this._designerCanvas.instanceServiceContainer.selectionService.onSelectionChanged.once(() => {
      this._selectionChanged = true;
      this._previousSelectionRect = null;
    });


    if (selection.length != 0) {
      let inputPos: IPoint = {
        x: isNaN(this._inputX.valueAsNumber) ? null : this._inputX.valueAsNumber,
        y: isNaN(this._inputY.valueAsNumber) ? null : this._inputY.valueAsNumber
      }
      let inputRotation = this._inputR.valueAsNumber ? this._inputR.valueAsNumber : 0;

      let grp = selection[0].openGroup("Transform selection")
      if (!this._previousSelectionRect || this._selectionChanged)
        this._previousSelectionRect = calculateOuterRect(selection, this._designerCanvas);
      let origin = this._calculateTransformOriginPosition(this._previousSelectionRect);
      for (let item of selection) {
        let itemPos: IRect = {
          x: parseFloat(item.getStyle("left")),
          y: parseFloat(item.getStyle("top")),
          width: parseFloat(item.getStyle("width")),
          height: parseFloat(item.getStyle("height"))
        }
        let itemRotStyle = item.getStyle("transform")
        let itemRotation = 0;
        if (itemRotStyle)
          itemRotation = parseFloat(item.getStyle("transform").replaceAll("rotate(", "").replaceAll("deg)", ""));
        let newPos = this._calculateTransform(this._previousSelectionRect, origin, itemPos, inputRotation, inputPos, this._transformMode)

        item.setStyle("left", newPos.x.toString() + "px");
        item.setStyle("top", newPos.y.toString() + "px");

        let rotation: number;
        if (this._transformMode == 'relative')
          rotation = itemRotation + inputRotation;
        else
          rotation = inputRotation;

        while (rotation >= 360)
          rotation -= 360;
        if (rotation != 0)
          item.setStyle("transform", "rotate(" + rotation + "deg)");
        else
          item.removeStyle("transform");
      }

      this._applySpacing(selection);

      grp.commit();
    }
  }

  private _calculateTransformOriginPosition(selectionRect: IRect): IPoint {
    switch (this._transformOrigin) {
      case "topLeft":
        return { x: selectionRect.x, y: selectionRect.y }
      case "topMid":
        return { x: selectionRect.x + selectionRect.width / 2, y: selectionRect.y }
      case "topRight":
        return { x: selectionRect.x + selectionRect.width, y: selectionRect.y }
      case "midLeft":
        return { x: selectionRect.x, y: selectionRect.y + selectionRect.height / 2 }
      case "midMid":
        return { x: selectionRect.x + selectionRect.width / 2, y: selectionRect.y + selectionRect.height / 2 }
      case "midRight":
        return { x: selectionRect.x + selectionRect.width, y: selectionRect.y + selectionRect.height / 2 }
      case "botLeft":
        return { x: selectionRect.x, y: selectionRect.y + selectionRect.height }
      case "botMid":
        return { x: selectionRect.x + selectionRect.width / 2, y: selectionRect.y + selectionRect.height }
      case "botRight":
        return { x: selectionRect.x + selectionRect.width, y: selectionRect.y + selectionRect.height }
    }
  }

  private _checkOrigin() {
    if (this._originTopLeft.checked)
      this._transformOrigin = "topLeft";
    else if (this._originTopMid.checked)
      this._transformOrigin = "topMid";
    else if (this._originTopRight.checked)
      this._transformOrigin = "topRight";
    else if (this._originMidLeft.checked)
      this._transformOrigin = "midLeft";
    else if (this._originMidMid.checked)
      this._transformOrigin = "midMid";
    else if (this._originMidRight.checked)
      this._transformOrigin = "midRight";
    else if (this._originBotLeft.checked)
      this._transformOrigin = "botLeft";
    else if (this._originBotMid.checked)
      this._transformOrigin = "botMid";
    else if (this._originBotRight.checked)
      this._transformOrigin = "botRight";
  }


  private _calculateTransform(selectionRect: IRect, origin: IPoint, itemRect: IRect, rotation: number, inputPos: IPoint, transformMode: 'relative' | 'absolute'): IPoint {
    let newPoint: IPoint;
    // convert deg in rad
    rotation = rotation * (Math.PI / 180);
    if (transformMode == 'absolute') {
      if (inputPos.x)
        inputPos.x = inputPos.x - selectionRect.x;
      if (inputPos.y)
        inputPos.y = inputPos.y - selectionRect.y;

    }
    origin = {
      x: origin.x - itemRect.width / 2,
      y: origin.y - itemRect.height / 2
    }
    let diffItemPosToOrigin: IPoint = {
      x: itemRect.x - origin.x,
      y: itemRect.y - origin.y
    }

    newPoint = {
      x: Math.cos(rotation) * diffItemPosToOrigin.x - Math.sin(rotation) * diffItemPosToOrigin.y + origin.x + inputPos.x,
      y: Math.sin(rotation) * diffItemPosToOrigin.x + Math.cos(rotation) * diffItemPosToOrigin.y + origin.y + inputPos.y
    }

    return newPoint;
  }

  private _applySpacing(selection: IDesignItem[]) {
    let xSpacing = this._inputSpacingX.valueAsNumber;
    let ySpacing = this._inputSpacingY.valueAsNumber;

    if (!isNaN(xSpacing)) {
      let sortedSelectionX = selection.sort((a, b) => {
        return parseFloat(a.getStyle("left")) - parseFloat(b.getStyle("left"));
      });
      let xStartPos = parseFloat(sortedSelectionX[0].getStyle("left"));
      for (let i = 0; i < sortedSelectionX.length; i++) {
        sortedSelectionX[i].setStyle("left", (i * xSpacing + xStartPos) + "px");
      }
    }

    if (!isNaN(ySpacing)) {
      let sortedSelectionY = selection.sort((a, b) => {
        return parseFloat(a.getStyle("top")) - parseFloat(b.getStyle("top"));
      });
      let yStartPos = parseFloat(sortedSelectionY[0].getStyle("top"));
      for (let i = 0; i < sortedSelectionY.length; i++) {
        sortedSelectionY[i].setStyle("top", (i * ySpacing + yStartPos) + "px");
      }
    }

  }
}


customElements.define('node-projects-designer-transform-tool-popup', TransformToolPopup);