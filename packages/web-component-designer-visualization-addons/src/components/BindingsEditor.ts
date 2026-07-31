import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import { BindingMode, BindingTarget, IBinding, InstanceServiceContainer, IProperty, ServiceContainer, assetsPath } from '@node-projects/web-component-designer';
import { CodeViewMonaco } from '@node-projects/web-component-designer-codeview-monaco';
import { VisualizationShell } from '../interfaces/VisualizationShell.js';
import { BindingsEditorHistoric } from './BindingsEditorHistoric.js';
import { VisualizationBinding } from '../interfaces/VisualizationBinding.js';
import { bindingsEditorHelpHtml } from './BindingsEditorHelp.js';

export class BindingsEditor extends BaseCustomWebComponentConstructorAppend {

  static override readonly template = html`
        <div id="root">
            <div class="vertical-grid">
                <div id="full-width-col">
                    <div id="signals-area">
                        <div class="row">
                            <span class="section-label" title="Add signals by name and path. The variable name is used in the formula (__0, __1,... or a custom name).&#010;Access signal objects in properties via ?propertyName, access the propertyValue via ??propertyName.&#010;Access signal objects in properties of the target via #propertyName, access a propertyValue of the target via ##propertyName.&#010;Bind to signal configurations via $objectId.&#010;Bind to special values via §name (if supported by your framework).&#010;You could also use signals inside of a Signal Name via {name}">objects</span>
                            <button id="helpBtn" class="info-btn" title="Help"><svg viewBox="0 0 512 512" width="16" height="16"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg></button>
                        </div>
                        <div class="bordered-section">
                            <div id="signalListHeader" class="signal-row signal-header">
                                <span class="signal-header-name">name</span>
                                <span class="signal-header-signal">signal</span>
                                <span class="signal-header-spacer"></span>
                            </div>
                            <div id="signalListContainer"></div>
                            <button id="addSignalBtn" class="add-signal-btn" @click="[[this._addSignal()]]">+ Add signal</button>
                        </div>
                        <div id="groupinvert" class="row">
                            <input type="checkbox" checked="{{this.invert::change}}">
                            <span>invert logic</span>
                            <button id="historicBtn" css:border="[[this.historic ? 'solid lime 5px' : 'none']]" @click="[[this.showHistoric()]]">historic</button>
                        </div>
                        <div class="row">
                            <span class="section-label" title="javascript expression. access context with __ctx, result with __res, objects by name (__0, __1,... or custom name)">formula</span>
                        </div>
                        <div class="row">
                            <node-projects-code-view-monaco id="expression" single-row language="javascript" .code="{{?this.expression}}" @code-changed="_refresh"></node-projects-code-view-monaco>
                        </div>
                        <div class="row">
                            <span class="section-label writeback-label" title="write back the value build by a formula to a signal. maybe only usefull when a formula is used.">write back signal :</span>
                            <input class="writeback-input" .disabled="[[!this.expression]]" value="{{?this.writeBackSignal::change}}">
                        </div>
                        <div id="groupBindingMode" class="row">
                            <input type="checkbox" disabled="[[!this.twoWayPossible]]" checked="{{this.twoWay::change}}" @change="_refresh">
                            <span>two way binding</span>
                            <span class="events-label" css:display="[[this.twoWay ? 'inline' : 'none']]">events:&nbsp;</span>
                            <input class="events-input" css:display="[[this.twoWay ? 'inline-block' : 'none']]" title="to use multiple events, seprate them with semicolon (;)" value="{{?this.events::change}}">
                        </div>
                        <div css:display="[[this.twoWay ? 'block' : 'none']]">
                            <div class="row">
                                <span class="section-label" title="javascript expression. access property with 'value'">formula write back (two way)</span>
                            </div>
                            <div class="row">
                                <node-projects-code-view-monaco id="expression2way" .read-only="[[!this.twoWay]]" $readonly="[[!this.twoWay]]" single-row language="javascript" .code="{{?this.expressionTwoWay}}"></node-projects-code-view-monaco>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="namedConverterRow" class="row">
                <span class="converter-label">converter :</span>
                <input id="namedConverterInput" value="{{?this.convertersString::change}}">
                <button id="namedConverterBrowse" class="signal-select-btn" @click="[[this._selectNamedConverter()]]">...</button>
            </div>
            <div class="bordered-section">
                <div class="signal-row signal-header">
                    <span class="converter-header-col">condition</span>
                    <span class="converter-header-col">value</span>
                    <span class="converter-header-spacer"></span>
                </div>
                <div id="converterListContainer"></div>
                <button class="add-signal-btn" @click="[[this._addConverter()]]">+ Add entry</button>
            </div>
        </div>`;

