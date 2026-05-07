import { css } from '@node-projects/base-custom-webcomponent';
import { DraggableToolWindow } from './DraggableToolWindow.js';
import { IDesignerCanvas } from '../../../IDesignerCanvas.js';

interface BorderRadiusCorner {
  x: number;      // horizontal radius (%)
  y: number;      // vertical radius (%)
  shape: 'round' | 'bevel' | 'scoop' | 'inset' | 'notch'; // corner-shape
}

interface BorderSide {
  width: number; // px
  style: string; // solid, dashed, dotted, etc.
  color: string; // hex color
  opacity: number; // 0-100
}

interface BorderConfig {
  topLeft: BorderRadiusCorner;
  topRight: BorderRadiusCorner;
  bottomRight: BorderRadiusCorner;
  bottomLeft: BorderRadiusCorner;
  uniform: boolean; // if true, all corners are the same
  // Border properties
  width: number;  // px (uniform across all sides)
  borderUniform: boolean; // if true, style and color are uniform
  top: BorderSide;
  right: BorderSide;
  bottom: BorderSide;
  left: BorderSide;
}

function defaultCorner(): BorderRadiusCorner {
  return { x: 0, y: 0, shape: 'round' };
}

function defaultSide(): BorderSide {
  return { width: 1, style: 'solid', color: '#000000', opacity: 100 };
}

function defaultConfig(): BorderConfig {
  return {
    topLeft: { ...defaultCorner() },
    topRight: { ...defaultCorner() },
    bottomRight: { ...defaultCorner() },
    bottomLeft: { ...defaultCorner() },
    uniform: true,
    width: 1,
    borderUniform: true,
    top: { ...defaultSide() },
    right: { ...defaultSide() },
    bottom: { ...defaultSide() },
    left: { ...defaultSide() },
  };
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function radiusToCss(c: BorderRadiusCorner): string {
  return c.x === c.y ? `${c.x}%` : `${c.x}% ${c.y}%`;
}

function configToRadiusCss(cfg: BorderConfig): string {
  const corners = [cfg.topLeft, cfg.topRight, cfg.bottomRight, cfg.bottomLeft];
  const xs = corners.map(c => `${c.x}%`);
  const ys = corners.map(c => `${c.y}%`);

  const allCornersSame = corners.every(c => c.x === corners[0].x && c.y === corners[0].y);
  if (allCornersSame)
    return radiusToCss(corners[0]);

  const allCircular = corners.every(c => c.x === c.y);
  if (allCircular)
    return xs.join(' ');

  return `${xs.join(' ')} / ${ys.join(' ')}`;
}

function configToShapeCss(cfg: BorderConfig): string | null {
  const shapes = [cfg.topLeft.shape, cfg.topRight.shape, cfg.bottomRight.shape, cfg.bottomLeft.shape];
  const allRound = shapes.every(s => s === 'round');
  if (allRound) return null; // Don't output corner-shape if all are round (the default)

  const allSame = shapes[0] === shapes[1] && shapes[1] === shapes[2] && shapes[2] === shapes[3];
  if (allSame) return shapes[0];

  return shapes.join(' ');
}

function configToBorderCss(cfg: BorderConfig): { width: string; style: string; color: string } {
  const width = cfg.width > 0 ? `${cfg.width}px` : '0px';
  
  if (cfg.borderUniform) {
    // Uniform border style and color
    const { style, color, opacity } = cfg.top;
    const rgba = `${hexToRgb(color)},${(opacity / 100).toFixed(2)}`;
    return {
      width,
      style,
      color: `rgba(${rgba})`,
    };
  } else {
    // Per-side border style and color
    const sides = [cfg.top, cfg.right, cfg.bottom, cfg.left];
    const styles = sides.map(s => s.style);
    const colors = sides.map(s => {
      const rgba = `${hexToRgb(s.color)},${(s.opacity / 100).toFixed(2)}`;
      return `rgba(${rgba})`;
    });
    
    const styleCss = styles[0] === styles[1] && styles[1] === styles[2] && styles[2] === styles[3]
      ? styles[0]
      : styles.join(' ');
    const colorCss = colors[0] === colors[1] && colors[1] === colors[2] && colors[2] === colors[3]
      ? colors[0]
      : colors.join(' ');
    
    return {
      width,
      style: styleCss,
      color: colorCss,
    };
  }
}

// Parse "10px 20px 30px 40px / 10px 20px 30px 40px" format
// or just "10% 20% 30% 40%" format
function parseCornerRadius(value: string): BorderConfig {
  const cfg = defaultConfig();
  if (!value) return cfg;

  value = value.trim();
  if (!value) return cfg;

  // Parse radius: "X1% X2% X3% X4% / Y1% Y2% Y3% Y4%" or simpler formats
  const parts = value.split('/').map(p => p.trim());
  const xStr = parts[0] ?? '';
  const yStr = parts[1] ?? xStr; // if no Y values, use X values

  const parseTokens = (str: string): number[] => {
    return str.split(/\s+/).map(t => {
      const n = parseFloat(t);
      return isNaN(n) ? 0 : n;
    });
  };

  const xTokens = parseTokens(xStr);
  const yTokens = parseTokens(yStr);

  // Fill in corners: 1→all, 2→[TL/BR, TR/BL], 3→[TL, TR/BL, BR], 4→[TL, TR, BR, BL]
  const getVal = (tokens: number[], idx: number): number => {
    if (tokens.length === 1) return tokens[0];
    if (tokens.length === 2) return tokens[idx === 1 || idx === 2 ? 1 : 0];
    if (tokens.length === 3) return tokens[idx === 3 ? 1 : (idx === 2 ? 2 : 0)];
    return tokens[idx] ?? 0;
  };

  cfg.topLeft.x = getVal(xTokens, 0);
  cfg.topRight.x = getVal(xTokens, 1);
  cfg.bottomRight.x = getVal(xTokens, 2);
  cfg.bottomLeft.x = getVal(xTokens, 3);

  cfg.topLeft.y = getVal(yTokens, 0);
  cfg.topRight.y = getVal(yTokens, 1);
  cfg.bottomRight.y = getVal(yTokens, 2);
  cfg.bottomLeft.y = getVal(yTokens, 3);

  return cfg;
}

function splitTopLevelWhitespace(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value.trim()) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;

    if (/\s/.test(ch) && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) tokens.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) tokens.push(trimmed);
  return tokens;
}

