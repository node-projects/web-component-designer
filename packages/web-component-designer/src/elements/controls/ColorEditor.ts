import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { w3color } from '../helper/w3color.js';

export type ColorEditorMode = 'rgb' | 'hsl' | 'cmyk' | 'oklab' | 'oklch';
export type ColorEditorValueChangedEventArgs = { newValue?: string, oldValue?: string };

type RgbaColor = { r: number, g: number, b: number, a: number };
type HsvColor = { h: number, s: number, v: number };

const modes: ColorEditorMode[] = ['rgb', 'hsl', 'cmyk', 'oklab', 'oklch'];
const epsilon = 0.000001;

export class ColorEditor extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 280px;
      color: var(--property-grid-text-color, #e8edf2);
      font: 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #editor {
      display: grid;
      gap: 10px;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 8px;
      background: var(--color-editor-background, #20252b);
      box-shadow: 0 14px 38px rgba(0, 0, 0, .36);
    }

    #plane {
      position: relative;
      height: 150px;
      border-radius: 6px;
      overflow: hidden;
      cursor: crosshair;
      background:
        linear-gradient(to top, #000, transparent),
        linear-gradient(to right, #fff, transparent),
        hsl(var(--hue, 0) 100% 50%);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .12);
      touch-action: none;
    }

    #plane-handle {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      border: 2px solid white;
      border-radius: 50%;
      transform: translate(-6px, -6px);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, .85), 0 1px 4px rgba(0, 0, 0, .55);
      pointer-events: none;
    }

    .slider-row {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) 42px;
      gap: 8px;
      align-items: center;
    }

    .slider-row span {
      color: rgba(232, 237, 242, .68);
      font-size: 11px;
      text-transform: uppercase;
    }

    input[type="range"] {
      --slider-background: #79b8ff;
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 16px;
      margin: 0;
      background: transparent;
      outline: none;
    }

    #hue {
      --slider-background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
    }

    #alpha {
      --slider-background:
        linear-gradient(to right, rgba(var(--rgb-color, 0, 0, 0), 0), var(--opaque-color, #000)),
        linear-gradient(45deg, rgba(255, 255, 255, .24) 25%, transparent 25% 75%, rgba(255, 255, 255, .24) 75%),
        linear-gradient(45deg, rgba(255, 255, 255, .24) 25%, transparent 25% 75%, rgba(255, 255, 255, .24) 75%),
        #2a3037;
      --slider-background-position: 0 0, 0 0, 5px 5px, 0 0;
      --slider-background-size: auto, 10px 10px, 10px 10px, auto;
    }

    input[type="range"]::-webkit-slider-runnable-track {
      height: 7px;
      border-radius: 999px;
      background: var(--slider-background);
      background-position: var(--slider-background-position, 0 0);
      background-size: var(--slider-background-size, auto);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22);
    }

    input[type="range"]::-moz-range-track {
      height: 7px;
      border-radius: 999px;
      background: var(--slider-background);
      background-position: var(--slider-background-position, 0 0);
      background-size: var(--slider-background-size, auto);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22);
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      margin-top: -3.5px;
      border: 2px solid white;
      border-radius: 50%;
      background: hsl(var(--hue, 0) 100% 50%);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, .75), 0 1px 3px rgba(0, 0, 0, .45);
    }

    input[type="range"]::-moz-range-thumb {
      width: 10px;
      height: 10px;
      border: 2px solid white;
      border-radius: 50%;
      background: hsl(var(--hue, 0) 100% 50%);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, .75), 0 1px 3px rgba(0, 0, 0, .45);
    }

    #alpha::-webkit-slider-thumb {
      background: var(--color, #000);
    }

    #alpha::-moz-range-thumb {
      background: var(--color, #000);
    }

    .swatch {
      width: 42px;
      height: 22px;
      border-radius: 5px;
      background:
        linear-gradient(var(--color, #000), var(--color, #000)),
        linear-gradient(45deg, rgba(255, 255, 255, .22) 25%, transparent 25% 75%, rgba(255, 255, 255, .22) 75%),
        linear-gradient(45deg, rgba(255, 255, 255, .22) 25%, transparent 25% 75%, rgba(255, 255, 255, .22) 75%);
      background-position: 0 0, 0 0, 5px 5px;
      background-size: auto, 10px 10px, 10px 10px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .16);
    }

    #mode {
      height: 26px;
      min-width: 0;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 5px;
      background: #161a1f;
      color: inherit;
      font: inherit;
      outline: none;
    }

    #channels {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
    }

    label {
      display: grid;
      gap: 3px;
      min-width: 0;
      color: rgba(232, 237, 242, .68);
      font-size: 10px;
      text-transform: uppercase;
    }

    input[type="number"],
    #text {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      height: 26px;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 5px;
      background: #161a1f;
      color: inherit;
      font: inherit;
      outline: none;
    }

    input[type="number"] {
      padding: 0 4px;
    }

    #text {
      padding: 0 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-transform: none;
    }

    #text.invalid {
      border-color: #e66b6b;
      box-shadow: 0 0 0 1px rgba(230, 107, 107, .35);
    }

    input:focus,
    select:focus {
      border-color: #79b8ff;
      box-shadow: 0 0 0 1px rgba(121, 184, 255, .28);
    }

    :host([readonly]) input,
    :host([readonly]) select,
    :host([readonly]) #plane,
    :host([disabled]) input,
    :host([disabled]) select,
    :host([disabled]) #plane {
      opacity: .65;
      pointer-events: none;
    }
  `;

  public static override readonly template = html`
    <div id="editor">
      <div id="plane"><div id="plane-handle"></div></div>
      <div class="slider-row">
        <span>Hue</span>
        <input id="hue" type="range" min="0" max="360" step="1">
        <div id="preview" class="swatch"></div>
      </div>
      <div class="slider-row">
        <span>Alpha</span>
        <input id="alpha" type="range" min="0" max="100" step="1">
        <span id="alpha-label"></span>
      </div>
      <select id="mode" aria-label="Color mode">
        <option value="rgb">RGB</option>
        <option value="hsl">HSL</option>
        <option value="cmyk">CMYK</option>
        <option value="oklab">OKLab</option>
        <option value="oklch">OKLCH</option>
      </select>
      <div id="channels"></div>
      <input id="text" type="text" spellcheck="false" aria-label="Color text">
    </div>
  `;

  public valueChanged = new TypedEvent<ColorEditorValueChangedEventArgs>();
  public valuePreviewChanged = new TypedEvent<ColorEditorValueChangedEventArgs>();

  private _value = '#000000';
  private _color: RgbaColor = { r: 0, g: 0, b: 0, a: 1 };
  private _mode: ColorEditorMode = 'rgb';
  private _hue = 0;
  private _plane: HTMLDivElement;
  private _planeHandle: HTMLDivElement;
  private _hueInput: HTMLInputElement;
  private _alphaInput: HTMLInputElement;
  private _alphaLabel: HTMLSpanElement;
  private _modeSelect: HTMLSelectElement;
  private _channels: HTMLDivElement;
  private _textInput: HTMLInputElement;
  private _dragPointerId: number = null;

  public get value() {
    return this._value;
  }
  public set value(value: string) {
    const parsed = parseColor(value);
    if (parsed) {
      this._color = parsed;
      this._mode = inferColorMode(value) ?? this._mode;
      this._syncHueFromColor();
      this._value = this._formatColor();
      this._render();
      return;
    }
    this._value = value ?? '';
    this._render();
  }

  public get mode() {
    return this._mode;
  }
  public set mode(value: ColorEditorMode) {
    if (modes.includes(value)) {
      this._mode = value;
      this._value = this._formatColor();
      this._render();
    }
  }

  public get readOnly() {
    return this.hasAttribute('readonly');
  }
  public set readOnly(value: boolean) {
    this.toggleAttribute('readonly', value);
  }

  public get disabled() {
    return this.hasAttribute('disabled');
  }
  public set disabled(value: boolean) {
    this.toggleAttribute('disabled', value);
  }

  constructor() {
    super();
    this._plane = this._getDomElement<HTMLDivElement>('plane');
    this._planeHandle = this._getDomElement<HTMLDivElement>('plane-handle');
    this._hueInput = this._getDomElement<HTMLInputElement>('hue');
    this._alphaInput = this._getDomElement<HTMLInputElement>('alpha');
    this._alphaLabel = this._getDomElement<HTMLSpanElement>('alpha-label');
    this._modeSelect = this._getDomElement<HTMLSelectElement>('mode');
    this._channels = this._getDomElement<HTMLDivElement>('channels');
    this._textInput = this._getDomElement<HTMLInputElement>('text');
  }

  ready() {
    this._wireEvents();
    const attributeValue = this.getAttribute('value');
    if (attributeValue != null)
      this.value = attributeValue;
    const attributeMode = this.getAttribute('mode') as ColorEditorMode;
    if (modes.includes(attributeMode)) {
      this._mode = attributeMode;
      this._value = this._formatColor();
    }
    this._render();
  }

  private _wireEvents() {
    this._plane.addEventListener('pointerdown', e => this._startPlaneDrag(e));
    this._hueInput.addEventListener('input', () => this._applyHue(true));
    this._hueInput.addEventListener('change', () => this._commitCurrentValue());
    this._alphaInput.addEventListener('input', () => this._applyAlpha(true));
    this._alphaInput.addEventListener('change', () => this._commitCurrentValue());
    this._modeSelect.addEventListener('change', () => {
      this.mode = this._modeSelect.value as ColorEditorMode;
      this._commitCurrentValue();
    });
    this._channels.addEventListener('input', () => this._applyChannelInputs(true));
    this._channels.addEventListener('change', () => this._commitCurrentValue());
    this._textInput.addEventListener('input', () => this._validateTextInput());
    this._textInput.addEventListener('change', () => this._applyText());
    this._textInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this._applyText();
        this._textInput.blur();
      }
    });
  }

  private _startPlaneDrag(event: PointerEvent) {
    if (this.readOnly || this.disabled)
      return;
    this._dragPointerId = event.pointerId;
    this._plane.setPointerCapture(event.pointerId);
    this._applyPlanePointer(event, true);
    this._plane.addEventListener('pointermove', this._planePointerMove);
    this._plane.addEventListener('pointerup', this._finishPlaneDrag);
    this._plane.addEventListener('pointercancel', this._finishPlaneDrag);
    event.preventDefault();
  }

  private _planePointerMove = (event: PointerEvent) => {
    if (event.pointerId === this._dragPointerId)
      this._applyPlanePointer(event, true);
  };

  private _finishPlaneDrag = (event: PointerEvent) => {
    if (event.pointerId !== this._dragPointerId)
      return;
    this._dragPointerId = null;
    this._plane.removeEventListener('pointermove', this._planePointerMove);
    this._plane.removeEventListener('pointerup', this._finishPlaneDrag);
    this._plane.removeEventListener('pointercancel', this._finishPlaneDrag);
    this._commitCurrentValue();
  };

  private _applyPlanePointer(event: PointerEvent, preview: boolean) {
    const rect = this._plane.getBoundingClientRect();
    const s = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - ((event.clientY - rect.top) / rect.height), 0, 1);
    const hue = Number(this._hueInput.value) || 0;
    this._hue = normalizeHue(hue);
    this._setColor({ ...hsvToRgb(hue, s, v), a: this._color.a }, preview);
  }

  private _applyHue(preview: boolean) {
    const hsv = rgbToHsv(this._color);
    const hue = Number(this._hueInput.value) || 0;
    this._hue = normalizeHue(hue);
    this._setColor({ ...hsvToRgb(hue, hsv.s || 1, hsv.v || 1), a: this._color.a }, preview);
  }

  private _applyAlpha(preview: boolean) {
    this._setColor({ ...this._color, a: clamp(Number(this._alphaInput.value) / 100, 0, 1) }, preview);
  }

  private _applyChannelInputs(preview: boolean) {
    const values = [...this._channels.querySelectorAll<HTMLInputElement>('input')].reduce((map, input) => {
      map[input.name] = Number(input.value);
      return map;
    }, {} as Record<string, number>);

    let color: RgbaColor;
    if (this._mode === 'rgb')
      color = { r: values.r, g: values.g, b: values.b, a: values.a / 100 };
    else if (this._mode === 'hsl')
      color = { ...hslToRgb(values.h, values.s / 100, values.l / 100), a: values.a / 100 };
    else if (this._mode === 'cmyk')
      color = { ...cmykToRgb(values.c / 100, values.m / 100, values.y / 100, values.k / 100), a: values.a / 100 };
    else if (this._mode === 'oklab')
      color = { ...oklabToRgb(values.l / 100, values.a1, values.b1), a: values.alpha / 100 };
    else
      color = { ...oklchToRgb(values.l / 100, values.c, values.h), a: values.a / 100 };

    this._setColor(normalizeColor(color), preview, false, true);
  }

  private _validateTextInput() {
    const text = this._textInput.value.trim();
    this._textInput.classList.toggle('invalid', text.length > 0 && !parseColor(text));
  }

  private _applyText() {
    const parsed = parseColor(this._textInput.value);
    this._textInput.classList.toggle('invalid', !parsed);
    if (!parsed)
      return;
    this._mode = inferColorMode(this._textInput.value) ?? this._mode;
    this._setColor(parsed, false, true, true);
  }

  private _setColor(color: RgbaColor, preview: boolean, renderChannels = true, syncHue = false) {
    const oldValue = this._value;
    this._color = normalizeColor(color);
    if (syncHue)
      this._syncHueFromColor();
    this._value = this._formatColor();
    this._render(renderChannels);
    if (preview)
      this.valuePreviewChanged.emit({ newValue: this._value, oldValue });
    else
      this.valueChanged.emit({ newValue: this._value, oldValue });
  }

  private _commitCurrentValue() {
    const oldValue = this._value;
    this._value = this._formatColor();
    this.valueChanged.emit({ newValue: this._value, oldValue });
  }

  private _render(renderChannels = true) {
    if (!this._textInput)
      return;

    const hsv = rgbToHsv(this._color);
    this.style.setProperty('--hue', String(Math.round(this._hue)));
    this.style.setProperty('--color', toCssRgb(this._color));
    this.style.setProperty('--opaque-color', `rgb(${this._color.r}, ${this._color.g}, ${this._color.b})`);
    this.style.setProperty('--rgb-color', `${this._color.r}, ${this._color.g}, ${this._color.b}`);
    this._planeHandle.style.left = `${hsv.s * 100}%`;
    this._planeHandle.style.top = `${(1 - hsv.v) * 100}%`;
    this._hueInput.value = String(Math.round(this._hue));
    this._alphaInput.value = String(Math.round(this._color.a * 100));
    this._alphaLabel.textContent = `${Math.round(this._color.a * 100)}%`;
    this._modeSelect.value = this._mode;
    if (renderChannels)
      this._renderChannelInputs();
    if (document.activeElement !== this._textInput)
      this._textInput.value = this._value;
    this._textInput.classList.remove('invalid');
  }

  private _renderChannelInputs() {
    const channels = getChannelValues(this._color, this._mode);
    this._channels.innerHTML = channels.map(channel => `
      <label>${channel.label}
        <input type="number" name="${channel.name}" min="${channel.min}" max="${channel.max}" step="${channel.step}" value="${channel.value}">
      </label>`).join('');
  }

  private _formatColor() {
    return formatColor(this._color, this._mode);
  }

  private _syncHueFromColor() {
    const hsv = rgbToHsv(this._color);
    if (hsv.s > epsilon && hsv.v > epsilon)
      this._hue = normalizeHue(hsv.h);
  }
}

export class ColorInput extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    :host {
      display: inline-block;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 2px;
    }

    button {
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 3px;
      border: 1px solid var(--input-border-color, #596c7a);
      border-radius: 4px;
      background: var(--input-background-color, #1d2228);
      cursor: pointer;
      outline: none;
    }

    button:focus {
      border-color: #79b8ff;
      box-shadow: 0 0 0 1px rgba(121, 184, 255, .28);
    }

    #swatch {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 2px;
      background:
        linear-gradient(var(--color, #000), var(--color, #000)),
        linear-gradient(45deg, rgba(255, 255, 255, .25) 25%, transparent 25% 75%, rgba(255, 255, 255, .25) 75%),
        linear-gradient(45deg, rgba(255, 255, 255, .25) 25%, transparent 25% 75%, rgba(255, 255, 255, .25) 75%);
      background-position: 0 0, 0 0, 5px 5px;
      background-size: auto, 10px 10px, 10px 10px;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .28);
    }

    :host([readonly]) button,
    :host([disabled]) button {
      cursor: default;
      opacity: .65;
    }
  `;

  public static override readonly template = html`
    <button id="button" type="button" aria-label="Edit color"><span id="swatch"></span></button>
  `;

  private _value = '#000000';
  private _button: HTMLButtonElement;
  private _popup: HTMLDivElement;
  private _editor: ColorEditor;
  private _ignoreNextClick = false;
  private _outsidePointerHandler = (event: PointerEvent) => this._handleOutsidePointer(event);
  private _windowKeyHandler = (event: KeyboardEvent) => this._handleWindowKey(event);

  public get value() {
    return this._value;
  }
  public set value(value: string) {
    this._setValue(value, false);
  }

  public get readOnly() {
    return this.hasAttribute('readonly');
  }
  public set readOnly(value: boolean) {
    this.toggleAttribute('readonly', value);
  }

  public get disabled() {
    return this.hasAttribute('disabled');
  }
  public set disabled(value: boolean) {
    this.toggleAttribute('disabled', value);
    if (this._button)
      this._button.disabled = value;
  }

  constructor() {
    super();
    this._button = this._getDomElement<HTMLButtonElement>('button');
  }

  ready() {
    const attributeValue = this.getAttribute('value');
    if (attributeValue != null)
      this._setValue(attributeValue, false);
    this._button.disabled = this.disabled;
    this._button.addEventListener('pointerdown', e => this._handleButtonPointerDown(e));
    this._button.addEventListener('click', e => this._handleButtonClick(e));
    this._button.addEventListener('keydown', e => this._handleButtonKeyDown(e));
    this._renderSwatch();
  }

  disconnectedCallback() {
    this._closePopup();
  }

  private _togglePopup() {
    if (this.readOnly || this.disabled)
      return;
    if (this._popup)
      this._closePopup();
    else
      this._openPopup();
  }

  private _handleButtonPointerDown(event: PointerEvent) {
    if (event.button !== 0)
      return;
    this._ignoreNextClick = true;
    this._togglePopup();
    event.preventDefault();
    event.stopPropagation();
  }

  private _handleButtonClick(event: MouseEvent) {
    if (this._ignoreNextClick) {
      this._ignoreNextClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this._togglePopup();
  }

  private _handleButtonKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ')
      return;
    this._togglePopup();
    event.preventDefault();
    event.stopPropagation();
  }

  private _openPopup() {
    this._popup = document.createElement('div');
    this._popup.style.position = 'fixed';
    this._popup.style.zIndex = '100000';
    this._popup.style.width = '280px';

    this._editor = document.createElement('node-projects-color-editor') as ColorEditor;
    this._editor.value = this._value;
    this._editor.valuePreviewChanged.on(e => {
      this._setValue(e.newValue, true);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    this._editor.valueChanged.on(e => {
      this._setValue(e.newValue, true);
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });
    this._popup.appendChild(this._editor);
    document.body.appendChild(this._popup);
    this._positionPopup();
    window.addEventListener('resize', () => this._positionPopup(), { once: true });
    window.addEventListener('scroll', () => this._positionPopup(), { once: true, capture: true });
    window.addEventListener('keydown', this._windowKeyHandler);
    requestAnimationFrame(() => window.addEventListener('pointerdown', this._outsidePointerHandler, true));
  }

  private _positionPopup() {
    if (!this._popup)
      return;
    const rect = this.getBoundingClientRect();
    const width = this._popup.offsetWidth || 280;
    const height = this._popup.offsetHeight || 360;
    let left = rect.left;
    let top = rect.bottom + 4;
    if (left + width > window.innerWidth - 8)
      left = window.innerWidth - width - 8;
    if (top + height > window.innerHeight - 8)
      top = rect.top - height - 4;
    this._popup.style.left = `${Math.max(8, left)}px`;
    this._popup.style.top = `${Math.max(8, top)}px`;
  }

  private _handleOutsidePointer(event: PointerEvent) {
    const path = event.composedPath();
    if (path.includes(this) || (this._popup && path.includes(this._popup)))
      return;
    this._closePopup();
  }

  private _handleWindowKey(event: KeyboardEvent) {
    if (event.key === 'Escape')
      this._closePopup();
  }

  private _closePopup() {
    window.removeEventListener('pointerdown', this._outsidePointerHandler, true);
    window.removeEventListener('keydown', this._windowKeyHandler);
    this._popup?.remove();
    this._popup = null;
    this._editor = null;
  }

  private _setValue(value: string, updateAttribute: boolean) {
    this._value = value ?? '';
    if (updateAttribute)
      this.setAttribute('value', this._value);
    this._renderSwatch();
  }

  private _renderSwatch() {
    const parsed = parseColor(this._value) ?? { r: 0, g: 0, b: 0, a: 1 };
    this.style.setProperty('--color', toCssRgb(parsed));
  }
}

function parseColor(value: string): RgbaColor {
  if (!value)
    return null;
  const text = value.trim();
  if (text.toLowerCase() === 'transparent')
    return { r: 0, g: 0, b: 0, a: 0 };
  const hex = parseHexColor(text);
  if (hex)
    return hex;
  const oklab = parseOklabColor(text);
  if (oklab)
    return oklab;

  const normalized = normalizeModernColorSyntax(text);
  const color = w3color.toColorObject(normalized);
  if (color?.valid)
    return normalizeColor({ r: color.red, g: color.green, b: color.blue, a: color.opacity });
  return null;
}

function inferColorMode(value: string): ColorEditorMode {
  const match = /^\s*(rgba?|hsla?|cmyk|oklab|oklch)\s*\(/i.exec(value ?? '');
  const colorFunction = match?.[1]?.toLowerCase();
  if (colorFunction === 'rgb' || colorFunction === 'rgba')
    return 'rgb';
  if (colorFunction === 'hsl' || colorFunction === 'hsla')
    return 'hsl';
  if (colorFunction === 'cmyk')
    return 'cmyk';
  if (colorFunction === 'oklab')
    return 'oklab';
  if (colorFunction === 'oklch')
    return 'oklch';
  return null;
}

function normalizeModernColorSyntax(value: string) {
  return value
    .replace(/,\s*/g, ',')
    .replace(/rgba?\(([^)]*)\)/i, (_, body) => normalizeFunctionBody('rgb', body))
    .replace(/hsla?\(([^)]*)\)/i, (_, body) => normalizeFunctionBody('hsl', body));
}