  static override readonly style = css`
        :host {
            box-sizing: border-box;
        }

        .padding_top {
            padding-top: 30px;
        }

        .row{
            margin-top: 3px;
            display: flex;
            align-items: center;
        }

        #converterListContainer {
            max-height: 72px;
            overflow-y: auto;
        }

        .input-headline {
            height: 30px;
        }

        input[type="checkbox"] {
            margin-right: 15px;
            width: 15px;
            height: 15px;
        }

        select {
            width: 100%;
        }

        #root {
            padding: 2px 10px;
            display: grid;
            grid-template-rows: min-content min-content;
            overflow: auto;
            height: calc(100% - 4px)
        }

        .vertical-grid {
            display: grid;
            grid-template-columns: calc((100% - 150px) - 30px) 150px;
            gap: 30px;
        }

        #full-width-col {
            grid-column: 1/3;
        }

        #signals-area {
            display: flex;
            flex-direction: column;
        }

        .section-label {
            cursor: pointer;
        }

        .bordered-section {
            border: solid 1px black;
            padding: 10px;
        }

        .signal-header-name {
            flex: 0 0 80px;
        }

        .signal-header-signal, .converter-header-col {
            flex: 1 1 auto;
        }

        .signal-header-spacer {
            flex: 0 0 72px;
        }

        .converter-header-spacer {
            flex: 0 0 47px;
        }

        #groupinvert {
            position: relative;
        }

        #historicBtn {
            position: absolute;
            right: 1px;
            top: 5px;
            padding: 10px;
        }

        node-projects-code-view-monaco {
            width: 100%;
            min-height: 17px;
            height: 17px;
            position: relative;
            overflow: hidden;
            resize: vertical;
        }

        .writeback-label {
            white-space: nowrap;
        }

        .writeback-input {
            width: 100%;
            margin-left: 5px;
        }

        .events-label {
            margin-left: 15px;
        }

        .events-input {
            flex-grow: 1;
        }

        #namedConverterRow {
            margin-top: 6px;
        }

        .converter-label {
            white-space: nowrap;
        }

        #namedConverterInput {
            flex: 1;
            margin-left: 5px;
        }

        #namedConverterBrowse {
            margin-left: 3px;
        }

        #grid input, #list input {
            border:0px;
        }

        #tagdata_type {
            height: 24px;
            font-size: inherit;
        }

        node-projects-code-view-monaco:not([readonly]) {
            border: 1px black solid;
        }

        node-projects-code-view-monaco[readonly] {
            border: 1px lightgray solid;
        }

        .signal-header {
            color: #888;
            font-size: 11px;
            margin-top: 3px;
        }

        .signal-row {
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .signal-row input {
            height: 22px;
            box-sizing: border-box;
        }

        .signal-name-input {
            min-width: 80px;
            flex: 0 0 80px;
            font-family: monospace;
        }

        .signal-path-input {
            flex: 1 1 auto;
        }

        .signal-icon-btn {
            flex: 0 0 22px;
            width: 22px;
            height: 22px;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .signal-icon-btn img {
            width: 12px;
            height: 12px;
        }

        .signal-select-btn {
            flex: 0 0 26px;
            width: 26px;
            height: 22px;
            padding: 0;
            cursor: pointer;
            font-size: 11px;
        }

        #signalListContainer {
            display: flex;
            flex-direction: column;
            gap: 3px;
            max-height: 72px;
            overflow-y: auto;
        }

        .add-signal-btn {
            align-self: flex-start;
            margin-top: 4px;
            height: 22px;
            cursor: pointer;
            font-size: 11px;
        }

        .info-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            padding: 0;
            border: none;
            background: transparent;
            cursor: pointer;
            flex-shrink: 0;
            margin-left: auto;
        }

        .info-btn:hover {
            background: #eee;
            border-radius: 3px;
        }`;

