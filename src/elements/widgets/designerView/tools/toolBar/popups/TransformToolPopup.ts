import { html, BaseCustomWebComponentConstructorAppend, css } from '@node-projects/base-custom-webcomponent';
import { DesignerToolbar } from '../DesignerToolbar';
import { filterChildPlaceItems } from '../../../../../helper/LayoutHelper';

export class TransformToolPopup extends BaseCustomWebComponentConstructorAppend {

  private _relativeButton: HTMLButtonElement;
  private _absoluteButton: HTMLButtonElement;
  private _applyButton: HTMLButtonElement;

  private _inputX: HTMLInputElement;
  private _inputY: HTMLInputElement;
  private _inputR: HTMLInputElement;

  private _originTopLeft: HTMLInputElement;
  private _originTopMid: HTMLInputElement;
  private _originTopRight: HTMLInputElement;
  private _originMidLeft: HTMLInputElement;
  private _originMidMid: HTMLInputElement;
  private _originMidRight: HTMLInputElement;
  private _originBotLeft: HTMLInputElement;
  private _originBotMid: HTMLInputElement;
  private _originBotRight: HTMLInputElement;

  private _positionMode: "relative" | "absolute";
  private _transformOrigin: "topLeft" | "topMid" | "topRight" | "midLeft" | "midMid" | "midRight" | "botLeft" | "botMid" | "botRight";

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
      #input-div{
        display: grid;
        grid-template-columns: 1fr 9fr;
        grid-template-rows: 25px 25px 25px;
        grid-row-gap: 2px;
        font-size: small;
        margin: 10px;
      }
      #button-div{
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 25px;
        font-size: small;
        margin: 10px;
        grid-column-gap: 5px
      }
      #apply-div{
        font-size: small;
        justify-content: center;
        width: 100%;
        margin-top: 10px;
        margin-bottom: 10px;
        display: flex;
      }
      #cube{
        display: grid;
        grid-template-columns: 20px 20px 20px;
        grid-template-rows: 20px 20px 20px;
        grid-gap: 10px;
        padding: 10px;
        top: -80px;
        position: relative;
      }
      #cube-background{
        width: 60px;
        height: 60px;
        background: gray;
        margin-top: 20px;
        margin-left: 20px;
      }
      `

  static override template = html`
        <div class="container">
          <header>
            <h2 id="title" style="margin:0px;">Transform</h2>
          </header>
          <main id="content-area">
            <div id="input-div">
              <span>X:</span>
              <input type="number" id="transform-input-x">
              <span>Y:</span>
              <input type="number" id="transform-input-y">
              <span>R:</span>
              <input type="number" id="transform-input-r">
            </div>
            <div id="button-div">
              <button id="transform-button-absolute">absolute</button>
              <button id="transform-button-relative">relative</button>
            </div>

            <div style="justify-content: center; display: grid; height: 100px">
              <div id="cube-background"></div>
                <div id="cube">
                  <input id="origin-top-left" type="radio" name="origin-radio">
                  <input id="origin-top-mid" type="radio" name="origin-radio">
                  <input id="origin-top-right" type="radio" name="origin-radio">
                  <input id="origin-mid-left" type="radio" name="origin-radio">
                  <input id="origin-mid-mid" type="radio" name="origin-radio" checked>
                  <input id="origin-mid-right" type="radio" name="origin-radio">
                  <input id="origin-bot-left" type="radio" name="origin-radio">
                  <input id="origin-bot-mid" type="radio" name="origin-radio">
                  <input id="origin-bot-right" type="radio" name="origin-radio">
                </div>
            </div>

            <div id="apply-div">
              <button id="transform-button-apply" style="width:100px;">apply</button>
            </div>
          </main>
        </div>`;

  constructor() {
    super();

    this._relativeButton = this._getDomElement<HTMLButtonElement>("transform-button-relative");
    this._absoluteButton = this._getDomElement<HTMLButtonElement>("transform-button-absolute");
    this._applyButton = this._getDomElement<HTMLButtonElement>("transform-button-apply");

    this._inputX = this._getDomElement<HTMLInputElement>("transform-input-x");
    this._inputY = this._getDomElement<HTMLInputElement>("transform-input-y");
    this._inputR = this._getDomElement<HTMLInputElement>("transform-input-r");

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

    this._positionMode = "relative";
    this._changePositionMode(this._positionMode);
  }

  private _changePositionMode(mode: "relative" | "absolute") {
    if (mode == "relative") {
      this._relativeButton.style.backgroundColor = "#6F8A9D";
      this._relativeButton.style.color = "black"
      this._absoluteButton.style.backgroundColor = "#A4B5C1";
      this._absoluteButton.style.color = "#77716E"
    }
    else {
      this._absoluteButton.style.backgroundColor = "#6F8A9D";
      this._absoluteButton.style.color = "black"
      this._relativeButton.style.backgroundColor = "#A4B5C1";
      this._relativeButton.style.color = "#77716E"
    }
    this._positionMode = mode;
  }

  private _applyTransform() {
    this._checkOrigin();
    let designerView = (<DesignerToolbar>(<ShadowRoot>this.getRootNode()).host).designerView;
    let selection = designerView.instanceServiceContainer.selectionService.selectedElements;
    selection = filterChildPlaceItems(selection);
    console.log("Mode: ", this._positionMode);
    console.log(selection)
    if (selection) {
      let x = this._inputX.valueAsNumber;
      let y = this._inputY.valueAsNumber;
      let r = this._inputR.valueAsNumber;
      if (this._positionMode == "absolute") {
        x = x - designerView.designerCanvas.getNormalizedElementCoordinates(selection[0].element).x;
        y = y - designerView.designerCanvas.getNormalizedElementCoordinates(selection[0].element).y;
      }
      let grp = selection[0].openGroup("Transform selection")
      for (let item of selection) {
        let itemX = parseFloat(item.getStyle("left"));
        let itemY = parseFloat(item.getStyle("top"));
        item.setStyle("left", (itemX + x).toString() + "px");
        item.setStyle("top", (itemY + y).toString() + "px");
        item.setStyle("transform", "rotate(" + r + "deg)");
      }
      grp.commit();
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
}


customElements.define('node-projects-designer-transformtool-popup', TransformToolPopup);