function normalizeFunctionBody(name: string, body: string) {
  if (body.includes(',')) {
    const parts = body.split(',').map(x => x.trim());
    if (parts.length === 4 && parts[3].endsWith('%'))
      parts[3] = String(Number(parts[3].slice(0, -1)) / 100);
    return `${name}${parts.length === 4 ? 'a' : ''}(${parts.join(',')})`;
  }
  const [channels, alpha] = body.split('/').map(x => x.trim());
  const parts = channels.split(/\s+/).filter(Boolean);
  if (alpha)
    parts.push(alpha.endsWith('%') ? String(Number(alpha.slice(0, -1)) / 100) : alpha);
  return `${name}${parts.length === 4 ? 'a' : ''}(${parts.join(',')})`;
}

function parseHexColor(value: string): RgbaColor {
  const match = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (!match)
    return null;
  const hex = match[1];
  const read = (part: string) => parseInt(part.length === 1 ? part + part : part, 16);
  if (hex.length === 3 || hex.length === 4)
    return normalizeColor({ r: read(hex[0]), g: read(hex[1]), b: read(hex[2]), a: hex.length === 4 ? read(hex[3]) / 255 : 1 });
  if (hex.length === 6 || hex.length === 8)
    return normalizeColor({ r: read(hex.slice(0, 2)), g: read(hex.slice(2, 4)), b: read(hex.slice(4, 6)), a: hex.length === 8 ? read(hex.slice(6, 8)) / 255 : 1 });
  return null;
}