function expandQuadTokens<T>(tokens: T[]): [T | undefined, T | undefined, T | undefined, T | undefined] {
  if (tokens.length === 1) return [tokens[0], tokens[0], tokens[0], tokens[0]];
  if (tokens.length === 2) return [tokens[0], tokens[1], tokens[0], tokens[1]];
  if (tokens.length === 3) return [tokens[0], tokens[1], tokens[2], tokens[1]];
  return [tokens[0], tokens[1], tokens[2], tokens[3]];
}

export class BorderRadiusEditorWindow extends DraggableToolWindow {
  private _designerCanvas: IDesignerCanvas;
  private _config: BorderConfig = defaultConfig();

  private _previewBox: HTMLDivElement;
  private _uniformCheck: HTMLInputElement;

  // Unified corner controls
  private _uniformXInput: HTMLInputElement;
  private _uniformYInput: HTMLInputElement;
  private _uniformShapeSelect: HTMLSelectElement;
  private _uniformXVal: HTMLSpanElement;
  private _uniformYVal: HTMLSpanElement;

  // Top-left
  private _tlXInput: HTMLInputElement;
  private _tlYInput: HTMLInputElement;
  private _tlShapeSelect: HTMLSelectElement;
  private _tlXVal: HTMLSpanElement;
  private _tlYVal: HTMLSpanElement;

  // Top-right
  private _trXInput: HTMLInputElement;
  private _trYInput: HTMLInputElement;
  private _trShapeSelect: HTMLSelectElement;
  private _trXVal: HTMLSpanElement;
  private _trYVal: HTMLSpanElement;

  // Bottom-right
  private _brXInput: HTMLInputElement;
  private _brYInput: HTMLInputElement;
  private _brShapeSelect: HTMLSelectElement;
  private _brXVal: HTMLSpanElement;
  private _brYVal: HTMLSpanElement;

  // Bottom-left
  private _blXInput: HTMLInputElement;
  private _blYInput: HTMLInputElement;
  private _blShapeSelect: HTMLSelectElement;
  private _blXVal: HTMLSpanElement;
  private _blYVal: HTMLSpanElement;

  // Section divs
  private _cornersUniformDiv: HTMLDivElement;
  private _cornersPersideDiv: HTMLDivElement;

  // Border controls
  private _widthInput: HTMLInputElement;
  private _borderUniformCheck: HTMLInputElement;
  private _widthVal: HTMLSpanElement;
  
  // Uniform border controls
  private _styleSelect: HTMLSelectElement;
  private _colorInput: HTMLInputElement;
  private _opacityInput: HTMLInputElement;
  private _opacityVal: HTMLSpanElement;
  
  // Per-side border controls
  private _topStyleSelect: HTMLSelectElement;
  private _topWidthInput: HTMLInputElement;
  private _topWidthVal: HTMLSpanElement;
  private _topColorInput: HTMLInputElement;
  private _topOpacityInput: HTMLInputElement;
  private _topOpacityVal: HTMLSpanElement;
  
  private _rightStyleSelect: HTMLSelectElement;
  private _rightWidthInput: HTMLInputElement;
  private _rightWidthVal: HTMLSpanElement;
  private _rightColorInput: HTMLInputElement;
  private _rightOpacityInput: HTMLInputElement;
  private _rightOpacityVal: HTMLSpanElement;
  
  private _bottomStyleSelect: HTMLSelectElement;
  private _bottomWidthInput: HTMLInputElement;
  private _bottomWidthVal: HTMLSpanElement;
  private _bottomColorInput: HTMLInputElement;
  private _bottomOpacityInput: HTMLInputElement;
  private _bottomOpacityVal: HTMLSpanElement;
  
  private _leftStyleSelect: HTMLSelectElement;
  private _leftWidthInput: HTMLInputElement;
  private _leftWidthVal: HTMLSpanElement;
  private _leftColorInput: HTMLInputElement;
  private _leftOpacityInput: HTMLInputElement;
  private _leftOpacityVal: HTMLSpanElement;
  
  private _borderUniformDiv: HTMLDivElement;
  private _borderPersideDiv: HTMLDivElement;

  private _cssOutput: HTMLTextAreaElement;
  private _loadBtn: HTMLButtonElement;
  private _copyBtn: HTMLButtonElement;
  private _applyBtn: HTMLButtonElement;

  protected override get windowTitle(): string { return 'Border Radius Editor'; }

