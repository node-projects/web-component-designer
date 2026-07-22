import { BaseCustomWebComponentConstructorAppend, TypedEvent, css, html } from "@node-projects/base-custom-webcomponent";
import { defaultOptions, defaultStyle } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from 'wunderbaum';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' with { type: 'css' };
import { ScriptCommandHelp } from "../scripting/ScriptCommandsDescriptions.js";
import { highlightJson } from "../scripting/JsonSnippetHighlighter.js";

export class SimpleScriptCommandPicker extends BaseCustomWebComponentConstructorAppend {
  static override readonly style = css`
        :host {
            display: block;
            background: white;
        }

        .root {
            width: calc(100% - 8px);
            height: calc(100% - 8px);
            margin: 4px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }

        #filter {
            width: 100%;
            height: 26px;
            box-sizing: border-box;
        }

        .content {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
        }

        #commandList {
            width: 40%;
            overflow: auto;
            box-sizing: border-box;
        }

        #description {
            width: 60%;
        }

        .detail {
            padding: 8px;
            overflow: auto;
            box-sizing: border-box;
        }

        .cmd-title {
            font-size: 14px;
            font-weight: bold;
            color: #24405c;
            border-bottom: 2px solid #2c6e9b;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        .cmd-title .hint {
            font-size: 11px;
            font-weight: normal;
            color: #808080;
            margin-left: 6px;
        }

        .snippet {
            font-family: Consolas, "Courier New", monospace;
            font-size: 11px;
            background: #f6f8fa;
            color: #24292e;
            border: 1px solid #e1e4e8;
            border-radius: 4px;
            padding: 6px 10px;
            white-space: pre;
            overflow-x: auto;
            line-height: 1.5;
        }

        .cs-key  { color: #22863a; }
        .cs-str  { color: #032f62; }
        .cs-bool { color: #d73a49; }
        .cs-num  { color: #e36209; }

        .note {
            font-size: 11px;
            color: #666;
            font-style: italic;
            margin-top: 6px;
        }

        .toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            box-sizing: border-box;
            flex: 0 0 auto;
            width: 100%;
            height: 40px;
            padding: 4px 8px;
            border-top: 1px solid #ccc;
            background-color: rgb(230, 230, 230);
        }

        .toolbar button {
            box-sizing: border-box;
            padding: 6px 16px;
            border-radius: 4px;
            border: 1px solid #b0b0b0;
            background: white;
            font-size: 12px;
            cursor: pointer;
        }

        .toolbar button:hover:not(:disabled) {
            background: #f0f0f0;
            border-color: #909090;
        }

        .toolbar button:active:not(:disabled) {
            background: #e2e2e2;
        }

        .toolbar button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .toolbar button.primary {
            background: #2c6e9b;
            border-color: #2c6e9b;
            color: white;
        }

        .toolbar button.primary:hover:not(:disabled) {
            background: #255d83;
            border-color: #255d83;
        }

        .toolbar button.primary:active:not(:disabled) {
            background: #1e4d6b;
        }

        .toolbar .spacer {
            flex: 1 1 auto;
        }

        .toolbar .hint {
            font-size: 11px;
            font-style: italic;
            color: #666;
        }
    `;

  static override readonly template = html`
        <div class="root">
            <input id="filter" placeholder="Filter..." autocomplete="off">
            <div class="content">
                <div id="commandList"></div>
                <div id="description" class="detail"></div>
            </div>
            <div class="toolbar">
                <button id="addBtn" class="primary" disabled @click="[[this.addClicked()]]">Add</button>
                <span class="hint">or drag a command into the script list</span>
                <span class="spacer"></span>
                <button id="closeBtn" @click="[[this.closeClicked()]]">Close</button>
            </div>
        </div>
    `;

  static readonly is = 'node-projects-visualization-simple-script-command-picker';

  private _title: string;
  public override get title(): string {
    return this._title;
  }
  public override set title(value: string) {
    this._title = value;
  }

  public selectedType: string;
  public commandTypeChosen = new TypedEvent<void>();
  public closeRequested = new TypedEvent<void>();

  private _tree: Wunderbaum;
  private _filter: HTMLInputElement;
  private _descriptionDiv: HTMLDivElement;
  private _addBtn: HTMLButtonElement;
  private _typeInfo: any;
  private _descriptions: Record<string, ScriptCommandHelp>;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, defaultStyle, SimpleScriptCommandPicker.style];

    this._descriptionDiv = this._getDomElement<HTMLDivElement>('description');
    this._addBtn = this._getDomElement<HTMLButtonElement>('addBtn');
    this._filter = this._getDomElement<HTMLInputElement>('filter');
    this._filter.onkeyup = () => {
      const match = this._filter.value;
      this._tree.filterNodes((node) => new RegExp(match, "i").test(node.title), {});
    }

    this._tree = new Wunderbaum({
      ...defaultOptions,
      element: this._getDomElement<HTMLDivElement>('commandList'),
      icon: false,
      filter: {
        autoExpand: true,
        mode: 'hide',
        highlight: true
      },
      activate: (e) => {
        this.selectedType = e.node.title;
        this._addBtn.disabled = false;
        this._renderDescription(e.node.title);
      },
      dblclick: (e) => {
        this.selectedType = e.node.title;
        this.commandTypeChosen.emit();
        return false;
      },
      render: (e) => {
        if (e.isNew) {
          e.nodeElem.oncontextmenu = (ev) => {
            ev.preventDefault();
            return false;
          };
        }
      },
      dnd: {
        guessDropEffect: false,
        serializeClipboardData: true,
        dragStart: (e) => {
          e.event.dataTransfer.effectAllowed = 'copy';
          e.event.dataTransfer.dropEffect = 'copy';
          return true;
        }
      }
    });
  }

  async ready() {
    this._parseAttributesToProperties();
    this._bindingsParse(null, true);
    this._assignEvents();
  }

  addClicked() {
    if (this.selectedType)
      this.commandTypeChosen.emit();
  }

  closeClicked() {
    this.closeRequested.emit();
  }

  private _renderDescription(type: string) {
    const help = this._descriptions?.[type];
    if (help) {
      this._descriptionDiv.innerHTML = `
        <div class="cmd-title">${type}<span class="hint">${help.description}</span></div>
        <pre class="snippet">${highlightJson(help.example)}</pre>
        ${help.note ? `<div class="note">${help.note}</div>` : ''}
      `;
      return;
    }

    const schemaDescription = this._typeInfo?.definitions?.[type]?.description;
    this._descriptionDiv.innerHTML = `
      <div class="cmd-title">${type}</div>
      ${schemaDescription ? `<div class="note">${schemaDescription}</div>` : ''}
    `;
  }

  loadCommands(scriptCommandsTypeInfo: any, descriptions?: Record<string, ScriptCommandHelp>) {
    this._typeInfo = scriptCommandsTypeInfo;
    this._descriptions = descriptions ?? {};
    const names = Object.keys(scriptCommandsTypeInfo.definitions)
      .filter(x => scriptCommandsTypeInfo.definitions[x].type === 'object' && x !== 'ScriptCommands');
    this._tree.root.addChildren(names.map(n => ({ title: n })));
  }
}

customElements.define(SimpleScriptCommandPicker.is, SimpleScriptCommandPicker);