  static readonly is: string = 'node-projects-visualization-bindings-editor';

  static readonly properties = {
    twoWayPossible: Boolean,
    twoWay: Boolean,
    expression: String,
    events: String,
    invert: Boolean,
    historic: Object
  }

  public twoWayPossible: boolean = false;
  public twoWay: boolean = false;
  public expression: string = '';
  public writeBackSignal: string = '';
  public expressionTwoWay: string = '';
  public historic: any;
  public objectNames: string = '';
  public events: string = '';
  public invert: boolean = false;
  public converters: { key: string, value: any }[] = [];

  static readonly namedConverters: { name: string, description?: string, converter?: Record<string, any> }[] = [];

  /** Extra help-page sections (raw HTML, same markup/classes as BindingsEditorHelp.ts) contributed by the host application.
   *  Left empty by default so the plain designer help page is unaffected. */
  static readonly helpSections: string[] = [];
  public convertersString: string;

  /** Unified converter value for use in IBinding.converters when saving. Returns the named converter
   *  string when set, otherwise converts the inline key/value table to a Record, or undefined if empty. */
  get converter(): Record<string, any> | string | undefined {
    if (this.convertersString) return this.convertersString;
    if (this.converters.length > 0)
      return Object.fromEntries(this.converters.map(c => [c.key, c.value]));
    return undefined;
  }

  protected _property: IProperty;
  protected _binding: IBinding & { converter: Record<string, any> | string };
  protected _bindingTarget: BindingTarget;
  protected _serviceContainer: ServiceContainer;
  protected _instanceServiceContainer: InstanceServiceContainer;
  protected _shell: VisualizationShell
  private _signals: { name: string, signal: string }[] = [];
  private _signalListContainer: HTMLElement;
  private _converterListContainer: HTMLElement;

  constructor(property: IProperty, binding: IBinding & { converter: Record<string, any> }, bindingTarget: BindingTarget, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, shell: VisualizationShell, config: { namedConverters?: boolean, showHistoric?: boolean, historicLabel?: string } = {}) {
    super();
    super._restoreCachedInititalValues();

    this._property = property;
    this._binding = binding;
    this._bindingTarget = bindingTarget;
    this._serviceContainer = serviceContainer;
    this._instanceServiceContainer = instanceServiceContainer;
    this._shell = shell;

    if (config?.namedConverters === false) {
      this._getDomElement<HTMLElement>('namedConverterRow').style.display = 'none';
    }
    const historicBtn = this._getDomElement<HTMLButtonElement>('historicBtn');
    if (config?.showHistoric === false) {
      historicBtn.style.display = 'none';
    } else if (config?.historicLabel) {
      historicBtn.textContent = config.historicLabel;
    }
  }

