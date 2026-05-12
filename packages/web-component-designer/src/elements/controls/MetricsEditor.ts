import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export type MetricsEditorArea = 'position' | 'margin' | 'border' | 'padding' | 'content';
export type MetricsEditorSide = 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height';
export type MetricsEditorValueChangedEventArgs = {
  property: string,
  area: MetricsEditorArea,
  side: MetricsEditorSide,
  newValue?: string,
  oldValue?: string
};

type MetricsEditorValueMap = Partial<Record<MetricsEditorArea, Partial<Record<MetricsEditorSide, string>>>>;
const metricsEditorNaturalWidth = 436;

const cssProperties: Record<MetricsEditorArea, Partial<Record<MetricsEditorSide, string>>> = {
  position: {
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left'
  },
  margin: {
    top: 'margin-top',
    right: 'margin-right',
    bottom: 'margin-bottom',
    left: 'margin-left'
  },
  border: {
    top: 'border-top-width',
    right: 'border-right-width',
    bottom: 'border-bottom-width',
    left: 'border-left-width'
  },
  padding: {
    top: 'padding-top',
    right: 'padding-right',
    bottom: 'padding-bottom',
    left: 'padding-left'
  },
  content: {
    width: 'width',
    height: 'height'
  }
};

const computedStyleProperties: Record<string, string> = {
  'border-top-width': 'borderTopWidth',
  'border-right-width': 'borderRightWidth',
  'border-bottom-width': 'borderBottomWidth',
  'border-left-width': 'borderLeftWidth',
  'margin-top': 'marginTop',
  'margin-right': 'marginRight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  'padding-top': 'paddingTop',
  'padding-right': 'paddingRight',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft'
};

