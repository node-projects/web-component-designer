import { css } from '@node-projects/base-custom-webcomponent';
import { DraggableToolWindow } from './DraggableToolWindow.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';

interface TextShadowLayer {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
  opacity: number;
  enabled: boolean;
}

function defaultLayer(): TextShadowLayer {
  return { offsetX: 2, offsetY: 2, blur: 4, color: '#000000', opacity: 50, enabled: true };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function splitLayers(value: string): string[] {
  const layers: string[] = [];
  let depth = 0, current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      const t = current.trim();
      if (t) layers.push(t);
      current = '';
      continue;
    }
    current += ch;
  }
  const t = current.trim();
  if (t) layers.push(t);
  return layers;
}

function layerToCss(l: TextShadowLayer): string {
  const a = (l.opacity / 100).toFixed(2);
  return `${l.offsetX}px ${l.offsetY}px ${l.blur}px rgba(${hexToRgb(l.color)},${a})`;
}

function parseCssTextShadow(value: string): TextShadowLayer[] {
  if (!value || value === 'none') return [defaultLayer()];
  const layers: TextShadowLayer[] = [];
  for (const token of splitLayers(value)) {
    const layer = parseOneLayer(token.trim());
    if (layer) layers.push(layer);
  }
  return layers.length ? layers : [defaultLayer()];
}