  protected override get windowContentStyle(): CSSStyleSheet {
    return css`
      * { box-sizing: border-box; }
      .bre-root {
        display: flex;
        flex-direction: column;
        width: 860px;
        max-width: calc(100vw - 48px);
        color: #ddd;
        font-family: sans-serif;
        font-size: 12px;
        gap: 4px;
        padding: 6px;
        background: #2a2a2a;
      }
      .editors-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        align-items: start;
      }
      .section-column {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .preview-area {
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 3px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2px;
      }
      .preview-box {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 0;
      }
      .uniform-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
      }
      .uniform-row label {
        display: flex;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        user-select: none;
        color: #aaa;
      }
      .uniform-row input[type=checkbox] {
        cursor: pointer;
        width: 14px;
        height: 14px;
      }
      .section-header {
        color: #999;
        font-size: 10px;
        font-weight: bold;
        margin-top: 3px;
        margin-bottom: 2px;
        text-transform: uppercase;
      }
      .corner-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }
      .separate-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px;
      }
      .corner-section {
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 2px;
        padding: 4px;
      }
      .corner-header {
        color: #888;
        font-size: 10px;
        margin-bottom: 3px;
        font-weight: bold;
      }
      .corner-row {
        display: grid;
        grid-template-columns: 35px 1fr 24px;
        gap: 2px 3px;
        align-items: center;
        margin-bottom: 2px;
      }
      .corner-row:last-child { margin-bottom: 0; }
      .corner-row label { color: #888; font-size: 10px; }
      .corner-row input[type=range] { width: 100%; height: 16px; }
      .corner-row input[type=color] { width: 100%; height: 18px; cursor: pointer; }
      .corner-row .val-label { text-align: right; color: #777; font-size: 9px; }
      .bre-root select {
        background: #2e2e2e;
        color: #ddd;
        border: 1px solid #555;
        border-radius: 2px;
        padding: 2px 3px;
        font-size: 10px;
        height: 18px;
      }
      .corner-row select {
        grid-column: 1 / -1;
      }
      .side-pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }
      @media (max-width: 900px) {
        .bre-root {
          width: 420px;
        }
        .editors-row {
          grid-template-columns: 1fr;
        }
      }
      .separator {
        height: 1px;
        background: #444;
        margin: 2px 0;
      }
      .css-out {
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 3px;
        color: #7ec8e3;
        font-family: monospace;
        font-size: 10px;
        padding: 4px;
        resize: none;
        width: 100%;
        height: 50px;
      }
      .actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }
      .actions .load-btn { margin-right: auto; }
      .actions button, .apply-btn {
        padding: 3px 10px;
        background: #3a3a3a;
        color: #ddd;
        border: 1px solid #555;
        border-radius: 2px;
        cursor: pointer;
        font-size: 11px;
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
      <div class="bre-root">
        <div class="preview-area">
          <div class="preview-box" id="bre-preview"></div>
        </div>

        <div class="editors-row">
          <div class="section-column">
            <div class="section-header">Corners</div>
            <div class="uniform-row">
              <label><input type="checkbox" id="bre-uniform"> Separate corners</label>
            </div>

            <div id="bre-corners-uniform" class="corner-section">
              <div class="corner-row">
                <label>X</label>
                <input type="range" id="bre-uniform-x" min="0" max="100" step="1">
                <span class="val-label" id="bre-uniform-x-val">0%</span>
              </div>
              <div class="corner-row">
                <label>Y</label>
                <input type="range" id="bre-uniform-y" min="0" max="100" step="1">
                <span class="val-label" id="bre-uniform-y-val">0%</span>
              </div>
              <select id="bre-uniform-shape">
                <option value="round">Round</option>
                <option value="bevel">Bevel</option>
                <option value="scoop">Scoop</option>
                <option value="inset">Inset</option>
                <option value="notch">Notch</option>
              </select>
            </div>

            <div id="bre-corners-perside" class="corner-grid separate-grid" style="display: none;">
              <div class="corner-section">
                <div class="corner-header">Top-left</div>
                <div class="corner-row">
                  <label>X</label>
                  <input type="range" id="bre-tl-x" min="0" max="100" step="1">
                  <span class="val-label" id="bre-tl-x-val">0%</span>
                </div>
                <div class="corner-row">
                  <label>Y</label>
                  <input type="range" id="bre-tl-y" min="0" max="100" step="1">
                  <span class="val-label" id="bre-tl-y-val">0%</span>
                </div>
                <select id="bre-tl-shape">
                  <option value="round">Round</option>
                  <option value="bevel">Bevel</option>
                  <option value="scoop">Scoop</option>
                  <option value="inset">Inset</option>
                  <option value="notch">Notch</option>
                </select>
              </div>

              <div class="corner-section">
                <div class="corner-header">Top-right</div>
                <div class="corner-row">
                  <label>X</label>
                  <input type="range" id="bre-tr-x" min="0" max="100" step="1">
                  <span class="val-label" id="bre-tr-x-val">0%</span>
                </div>
                <div class="corner-row">
                  <label>Y</label>
                  <input type="range" id="bre-tr-y" min="0" max="100" step="1">
                  <span class="val-label" id="bre-tr-y-val">0%</span>
                </div>
                <select id="bre-tr-shape">
                  <option value="round">Round</option>
                  <option value="bevel">Bevel</option>
                  <option value="scoop">Scoop</option>
                  <option value="inset">Inset</option>
                  <option value="notch">Notch</option>
                </select>
              </div>

              <div class="corner-section">
                <div class="corner-header">Bottom-right</div>
                <div class="corner-row">
                  <label>X</label>
                  <input type="range" id="bre-br-x" min="0" max="100" step="1">
                  <span class="val-label" id="bre-br-x-val">0%</span>
                </div>
                <div class="corner-row">
                  <label>Y</label>
                  <input type="range" id="bre-br-y" min="0" max="100" step="1">
                  <span class="val-label" id="bre-br-y-val">0%</span>
                </div>
                <select id="bre-br-shape">
                  <option value="round">Round</option>
                  <option value="bevel">Bevel</option>
                  <option value="scoop">Scoop</option>
                  <option value="inset">Inset</option>
                  <option value="notch">Notch</option>
                </select>
              </div>

              <div class="corner-section">
                <div class="corner-header">Bottom-left</div>
                <div class="corner-row">
                  <label>X</label>
                  <input type="range" id="bre-bl-x" min="0" max="100" step="1">
                  <span class="val-label" id="bre-bl-x-val">0%</span>
                </div>
                <div class="corner-row">
                  <label>Y</label>
                  <input type="range" id="bre-bl-y" min="0" max="100" step="1">
                  <span class="val-label" id="bre-bl-y-val">0%</span>
                </div>
                <select id="bre-bl-shape">
                  <option value="round">Round</option>
                  <option value="bevel">Bevel</option>
                  <option value="scoop">Scoop</option>
                  <option value="inset">Inset</option>
                  <option value="notch">Notch</option>
                </select>
              </div>
            </div>
          </div>

          <div class="section-column">
            <div class="section-header">Border</div>
            <div class="corner-row">
              <label>Width</label>
              <input type="range" id="bre-width" min="0" max="50" step="1">
              <span class="val-label" id="bre-width-val">0px</span>
            </div>
            <div class="uniform-row">
              <label><input type="checkbox" id="bre-border-separate"> Separate sides</label>
            </div>

            <div id="bre-border-uniform-editor" class="corner-section">
              <div class="corner-row">
                <label>Style</label>
                <select id="bre-style">
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="groove">Groove</option>
                  <option value="ridge">Ridge</option>
                  <option value="inset">Inset</option>
                  <option value="outset">Outset</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div class="corner-row">
                <label>Color</label>
                <input type="color" id="bre-color" value="#000000">
              </div>
              <div class="corner-row">
                <label>Opacity</label>
                <input type="range" id="bre-opacity" min="0" max="100" step="1">
                <span class="val-label" id="bre-opacity-val">100%</span>
              </div>
            </div>

            <div id="bre-border-perside" class="corner-grid separate-grid" style="display: none;">
              <div class="corner-section">
                <div class="corner-header">Top</div>
                <select id="bre-top-style">
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="groove">Groove</option>
                  <option value="ridge">Ridge</option>
                  <option value="inset">Inset</option>
                  <option value="outset">Outset</option>
                  <option value="none">None</option>
                </select>
                <div class="corner-row">
                  <label>Width</label>
                  <input type="range" id="bre-top-width" min="0" max="50" step="1">
                  <span class="val-label" id="bre-top-width-val">0px</span>
                </div>
                <input type="color" id="bre-top-color" value="#000000" style="width: 100%; height: 20px; margin: 2px 0;">
                <div class="corner-row" style="grid-template-columns: 1fr;">
                  <label style="grid-column: 1;">Opacity</label>
                  <input type="range" id="bre-top-opacity" min="0" max="100" step="1">
                  <span class="val-label" id="bre-top-opacity-val">100%</span>
                </div>
              </div>

              <div class="corner-section">
                <div class="corner-header">Right</div>
                <select id="bre-right-style">
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="groove">Groove</option>
                  <option value="ridge">Ridge</option>
                  <option value="inset">Inset</option>
                  <option value="outset">Outset</option>
                  <option value="none">None</option>
                </select>
                <div class="corner-row">
                  <label>Width</label>
                  <input type="range" id="bre-right-width" min="0" max="50" step="1">
                  <span class="val-label" id="bre-right-width-val">0px</span>
                </div>
                <input type="color" id="bre-right-color" value="#000000" style="width: 100%; height: 20px; margin: 2px 0;">
                <div class="corner-row" style="grid-template-columns: 1fr;">
                  <label style="grid-column: 1;">Opacity</label>
                  <input type="range" id="bre-right-opacity" min="0" max="100" step="1">
                  <span class="val-label" id="bre-right-opacity-val">100%</span>
                </div>
              </div>

              <div class="corner-section">
                <div class="corner-header">Bottom</div>
                <select id="bre-bottom-style">
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="groove">Groove</option>
                  <option value="ridge">Ridge</option>
                  <option value="inset">Inset</option>
                  <option value="outset">Outset</option>
                  <option value="none">None</option>
                </select>
                <div class="corner-row">
                  <label>Width</label>
                  <input type="range" id="bre-bottom-width" min="0" max="50" step="1">
                  <span class="val-label" id="bre-bottom-width-val">0px</span>
                </div>
                <input type="color" id="bre-bottom-color" value="#000000" style="width: 100%; height: 20px; margin: 2px 0;">
                <div class="corner-row" style="grid-template-columns: 1fr;">
                  <label style="grid-column: 1;">Opacity</label>
                  <input type="range" id="bre-bottom-opacity" min="0" max="100" step="1">
                  <span class="val-label" id="bre-bottom-opacity-val">100%</span>
                </div>
              </div>

              <div class="corner-section">
                <div class="corner-header">Left</div>
                <select id="bre-left-style">
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="groove">Groove</option>
                  <option value="ridge">Ridge</option>
                  <option value="inset">Inset</option>
                  <option value="outset">Outset</option>
                  <option value="none">None</option>
                </select>
                <div class="corner-row">
                  <label>Width</label>
                  <input type="range" id="bre-left-width" min="0" max="50" step="1">
                  <span class="val-label" id="bre-left-width-val">0px</span>
                </div>
                <input type="color" id="bre-left-color" value="#000000" style="width: 100%; height: 20px; margin: 2px 0;">
                <div class="corner-row" style="grid-template-columns: 1fr;">
                  <label style="grid-column: 1;">Opacity</label>
                  <input type="range" id="bre-left-opacity" min="0" max="100" step="1">
                  <span class="val-label" id="bre-left-opacity-val">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="separator"></div>

        <textarea class="css-out" id="bre-css-out"></textarea>

        <div class="actions">
          <button class="load-btn" id="bre-load-btn">Load</button>
          <button id="bre-copy-btn">Copy CSS</button>
          <button class="apply-btn" id="bre-apply-btn">Apply to selection</button>
        </div>
      </div>`;
  }