  ready() {
    this._parseAttributesToProperties();
    this._assignEvents();

    this._signalListContainer = this._getDomElement<HTMLElement>('signalListContainer');
    this._converterListContainer = this._getDomElement<HTMLElement>('converterListContainer');
    this._getDomElement<HTMLButtonElement>('helpBtn').onclick = () => this._showHelp();

    if (BindingsEditor.namedConverters.length === 0)
      this._getDomElement<HTMLElement>('namedConverterBrowse').style.display = 'none';

    this.twoWayPossible = false;
    if (this._bindingTarget == BindingTarget.property || this._bindingTarget == BindingTarget.attribute)
      this.twoWayPossible = true;

    if (this._binding) {
      this.twoWay = this._binding.mode == BindingMode.twoWay;
      this.expression = this._binding.expression;
      this.writeBackSignal = (<VisualizationBinding><unknown>this._binding).writeBackSignal;
      this.expressionTwoWay = (<any>this._binding).expressionTwoWay;
      this.historic = (<any>this._binding).historic;
      this.invert = this._binding.invert;
      if (this._binding.bindableObjectNames)
        this.objectNames = this._binding.bindableObjectNames.join(';');
      if (this._binding.converter) {
        if (typeof this._binding.converter === 'string') {
          this.convertersString = this._binding.converter;
        } else {
          for (let c in this._binding.converter) {
            this.converters.push({ key: c, value: this._binding.converter[c] });
          }
        }
      }
      if (this._binding.changedEvents && this._binding.changedEvents.length)
        this.events = this._binding.changedEvents.join(';');
    }

    if (this.expression) {
      let edt = this._getDomElement<CodeViewMonaco>('expression');
      if (this.expression.indexOf('\n') >= 0) {
        edt.style.height = (3 * 17) + 'px';
      }
    }

    if (this.expressionTwoWay) {
      let edt = this._getDomElement<CodeViewMonaco>('expression2way');
      if (this.expressionTwoWay.indexOf('\n') >= 0) {
        edt.style.height = (3 * 17) + 'px';
      }
    }

    this._signals = this._parseObjectNames(this.objectNames);
    if (this._signals.length === 0)
      this._signals.push({ name: '', signal: '' });
    this._renderSignalList();
    this._renderConverterList();

    this._bindingsParse();
  }

  private _parseObjectNames(str: string): { name: string, signal: string }[] {
    if (!str) return [];
    return str.split(';').filter(s => s.length > 0).map(s => {
      const colonIdx = s.indexOf(':');
      if (colonIdx > 0) {
        return { name: s.slice(0, colonIdx), signal: s.slice(colonIdx + 1) };
      }
      return { name: '', signal: s };
    });
  }

  private _signalsToObjectNames(): string {
    return this._signals.map(s => s.name ? s.name + ':' + s.signal : s.signal).join(';');
  }

  private _renderSignalList() {
    const container = this._signalListContainer;
    container.innerHTML = '';

    this._signals.forEach((sig, i) => {
      const row = document.createElement('div');
      row.className = 'signal-row';

      const nameInput = document.createElement('input');
      nameInput.className = 'signal-name-input';
      nameInput.placeholder = `__${i}`;
      nameInput.value = sig.name;
      nameInput.title = 'variable name used in the formula (defaults to __' + i + ' if empty)';
      nameInput.oninput = () => {
        this._signals[i].name = nameInput.value;
        this._syncSignals();
      };

      const signalInput = document.createElement('input');
      signalInput.className = 'signal-path-input';
      signalInput.value = sig.signal;
      signalInput.placeholder = 'signal path';
      signalInput.title = 'signal path (prefix: ? = signalProperty, ?? = property value, # = target property, ## = target property value)';
      signalInput.oninput = () => {
        this._signals[i].signal = signalInput.value;
        this._syncSignals();
      };

      const copyBtn = document.createElement('button');
      copyBtn.className = 'signal-icon-btn';
      copyBtn.title = 'Duplicate';
      const copyIcon = document.createElement('img');
      copyIcon.src = assetsPath + 'icons/copy.svg';
      copyIcon.style.cssText = 'width:12px; height:12px;';
      copyBtn.appendChild(copyIcon);
      copyBtn.onclick = () => {
        this._signals.splice(i + 1, 0, { ...this._signals[i] });
        this._syncSignals();
        this._renderSignalList();
      };

      const selectBtn = document.createElement('button');
      selectBtn.className = 'signal-select-btn';
      selectBtn.textContent = '...';
      selectBtn.title = 'Browse signal';
      selectBtn.onclick = () => this._selectForRow(i, signalInput);

      const delBtn = document.createElement('button');
      delBtn.className = 'signal-icon-btn';
      delBtn.title = 'Remove';
      const delIcon = document.createElement('img');
      delIcon.src = assetsPath + 'icons/delete.svg';
      delIcon.style.cssText = 'width:12px; height:12px;';
      delBtn.appendChild(delIcon);
      delBtn.onclick = () => {
        this._signals.splice(i, 1);
        this._syncSignals();
        this._renderSignalList();
      };

      row.appendChild(nameInput);
      row.appendChild(signalInput);
      row.appendChild(selectBtn);
      row.appendChild(copyBtn);
      row.appendChild(delBtn);
      container.appendChild(row);
    });
  }