function parseOneLayer(token: string): TextShadowLayer | null {
  let color = '#000000', opacity = 100;
  let remaining = token;

  const colorFnMatch = remaining.match(/(rgba?\([^)]+\)|hsla?\([^)]+\))/);
  if (colorFnMatch) {
    const fn = colorFnMatch[1];
    remaining = remaining.replace(fn, '').trim();
    const m = fn.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (m) {
      color = rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
      opacity = m[4] != null ? Math.round(parseFloat(m[4]) * 100) : 100;
    }
  } else {
    const hexMatch = remaining.match(/(#[0-9a-fA-F]{3,8})/);
    if (hexMatch) {
      color = hexMatch[1].length === 4
        ? '#' + hexMatch[1].slice(1).split('').map(c => c + c).join('')
        : hexMatch[1].slice(0, 7);
      remaining = remaining.replace(hexMatch[1], '').trim();
    }
  }

  const numbers = remaining.split(/\s+/).filter(Boolean).map(p => parseFloat(p)).filter(n => !isNaN(n));
  if (numbers.length < 2) return null;
  return { offsetX: numbers[0] ?? 0, offsetY: numbers[1] ?? 0, blur: numbers[2] ?? 0, color, opacity, enabled: true };
}

export class TextShadowEditorWindow extends DraggableToolWindow {
  private _designerCanvas: IDesignerCanvas;
  private _layers: TextShadowLayer[] = [defaultLayer()];
  private _selectedIndex = 0;

  private _layerList: HTMLUListElement;
  private _removeBtn: HTMLButtonElement;
  private _enabledCheck: HTMLInputElement;
  private _inputX: HTMLInputElement;
  private _inputY: HTMLInputElement;
  private _inputBlur: HTMLInputElement;
  private _inputColor: HTMLInputElement;
  private _inputOpacity: HTMLInputElement;
  private _opacityVal: HTMLSpanElement;
  private _previewText: HTMLDivElement;
  private _cssOutput: HTMLTextAreaElement;
  private _loadBtn: HTMLButtonElement;
  private _copyBtn: HTMLButtonElement;
  private _applyBtn: HTMLButtonElement;

  protected override get windowTitle(): string { return 'Text Shadow Editor'; }

  protected override get windowContentStyle(): CSSStyleSheet {
    return css`
      * { box-sizing: border-box; }
      .tse-root {
        display: flex;
        flex-direction: column;
        width: 360px;
        color: #ddd;
        font-family: sans-serif;
        font-size: 12px;
        gap: 6px;
        padding: 8px;
        background: #2a2a2a;
      }
      .preview-area {
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .preview-text {
        font-size: 28px;
        font-weight: bold;
        color: #fff;
        user-select: none;
      }
      .layers-row {
        display: flex;
        gap: 4px;
      }
      .layer-list {
        flex: 1;
        list-style: none;
        margin: 0;
        padding: 0;
        border: 1px solid #444;
        border-radius: 3px;
        max-height: 80px;
        overflow-y: auto;
        background: #1e1e1e;
      }
      .layer-list li {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 2px 5px;
        cursor: pointer;
        font-size: 11px;
      }
      .layer-list li:hover { background: #333; }
      .layer-list li.selected { background: #2a4a7a; }
      .swatch {
        width: 12px; height: 12px;
        border-radius: 2px;
        border: 1px solid #555;
        flex-shrink: 0;
      }
      .disabled-label { opacity: 0.4; }
      .layer-buttons {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .layer-buttons button {
        width: 22px; height: 22px;
        background: #3a3a3a;
        color: #ddd;
        border: 1px solid #555;
        border-radius: 3px;
        cursor: pointer;
        font-size: 13px;
        padding: 0;
      }
      .layer-buttons button:hover { background: #555; }
      .controls {
        display: grid;
        grid-template-columns: 60px 1fr 38px;
        gap: 3px 6px;
        align-items: center;
      }
      .controls label { color: #aaa; }
      .controls input[type=range] { width: 100%; }
      .controls input[type=color] {
        width: 100%;
        height: 22px;
        padding: 1px;
        border: 1px solid #555;
        border-radius: 3px;
        background: #1e1e1e;
        cursor: pointer;
      }
      .check-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .check-row label {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        user-select: none;
      }
      .css-out {
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 3px;
        color: #7ec8e3;
        font-family: monospace;
        font-size: 11px;
        padding: 6px;
        resize: none;
        width: 100%;
        height: 40px;
      }
      .actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }
      .actions .load-btn { margin-right: auto; }
      .actions button, .apply-btn {
        padding: 4px 12px;
        background: #3a3a3a;
        color: #ddd;
        border: 1px solid #555;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      .actions button:hover, .apply-btn:hover { background: #555; }
      .apply-btn {
        background: #3a6a9a;
        border-color: #2a5a8a;
      }
      .apply-btn:hover { background: #4a7aaa; }
      .val-label { text-align: right; color: #888; }
    `;
  }

  protected override get windowTemplate(): string {
    return `
      <div class="tse-root">
        <div class="preview-area">
          <div class="preview-text" id="tse-preview">Sample Text</div>
        </div>

        <div class="layers-row">
          <ul class="layer-list" id="tse-layer-list"></ul>
          <div class="layer-buttons">
            <button id="tse-add-btn" title="Add layer">+</button>
            <button id="tse-dup-btn" title="Duplicate layer">⧉</button>
            <button id="tse-up-btn" title="Move up">↑</button>
            <button id="tse-down-btn" title="Move down">↓</button>
            <button id="tse-remove-btn" title="Remove layer">−</button>
          </div>
        </div>

        <div class="check-row">
          <label><input type="checkbox" id="tse-enabled"> Enabled</label>
        </div>

        <div class="controls">
          <label>Offset X</label>
          <input type="range" id="tse-x" min="-50" max="50" step="1">
          <span class="val-label" id="tse-x-val">0px</span>

          <label>Offset Y</label>
          <input type="range" id="tse-y" min="-50" max="50" step="1">
          <span class="val-label" id="tse-y-val">0px</span>

          <label>Blur</label>
          <input type="range" id="tse-blur" min="0" max="100" step="1">
          <span class="val-label" id="tse-blur-val">0px</span>

          <label>Color</label>
          <input type="color" id="tse-color" value="#000000">
          <span></span>

          <label>Opacity</label>
          <input type="range" id="tse-opacity" min="0" max="100" step="1">
          <span class="val-label" id="tse-opacity-val">100%</span>
        </div>

        <textarea class="css-out" id="tse-css-out"></textarea>

        <div class="actions">
          <button class="load-btn" id="tse-load-btn">Load</button>
          <button id="tse-copy-btn">Copy CSS</button>
          <button class="apply-btn" id="tse-apply-btn">Apply to selection</button>
        </div>
      </div>`;
  }

  constructor(designerCanvas?: IDesignerCanvas) {
    super();
    this._designerCanvas = designerCanvas;

    this._layerList = this._getDomElement<HTMLUListElement>('tse-layer-list');
    this._removeBtn = this._getDomElement<HTMLButtonElement>('tse-remove-btn');
    this._enabledCheck = this._getDomElement<HTMLInputElement>('tse-enabled');
    this._inputX = this._getDomElement<HTMLInputElement>('tse-x');
    this._inputY = this._getDomElement<HTMLInputElement>('tse-y');
    this._inputBlur = this._getDomElement<HTMLInputElement>('tse-blur');
    this._inputColor = this._getDomElement<HTMLInputElement>('tse-color');
    this._inputOpacity = this._getDomElement<HTMLInputElement>('tse-opacity');
    this._opacityVal = this._getDomElement<HTMLSpanElement>('tse-opacity-val');
    this._previewText = this._getDomElement<HTMLDivElement>('tse-preview');
    this._cssOutput = this._getDomElement<HTMLTextAreaElement>('tse-css-out');
    this._loadBtn = this._getDomElement<HTMLButtonElement>('tse-load-btn');
    this._copyBtn = this._getDomElement<HTMLButtonElement>('tse-copy-btn');
    this._applyBtn = this._getDomElement<HTMLButtonElement>('tse-apply-btn');

    this._getDomElement<HTMLButtonElement>('tse-add-btn').onclick = () => this._addLayer();
    this._getDomElement<HTMLButtonElement>('tse-dup-btn').onclick = () => this._duplicateLayer();
    this._getDomElement<HTMLButtonElement>('tse-up-btn').onclick = () => this._moveLayer(-1);
    this._getDomElement<HTMLButtonElement>('tse-down-btn').onclick = () => this._moveLayer(1);
    this._removeBtn.onclick = () => this._removeLayer();

    this._enabledCheck.onchange = () => { this._currentLayer().enabled = this._enabledCheck.checked; this._refresh(); };

    for (const [input, key, valId] of [
      [this._inputX, 'offsetX', 'tse-x-val'],
      [this._inputY, 'offsetY', 'tse-y-val'],
      [this._inputBlur, 'blur', 'tse-blur-val'],
    ] as [HTMLInputElement, keyof TextShadowLayer, string][]) {
      input.oninput = () => {
        (this._currentLayer() as any)[key] = Number(input.value);
        this._getDomElement<HTMLSpanElement>(valId).textContent = input.value + 'px';
        this._refresh();
      };
    }

    this._inputColor.oninput = () => { this._currentLayer().color = this._inputColor.value; this._refresh(); };
    this._inputOpacity.oninput = () => {
      this._currentLayer().opacity = Number(this._inputOpacity.value);
      this._opacityVal.textContent = this._inputOpacity.value + '%';
      this._refresh();
    };

    this._copyBtn.onclick = () => { navigator.clipboard?.writeText(this._cssOutput.value).catch(() => {}); };
    this._applyBtn.onclick = () => this._applyToSelection();
    this._loadBtn.onclick = () => {
      this._loadFromPrimarySelection();
      this._renderList();
      this._loadControls();
      this._refresh();
    };

    this._loadFromPrimarySelection();
    this._renderList();
    this._loadControls();
    this._refresh();
  }

  private _loadFromPrimarySelection() {
    const primary = this._designerCanvas?.instanceServiceContainer?.selectionService?.primarySelection;
    if (!primary) return;
    const existing = primary.getStyle('text-shadow');
    if (existing) {
      this._layers = parseCssTextShadow(existing);
      this._selectedIndex = 0;
    }
  }

  private _currentLayer(): TextShadowLayer {
    return this._layers[this._selectedIndex];
  }

  private _addLayer() {
    this._layers.push(defaultLayer());
    this._selectedIndex = this._layers.length - 1;
    this._renderList();
    this._loadControls();
    this._refresh();
  }

  private _duplicateLayer() {
    this._layers.splice(this._selectedIndex + 1, 0, { ...this._currentLayer() });
    this._selectedIndex = this._selectedIndex + 1;
    this._renderList();
    this._loadControls();
    this._refresh();
  }

  private _removeLayer() {
    if (this._layers.length <= 1) return;
    this._layers.splice(this._selectedIndex, 1);
    this._selectedIndex = Math.min(this._selectedIndex, this._layers.length - 1);
    this._renderList();
    this._loadControls();
    this._refresh();
  }

  private _moveLayer(dir: -1 | 1) {
    const i = this._selectedIndex;
    const j = i + dir;
    if (j < 0 || j >= this._layers.length) return;
    [this._layers[i], this._layers[j]] = [this._layers[j], this._layers[i]];
    this._selectedIndex = j;
    this._renderList();
    this._refresh();
  }

  private _renderList() {
    this._layerList.innerHTML = '';
    this._layers.forEach((l, i) => {
      const li = document.createElement('li');
      if (i === this._selectedIndex) li.classList.add('selected');
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = l.color;
      li.appendChild(swatch);
      const lbl = document.createElement('span');
      lbl.textContent = `${l.offsetX}px ${l.offsetY}px ${l.blur}px`;
      if (!l.enabled) lbl.classList.add('disabled-label');
      li.appendChild(lbl);
      li.onclick = () => { this._selectedIndex = i; this._renderList(); this._loadControls(); };
      this._layerList.appendChild(li);
    });
  }

  private _loadControls() {
    const l = this._currentLayer();
    this._enabledCheck.checked = l.enabled;
    this._inputX.value = String(l.offsetX);
    this._getDomElement<HTMLSpanElement>('tse-x-val').textContent = l.offsetX + 'px';
    this._inputY.value = String(l.offsetY);
    this._getDomElement<HTMLSpanElement>('tse-y-val').textContent = l.offsetY + 'px';
    this._inputBlur.value = String(l.blur);
    this._getDomElement<HTMLSpanElement>('tse-blur-val').textContent = l.blur + 'px';
    this._inputColor.value = l.color;
    this._inputOpacity.value = String(l.opacity);
    this._opacityVal.textContent = l.opacity + '%';
  }

  private _buildCss(): string {
    return this._layers.filter(l => l.enabled).map(layerToCss).join(', ') || 'none';
  }

  private _refresh() {
    const css = this._buildCss();
    this._previewText.style.textShadow = css;
    this._cssOutput.value = css;
    this._renderList();
  }

  private _applyToSelection() {
    const items = this._designerCanvas?.instanceServiceContainer?.selectionService?.selectedElements;
    if (!items?.length) return;
    const cssVal = this._buildCss();
    const group = items[0].openGroup('set text-shadow');
    for (const item of items) {
      if (cssVal === 'none') item.removeStyle('text-shadow');
      else item.setStyle('text-shadow', cssVal);
    }
    group.commit();
  }
}

customElements.define('node-projects-text-shadow-editor-window', TextShadowEditorWindow);
