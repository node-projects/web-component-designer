import { css } from '@node-projects/base-custom-webcomponent';
import { DraggableToolWindow } from './DraggableToolWindow.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';

interface GradientStop {
  color: string;    // hex #rrggbb
  opacity: number;  // 0-100
  position: number; // 0-100 (%)
}

type GradientType = 'linear' | 'radial' | 'conic';
type RadialShape = 'circle' | 'ellipse';
type RadialSize = 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner';

interface GradientConfig {
  type: GradientType;
  angle: number;
  radialShape: RadialShape;
  radialSize: RadialSize;
  posX: number;
  posY: number;
  stops: GradientStop[];
  repeating: boolean;
}

function defaultConfig(): GradientConfig {
  return {
    type: 'linear',
    angle: 135,
    radialShape: 'ellipse',
    radialSize: 'farthest-corner',
    posX: 50,
    posY: 50,
    stops: [
      { color: '#667eea', opacity: 100, position: 0 },
      { color: '#764ba2', opacity: 100, position: 100 },
    ],
    repeating: false,
  };
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function stopToCss(s: GradientStop): string {
  return `rgba(${hexToRgb(s.color)},${(s.opacity / 100).toFixed(2)}) ${s.position}%`;
}

function configToCss(cfg: GradientConfig): string {
  const sorted = [...cfg.stops].sort((a, b) => a.position - b.position);
  const stops = sorted.map(stopToCss).join(', ');
  const prefix = cfg.repeating ? 'repeating-' : '';
  if (cfg.type === 'linear') {
    return `${prefix}linear-gradient(${cfg.angle}deg, ${stops})`;
  } else if (cfg.type === 'radial') {
    return `${prefix}radial-gradient(${cfg.radialShape} ${cfg.radialSize} at ${cfg.posX}% ${cfg.posY}%, ${stops})`;
  } else {
    return `${prefix}conic-gradient(from ${cfg.angle}deg at ${cfg.posX}% ${cfg.posY}%, ${stops})`;
  }
}

/**
 * Extracts the first gradient function from a CSS value string,
 * using bracket counting to correctly handle nested functions like rgba().
 */
function extractFirstGradient(value: string): string | null {
  const keywords = ['repeating-linear-gradient', 'repeating-radial-gradient', 'repeating-conic-gradient',
    'linear-gradient', 'radial-gradient', 'conic-gradient'];
  for (const kw of keywords) {
    const idx = value.indexOf(kw + '(');
    if (idx === -1) continue;
    const start = idx + kw.length; // points to '('
    let depth = 0, end = start;
    for (let i = start; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
    }
    return value.slice(idx, end + 1);
  }
  return null;
}

// ─── Parser ────────────────────────────────────────────────────────────────

function splitTopLevel(s: string): string[] {
  const result: string[] = [];
  let depth = 0, current = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) { result.push(current); current = ''; continue; }
    current += ch;
  }
  if (current) result.push(current);
  return result;
}