function parseOklabColor(value: string): RgbaColor {
  const match = /^(oklab|oklch)\((.*)\)$/i.exec(value);
  if (!match)
    return null;
  const mode = match[1].toLowerCase();
  const [channels, alphaText] = match[2].split('/').map(x => x.trim());
  const parts = channels.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length !== 3)
    return null;
  const alpha = alphaText ? parseNumberOrPercent(alphaText, 1) : 1;
  if (mode === 'oklab')
    return normalizeColor({ ...oklabToRgb(parseNumberOrPercent(parts[0], 1), Number(parts[1]), Number(parts[2])), a: alpha });
  return normalizeColor({ ...oklchToRgb(parseNumberOrPercent(parts[0], 1), Number(parts[1]), Number(parts[2])), a: alpha });
}

function formatColor(color: RgbaColor, mode: ColorEditorMode) {
  const alpha = round(color.a, 3);
  if (mode === 'rgb')
    return color.a >= 1 ? `rgb(${color.r}, ${color.g}, ${color.b})` : `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  if (mode === 'hsl') {
    const hsl = rgbToHsl(color);
    return color.a >= 1
      ? `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
      : `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${alpha})`;
  }
  if (mode === 'cmyk') {
    const cmyk = rgbToCmyk(color);
    const body = `${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%`;
    return color.a >= 1 ? `cmyk(${body})` : `cmyk(${body}, ${alpha})`;
  }
  if (mode === 'oklab') {
    const lab = rgbToOklab(color);
    return `oklab(${round(lab.l * 100, 2)}% ${round(lab.a, 4)} ${round(lab.b, 4)}${color.a >= 1 ? '' : ` / ${alpha}`})`;
  }
  const lch = rgbToOklch(color);
  return `oklch(${round(lch.l * 100, 2)}% ${round(lch.c, 4)} ${round(lch.h, 2)}${color.a >= 1 ? '' : ` / ${alpha}`})`;
}