export class MetricsEditor extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    :host {
      display: block;
      box-sizing: border-box;
      min-width: 0;
      color: var(--property-grid-text-color, white);
      font: 11px monospace;
      overflow: hidden;
    }

    #box-model {
      display: grid;
      grid-template-columns: 46px minmax(120px, 1fr) 46px;
      grid-template-rows: 22px minmax(29px, auto) minmax(58px, auto) minmax(29px, auto) 22px;
      grid-template-areas:
        ". position-top ."
        "position-left margin position-right"
        "position-left margin position-right"
        "position-left margin position-right"
        ". position-bottom .";
      align-items: center;
      justify-items: center;
      width: 100%;
      min-width: ${metricsEditorNaturalWidth}px;
      box-sizing: border-box;
      padding: 4px;
      transform-origin: top left;
    }

    .ring {
      display: grid;
      grid-template-columns: 42px minmax(56px, 1fr) 42px;
      grid-template-rows: 20px minmax(34px, auto) 20px;
      grid-template-areas:
        ". top ."
        "left inner right"
        ". bottom .";
      align-items: center;
      justify-items: center;
      position: relative;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      height: 100%;
      min-height: 116px;
      border: 1px dashed rgba(0, 0, 0, .55);
    }

    #margin {
      grid-area: margin;
      background: #f6c89f;
    }

    #border {
      grid-area: inner;
      background: #f7dd9c;
      border-style: solid;
      min-height: 76px;
    }

    #padding {
      grid-area: inner;
      background: #c8d08f;
      min-height: 38px;
    }

    #content {
      grid-area: inner;
      display: grid;
      grid-template-columns: minmax(26px, 1fr) auto minmax(26px, 1fr);
      gap: 4px;
      align-items: center;
      justify-items: center;
      width: 100%;
      height: 100%;
      min-height: 24px;
      box-sizing: border-box;
      background: #8fb9c3;
      border: 1px solid rgba(0, 0, 0, .65);
    }

    #position-label,
    #content-label {
      display: none;
    }

    #content.box,
    #border.box {
      outline: 2px solid rgba(0, 0, 0, .85);
      outline-offset: -2px;
    }

    .label {
      position: absolute;
      top: 2px;
      left: 4px;
      max-width: calc(100% - 8px);
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      color: rgba(0, 0, 0, .72);
      font-size: 10px;
      line-height: 12px;
    }

    input {
      width: 38px;
      max-width: 100%;
      min-width: 0;
      height: 17px;
      box-sizing: border-box;
      padding: 0 2px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: rgba(0, 0, 0, .85);
      font: inherit;
      line-height: 17px;
      text-align: center;
      outline: none;
    }

    input:hover,
    input:focus {
      background: rgba(255, 255, 255, .72);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, .35);
    }

    input:disabled {
      opacity: .65;
    }

    [data-side="top"] {
      grid-area: top;
    }

    [data-side="right"] {
      grid-area: right;
    }

    [data-side="bottom"] {
      grid-area: bottom;
    }

    [data-side="left"] {
      grid-area: left;
    }

    [data-area="position"][data-side="top"] {
      grid-area: position-top;
    }

    [data-area="position"][data-side="right"] {
      grid-area: position-right;
    }

    [data-area="position"][data-side="bottom"] {
      grid-area: position-bottom;
    }

    [data-area="position"][data-side="left"] {
      grid-area: position-left;
    }
  `;

  public static override readonly template = html`
    <div id="box-model">
      <span id="position-label" class="label" title="position">position</span>
      <input data-area="position" data-side="top" title="top" spellcheck="false">
      <input data-area="position" data-side="right" title="right" spellcheck="false">
      <input data-area="position" data-side="bottom" title="bottom" spellcheck="false">
      <input data-area="position" data-side="left" title="left" spellcheck="false">

      <div id="margin" class="ring">
        <span class="label" title="margin">margin</span>
        <input data-area="margin" data-side="top" title="margin-top" spellcheck="false">
        <input data-area="margin" data-side="right" title="margin-right" spellcheck="false">
        <input data-area="margin" data-side="bottom" title="margin-bottom" spellcheck="false">
        <input data-area="margin" data-side="left" title="margin-left" spellcheck="false">

        <div id="border" class="ring">
          <span class="label" title="border">border</span>
          <input data-area="border" data-side="top" title="border-top-width" spellcheck="false">
          <input data-area="border" data-side="right" title="border-right-width" spellcheck="false">
          <input data-area="border" data-side="bottom" title="border-bottom-width" spellcheck="false">
          <input data-area="border" data-side="left" title="border-left-width" spellcheck="false">

          <div id="padding" class="ring">
            <span class="label" title="padding">padding</span>
            <input data-area="padding" data-side="top" title="padding-top" spellcheck="false">
            <input data-area="padding" data-side="right" title="padding-right" spellcheck="false">
            <input data-area="padding" data-side="bottom" title="padding-bottom" spellcheck="false">
            <input data-area="padding" data-side="left" title="padding-left" spellcheck="false">

            <div id="content">
              <span id="content-label" class="label" title="content">content</span>
              <input data-area="content" data-side="width" title="width" spellcheck="false">
              <span id="content-separator">x</span>
              <input data-area="content" data-side="height" title="height" spellcheck="false">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  public property: string;
  public unsetValue = '-';

  private _borderDiv: HTMLDivElement;
  private _boxModelDiv: HTMLDivElement;
  private _contentDiv: HTMLDivElement;
  private _inputs: HTMLInputElement[] = [];
  private _values: MetricsEditorValueMap = {};
  private _isRefreshing = false;
  private _resizeObserver: ResizeObserver;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._borderDiv = this._getDomElement<HTMLDivElement>('border');
    this._boxModelDiv = this._getDomElement<HTMLDivElement>('box-model');
    this._contentDiv = this._getDomElement<HTMLDivElement>('content');
    this._inputs = [...this.shadowRoot.querySelectorAll<HTMLInputElement>('input[data-area][data-side]')];
  }

  ready() {
    this._parseAttributesToProperties();
    this._wireEvents();
    this._updateInputs();
    requestAnimationFrame(() => this._updateScale());
  }

  connectedCallback() {
    this._resizeObserver ??= new ResizeObserver(() => this._updateScale());
    this._resizeObserver.observe(this);
    requestAnimationFrame(() => this._updateScale());
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
  }

  public get values(): MetricsEditorValueMap {
    return this._cloneValues(this._values);
  }

  public set values(value: MetricsEditorValueMap) {
    this._values = this._cloneValues(value ?? {});
    this._updateInputs();
  }

  public getPropertyName(area: MetricsEditorArea, side: MetricsEditorSide) {
    return cssProperties[area]?.[side];
  }

  public refresh(element: Element) {
    this._contentDiv.classList.remove('box');
    this._borderDiv.classList.remove('box');

    if (!element) {
      this.values = {};
      return;
    }

    const computedStyle = element.ownerDocument.defaultView.getComputedStyle(element);
    const nextValues: MetricsEditorValueMap = {};

    for (const area of Object.keys(cssProperties) as MetricsEditorArea[]) {
      nextValues[area] = {};
      for (const side of Object.keys(cssProperties[area]) as MetricsEditorSide[]) {
        const propertyName = this.getPropertyName(area, side);
        nextValues[area][side] = this._getComputedProperty(computedStyle, propertyName, area);
      }
    }

    if (computedStyle.boxSizing == 'content-box')
      this._contentDiv.classList.add('box');
    else
      this._borderDiv.classList.add('box');

    this.values = nextValues;
    this._updateScale();
  }

  private _wireEvents() {
    for (const input of this._inputs) {
      input.addEventListener('focus', () => input.select());
      input.addEventListener('change', () => this._commitInput(input));
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          this._commitInput(input);
          input.blur();
        } else if (event.key === 'Escape') {
          this._updateInput(input);
          input.blur();
        }
      });
    }
  }

  private _commitInput(input: HTMLInputElement) {
    if (this._isRefreshing)
      return;

    const area = input.dataset['area'] as MetricsEditorArea;
    const side = input.dataset['side'] as MetricsEditorSide;
    const oldValue = this._values[area]?.[side] ?? '';
    const newValue = input.value.trim();

    if (!this._values[area])
      this._values[area] = {};
    this._values[area][side] = newValue;
    this._updateInput(input);

    if (oldValue === newValue)
      return;

    this.dispatchEvent(new CustomEvent<MetricsEditorValueChangedEventArgs>('value-changed', {
      bubbles: true,
      composed: true,
      detail: {
        property: this.getPropertyName(area, side),
        area,
        side,
        newValue,
        oldValue
      }
    }));
  }

  private _updateInputs() {
    this._isRefreshing = true;
    try {
      for (const input of this._inputs)
        this._updateInput(input);
    } finally {
      this._isRefreshing = false;
    }
  }

  private _updateInput(input: HTMLInputElement) {
    const area = input.dataset['area'] as MetricsEditorArea;
    const side = input.dataset['side'] as MetricsEditorSide;
    input.value = this._values[area]?.[side] ?? this.unsetValue;
  }

  private _getComputedProperty(computedStyle: CSSStyleDeclaration, propertyName: string, area: MetricsEditorArea) {
    const camelName = computedStyleProperties[propertyName] ?? propertyName;
    const value = computedStyle.getPropertyValue(propertyName) || computedStyle[camelName];
    if (area === 'position' && value === 'auto')
      return this.unsetValue;
    return value || this.unsetValue;
  }

  private _cloneValues(values: MetricsEditorValueMap): MetricsEditorValueMap {
    const clone: MetricsEditorValueMap = {};
    for (const area of Object.keys(values) as MetricsEditorArea[])
      clone[area] = { ...values[area] };
    return clone;
  }

  private _updateScale() {
    if (!this._boxModelDiv)
      return;

    const availableWidth = this.clientWidth;
    if (availableWidth <= 0)
      return;

    const scale = Math.min(1, availableWidth / metricsEditorNaturalWidth);
    this._boxModelDiv.style.width = scale < 1 ? metricsEditorNaturalWidth + 'px' : '100%';
    this._boxModelDiv.style.transform = scale < 1 ? `scale(${scale})` : '';
    this.style.height = (this._boxModelDiv.offsetHeight * scale) + 'px';
  }
}

customElements.define('node-projects-metrics-editor', MetricsEditor);