function parseGradientStop(token: string): GradientStop | null {
  let color = '#000000', opacity = 100, position = 0;
  let remaining = token.trim();
  const colorFnMatch = remaining.match(/^(rgba?\([^)]+\)|hsla?\([^)]+\))/);
  if (colorFnMatch) {
    const fn = colorFnMatch[1];
    remaining = remaining.slice(fn.length).trim();
    const m = fn.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (m) {
      color = rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
      opacity = m[4] != null ? Math.round(parseFloat(m[4]) * 100) : 100;
    }
  } else {
    const hexMatch = remaining.match(/^(#[0-9a-fA-F]{3,8})/);
    if (hexMatch) {
      color = hexMatch[1].length === 4
        ? '#' + hexMatch[1].slice(1).split('').map(c => c + c).join('')
        : hexMatch[1].slice(0, 7);
      remaining = remaining.slice(hexMatch[1].length).trim();
    } else {
      return null; // named color – skip
    }
  }
  const posMatch = remaining.match(/([\d.]+)%/);
  if (posMatch) position = parseFloat(posMatch[1]);
  return { color, opacity, position };
}

function looksLikeStop(token: string): boolean {
  const t = token.trim();
  return t.startsWith('#') || /^rgba?\(/.test(t) || /^hsla?\(/.test(t);
}

function parseGradientCss(value: string): GradientConfig {
  const cfg = defaultConfig();
  if (!value) return cfg;
  const trimmed = value.trim();
  cfg.repeating = trimmed.startsWith('repeating-');
  let inner = cfg.repeating ? trimmed.slice('repeating-'.length) : trimmed;

  if (inner.startsWith('linear-gradient')) cfg.type = 'linear';
  else if (inner.startsWith('radial-gradient')) cfg.type = 'radial';
  else if (inner.startsWith('conic-gradient')) cfg.type = 'conic';
  else return cfg;

  const parenStart = inner.indexOf('(');
  const parenEnd = inner.lastIndexOf(')');
  if (parenStart < 0 || parenEnd < 0) return cfg;
  const content = inner.slice(parenStart + 1, parenEnd);
  const tokens = splitTopLevel(content);

  // Separate gradient-specific args from color stops
  const argTokens: string[] = [];
  let stopStart = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (looksLikeStop(tokens[i])) { stopStart = i; break; }
    argTokens.push(tokens[i]);
    if (i === tokens.length - 1) stopStart = tokens.length;
  }

  // Parse type args
  if (cfg.type === 'linear') {
    const firstArg = argTokens[0]?.trim() ?? '';
    const degMatch = firstArg.match(/^(-?[\d.]+)deg$/);
    if (degMatch) cfg.angle = parseFloat(degMatch[1]);
    else if (firstArg.startsWith('to ')) {
      const toMap: Record<string, number> = {
        'to right': 90, 'to left': 270, 'to bottom': 180, 'to top': 0,
        'to bottom right': 135, 'to bottom left': 225, 'to top right': 45, 'to top left': 315,
      };
      cfg.angle = toMap[firstArg] ?? 135;
    }
  } else if (cfg.type === 'radial') {
    const firstArg = argTokens[0]?.trim() ?? '';
    const atMatch = firstArg.match(/^(.*?)\s+at\s+([\d.]+)%\s+([\d.]+)%$/);
    if (atMatch) {
      const shapePart = atMatch[1].trim();
      cfg.posX = parseFloat(atMatch[2]);
      cfg.posY = parseFloat(atMatch[3]);
      cfg.radialShape = shapePart.includes('circle') ? 'circle' : 'ellipse';
      for (const sz of ['closest-side', 'closest-corner', 'farthest-side', 'farthest-corner'] as RadialSize[]) {
        if (shapePart.includes(sz)) { cfg.radialSize = sz; break; }
      }
    }
  } else if (cfg.type === 'conic') {
    const firstArg = argTokens[0]?.trim() ?? '';
    const fromMatch = firstArg.match(/from\s+(-?[\d.]+)deg/);
    if (fromMatch) cfg.angle = parseFloat(fromMatch[1]);
    const atMatch = firstArg.match(/at\s+([\d.]+)%\s+([\d.]+)%/);
    if (atMatch) { cfg.posX = parseFloat(atMatch[1]); cfg.posY = parseFloat(atMatch[2]); }
  }

  // Parse color stops
  const stops: GradientStop[] = [];
  for (let i = stopStart; i < tokens.length; i++) {
    const s = parseGradientStop(tokens[i]);
    if (s) stops.push(s);
  }
  if (stops.length >= 2) cfg.stops = stops;
  return cfg;
}

// ─── Window class ──────────────────────────────────────────────────────────

export class GradientEditorWindow extends DraggableToolWindow {
  private _designerCanvas: IDesignerCanvas;
  private _config: GradientConfig = defaultConfig();
  private _selectedStopIndex = 0;

  private _previewStrip: HTMLDivElement;
  private _stopTrack: HTMLDivElement;
  private _typeSelect: HTMLSelectElement;
  private _repeatingCheck: HTMLInputElement;
  private _linearGroup: HTMLDivElement;
  private _radialGroup: HTMLDivElement;
  private _conicGroup: HTMLDivElement;
  private _angleInput: HTMLInputElement;
  private _angleVal: HTMLSpanElement;
  private _conicAngleInput: HTMLInputElement;
  private _conicAngleVal: HTMLSpanElement;
  private _shapeSelect: HTMLSelectElement;
  private _sizeSelect: HTMLSelectElement;
  private _posXInput: HTMLInputElement;
  private _posXVal: HTMLSpanElement;
  private _posYInput: HTMLInputElement;
  private _posYVal: HTMLSpanElement;
  private _conicPosXInput: HTMLInputElement;
  private _conicPosXVal: HTMLSpanElement;
  private _conicPosYInput: HTMLInputElement;
  private _conicPosYVal: HTMLSpanElement;
  private _stopColorInput: HTMLInputElement;
  private _stopOpacityInput: HTMLInputElement;
  private _stopOpacityVal: HTMLSpanElement;
  private _stopPositionInput: HTMLInputElement;
  private _stopPositionVal: HTMLSpanElement;
  private _removeStopBtn: HTMLButtonElement;
  private _propertySelect: HTMLSelectElement;
  private _cssOutput: HTMLTextAreaElement;
  private _loadBtn: HTMLButtonElement;
  private _copyBtn: HTMLButtonElement;
  private _applyBtn: HTMLButtonElement;

  protected override get windowTitle(): string { return 'Gradient Editor'; }

  protected override get windowContentStyle(): CSSStyleSheet {
    return css`
      * { box-sizing: border-box; }
      .ge-root {
        display: flex;
        flex-direction: column;
        width: 380px;
        color: #ddd;
        font-family: sans-serif;
        font-size: 12px;
        gap: 6px;
        padding: 8px;
        background: #2a2a2a;
      }
      .preview-strip {
        height: 50px;
        border-radius: 4px 4px 0 0;
        border: 1px solid #444;
        border-bottom: none;
      }
      .stop-track {
        height: 20px;
        background: repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 0 0 / 10px 10px;
        border: 1px solid #444;
        border-radius: 0 0 4px 4px;
        position: relative;
        cursor: crosshair;
        margin-bottom: 2px;
      }
      .stop-marker {
        position: absolute;
        top: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #aaa;
        cursor: pointer;
        transform: translateX(-50%);
        transition: border-color 0.1s;
      }
      .stop-marker.selected {
        border-color: #fff;
        box-shadow: 0 0 0 2px #3a7ad5;
        z-index: 1;
      }
      .row {
        display: grid;
        grid-template-columns: 70px 1fr 40px;
        gap: 3px 6px;
        align-items: center;
      }
      .row.two-col {
        grid-template-columns: 70px 1fr;
      }
      .row.multi {
        grid-template-columns: 70px 1fr 70px 1fr;
      }
      .row label { color: #aaa; }
      .row input[type=range] { width: 100%; }
      .row input[type=color] {
        width: 100%;
        height: 22px;
        padding: 1px;
        border: 1px solid #555;
        border-radius: 3px;
        background: #1e1e1e;
        cursor: pointer;
      }
      select {
        background: #2e2e2e;
        color: #ddd;
        border: 1px solid #555;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 11px;
        width: 100%;
      }
      .separator {
        height: 1px;
        background: #444;
        margin: 2px 0;
      }
      .stop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #888;
        font-size: 11px;
      }
      .stop-header .stop-actions {
        display: flex;
        gap: 3px;
      }
      .stop-actions button {
        padding: 1px 7px;
        background: #3a3a3a;
        color: #ddd;
        border: 1px solid #555;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      .stop-actions button:hover { background: #555; }
      .val-label { text-align: right; color: #888; }
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
    `;
  }

  protected override get windowTemplate(): string {
    return `
      <div class="ge-root">
        <div class="preview-strip" id="ge-preview-strip"></div>
        <div class="stop-track" id="ge-stop-track"></div>

        <div class="row">
          <label>Type</label>
          <select id="ge-type">
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
            <option value="conic">Conic</option>
          </select>
          <span></span>
        </div>
        <div class="row two-col" style="margin-top:-3px">
          <label></label>
          <label style="color:#ddd"><input type="checkbox" id="ge-repeating"> Repeating</label>
        </div>

        <!-- Linear controls -->
        <div id="ge-linear-group">
          <div class="row">
            <label>Angle</label>
            <input type="range" id="ge-angle" min="0" max="360" step="1">
            <span class="val-label" id="ge-angle-val">135°</span>
          </div>
        </div>

        <!-- Radial controls -->
        <div id="ge-radial-group" style="display:none">
          <div class="row multi">
            <label>Shape</label>
            <select id="ge-shape">
              <option value="ellipse">Ellipse</option>
              <option value="circle">Circle</option>
            </select>
            <label>Size</label>
            <select id="ge-size">
              <option value="farthest-corner">Farthest Corner</option>
              <option value="farthest-side">Farthest Side</option>
              <option value="closest-corner">Closest Corner</option>
              <option value="closest-side">Closest Side</option>
            </select>
          </div>
          <div class="row">
            <label>Position X</label>
            <input type="range" id="ge-pos-x" min="0" max="100" step="1">
            <span class="val-label" id="ge-pos-x-val">50%</span>
          </div>
          <div class="row">
            <label>Position Y</label>
            <input type="range" id="ge-pos-y" min="0" max="100" step="1">
            <span class="val-label" id="ge-pos-y-val">50%</span>
          </div>
        </div>

        <!-- Conic controls -->
        <div id="ge-conic-group" style="display:none">
          <div class="row">
            <label>Angle</label>
            <input type="range" id="ge-conic-angle" min="0" max="360" step="1">
            <span class="val-label" id="ge-conic-angle-val">0°</span>
          </div>
          <div class="row">
            <label>Position X</label>
            <input type="range" id="ge-conic-pos-x" min="0" max="100" step="1">
            <span class="val-label" id="ge-conic-pos-x-val">50%</span>
          </div>
          <div class="row">
            <label>Position Y</label>
            <input type="range" id="ge-conic-pos-y" min="0" max="100" step="1">
            <span class="val-label" id="ge-conic-pos-y-val">50%</span>
          </div>
        </div>

        <div class="separator"></div>

        <div class="stop-header">
          <span>Selected Stop</span>
          <div class="stop-actions">
            <button id="ge-add-stop-btn" title="Add stop at 50%">+ Add</button>
            <button id="ge-remove-stop-btn" title="Remove selected stop">− Remove</button>
          </div>
        </div>

        <div class="row">
          <label>Color</label>
          <input type="color" id="ge-stop-color" value="#667eea">
          <span></span>
        </div>
        <div class="row">
          <label>Opacity</label>
          <input type="range" id="ge-stop-opacity" min="0" max="100" step="1">
          <span class="val-label" id="ge-stop-opacity-val">100%</span>
        </div>
        <div class="row">
          <label>Position</label>
          <input type="range" id="ge-stop-pos" min="0" max="100" step="1">
          <span class="val-label" id="ge-stop-pos-val">0%</span>
        </div>

        <div class="separator"></div>

        <div class="row two-col">
          <label>Apply to</label>
          <select id="ge-property">
            <option value="background-image">background-image</option>
            <option value="background">background</option>
          </select>
        </div>

        <textarea class="css-out" id="ge-css-out"></textarea>

        <div class="actions">
          <button class="load-btn" id="ge-load-btn">Load</button>
          <button id="ge-copy-btn">Copy CSS</button>
          <button class="apply-btn" id="ge-apply-btn">Apply to selection</button>
        </div>
      </div>`;
  }

  constructor(designerCanvas?: IDesignerCanvas) {
    super();
    this._designerCanvas = designerCanvas;

    this._previewStrip = this._getDomElement<HTMLDivElement>('ge-preview-strip');
    this._stopTrack = this._getDomElement<HTMLDivElement>('ge-stop-track');
    this._typeSelect = this._getDomElement<HTMLSelectElement>('ge-type');
    this._repeatingCheck = this._getDomElement<HTMLInputElement>('ge-repeating');
    this._linearGroup = this._getDomElement<HTMLDivElement>('ge-linear-group');
    this._radialGroup = this._getDomElement<HTMLDivElement>('ge-radial-group');
    this._conicGroup = this._getDomElement<HTMLDivElement>('ge-conic-group');
    this._angleInput = this._getDomElement<HTMLInputElement>('ge-angle');
    this._angleVal = this._getDomElement<HTMLSpanElement>('ge-angle-val');
    this._conicAngleInput = this._getDomElement<HTMLInputElement>('ge-conic-angle');
    this._conicAngleVal = this._getDomElement<HTMLSpanElement>('ge-conic-angle-val');
    this._shapeSelect = this._getDomElement<HTMLSelectElement>('ge-shape');
    this._sizeSelect = this._getDomElement<HTMLSelectElement>('ge-size');
    this._posXInput = this._getDomElement<HTMLInputElement>('ge-pos-x');
    this._posXVal = this._getDomElement<HTMLSpanElement>('ge-pos-x-val');
    this._posYInput = this._getDomElement<HTMLInputElement>('ge-pos-y');
    this._posYVal = this._getDomElement<HTMLSpanElement>('ge-pos-y-val');
    this._conicPosXInput = this._getDomElement<HTMLInputElement>('ge-conic-pos-x');
    this._conicPosXVal = this._getDomElement<HTMLSpanElement>('ge-conic-pos-x-val');
    this._conicPosYInput = this._getDomElement<HTMLInputElement>('ge-conic-pos-y');
    this._conicPosYVal = this._getDomElement<HTMLSpanElement>('ge-conic-pos-y-val');
    this._stopColorInput = this._getDomElement<HTMLInputElement>('ge-stop-color');
    this._stopOpacityInput = this._getDomElement<HTMLInputElement>('ge-stop-opacity');
    this._stopOpacityVal = this._getDomElement<HTMLSpanElement>('ge-stop-opacity-val');
    this._stopPositionInput = this._getDomElement<HTMLInputElement>('ge-stop-pos');
    this._stopPositionVal = this._getDomElement<HTMLSpanElement>('ge-stop-pos-val');
    this._removeStopBtn = this._getDomElement<HTMLButtonElement>('ge-remove-stop-btn');
    this._propertySelect = this._getDomElement<HTMLSelectElement>('ge-property');
    this._cssOutput = this._getDomElement<HTMLTextAreaElement>('ge-css-out');
    this._loadBtn = this._getDomElement<HTMLButtonElement>('ge-load-btn');
    this._copyBtn = this._getDomElement<HTMLButtonElement>('ge-copy-btn');
    this._applyBtn = this._getDomElement<HTMLButtonElement>('ge-apply-btn');

    // Type / repeating
    this._typeSelect.onchange = () => {
      this._config.type = this._typeSelect.value as GradientType;
      this._updateTypeVisibility();
      this._refresh();
    };
    this._repeatingCheck.onchange = () => { this._config.repeating = this._repeatingCheck.checked; this._refresh(); };

    // Linear angle
    this._angleInput.oninput = () => {
      this._config.angle = Number(this._angleInput.value);
      this._angleVal.textContent = this._angleInput.value + '°';
      this._refresh();
    };

    // Conic angle
    this._conicAngleInput.oninput = () => {
      this._config.angle = Number(this._conicAngleInput.value);
      this._conicAngleVal.textContent = this._conicAngleInput.value + '°';
      this._refresh();
    };

    // Radial controls
    this._shapeSelect.onchange = () => { this._config.radialShape = this._shapeSelect.value as RadialShape; this._refresh(); };
    this._sizeSelect.onchange = () => { this._config.radialSize = this._sizeSelect.value as RadialSize; this._refresh(); };
    this._posXInput.oninput = () => { this._config.posX = Number(this._posXInput.value); this._posXVal.textContent = this._posXInput.value + '%'; this._refresh(); };
    this._posYInput.oninput = () => { this._config.posY = Number(this._posYInput.value); this._posYVal.textContent = this._posYInput.value + '%'; this._refresh(); };

    // Conic position
    this._conicPosXInput.oninput = () => { this._config.posX = Number(this._conicPosXInput.value); this._conicPosXVal.textContent = this._conicPosXInput.value + '%'; this._refresh(); };
    this._conicPosYInput.oninput = () => { this._config.posY = Number(this._conicPosYInput.value); this._conicPosYVal.textContent = this._conicPosYInput.value + '%'; this._refresh(); };

    // Stop controls
    this._stopColorInput.oninput = () => { this._currentStop().color = this._stopColorInput.value; this._refresh(); };
    this._stopOpacityInput.oninput = () => {
      this._currentStop().opacity = Number(this._stopOpacityInput.value);
      this._stopOpacityVal.textContent = this._stopOpacityInput.value + '%';
      this._refresh();
    };
    this._stopPositionInput.oninput = () => {
      this._currentStop().position = Number(this._stopPositionInput.value);
      this._stopPositionVal.textContent = this._stopPositionInput.value + '%';
      this._refresh();
    };

    // Add / remove stop
    this._getDomElement<HTMLButtonElement>('ge-add-stop-btn').onclick = () => this._addStop(50);
    this._removeStopBtn.onclick = () => this._removeStop();

    // Stop track: click to add stop
    this._stopTrack.addEventListener('click', (e) => {
      const rect = this._stopTrack.getBoundingClientRect();
      const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      this._addStop(Math.max(0, Math.min(100, pos)));
    });

    // Output / apply
    this._copyBtn.onclick = () => { navigator.clipboard?.writeText(this._cssOutput.value).catch(() => {}); };
    this._applyBtn.onclick = () => this._applyToSelection();
    this._loadBtn.onclick = () => {
      this._loadFromPrimarySelection();
      this._selectedStopIndex = Math.max(0, Math.min(this._selectedStopIndex, this._config.stops.length - 1));
      this._updateTypeVisibility();
      this._syncControls();
      this._renderStopTrack();
      this._refreshOutput();
    };

    this._loadFromPrimarySelection();
    this._updateTypeVisibility();
    this._syncControls();
    this._renderStopTrack();
    this._refreshOutput();
  }

  private _loadFromPrimarySelection() {
    const primary = this._designerCanvas?.instanceServiceContainer?.selectionService?.primarySelection;
    if (!primary) return;
    for (const prop of ['background-image', 'background']) {
      const val = primary.getStyle(prop);
      if (val && val.includes('gradient')) {
        const extracted = extractFirstGradient(val);
        if (extracted) {
          this._config = parseGradientCss(extracted);
          if (prop === 'background') this._propertySelect.value = 'background';
        }
        break;
      }
    }
  }

  private _currentStop(): GradientStop {
    return this._config.stops[this._selectedStopIndex];
  }

  private _addStop(position: number) {
    this._config.stops.push({ color: '#ffffff', opacity: 100, position });
    this._selectedStopIndex = this._config.stops.length - 1;
    this._syncControls();
    this._renderStopTrack();
    this._refreshOutput();
  }

  private _removeStop() {
    if (this._config.stops.length <= 2) return;
    this._config.stops.splice(this._selectedStopIndex, 1);
    this._selectedStopIndex = Math.min(this._selectedStopIndex, this._config.stops.length - 1);
    this._syncControls();
    this._renderStopTrack();
    this._refreshOutput();
  }

  private _updateTypeVisibility() {
    this._linearGroup.style.display = this._config.type === 'linear' ? '' : 'none';
    this._radialGroup.style.display = this._config.type === 'radial' ? '' : 'none';
    this._conicGroup.style.display = this._config.type === 'conic' ? '' : 'none';
  }

  private _syncControls() {
    // type
    this._typeSelect.value = this._config.type;
    this._repeatingCheck.checked = this._config.repeating;

    // linear/conic angle
    this._angleInput.value = String(this._config.angle);
    this._angleVal.textContent = this._config.angle + '°';
    this._conicAngleInput.value = String(this._config.angle);
    this._conicAngleVal.textContent = this._config.angle + '°';

    // radial
    this._shapeSelect.value = this._config.radialShape;
    this._sizeSelect.value = this._config.radialSize;
    this._posXInput.value = String(this._config.posX);
    this._posXVal.textContent = this._config.posX + '%';
    this._posYInput.value = String(this._config.posY);
    this._posYVal.textContent = this._config.posY + '%';

    // conic position
    this._conicPosXInput.value = String(this._config.posX);
    this._conicPosXVal.textContent = this._config.posX + '%';
    this._conicPosYInput.value = String(this._config.posY);
    this._conicPosYVal.textContent = this._config.posY + '%';

    // selected stop
    const s = this._currentStop();
    this._stopColorInput.value = s.color;
    this._stopOpacityInput.value = String(s.opacity);
    this._stopOpacityVal.textContent = s.opacity + '%';
    this._stopPositionInput.value = String(s.position);
    this._stopPositionVal.textContent = s.position + '%';
  }

  private _renderStopTrack() {
    // Update gradient preview on strip
    const gradCss = configToCss(this._config);
    this._previewStrip.style.background = gradCss;

    // Re-render stop markers
    this._stopTrack.innerHTML = '';
    this._config.stops.forEach((stop, i) => {
      const marker = document.createElement('div');
      marker.className = 'stop-marker' + (i === this._selectedStopIndex ? ' selected' : '');
      marker.style.left = `${stop.position}%`;
      marker.style.background = stop.color;
      marker.style.opacity = String(stop.opacity / 100);

      // Select on click (stop propagation so track click handler doesn't fire)
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectedStopIndex = i;
        this._syncControls();
        this._renderStopTrack();
      });

      // Drag to reposition — update marker in-place to avoid destroying pointer capture
      marker.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        marker.setPointerCapture(e.pointerId);
        const trackRect = this._stopTrack.getBoundingClientRect();
        const onMove = (me: PointerEvent) => {
          const x = Math.max(0, Math.min(1, (me.clientX - trackRect.left) / trackRect.width));
          const pos = Math.round(x * 100);
          this._config.stops[i].position = pos;
          this._selectedStopIndex = i;
          // Update this marker's position in-place (don't re-render — that would destroy the captured element)
          marker.style.left = pos + '%';
          // Update the selected state visually
          this._stopTrack.querySelectorAll('.stop-marker').forEach((m, mi) => {
            m.classList.toggle('selected', mi === i);
          });
          // Refresh preview and output without re-rendering markers
          this._previewStrip.style.background = configToCss(this._config);
          this._refreshOutput();
        };
        const onUp = () => {
          marker.removeEventListener('pointermove', onMove);
          marker.removeEventListener('pointerup', onUp);
          // Full sync after drag ends
          this._syncControls();
          this._renderStopTrack();
        };
        marker.addEventListener('pointermove', onMove);
        marker.addEventListener('pointerup', onUp);
      });

      this._stopTrack.appendChild(marker);
    });
  }

  private _refreshOutput() {
    this._cssOutput.value = configToCss(this._config);
  }

  private _refresh() {
    this._renderStopTrack();
    this._refreshOutput();
  }

  private _applyToSelection() {
    const items = this._designerCanvas?.instanceServiceContainer?.selectionService?.selectedElements;
    if (!items?.length) return;
    const cssVal = configToCss(this._config);
    const prop = this._propertySelect.value;
    const group = items[0].openGroup(`set ${prop}`);
    for (const item of items) {
      item.setStyle(prop, cssVal);
    }
    group.commit();
  }
}

customElements.define('node-projects-gradient-editor-window', GradientEditorWindow);