  private _syncSignals() {
    this.objectNames = this._signalsToObjectNames();
    this._bindingsRefresh();
  }

  _addSignal() {
    this._signals.push({ name: '', signal: '' });
    this._renderSignalList();
  }

  async _selectForRow(index: number, signalInput: HTMLInputElement) {
    let b = this._shell.createBindableObjectBrowser();
    b.initialize(this._serviceContainer, this._instanceServiceContainer, 'binding');
    b.title = 'select signal...';
    const abortController = new AbortController();
    b.objectDoubleclicked.on(() => {
      abortController.abort();
      let prefix = '';
      if (b.selectedObject.specialType == 'signalProperty') {
        prefix = '?';
      } else if (b.selectedObject.bindabletype === 'property') {
        prefix = '??';
      }
      this._signals[index].signal = prefix + b.selectedObject.fullName;
      signalInput.value = this._signals[index].signal;
      this._syncSignals();
    });
    let res = await this._shell.openConfirmation(b, { x: 100, y: 100, width: 400, height: 300, parent: this, abortSignal: abortController.signal });
    if (res) {
      let prefix = '';
      if (b.selectedObject.specialType == 'signalProperty') {
        prefix = '?';
      } else if (b.selectedObject.bindabletype === 'property') {
        prefix = '??';
      }
      this._signals[index].signal = prefix + b.selectedObject.fullName;
      signalInput.value = this._signals[index].signal;
      this._syncSignals();
    }
  }

