import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';

export type ThicknessEditorValueChangedEventArgs = { newValue?: string, oldValue?: string };

export class ThicknessEditor extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
  :host {
    margin: 4px;
    margin-left: auto;
    margin-right: auto;
  }
  #container {
    display: grid;
    grid-template-columns: minmax(30px, 40px) minmax(30px, 60px) minmax(30px, 40px);
    grid-template-rows: auto;
    grid-template-areas: 
          "  .   top     ."
          "left middle right"
          "  .  bottom   .";
    column-gap: 2px;
    row-gap: 2px;
  }
  input {
    width: 20px;
    text-align: center;
    font-size: 10px;
    height: 20px;
    padding: 0;
  }
  #left {
    grid-area: left;
    justify-self: end;
  }
  #top {
    grid-area: top;
    align-self: end;
    justify-self: center;
  }
  #right {
    grid-area: right;
    justify-self: start;
  }
  #bottom {
    grid-area: bottom;
    align-self: start;
    justify-self: center;
  }
  #rect {
    grid-area: middle;
    border: 1px solid black;
    background: lightgray;
  }
  `;

  public static override readonly template = html`
    <div id="container">
      <input id="left">
      <input id="top">
      <input id="right">
      <input id="bottom">
      <div id="rect"></div>
    </div>
  `;

  private _leftInput: HTMLInputElement;
  private _topInput: HTMLInputElement;
  private _rightInput: HTMLInputElement;
  private _bottomInput: HTMLInputElement;

  private _valueLeft: string;
  public get valueLeft() {
    return this._valueLeft;
  }
  public set valueLeft(value) {
    const oldValue = this._valueLeft;
    this._valueLeft = value;
    if (oldValue !== value) {
      this._updateValue();
      this.valueLeftChanged.emit({ newValue: value, oldValue: oldValue });
    }
  }
  public valueLeftChanged = new TypedEvent<ThicknessEditorValueChangedEventArgs>();

  private _valueTop: string;
  public get valueTop() {
    return this._valueTop;
  }
  public set valueTop(value) {
    const oldValue = this._valueTop;
    this._valueTop = value;
    if (oldValue !== value) {
      this._updateValue();
      this.valueTopChanged.emit({ newValue: value, oldValue: oldValue });
    }
  }
  public valueTopChanged = new TypedEvent<ThicknessEditorValueChangedEventArgs>();

  private _valueRight: string;
  public get valueRight() {
    return this._valueRight;
  }
  public set valueRight(value) {
    const oldValue = this._valueRight;
    this._valueRight = value;
    if (oldValue !== value) {
      this._updateValue();
      this.valueRightChanged.emit({ newValue: value, oldValue: oldValue });
    }
  }
  public valueRightChanged = new TypedEvent<ThicknessEditorValueChangedEventArgs>();

  private _valueBottom: string;
  public get valueBottom() {
    return this._valueBottom;
  }
  public set valueBottom(value) {
    const oldValue = this._valueBottom;
    this._valueBottom = value;
    if (oldValue !== value) {
      this._updateValue();
      this.valueBottomChanged.emit({ newValue: value, oldValue: oldValue });
    }
  }
  public valueBottomChanged = new TypedEvent<ThicknessEditorValueChangedEventArgs>();

  public property: string;
  public unsetValue: string;

  _updateValue() {
    this._leftInput.value = this.valueLeft;
    this._topInput.value = this.valueTop;
    this._rightInput.value = this.valueRight;
    this._bottomInput.value = this._valueBottom;
  }

  ready() {
    this._parseAttributesToProperties();

    this._leftInput = this._getDomElement<HTMLInputElement>('left');
    this._topInput = this._getDomElement<HTMLInputElement>('top');
    this._rightInput = this._getDomElement<HTMLInputElement>('right');
    this._bottomInput = this._getDomElement<HTMLInputElement>('bottom');

    this._leftInput.onkeyup = (e) => { if (e.key === 'Enter') this._valueLeft = this._leftInput.value };
    this._topInput.onkeyup = (e) => { if (e.key === 'Enter') this._valueTop = this._topInput.value };
    this._rightInput.onkeyup = (e) => { if (e.key === 'Enter') this._valueRight = this._rightInput.value };
    this._bottomInput.onkeyup = (e) => { if (e.key === 'Enter') this._valueBottom = this._bottomInput.value };

    this._leftInput.onblur = (e) => this._valueLeft = this._leftInput.value;
    this._topInput.onblur = (e) => this._valueTop = this._topInput.value;
    this._rightInput.onblur = (e) => this._valueRight = this._rightInput.value;
    this._bottomInput.onblur = (e) => this._valueBottom = this._bottomInput.value;

    this._updateValue();
  }
}

customElements.define('node-projects-thickness-editor', ThicknessEditor);