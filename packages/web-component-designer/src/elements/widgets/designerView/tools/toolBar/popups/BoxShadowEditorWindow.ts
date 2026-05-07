import { css } from '@node-projects/base-custom-webcomponent';
import { DraggableToolWindow } from './DraggableToolWindow.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';

interface BoxShadowLayer {
  inset: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  enabled: boolean;
}

function defaultLayer(): BoxShadowLayer {
  return { inset: false, offsetX: 5, offsetY: 5, blur: 10, spread: 0, color: '#000000', opacity: 50, enabled: true };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Splits a box-shadow value string into individual shadow tokens,
 * correctly ignoring commas inside color functions like rgba().
 */
function splitShadowLayers(value: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) layers.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) layers.push(trimmed);
  return layers;
}

function parseCssBoxShadow(value: string): BoxShadowLayer[] {
  if (!value || value === 'none') return [defaultLayer()];
  const layers: BoxShadowLayer[] = [];
  for (const token of splitShadowLayers(value)) {
    const layer = parseOneShadowLayer(token.trim());
    if (layer) layers.push(layer);
  }
  return layers.length ? layers : [defaultLayer()];
}

function parseOneShadowLayer(token: string): BoxShadowLayer | null {
  // Extract color function first (rgb/rgba/hsl/hsla) to avoid its spaces confusing token split
  let color = '#000000';
  let opacity = 100;
  let remaining = token;

  const colorFnMatch = remaining.match(/(rgba?\([^)]+\)|hsla?\([^)]+\))/);
  if (colorFnMatch) {
    const fn = colorFnMatch[1];
    remaining = remaining.replace(fn, '').trim();
    const rgbaMatch = fn.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (rgbaMatch) {
      color = rgbToHex(parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]));
      opacity = rgbaMatch[4] != null ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
    }
  } else {
    // Try hex color
    const hexMatch = remaining.match(/(#[0-9a-fA-F]{3,8})/);
    if (hexMatch) {
      color = hexMatch[1].length === 4
        ? '#' + hexMatch[1].slice(1).split('').map(c => c + c).join('')
        : hexMatch[1].slice(0, 7);
      remaining = remaining.replace(hexMatch[1], '').trim();
    }
  }

  // What remains: [inset] offsetX offsetY [blur] [spread]
  const parts = remaining.split(/\s+/).filter(Boolean);
  let inset = false;
  const numbers: number[] = [];
  for (const p of parts) {
    if (p === 'inset') { inset = true; continue; }
    const n = parseFloat(p);
    if (!isNaN(n)) numbers.push(n);
  }
  if (numbers.length < 2) return null;
  return {
    inset,
    offsetX: numbers[0] ?? 0,
    offsetY: numbers[1] ?? 0,
    blur: numbers[2] ?? 0,
    spread: numbers[3] ?? 0,
    color,
    opacity,
    enabled: true,
  };
}

function layerToCss(l: BoxShadowLayer): string {
  const rgb = hexToRgb(l.color);
  const a = (l.opacity / 100).toFixed(2);
  return `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px rgba(${rgb},${a})`;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export class BoxShadowEditorWindow extends DraggableToolWindow {
  private _designerCanvas: IDesignerCanvas;
  private _layers: BoxShadowLayer[] = [defaultLayer()];
  private _selectedIndex = 0;

  // List
  private _layerList: HTMLUListElement;
  private _removeBtn: HTMLButtonElement;

  // Controls
  private _insetCheck: HTMLInputElement;
  private _enabledCheck: HTMLInputElement;
  private _inputX: HTMLInputElement;
  private _inputY: HTMLInputElement;
  private _inputBlur: HTMLInputElement;
  private _inputSpread: HTMLInputElement;
  private _inputColor: HTMLInputElement;
  private _inputOpacity: HTMLInputElement;
  private _opacityVal: HTMLSpanElement;

  // Preview
  private _previewBox: HTMLDivElement;

  // Output
  private _cssOutput: HTMLTextAreaElement;
  private _loadBtn: HTMLButtonElement;
  private _copyBtn: HTMLButtonElement;
  private _applyBtn: HTMLButtonElement;

  protected override get windowTitle(): string { return 'Box Shadow Editor'; }

  protected override get windowContentStyle(): CSSStyleSheet {
    return css`
      * { box-sizing: border-box; }
      .bse-root {
        display: flex;
        flex-direction: column;
        width: 380px;
        color: #ddd;
        font-family: sans-serif;
        font-size: 12px;
        padding: 8px;
        gap: 8px;
        background: #2c2c2c;
      }
      .preview-area {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 110px;
        background: repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 0 0 / 16px 16px;
        border-radius: 4px;
        border: 1px solid #111;
      }
      .preview-box {
        width: 70px;
        height: 70px;
        background: #fff;
        border-radius: 4px;
      }
      .layers-row {
        display: flex;
        gap: 6px;
        align-items: flex-start;
      }
      .layer-list {
        list-style: none;
        margin: 0;
        padding: 0;
        flex: 1;
        min-height: 60px;
        max-height: 100px;
        overflow-y: auto;
        background: #1e1e1e;
        border: 1px solid #111;
        border-radius: 3px;
      }
      .layer-list li {
        padding: 4px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .layer-list li.selected {
        background: #3a3a5a;
      }
      .layer-list li .swatch {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        border: 1px solid #555;
        flex-shrink: 0;
        display: inline-block;
      }
      .layer-list li .disabled-label { opacity: 0.4; }
      .layer-buttons {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .layer-buttons button {
        width: 24px;
        height: 24px;
        padding: 0;
        font-size: 14px;
        background: #444;
        color: #ddd;
        border: 1px solid #222;
        border-radius: 3px;
        cursor: pointer;
        line-height: 1;
      }
      .layer-buttons button:hover { background: #666; }
      .controls {
        display: grid;
        grid-template-columns: 90px 1fr 36px;
        gap: 4px 6px;
        align-items: center;
      }
      .controls label { color: #aaa; }
      .controls input[type=range] { width: 100%; }
      .controls input[type=number] {
        width: 100%;
        background: #1e1e1e;
        border: 1px solid #444;
        color: #ddd;
        border-radius: 3px;
        padding: 2px 4px;
      }
      .controls input[type=color] {
        width: 100%;
        height: 24px;
        padding: 1px;
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 3px;
        cursor: pointer;
      }
      .check-row {
        display: flex;
        gap: 14px;
        align-items: center;
        margin-bottom: 2px;
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
        height: 48px;
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
      <div class="bse-root">
        <div class="preview-area">
          <div class="preview-box" id="bse-preview"></div>
        </div>

        <div class="layers-row">
          <ul class="layer-list" id="bse-layer-list"></ul>
          <div class="layer-buttons">
            <button id="bse-add-btn" title="Add layer">+</button>
            <button id="bse-dup-btn" title="Duplicate layer">⧉</button>
            <button id="bse-up-btn" title="Move up">↑</button>
            <button id="bse-down-btn" title="Move down">↓</button>
            <button id="bse-remove-btn" title="Remove layer">−</button>
          </div>
        </div>

        <div class="check-row">
          <label><input type="checkbox" id="bse-enabled"> Enabled</label>
          <label><input type="checkbox" id="bse-inset"> Inset</label>
        </div>

        <div class="controls">
          <label>Offset X</label>
          <input type="range" id="bse-x" min="-100" max="100" step="1">
          <span class="val-label" id="bse-x-val">0px</span>

          <label>Offset Y</label>
          <input type="range" id="bse-y" min="-100" max="100" step="1">
          <span class="val-label" id="bse-y-val">0px</span>

          <label>Blur</label>
          <input type="range" id="bse-blur" min="0" max="200" step="1">
          <span class="val-label" id="bse-blur-val">0px</span>

          <label>Spread</label>
          <input type="range" id="bse-spread" min="-50" max="100" step="1">
          <span class="val-label" id="bse-spread-val">0px</span>

          <label>Color</label>
          <input type="color" id="bse-color" value="#000000">
          <span></span>

          <label>Opacity</label>
          <input type="range" id="bse-opacity" min="0" max="100" step="1">
          <span class="val-label" id="bse-opacity-val">100%</span>
        </div>

        <textarea class="css-out" id="bse-css-out"></textarea>

        <div class="actions">
          <button class="load-btn" id="bse-load-btn">Load</button>
          <button id="bse-copy-btn">Copy CSS</button>
          <button class="apply-btn" id="bse-apply-btn">Apply to selection</button>
        </div>
      </div>`;
  }

  constructor(designerCanvas?: IDesignerCanvas) {
    super();
    this._designerCanvas = designerCanvas;

    this._layerList = this._getDomElement<HTMLUListElement>('bse-layer-list');
    this._removeBtn = this._getDomElement<HTMLButtonElement>('bse-remove-btn');
    this._insetCheck = this._getDomElement<HTMLInputElement>('bse-inset');
    this._enabledCheck = this._getDomElement<HTMLInputElement>('bse-enabled');
    this._inputX = this._getDomElement<HTMLInputElement>('bse-x');
    this._inputY = this._getDomElement<HTMLInputElement>('bse-y');
    this._inputBlur = this._getDomElement<HTMLInputElement>('bse-blur');
    this._inputSpread = this._getDomElement<HTMLInputElement>('bse-spread');
    this._inputColor = this._getDomElement<HTMLInputElement>('bse-color');
    this._inputOpacity = this._getDomElement<HTMLInputElement>('bse-opacity');
    this._opacityVal = this._getDomElement<HTMLSpanElement>('bse-opacity-val');
    this._previewBox = this._getDomElement<HTMLDivElement>('bse-preview');
    this._cssOutput = this._getDomElement<HTMLTextAreaElement>('bse-css-out');
    this._loadBtn = this._getDomElement<HTMLButtonElement>('bse-load-btn');
    this._copyBtn = this._getDomElement<HTMLButtonElement>('bse-copy-btn');
    this._applyBtn = this._getDomElement<HTMLButtonElement>('bse-apply-btn');

    this._getDomElement<HTMLButtonElement>('bse-add-btn').onclick = () => this._addLayer();
    this._getDomElement<HTMLButtonElement>('bse-dup-btn').onclick = () => this._duplicateLayer();
    this._getDomElement<HTMLButtonElement>('bse-up-btn').onclick = () => this._moveLayer(-1);
    this._getDomElement<HTMLButtonElement>('bse-down-btn').onclick = () => this._moveLayer(1);
    this._removeBtn.onclick = () => this._removeLayer();

    this._insetCheck.onchange = () => { this._currentLayer().inset = this._insetCheck.checked; this._refresh(); };
    this._enabledCheck.onchange = () => { this._currentLayer().enabled = this._enabledCheck.checked; this._refresh(); };

    for (const [input, key, valId] of [
      [this._inputX, 'offsetX', 'bse-x-val'],
      [this._inputY, 'offsetY', 'bse-y-val'],
      [this._inputBlur, 'blur', 'bse-blur-val'],
      [this._inputSpread, 'spread', 'bse-spread-val'],
    ] as [HTMLInputElement, keyof BoxShadowLayer, string][]) {
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

    this._copyBtn.onclick = () => {
      navigator.clipboard?.writeText(this._cssOutput.value).catch(() => {});
    };
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
    const existing = primary.getStyle('box-shadow');
    if (existing) {
      this._layers = parseCssBoxShadow(existing);
      this._selectedIndex = 0;
    }
  }

  private _currentLayer(): BoxShadowLayer {
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
    const clone = { ...this._currentLayer() };
    this._layers.splice(this._selectedIndex + 1, 0, clone);
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
      lbl.textContent = `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px`;
      if (!l.enabled) lbl.classList.add('disabled-label');
      li.appendChild(lbl);
      li.onclick = () => { this._selectedIndex = i; this._renderList(); this._loadControls(); };
      this._layerList.appendChild(li);
    });
  }

  private _loadControls() {
    const l = this._currentLayer();
    this._insetCheck.checked = l.inset;
    this._enabledCheck.checked = l.enabled;
    this._inputX.value = String(l.offsetX);
    this._getDomElement<HTMLSpanElement>('bse-x-val').textContent = l.offsetX + 'px';
    this._inputY.value = String(l.offsetY);
    this._getDomElement<HTMLSpanElement>('bse-y-val').textContent = l.offsetY + 'px';
    this._inputBlur.value = String(l.blur);
    this._getDomElement<HTMLSpanElement>('bse-blur-val').textContent = l.blur + 'px';
    this._inputSpread.value = String(l.spread);
    this._getDomElement<HTMLSpanElement>('bse-spread-val').textContent = l.spread + 'px';
    this._inputColor.value = l.color;
    this._inputOpacity.value = String(l.opacity);
    this._opacityVal.textContent = l.opacity + '%';
  }

  private _buildCss(): string {
    return this._layers.filter(l => l.enabled).map(layerToCss).join(', ') || 'none';
  }

  private _refresh() {
    const cssVal = this._buildCss();
    this._previewBox.style.boxShadow = cssVal;
    this._cssOutput.value = `box-shadow: ${cssVal};`;
    this._renderList();
  }

  private _applyToSelection() {
    if (!this._designerCanvas) return;
    const selection = this._designerCanvas.instanceServiceContainer.selectionService.selectedElements;
    if (!selection?.length) return;
    const cssVal = this._buildCss();
    const grp = selection[0].openGroup('Apply box-shadow');
    for (const item of selection) {
      item.setStyle('box-shadow', cssVal);
    }
    grp.commit();
  }
}

customElements.define('node-projects-designer-box-shadow-editor', BoxShadowEditorWindow);
