import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export type ThicknessEditorValueChangedEventArgs = { newValue?: string, oldValue?: string };

export class MetricsEditor extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
:host {
  justify-content: center;
  display: flex;
  margin: 10px;
  line-height: 12px;
  min-width: 120px;
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
  width:280px;height:120px;
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
}

span {
  width: 30%;
  overflow: hidden;
  text-overflow: ellipsis;
}`;

  public static override readonly template = html`
  <div class="ct"><span title="position">position</span>
  <div data-style="position" @keydown="onKeyDown" @dblclick="onDoubleClick" class="top">-</div><br><div data-style="position" @keydown="onKeyDown" @dblclick="onDoubleClick" class="left">-</div><div class="ct"><span title="margin">margin</span>
  <div data-style="margin" @keydown="onKeyDown" @dblclick="onDoubleClick" class="top">-</div><br><div @keydown="onKeyDown" @dblclick="onDoubleClick" class="left">-</div><div class="ct"><span title="border">border</span>
  <div data-style="border" @keydown="onKeyDown" @dblclick="onDoubleClick" class="top">-</div><br><div @keydown="onKeyDown" @dblclick="onDoubleClick" class="left">-</div><div class="ct"><span title="padding">padding</span>
  <div data-style="padding" @keydown="onKeyDown" @dblclick="onDoubleClick" class="top">-</div><br><div @keydown="onKeyDown" @dblclick="onDoubleClick" class="left">-</div><div class="ct" style="font-size:6px"><div data-style="element" @keydown="onKeyDown" @dblclick="onDoubleClick" class="left">-</div>
  &nbsp;x&nbsp;
  <div data-style="element" @keydown="onKeyDown" @dblclick="onDoubleClick" class="right">-</div>
  </div><div data-style="padding" @keydown="onKeyDown" @dblclick="onDoubleClick" class="right">-</div><br><div data-style="padding" @keydown="onKeyDown" @dblclick="onDoubleClick" class="bottom">-</div></div><div data-style="border" @keydown="onKeyDown" @dblclick="onDoubleClick" class="right">-</div><br><div data-style="border" @keydown="onKeyDown" @dblclick="onDoubleClick" class="bottom">-</div></div><div data-style="margin" @keydown="onKeyDown" @dblclick="onDoubleClick" class="right">-</div><br><div data-style="margin" @keydown="onKeyDown" @dblclick="onDoubleClick" class="bottom">-</div></div><div data-style="position" @keydown="onKeyDown" @dblclick="onDoubleClick" class="right">-</div><br><div data-style="position" @keydown="onKeyDown" @dblclick="onDoubleClick" class="bottom">-</div></div>
  `;

  public property: string;
  public unsetValue: string;

  ready() {
    this._parseAttributesToProperties();
    this._assignEvents();
  }

  onDoubleClick(event: PointerEvent) {
    const element = event.target as HTMLDivElement;
    element.setAttribute("contentEditable", "");

    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(element.firstChild, 0);
    range.setEndAfter(element.lastChild);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  onKeyDown(event: KeyboardEvent) {
    const element = event.target as HTMLDivElement;
    if (event.key == "Enter") {
      element.removeAttribute("contentEditable");
      const value = element.innerHTML;
      const valueChangedEvent = new CustomEvent('value-changed', {
        detail: {
          style: element.dataset['style'],
          value: value
        }
      });
      this.dispatchEvent(valueChangedEvent);
    }
  }
}

customElements.define('node-projects-metrics-editor', MetricsEditor);