  constructor(designerCanvas?: IDesignerCanvas) {
    super();
    this._designerCanvas = designerCanvas;

    this._previewBox = this._getDomElement<HTMLDivElement>('bre-preview');
    this._uniformCheck = this._getDomElement<HTMLInputElement>('bre-uniform');

    // Unified corner controls
    this._uniformXInput = this._getDomElement<HTMLInputElement>('bre-uniform-x');
    this._uniformYInput = this._getDomElement<HTMLInputElement>('bre-uniform-y');
    this._uniformShapeSelect = this._getDomElement<HTMLSelectElement>('bre-uniform-shape');
    this._uniformXVal = this._getDomElement<HTMLSpanElement>('bre-uniform-x-val');
    this._uniformYVal = this._getDomElement<HTMLSpanElement>('bre-uniform-y-val');

    // Top-left
    this._tlXInput = this._getDomElement<HTMLInputElement>('bre-tl-x');
    this._tlYInput = this._getDomElement<HTMLInputElement>('bre-tl-y');
    this._tlShapeSelect = this._getDomElement<HTMLSelectElement>('bre-tl-shape');
    this._tlXVal = this._getDomElement<HTMLSpanElement>('bre-tl-x-val');
    this._tlYVal = this._getDomElement<HTMLSpanElement>('bre-tl-y-val');

    // Top-right
    this._trXInput = this._getDomElement<HTMLInputElement>('bre-tr-x');
    this._trYInput = this._getDomElement<HTMLInputElement>('bre-tr-y');
    this._trShapeSelect = this._getDomElement<HTMLSelectElement>('bre-tr-shape');
    this._trXVal = this._getDomElement<HTMLSpanElement>('bre-tr-x-val');
    this._trYVal = this._getDomElement<HTMLSpanElement>('bre-tr-y-val');

    // Bottom-right
    this._brXInput = this._getDomElement<HTMLInputElement>('bre-br-x');
    this._brYInput = this._getDomElement<HTMLInputElement>('bre-br-y');
    this._brShapeSelect = this._getDomElement<HTMLSelectElement>('bre-br-shape');
    this._brXVal = this._getDomElement<HTMLSpanElement>('bre-br-x-val');
    this._brYVal = this._getDomElement<HTMLSpanElement>('bre-br-y-val');

    // Bottom-left
    this._blXInput = this._getDomElement<HTMLInputElement>('bre-bl-x');
    this._blYInput = this._getDomElement<HTMLInputElement>('bre-bl-y');
    this._blShapeSelect = this._getDomElement<HTMLSelectElement>('bre-bl-shape');
    this._blXVal = this._getDomElement<HTMLSpanElement>('bre-bl-x-val');
    this._blYVal = this._getDomElement<HTMLSpanElement>('bre-bl-y-val');

    // Section divs
    this._cornersUniformDiv = this._getDomElement<HTMLDivElement>('bre-corners-uniform');
    this._cornersPersideDiv = this._getDomElement<HTMLDivElement>('bre-corners-perside');

    // Border controls
    this._widthInput = this._getDomElement<HTMLInputElement>('bre-width');
    this._borderUniformCheck = this._getDomElement<HTMLInputElement>('bre-border-separate');
    this._widthVal = this._getDomElement<HTMLSpanElement>('bre-width-val');
    
    // Uniform border controls
    this._styleSelect = this._getDomElement<HTMLSelectElement>('bre-style');
    this._colorInput = this._getDomElement<HTMLInputElement>('bre-color');
    this._opacityInput = this._getDomElement<HTMLInputElement>('bre-opacity');
    this._opacityVal = this._getDomElement<HTMLSpanElement>('bre-opacity-val');
    
    // Per-side border controls
    this._topStyleSelect = this._getDomElement<HTMLSelectElement>('bre-top-style');
    this._topWidthInput = this._getDomElement<HTMLInputElement>('bre-top-width');
    this._topWidthVal = this._getDomElement<HTMLSpanElement>('bre-top-width-val');
    this._topColorInput = this._getDomElement<HTMLInputElement>('bre-top-color');
    this._topOpacityInput = this._getDomElement<HTMLInputElement>('bre-top-opacity');
    this._topOpacityVal = this._getDomElement<HTMLSpanElement>('bre-top-opacity-val');
    
    this._rightStyleSelect = this._getDomElement<HTMLSelectElement>('bre-right-style');
    this._rightWidthInput = this._getDomElement<HTMLInputElement>('bre-right-width');
    this._rightWidthVal = this._getDomElement<HTMLSpanElement>('bre-right-width-val');
    this._rightColorInput = this._getDomElement<HTMLInputElement>('bre-right-color');
    this._rightOpacityInput = this._getDomElement<HTMLInputElement>('bre-right-opacity');
    this._rightOpacityVal = this._getDomElement<HTMLSpanElement>('bre-right-opacity-val');
    
    this._bottomStyleSelect = this._getDomElement<HTMLSelectElement>('bre-bottom-style');
    this._bottomWidthInput = this._getDomElement<HTMLInputElement>('bre-bottom-width');
    this._bottomWidthVal = this._getDomElement<HTMLSpanElement>('bre-bottom-width-val');
    this._bottomColorInput = this._getDomElement<HTMLInputElement>('bre-bottom-color');
    this._bottomOpacityInput = this._getDomElement<HTMLInputElement>('bre-bottom-opacity');
    this._bottomOpacityVal = this._getDomElement<HTMLSpanElement>('bre-bottom-opacity-val');
    
    this._leftStyleSelect = this._getDomElement<HTMLSelectElement>('bre-left-style');
    this._leftWidthInput = this._getDomElement<HTMLInputElement>('bre-left-width');
    this._leftWidthVal = this._getDomElement<HTMLSpanElement>('bre-left-width-val');
    this._leftColorInput = this._getDomElement<HTMLInputElement>('bre-left-color');
    this._leftOpacityInput = this._getDomElement<HTMLInputElement>('bre-left-opacity');
    this._leftOpacityVal = this._getDomElement<HTMLSpanElement>('bre-left-opacity-val');
    
    this._borderUniformDiv = this._getDomElement<HTMLDivElement>('bre-border-uniform-editor');
    this._borderPersideDiv = this._getDomElement<HTMLDivElement>('bre-border-perside');

    this._cssOutput = this._getDomElement<HTMLTextAreaElement>('bre-css-out');
    this._loadBtn = this._getDomElement<HTMLButtonElement>('bre-load-btn');
    this._copyBtn = this._getDomElement<HTMLButtonElement>('bre-copy-btn');
    this._applyBtn = this._getDomElement<HTMLButtonElement>('bre-apply-btn');

    // Uniform mode for corners
    this._uniformCheck.onchange = () => {
      this._config.uniform = !this._uniformCheck.checked;
      this._cornersUniformDiv.style.display = this._config.uniform ? 'block' : 'none';
      this._cornersPersideDiv.style.display = this._config.uniform ? 'none' : 'grid';
      if (this._config.uniform) {
        const tl = this._config.topLeft;
        this._config.topRight = { ...tl };
        this._config.bottomRight = { ...tl };
        this._config.bottomLeft = { ...tl };
      }
      this._syncControls();
      this._refresh();
    };

    // Wire up unified corner controls
    this._uniformXInput.oninput = () => {
      this._config.topLeft.x = Number(this._uniformXInput.value);
      this._config.topRight.x = Number(this._uniformXInput.value);
      this._config.bottomRight.x = Number(this._uniformXInput.value);
      this._config.bottomLeft.x = Number(this._uniformXInput.value);
      this._uniformXVal.textContent = this._config.topLeft.x + '%';
      this._refresh();
    };
    this._uniformYInput.oninput = () => {
      this._config.topLeft.y = Number(this._uniformYInput.value);
      this._config.topRight.y = Number(this._uniformYInput.value);
      this._config.bottomRight.y = Number(this._uniformYInput.value);
      this._config.bottomLeft.y = Number(this._uniformYInput.value);
      this._uniformYVal.textContent = this._config.topLeft.y + '%';
      this._refresh();
    };
    this._uniformShapeSelect.onchange = () => {
      const shape = this._uniformShapeSelect.value as any;
      this._config.topLeft.shape = shape;
      this._config.topRight.shape = shape;
      this._config.bottomRight.shape = shape;
      this._config.bottomLeft.shape = shape;
      this._refresh();
    };

    // Wire up per-corner controls: Top-left
    this._wireCornerControls('tl', this._tlXInput, this._tlYInput, this._tlShapeSelect, this._tlXVal, this._tlYVal);
    this._wireCornerControls('tr', this._trXInput, this._trYInput, this._trShapeSelect, this._trXVal, this._trYVal);
    this._wireCornerControls('br', this._brXInput, this._brYInput, this._brShapeSelect, this._brXVal, this._brYVal);
    this._wireCornerControls('bl', this._blXInput, this._blYInput, this._blShapeSelect, this._blXVal, this._blYVal);

    // Wire up border controls
    this._widthInput.oninput = () => {
      this._config.width = Number(this._widthInput.value);
      this._config.top.width = this._config.width;
      this._config.right.width = this._config.width;
      this._config.bottom.width = this._config.width;
      this._config.left.width = this._config.width;
      this._widthVal.textContent = this._config.width + 'px';
      this._refresh();
    };
    
    this._borderUniformCheck.onchange = () => {
      this._config.borderUniform = !this._borderUniformCheck.checked;
      if (this._config.borderUniform) {
        this._config.width = this._config.top.width;
        this._config.right.width = this._config.top.width;
        this._config.bottom.width = this._config.top.width;
        this._config.left.width = this._config.top.width;
      }
      this._borderUniformDiv.style.display = this._config.borderUniform ? 'block' : 'none';
      this._borderPersideDiv.style.display = this._config.borderUniform ? 'none' : 'grid';
      this._syncControls();
      this._refresh();
    };
    
    // Uniform mode handlers for border
    this._styleSelect.onchange = () => {
      this._config.top.style = this._styleSelect.value;
      this._config.right.style = this._styleSelect.value;
      this._config.bottom.style = this._styleSelect.value;
      this._config.left.style = this._styleSelect.value;
      this._refresh();
    };
    this._colorInput.oninput = () => {
      this._config.top.color = this._colorInput.value;
      this._config.right.color = this._colorInput.value;
      this._config.bottom.color = this._colorInput.value;
      this._config.left.color = this._colorInput.value;
      this._refresh();
    };
    this._opacityInput.oninput = () => {
      const opacity = Number(this._opacityInput.value);
      this._config.top.opacity = opacity;
      this._config.right.opacity = opacity;
      this._config.bottom.opacity = opacity;
      this._config.left.opacity = opacity;
      this._opacityVal.textContent = opacity + '%';
      this._refresh();
    };
    
    // Per-side handlers
    const wirePerSideBorderControls = (side: 'top' | 'right' | 'bottom' | 'left', 
      styleSelect: HTMLSelectElement,
      widthInput: HTMLInputElement,
      widthVal: HTMLSpanElement,
      colorInput: HTMLInputElement,
      opacityInput: HTMLInputElement,
      opacityVal: HTMLSpanElement) => {
      const getSide = (): BorderSide => this._config[side];
      styleSelect.onchange = () => {
        const sideCfg = getSide();
        sideCfg.style = styleSelect.value;
        this._refresh();
      };
      widthInput.oninput = () => {
        const sideCfg = getSide();
        sideCfg.width = Number(widthInput.value);
        widthVal.textContent = sideCfg.width + 'px';
        this._refresh();
      };
      colorInput.oninput = () => {
        const sideCfg = getSide();
        sideCfg.color = colorInput.value;
        this._refresh();
      };
      opacityInput.oninput = () => {
        const sideCfg = getSide();
        sideCfg.opacity = Number(opacityInput.value);
        opacityVal.textContent = sideCfg.opacity + '%';
        this._refresh();
      };
    };
    
    wirePerSideBorderControls('top', this._topStyleSelect, this._topWidthInput, this._topWidthVal, this._topColorInput, this._topOpacityInput, this._topOpacityVal);
    wirePerSideBorderControls('right', this._rightStyleSelect, this._rightWidthInput, this._rightWidthVal, this._rightColorInput, this._rightOpacityInput, this._rightOpacityVal);
    wirePerSideBorderControls('bottom', this._bottomStyleSelect, this._bottomWidthInput, this._bottomWidthVal, this._bottomColorInput, this._bottomOpacityInput, this._bottomOpacityVal);
    wirePerSideBorderControls('left', this._leftStyleSelect, this._leftWidthInput, this._leftWidthVal, this._leftColorInput, this._leftOpacityInput, this._leftOpacityVal);

    // Copy / Apply
    this._copyBtn.onclick = () => { navigator.clipboard?.writeText(this._cssOutput.value).catch(() => {}); };
    this._applyBtn.onclick = () => this._applyToSelection();
    this._loadBtn.onclick = () => {
      this._loadFromPrimarySelection();
      this._syncControls();
      this._refresh();
    };

    this._loadFromPrimarySelection();
    this._syncControls();
    this._refresh();
  }

