import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export type ThicknessEditorValueChangedEventArgs = { newValue?: string, oldValue?: string };

export class MetricsEditor extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
:host {
  justify-content: center;
  display: flex;
  margin: 4px;
  line-height: 12px;
}

* { 
  font-size: 12px;
  font-family: monospace;
  color: black;
}

.top {
  display: inline-block;
}
.left {
  display: inline-block;
  vertical-align: middle;
}
.right {
  display: inline-block;
  vertical-align: middle;
}
.bottom {
  display: inline-block;
}

div.ct {
  width:180px;height:120px;
}

div span {
  font-size: 10px;
  position: absolute;
  top: 0;
  left: 0; 
}

div.ct {
  position: relative;
  background: white;
  display: inline-block;
  border: dotted 1px gray;
  text-align: center;
  vertical-align: middle;
}

div.ct > div.ct {
  left: 0;
  top: 0;
  background: #F9CC9F;
  width: calc(100% - 20px);
  height: calc(100% - 26px);
  border-style: dashed;
}

div.ct > div.ct > div.ct {
  background: #FEDC9B;
  border-style: solid;
}

div.ct > div.ct > div.ct > div.ct {
  background: #C4Cf8C;
  border-style: dashed;
}

div.ct > div.ct > div.ct > div.ct > div.ct {
  background: #8Cb6C2;
  border-style: solid;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}`;

  public static override readonly template = html`
  <div class="ct"><span>position</span>
  <div class="top">-</div><br><div class="left">-</div><div class="ct"><span>margin</span>
  <div class="top">-</div><br><div class="left">-</div><div class="ct"><span>border</span>
  <div class="top">-</div><br><div class="left">-</div><div class="ct"><span>padding</span>
  <div class="top">-</div><br><div class="left">-</div><div class="ct" style="font-size:6px"><div class="left">-</div>
  x
  <div class="right">-</div>
  </div><div class="right">-</div><br><div class="bottom">-</div></div><div class="right">-</div><br><div class="bottom">-</div></div><div class="right">-</div><br><div class="bottom">-</div></div><div class="right">-</div><br><div class="bottom">-</div></div>
  `;

  public property: string;
  public unsetValue: string;

  _updateValue() {
    }

  ready() {
    this._parseAttributesToProperties();
    this._updateValue();
  }
}

customElements.define('node-projects-metrics-editor', MetricsEditor);