function getChannelValues(color: RgbaColor, mode: ColorEditorMode) {
  if (mode === 'rgb')
    return [
      { label: 'R', name: 'r', value: color.r, min: 0, max: 255, step: 1 },
      { label: 'G', name: 'g', value: color.g, min: 0, max: 255, step: 1 },
      { label: 'B', name: 'b', value: color.b, min: 0, max: 255, step: 1 },
      { label: 'A', name: 'a', value: Math.round(color.a * 100), min: 0, max: 100, step: 1 }
    ];
  if (mode === 'hsl') {
    const hsl = rgbToHsl(color);
    return [
      { label: 'H', name: 'h', value: Math.round(hsl.h), min: 0, max: 360, step: 1 },
      { label: 'S', name: 's', value: Math.round(hsl.s * 100), min: 0, max: 100, step: 1 },
      { label: 'L', name: 'l', value: Math.round(hsl.l * 100), min: 0, max: 100, step: 1 },
      { label: 'A', name: 'a', value: Math.round(color.a * 100), min: 0, max: 100, step: 1 }
    ];
  }
  if (mode === 'cmyk') {
    const cmyk = rgbToCmyk(color);
    return [
      { label: 'C', name: 'c', value: Math.round(cmyk.c * 100), min: 0, max: 100, step: 1 },
      { label: 'M', name: 'm', value: Math.round(cmyk.m * 100), min: 0, max: 100, step: 1 },
      { label: 'Y', name: 'y', value: Math.round(cmyk.y * 100), min: 0, max: 100, step: 1 },
      { label: 'K', name: 'k', value: Math.round(cmyk.k * 100), min: 0, max: 100, step: 1 },
      { label: 'A', name: 'a', value: Math.round(color.a * 100), min: 0, max: 100, step: 1 }
    ];
  }
  if (mode === 'oklab') {
    const lab = rgbToOklab(color);
    return [
      { label: 'L', name: 'l', value: round(lab.l * 100, 2), min: 0, max: 100, step: .1 },
      { label: 'A', name: 'a1', value: round(lab.a, 4), min: -1, max: 1, step: .001 },
      { label: 'B', name: 'b1', value: round(lab.b, 4), min: -1, max: 1, step: .001 },
      { label: 'Alpha', name: 'alpha', value: Math.round(color.a * 100), min: 0, max: 100, step: 1 }
    ];
  }
  const lch = rgbToOklch(color);
  return [
    { label: 'L', name: 'l', value: round(lch.l * 100, 2), min: 0, max: 100, step: .1 },
    { label: 'C', name: 'c', value: round(lch.c, 4), min: 0, max: 1, step: .001 },
    { label: 'H', name: 'h', value: round(lch.h, 2), min: 0, max: 360, step: .1 },
    { label: 'A', name: 'a', value: Math.round(color.a * 100), min: 0, max: 100, step: 1 }
  ];
}