  private _wireCornerControls(
    cornerKey: 'tl' | 'tr' | 'br' | 'bl',
    xInput: HTMLInputElement,
    yInput: HTMLInputElement,
    shapeSelect: HTMLSelectElement,
    xVal: HTMLSpanElement,
    yVal: HTMLSpanElement
  ) {
    const getCorner = (): BorderRadiusCorner => {
      switch (cornerKey) {
        case 'tl': return this._config.topLeft;
        case 'tr': return this._config.topRight;
        case 'br': return this._config.bottomRight;
        case 'bl': return this._config.bottomLeft;
      }
    };

    xInput.oninput = () => {
      const liveCorner = getCorner();
      liveCorner.x = Number(xInput.value);
      if (this._config.uniform) {
        this._config.topLeft.x = this._config.topRight.x = this._config.bottomRight.x = this._config.bottomLeft.x = liveCorner.x;
      }
      xVal.textContent = liveCorner.x + '%';
      this._refresh();
    };
    yInput.oninput = () => {
      const liveCorner = getCorner();
      liveCorner.y = Number(yInput.value);
      if (this._config.uniform) {
        this._config.topLeft.y = this._config.topRight.y = this._config.bottomRight.y = this._config.bottomLeft.y = liveCorner.y;
      }
      yVal.textContent = liveCorner.y + '%';
      this._refresh();
    };
    shapeSelect.onchange = () => {
      const liveCorner = getCorner();
      liveCorner.shape = shapeSelect.value as BorderRadiusCorner['shape'];
      if (this._config.uniform) {
        this._config.topLeft.shape = this._config.topRight.shape = this._config.bottomRight.shape = this._config.bottomLeft.shape = liveCorner.shape;
      }
      this._refresh();
    };
  }

