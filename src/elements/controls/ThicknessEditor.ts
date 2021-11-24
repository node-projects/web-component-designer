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

  private _value: string;
  public get value() {
    return this._value;
  }
  public set value(value) {
    const oldValue = this._value;
    this._value = value;
    this._updateValue();
    this.valueChanged.emit({ newValue: this._value, oldValue: oldValue });
  }
  public valueChanged = new TypedEvent<ThicknessEditorValueChangedEventArgs>();

  public property: string;
  public unsetValue: string;

  _updateValue() {
    
  }

  ready() {
    this._parseAttributesToProperties();

    this._updateValue();
  }
}

customElements.define('node-projects-thickness-editor', ThicknessEditor);