function normalizeColor(color: RgbaColor): RgbaColor {
  return {
    r: Math.round(clamp(color.r, 0, 255)),
    g: Math.round(clamp(color.g, 0, 255)),
    b: Math.round(clamp(color.b, 0, 255)),
    a: clamp(Number.isFinite(color.a) ? color.a : 1, 0, 1)
  };
}

function toCssRgb(color: RgbaColor) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${round(color.a, 3)})`;
}

function rgbToHsv(color: RgbaColor): HsvColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r)
      h = ((g - b) / d) % 6;
    else if (max === g)
      h = (b - r) / d + 2;
    else
      h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60)
    [r, g, b] = [c, x, 0];
  else if (h < 120)
    [r, g, b] = [x, c, 0];
  else if (h < 180)
    [r, g, b] = [0, c, x];
  else if (h < 240)
    [r, g, b] = [0, x, c];
  else if (h < 300)
    [r, g, b] = [x, 0, c];
  else
    [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function rgbToHsl(color: RgbaColor) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r)
      h = ((g - b) / d) % 6;
    else if (max === g)
      h = (b - r) / d + 2;
    else
      h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: (h + 360) % 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60)
    [r, g, b] = [c, x, 0];
  else if (h < 120)
    [r, g, b] = [x, c, 0];
  else if (h < 180)
    [r, g, b] = [0, c, x];
  else if (h < 240)
    [r, g, b] = [0, x, c];
  else if (h < 300)
    [r, g, b] = [x, 0, c];
  else
    [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function rgbToCmyk(color: RgbaColor) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1 - epsilon)
    return { c: 0, m: 0, y: 0, k: 1 };
  return {
    c: (1 - r - k) / (1 - k),
    m: (1 - g - k) / (1 - k),
    y: (1 - b - k) / (1 - k),
    k
  };
}

function cmykToRgb(c: number, m: number, y: number, k: number) {
  return {
    r: 255 * (1 - c) * (1 - k),
    g: 255 * (1 - m) * (1 - k),
    b: 255 * (1 - y) * (1 - k)
  };
}

function rgbToOklab(color: RgbaColor) {
  const r = srgbToLinear(color.r / 255);
  const g = srgbToLinear(color.g / 255);
  const b = srgbToLinear(color.b / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  };
}

function oklabToRgb(lValue: number, aValue: number, bValue: number) {
  const l = Math.pow(lValue + 0.3963377774 * aValue + 0.2158037573 * bValue, 3);
  const m = Math.pow(lValue - 0.1055613458 * aValue - 0.0638541728 * bValue, 3);
  const s = Math.pow(lValue - 0.0894841775 * aValue - 1.2914855480 * bValue, 3);
  return {
    r: 255 * linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: 255 * linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: 255 * linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
  };
}

function rgbToOklch(color: RgbaColor) {
  const lab = rgbToOklab(color);
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const h = c < epsilon ? 0 : (Math.atan2(lab.b, lab.a) * 180 / Math.PI + 360) % 360;
  return { l: lab.l, c, h };
}

function oklchToRgb(l: number, c: number, h: number) {
  const radians = h * Math.PI / 180;
  return oklabToRgb(l, c * Math.cos(radians), c * Math.sin(radians));
}

function srgbToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number) {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function parseNumberOrPercent(value: string, percentBase: number) {
  return value.endsWith('%') ? Number(value.slice(0, -1)) / 100 * percentBase : Number(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function normalizeHue(value: number) {
  return clamp(value, 0, 360);
}

function round(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

customElements.define('node-projects-color-editor', ColorEditor);
customElements.define('node-projects-color-input', ColorInput);