  private _loadFromPrimarySelection() {
    const primary = this._designerCanvas?.instanceServiceContainer?.selectionService?.primarySelection;
    if (!primary) return;
    const br = primary.getStyle('border-radius');
    if (br) {
      this._config = parseCornerRadius(br);
    }
    // Also load corner-shape property if it exists
    const cs = primary.getStyle('corner-shape');
    if (cs) {
      const shapes = cs.trim().split(/\s+/).filter(Boolean) as ('round' | 'bevel' | 'scoop' | 'inset' | 'notch')[];
      const getShape = (idx: number): BorderRadiusCorner['shape'] => {
        if (shapes.length === 1) return shapes[0];
        if (shapes.length === 2) return shapes[idx === 1 || idx === 2 ? 1 : 0];
        if (shapes.length === 3) return shapes[idx === 3 ? 1 : (idx === 2 ? 2 : 0)];
        return shapes[idx] ?? 'round';
      };
      this._config.topLeft.shape = getShape(0);
      this._config.topRight.shape = getShape(1);
      this._config.bottomRight.shape = getShape(2);
      this._config.bottomLeft.shape = getShape(3);
    }

    const corners = [this._config.topLeft, this._config.topRight, this._config.bottomRight, this._config.bottomLeft];
    this._config.uniform = corners.every(c =>
      c.x === corners[0].x &&
      c.y === corners[0].y &&
      c.shape === corners[0].shape
    );
    // Load border width
    const bw = primary.getStyle('border-width');
    if (bw) {
      const widthTokens = splitTopLevelWhitespace(bw).map(t => parseFloat(t)).filter(v => !isNaN(v));
      const [top, right, bottom, left] = expandQuadTokens(widthTokens);
      if (top != null) this._config.top.width = top;
      if (right != null) this._config.right.width = right;
      if (bottom != null) this._config.bottom.width = bottom;
      if (left != null) this._config.left.width = left;
      if (top != null) this._config.width = top;
    }

    const topWidth = primary.getStyle('border-top-width');
    const rightWidth = primary.getStyle('border-right-width');
    const bottomWidth = primary.getStyle('border-bottom-width');
    const leftWidth = primary.getStyle('border-left-width');
    const hasPerSideWidth = !!(topWidth || rightWidth || bottomWidth || leftWidth);
    if (hasPerSideWidth) {
      this._config.borderUniform = false;
      if (topWidth) {
        const widthNum = parseFloat(topWidth);
        if (!isNaN(widthNum)) this._config.top.width = widthNum;
      }
      if (rightWidth) {
        const widthNum = parseFloat(rightWidth);
        if (!isNaN(widthNum)) this._config.right.width = widthNum;
      }
      if (bottomWidth) {
        const widthNum = parseFloat(bottomWidth);
        if (!isNaN(widthNum)) this._config.bottom.width = widthNum;
      }
      if (leftWidth) {
        const widthNum = parseFloat(leftWidth);
        if (!isNaN(widthNum)) this._config.left.width = widthNum;
      }
      this._config.width = this._config.top.width;
    }
    
    // Load border style and color (per-side or uniform)
    const parseColorAndOpacity = (colorStr: string): { hex: string; opacity: number } => {
      const rgbaMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
      if (rgbaMatch) {
        const hex = '#' + [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])].map(v => v.toString(16).padStart(2, '0')).join('');
        const opacity = rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
        return { hex, opacity };
      } else if (colorStr.startsWith('#')) {
        return { hex: colorStr.slice(0, 7), opacity: 100 };
      }
      return { hex: '#000000', opacity: 100 };
    };
    
    // Try to load per-side styles
    const topStyle = primary.getStyle('border-top-style');
    const rightStyle = primary.getStyle('border-right-style');
    const bottomStyle = primary.getStyle('border-bottom-style');
    const leftStyle = primary.getStyle('border-left-style');
    
    if (topStyle || rightStyle || bottomStyle || leftStyle) {
      // Per-side mode
      this._config.borderUniform = false;
      if (topStyle) this._config.top.style = topStyle;
      if (rightStyle) this._config.right.style = rightStyle;
      if (bottomStyle) this._config.bottom.style = bottomStyle;
      if (leftStyle) this._config.left.style = leftStyle;
    } else {
      // Try uniform shorthand
      const bs = primary.getStyle('border-style');
      if (bs) {
        if (!hasPerSideWidth)
          this._config.borderUniform = true;
        const [top, right, bottom, left] = expandQuadTokens(splitTopLevelWhitespace(bs));
        if (top) this._config.top.style = top;
        if (right) this._config.right.style = right;
        if (bottom) this._config.bottom.style = bottom;
        if (left) this._config.left.style = left;
      }
    }
    
    // Try to load per-side colors
    const topColor = primary.getStyle('border-top-color');
    const rightColor = primary.getStyle('border-right-color');
    const bottomColor = primary.getStyle('border-bottom-color');
    const leftColor = primary.getStyle('border-left-color');
    
    if (topColor || rightColor || bottomColor || leftColor) {
      // Per-side mode
      this._config.borderUniform = false;
      if (topColor) {
        const parsed = parseColorAndOpacity(topColor);
        this._config.top.color = parsed.hex;
        this._config.top.opacity = parsed.opacity;
      }
      if (rightColor) {
        const parsed = parseColorAndOpacity(rightColor);
        this._config.right.color = parsed.hex;
        this._config.right.opacity = parsed.opacity;
      }
      if (bottomColor) {
        const parsed = parseColorAndOpacity(bottomColor);
        this._config.bottom.color = parsed.hex;
        this._config.bottom.opacity = parsed.opacity;
      }
      if (leftColor) {
        const parsed = parseColorAndOpacity(leftColor);
        this._config.left.color = parsed.hex;
        this._config.left.opacity = parsed.opacity;
      }
    } else {
      // Try uniform shorthand
      const bc = primary.getStyle('border-color');
      if (bc) {
        if (!hasPerSideWidth)
          this._config.borderUniform = true;
        const [top, right, bottom, left] = expandQuadTokens(splitTopLevelWhitespace(bc));
        if (top) {
          const parsed = parseColorAndOpacity(top);
          this._config.top.color = parsed.hex;
          this._config.top.opacity = parsed.opacity;
        }
        if (right) {
          const parsed = parseColorAndOpacity(right);
          this._config.right.color = parsed.hex;
          this._config.right.opacity = parsed.opacity;
        }
        if (bottom) {
          const parsed = parseColorAndOpacity(bottom);
          this._config.bottom.color = parsed.hex;
          this._config.bottom.opacity = parsed.opacity;
        }
        if (left) {
          const parsed = parseColorAndOpacity(left);
          this._config.left.color = parsed.hex;
          this._config.left.opacity = parsed.opacity;
        }
      }
    }

    const sides = [this._config.top, this._config.right, this._config.bottom, this._config.left];
    this._config.borderUniform = sides.every(s =>
      s.width === sides[0].width &&
      s.style === sides[0].style &&
      s.color === sides[0].color &&
      s.opacity === sides[0].opacity
    );
    this._config.width = this._config.top.width;
  }

  private _syncControls() {
    // Sync corner controls
    this._uniformCheck.checked = !this._config.uniform;
    this._cornersUniformDiv.style.display = this._config.uniform ? 'block' : 'none';
    this._cornersPersideDiv.style.display = this._config.uniform ? 'none' : 'grid';

    // Sync unified corner controls
    if (this._config.uniform) {
      this._uniformXInput.value = String(this._config.topLeft.x);
      this._uniformYInput.value = String(this._config.topLeft.y);
      this._uniformShapeSelect.value = this._config.topLeft.shape;
      this._uniformXVal.textContent = this._config.topLeft.x + '%';
      this._uniformYVal.textContent = this._config.topLeft.y + '%';
    }

    const syncCorner = (x: HTMLInputElement, y: HTMLInputElement, shape: HTMLSelectElement, xVal: HTMLSpanElement, yVal: HTMLSpanElement, corner: BorderRadiusCorner) => {
      x.value = String(corner.x);
      y.value = String(corner.y);
      shape.value = corner.shape;
      xVal.textContent = corner.x + '%';
      yVal.textContent = corner.y + '%';
    };

    syncCorner(this._tlXInput, this._tlYInput, this._tlShapeSelect, this._tlXVal, this._tlYVal, this._config.topLeft);
    syncCorner(this._trXInput, this._trYInput, this._trShapeSelect, this._trXVal, this._trYVal, this._config.topRight);
    syncCorner(this._brXInput, this._brYInput, this._brShapeSelect, this._brXVal, this._brYVal, this._config.bottomRight);
    syncCorner(this._blXInput, this._blYInput, this._blShapeSelect, this._blXVal, this._blYVal, this._config.bottomLeft);

    // Sync border controls
    this._widthInput.value = String(this._config.width);
    this._widthVal.textContent = this._config.width + 'px';
    
    this._borderUniformCheck.checked = !this._config.borderUniform;
    this._borderUniformDiv.style.display = this._config.borderUniform ? 'block' : 'none';
    this._borderPersideDiv.style.display = this._config.borderUniform ? 'none' : 'grid';
    
    if (this._config.borderUniform) {
      // Sync uniform controls
      this._styleSelect.value = this._config.top.style;
      this._colorInput.value = this._config.top.color;
      this._opacityInput.value = String(this._config.top.opacity);
      this._opacityVal.textContent = this._config.top.opacity + '%';
    } else {
      // Sync per-side controls
      this._topStyleSelect.value = this._config.top.style;
      this._topWidthInput.value = String(this._config.top.width);
      this._topWidthVal.textContent = this._config.top.width + 'px';
      this._topColorInput.value = this._config.top.color;
      this._topOpacityInput.value = String(this._config.top.opacity);
      this._topOpacityVal.textContent = this._config.top.opacity + '%';
      
      this._rightStyleSelect.value = this._config.right.style;
      this._rightWidthInput.value = String(this._config.right.width);
      this._rightWidthVal.textContent = this._config.right.width + 'px';
      this._rightColorInput.value = this._config.right.color;
      this._rightOpacityInput.value = String(this._config.right.opacity);
      this._rightOpacityVal.textContent = this._config.right.opacity + '%';
      
      this._bottomStyleSelect.value = this._config.bottom.style;
      this._bottomWidthInput.value = String(this._config.bottom.width);
      this._bottomWidthVal.textContent = this._config.bottom.width + 'px';
      this._bottomColorInput.value = this._config.bottom.color;
      this._bottomOpacityInput.value = String(this._config.bottom.opacity);
      this._bottomOpacityVal.textContent = this._config.bottom.opacity + '%';
      
      this._leftStyleSelect.value = this._config.left.style;
      this._leftWidthInput.value = String(this._config.left.width);
      this._leftWidthVal.textContent = this._config.left.width + 'px';
      this._leftColorInput.value = this._config.left.color;
      this._leftOpacityInput.value = String(this._config.left.opacity);
      this._leftOpacityVal.textContent = this._config.left.opacity + '%';
    }
  }

  private _buildCss(): { radius: string; shape: string | null; borderCss: { [key: string]: string } } {
    const radius = configToRadiusCss(this._config);
    const shape = configToShapeCss(this._config);
    
    const borderCss: { [key: string]: string } = {};
    
    const { width, style, color } = configToBorderCss(this._config);
    
    if (this._config.borderUniform) {
      // Uniform: use shorthand
      borderCss['border-width'] = width;
      borderCss['border-style'] = style;
      borderCss['border-color'] = color;
    } else {
      // Per-side
      const sides = ['top', 'right', 'bottom', 'left'] as const;
      const sides_data = [this._config.top, this._config.right, this._config.bottom, this._config.left];
      
      for (let i = 0; i < sides.length; i++) {
        const side = sides[i];
        const cfg = sides_data[i];
        borderCss[`border-${side}-width`] = `${cfg.width}px`;
        borderCss[`border-${side}-style`] = cfg.style;
        const rgba = `${hexToRgb(cfg.color)},${(cfg.opacity / 100).toFixed(2)}`;
        borderCss[`border-${side}-color`] = `rgba(${rgba})`;
      }
    }
    
    return {
      radius,
      shape,
      borderCss,
    };
  }

  private _refresh() {
    const { radius, shape, borderCss } = this._buildCss();
    this._previewBox.style.borderRadius = radius;
    // Set corner-shape in preview if not round
    if (shape) {
      (this._previewBox.style as any).cornerShape = shape;
    } else {
      (this._previewBox.style as any).cornerShape = '';
    }
    
    // Set border in preview
    Object.entries(borderCss).forEach(([prop, value]) => {
      (this._previewBox.style as any)[prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = value;
    });

    // Output all properties
    let output = `border-radius: ${radius};`;
    if (shape) {
      output += `\ncorner-shape: ${shape};`;
    }
    Object.entries(borderCss).forEach(([prop, value]) => {
      output += `\n${prop}: ${value};`;
    });
    this._cssOutput.value = output;
  }

  private _applyToSelection() {
    const items = this._designerCanvas?.instanceServiceContainer?.selectionService?.selectedElements;
    if (!items?.length) return;
    const { radius, shape, borderCss } = this._buildCss();
    const group = items[0].openGroup('set border-radius and border properties');
    for (const item of items) {
      item.setStyle('border-radius', radius);
      if (shape) {
        item.setStyle('corner-shape', shape);
      } else {
        item.removeStyle('corner-shape');
      }
      Object.entries(borderCss).forEach(([prop, value]) => {
        item.setStyle(prop, value);
      });
    }
    group.commit();
  }
}

customElements.define('node-projects-border-radius-editor-window', BorderRadiusEditorWindow);