  private _renderConverterList() {
    const container = this._converterListContainer;
    container.innerHTML = '';
    const valueType = this._property?.type === 'color' ? 'color' : 'text';

    this.converters.forEach((conv, i) => {
      const row = document.createElement('div');
      row.className = 'signal-row';

      const keyInput = document.createElement('input');
      keyInput.style.cssText = 'flex:1 1 auto; height:22px; box-sizing:border-box;';
      keyInput.value = conv.key;
      keyInput.placeholder = 'condition';
      keyInput.oninput = () => { this.converters[i].key = keyInput.value; };

      const valInput = document.createElement('input');
      valInput.type = valueType;
      valInput.style.cssText = 'flex:1 1 auto; height:22px; box-sizing:border-box;';
      valInput.value = conv.value;
      valInput.placeholder = 'value';
      valInput.oninput = () => { this.converters[i].value = valInput.value; };

      const copyBtn = document.createElement('button');
      copyBtn.className = 'signal-icon-btn';
      copyBtn.title = 'Duplicate';
      const copyIcon = document.createElement('img');
      copyIcon.src = assetsPath + 'icons/copy.svg';
      copyIcon.style.cssText = 'width:12px; height:12px;';
      copyBtn.appendChild(copyIcon);
      copyBtn.onclick = () => {
        this.converters.splice(i + 1, 0, { ...this.converters[i] });
        this._renderConverterList();
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'signal-icon-btn';
      delBtn.title = 'Remove';
      const delIcon = document.createElement('img');
      delIcon.src = assetsPath + 'icons/delete.svg';
      delIcon.style.cssText = 'width:12px; height:12px;';
      delBtn.appendChild(delIcon);
      delBtn.onclick = () => {
        this.converters.splice(i, 1);
        this._renderConverterList();
      };

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(copyBtn);
      row.appendChild(delBtn);
      container.appendChild(row);
    });
  }

  _addConverter() {
    this.converters.push({ key: '', value: '' });
    this._renderConverterList();
  }

  async _selectNamedConverter() {
    const list = BindingsEditor.namedConverters;
    if (list.length === 0) return;

    let selectedName = '';
    let selectedRow: HTMLElement | null = null;

    const outer = document.createElement('div');
    outer.style.cssText = 'display:flex; flex-direction:column; height:100%; box-sizing:border-box; font-size:12px;';

    const hint = document.createElement('div');
    hint.style.cssText = 'padding:6px 8px 4px; color:#666; font-size:11px; border-bottom:1px solid #e0e0e0; flex-shrink:0;';
    hint.textContent = 'Select a converter and confirm with OK.';
    outer.appendChild(hint);

    const listEl = document.createElement('div');
    listEl.style.cssText = 'flex:1; overflow-y:auto; padding:4px;';
    outer.appendChild(listEl);

    const deselect = (row: HTMLElement) => {
      row.style.background = '';
      row.style.borderLeftColor = 'transparent';
    };

    const select = (row: HTMLElement, name: string) => {
      if (selectedRow) deselect(selectedRow);
      selectedRow = row;
      row.style.background = '#e8f4fd';
      row.style.borderLeftColor = '#0078d7';
      selectedName = name;
    };

    for (const nc of list) {
      const row = document.createElement('div');
      row.style.cssText = 'padding:5px 6px 5px 9px; cursor:pointer; border-radius:3px; border-left:3px solid transparent; margin-bottom:2px;';

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-family:monospace; font-weight:bold; color:#111;';
      nameEl.textContent = nc.name;
      row.appendChild(nameEl);

      if (nc.description) {
        const descEl = document.createElement('div');
        descEl.style.cssText = 'color:#555; font-size:11px; margin-top:2px;';
        descEl.textContent = nc.description;
        row.appendChild(descEl);
      }

      if (nc.converter && Object.keys(nc.converter).length > 0) {
        const table = document.createElement('div');
        table.style.cssText = 'display:grid; grid-template-columns:max-content max-content 1fr; gap:1px 6px; margin-top:4px; padding:4px 6px; background:#f5f5f5; border-radius:2px; font-family:monospace; font-size:11px; color:#333;';
        for (const [k, v] of Object.entries(nc.converter)) {
          const keyEl = document.createElement('span');
          keyEl.style.cssText = 'color:#555; text-align:right;';
          keyEl.textContent = k;
          const arrow = document.createElement('span');
          arrow.style.cssText = 'color:#aaa;';
          arrow.textContent = '→';
          const valEl = document.createElement('span');
          valEl.style.cssText = 'color:#0078d7; font-weight:bold;';
          valEl.textContent = String(v);
          table.appendChild(keyEl);
          table.appendChild(arrow);
          table.appendChild(valEl);
        }
        row.appendChild(table);
      }

      row.onmouseenter = () => { if (row !== selectedRow) row.style.background = '#f5f5f5'; };
      row.onmouseleave = () => { if (row !== selectedRow) row.style.background = ''; };
      row.onclick = () => select(row, nc.name);

      listEl.appendChild(row);
    }

    const res = await this._shell.openConfirmation(outer, { x: 100, y: 100, width: 320, height: 300, parent: this });
    if (res && selectedName) {
      this.convertersString = selectedName;
      this._getDomElement<HTMLInputElement>('namedConverterInput').value = selectedName;
      this._bindingsRefresh();
    }
  }

  _refresh() {
    requestAnimationFrame(() => {
      this._bindingsRefresh();
    });
  }

  async showHistoric() {
    let h = new BindingsEditorHistoric(this.historic);
    const abortController = new AbortController();
    h.title = "Edit historic binding to: " + this._property.name;
    let res = await this._shell.openConfirmation(h, { x: 100, y: 100, width: 420, height: 510, parent: this, abortSignal: abortController.signal, disableResize: true, cancelText: 'Remove' });
    if (!res) {
      this.historic = null;
    } else {
      this.historic = h.historic;
    }
    this._bindingsRefresh();
  }

  _showHelp() {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = BindingsEditor.helpSections.length > 0
      ? bindingsEditorHelpHtml.replace('</div>\n</body>', BindingsEditor.helpSections.join('') + '</div>\n</body>')
      : bindingsEditorHelpHtml;
    iframe.style.cssText = 'width:100%; height:100%; border:none; display:block;';
    this._shell.openModal(iframe, { title: 'Bindings Editor Help', parent: this, x: -660, y: -80, width: 630, height: 580 });
  }

}
customElements.define(BindingsEditor.is, BindingsEditor)
