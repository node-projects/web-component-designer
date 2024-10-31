import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
import { BindingMode, BindingTarget, IBinding, IProperty, ServiceContainer } from '@node-projects/web-component-designer';
import { CodeViewMonaco } from '@node-projects/web-component-designer-codeview-monaco';
import { BindableObjectsBrowser } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { VisualizationShell } from '../interfaces/VisualizationShell.js';
import { BindingsEditorHistoric } from './BindingsEditorHistoric.js';
import { VisualizationBinding } from '../interfaces/VisualizationBinding.js';

export class BindingsEditor extends BaseCustomWebComponentConstructorAppend {

  static override readonly template = html`
        <div id="root">
            <div class="vertical-grid">
                <div style="grid-column: 1/3">
                    <div style="display: flex; flex-direction: column;">
                        <div class="row">
                            <span style="cursor: pointer;" title="to use multiple objects, seprate them with semicolon (;). access signal objects in properties via ?propertyName, access the propertyValue via ??propertyName. Bind to signal configurations via $objectId. You could also use signals inside of a Signal Name via {name}">objects</span>
                        </div>
                        <div style="display:flex;align-items: flex-end;">
                            <input id="objnm" class="row" value="{{?this.objectNames::change}}" style="flex-grow: 1;">
                            <button @click="_clear" style="height: 22px">X</button>
                            <button @click="_select" style="height: 22px">...</button>
                        </div>
                        <div class="row">
                            <label style="white-space: nowrap; margin-right: 4px;" title="if set, the value is converted to the type before binding is applied">type :</label>
                            <select class="row" value="{{?this.objectValueType}}">
                                <option selected value="">ignore</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                                <option value="string">string</string>
                            </select>
                        </div>
                        <div class="row">
                            <input type="checkbox" disabled="[[!this.twoWayPossible]]" checked="{{this.twoWay::change}}" @change="_refresh">
                            <span>two way binding</span>
                            <span css:display="[[this.twoWay ? 'inline' : 'none']]" style="margin-left: 15px">events:&nbsp;</span>
                            <input css:display="[[this.twoWay ? 'inline-block' : 'none']]" title="to use multiple events, seprate them with semicolon (;)" class="row" value="{{?this.events::change}}" style="flex-grow: 1;">
                        </div>
                        <div class="row" style="position: relative">
                            <input type="checkbox" checked="{{this.invert::change}}">
                            <span>invert logic</span>
                            <button css:border="[[this.historic ? 'solid lime 5px' : 'none']]" style="position: absolute; right: 1px; top: 5px; padding: 10px;" @click="showHistoric">historic</button>
                        </div>
                        <div class="row">
                            <span style="cursor: pointer;" title="javascript expression. access objects with __0, __1, ...">formula</span>
                        </div>
                        <div class="row">
                            <node-projects-code-view-monaco id="expression" single-row language="javascript" style="width: 100%; min-height: 17px; height: 17px; position: relative; overflow: hidden; resize: vertical;" .code="{{?this.expression}}" @code-changed="_refresh"></iobroker-webui-monaco-editor>
                        </div>
                        <div class="row">
                          <span style="text-wrap: nowrap" style="cursor: pointer;" title="write back the value build by a formula to a signal. maybe only usefull when a formula is used.">write back signal :</span>
                          <input style="width: 100%; margin-left: 5px;" .disabled="[[!this.expression]]" value="{{?this.writeBackSignal::change}}">
                        </div>
                        <div class="row">
                            <span style="cursor: pointer;" title="javascript expression. access property with 'value'">formula write back (two way)</span>
                        </div>
                        <div class="row">
                            <node-projects-code-view-monaco id="expression2way" .read-only="[[!this.twoWay]]" $readonly="[[!this.twoWay]]" single-row language="javascript" style="width: 100%; min-height: 17px; height: 17px; position: relative; overflow: hidden; resize: vertical;" .code="{{?this.expressionTwoWay}}"></iobroker-webui-monaco-editor>
                        </div>
                    </div>
                </div>
            </div>
            <div class="vertical-grid" style="margin-top: 10px;">
                <div>
                    <div class="input-headline">
                        <span>converter</span>:
                    </div>
                </div>
            </div>
            <div class="vertical-grid" style="border: solid 1px black; padding: 10px; overflow-y: auto;">
                <div class="bottomleft">
                    <div id="converterGrid" style="height: 100%;">
                        <div style="width: 100%; height: 20px; display: flex;">
                            <div style="width: 39%">condition</div>
                            <div style="width: 59%">value</div>
                        </div>
                        <template repeat:item="[[this.converters]]">
                            <div css:background-color="[[item.activeRow ? 'gray' : '']]" style="width: 100%; display: flex; height: 26px; justify-content: center; align-items: center; gap: 5px;">
                                <input type="text" value="{{item.key}}" @focus="[[this._focusRow(index)]]" style="width: 39%">
                                <input type="[[this._property.type == 'color' ? 'color' : 'text']]" value="{{item.value}}" @focus="[[this._focusRow(index)]]" style="width: 59%">
                            </div>
                        </template>
                    </div>
                </div>
                <div class="controlbox" id="grid-controls">
                    <button type="button" id="add-row-button" value="add" @click="addConverter">
                        <span>add</span>
                    </button>
                    <button id="remove-row-button" value="remove" style="margin-top: 6px;" @click="removeConverter">
                        <span>remove</span>
                    </button>
                </div>
            </div>
        </div>`;

  static override readonly style = css`
        :host {
            box-sizing: border-box;
        }
        
        #converterGrid {
            display: flex;
            gap: 2px;
            flex-direction: column;
        }
        #converterGrid input {
            height: 20px;
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

        .controlbox {
            display: flex;
            flex-direction: column;
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
        }`;

  static readonly is = 'node-projects-visualization-bindings-editor';

  static readonly properties = {
    twoWayPossible: Boolean,
    twoWay: Boolean,
    expression: String,
    objectNames: String,
    events: String,
    invert: Boolean,
    converters: Array,
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
  public objectValueType: string;

  private _property: IProperty;
  private _binding: IBinding & { converter: Record<string, any> };
  private _bindingTarget: BindingTarget;
  private _serviceContainer: ServiceContainer;
  private _shell: VisualizationShell
  private _activeRow: number = -1;
  private _objNmInput: HTMLInputElement;

  constructor(property: IProperty, binding: IBinding & { converter: Record<string, any> }, bindingTarget: BindingTarget, serviceContainer: ServiceContainer, shell: VisualizationShell) {
    super();
    super._restoreCachedInititalValues();

    this._objNmInput = this._getDomElement<HTMLInputElement>('objnm');

    this._property = property;
    this._binding = binding;
    this._bindingTarget = bindingTarget;
    this._serviceContainer = serviceContainer;
    this._shell = shell;
  }

  ready() {
    this._parseAttributesToProperties();
    this._assignEvents();

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
      this.objectValueType = this._binding.type;
      if (this._binding.bindableObjectNames)
        this.objectNames = this._binding.bindableObjectNames.join(';');
      if (this._binding.converter) {
        for (let c in this._binding.converter) {
          this.converters.push({ key: c, value: this._binding.converter[c] });
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

    this._bindingsParse();

    this._objNmInput.focus();
  }

  _focusRow(index: number) {
    this._activeRow = index;
    this._updatefocusedRow();
  }

  _updatefocusedRow() {
    let g = this._getDomElement('converterGrid');
    g.querySelectorAll('div').forEach(x => x.style.background = '');
    if (this._activeRow >= 0)
      (<HTMLDivElement>g.children[this._activeRow + 1]).style.background = 'gray';
  }

  _clear() {
    this.objectNames = '';
    this._bindingsRefresh();
  }

  _refresh() {
    requestAnimationFrame(() => {
      this._bindingsRefresh();
    });
  }

  async _select() {
    let b = new BindableObjectsBrowser();
    b.initialize(this._serviceContainer);
    b.title = 'select signal...';
    const abortController = new AbortController();
    b.objectDoubleclicked.on(() => {
      abortController.abort();
      if (this.objectNames != '')
        this.objectNames += ';'
      this.objectNames += b.selectedObject.fullName;
      this._bindingsRefresh();
    });
    let res = await this._shell.openConfirmation(b, { x: 100, y: 100, width: 400, height: 300, parent: this, abortSignal: abortController.signal });
    if (res) {
      if (this.objectNames != '')
        this.objectNames += ';'
      this.objectNames += b.selectedObject.fullName;
      this._bindingsRefresh();
    }
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

  addConverter() {
    this.converters.push({ key: '', value: '' });
    this._activeRow = this.converters.length - 1;
    this._bindingsRefresh();
    this._updatefocusedRow();
  }

  removeConverter() {
    this.converters.splice(this._activeRow, 1);
    this._activeRow = -1;
    this._bindingsRefresh();
    this._updatefocusedRow();
  }
}
customElements.define(BindingsEditor.is, BindingsEditor)