import {
  BaseCustomWebComponentConstructorAppend,
  TypedEvent,
  css,
  html,
} from "@node-projects/base-custom-webcomponent";
import { Script } from "../scripting/Script.js";
import { If, IfSignal, ScriptCommands } from "../scripting/ScriptCommands.js";
import {
  ContextMenu,
  InstanceServiceContainer,
  ServiceContainer,
  assetsPath,
} from "@node-projects/web-component-designer";
import {
  IProperty,
  typeInfoFromJsonSchema,
} from "@node-projects/propertygrid.webcomponent";
import { defaultOptions, defaultStyle } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from "wunderbaum";
//@ts-ignore
import wunderbaumStyle from "wunderbaum/dist/wunderbaum.css" with { type: "css" };
import { WbRenderEventType } from "types";
import { VisualizationPropertyGrid } from "./VisualizationPropertyGrid.js";
import { CodeViewMonaco } from "@node-projects/web-component-designer-codeview-monaco";
import { SimpleScriptCommandPicker } from "./SimpleScriptCommandPicker.js";
import { simpleScriptEditorHelpHtml } from "./SimpleScriptEditorHelp.js";
import {
  ScriptCommandHelp,
  nativeScriptCommandDescriptions,
} from "../scripting/ScriptCommandsDescriptions.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { VisualizationShell } from "../interfaces/VisualizationShell.js";
import "@node-projects/splitview.webcomponent";
import { ScriptUpgrades } from "../scripting/ScriptUpgrader.js";

const SAME_TREE_MOVE_MIME = "application/x-simple-script-move";

export class SimpleScriptEditor extends BaseCustomWebComponentConstructorAppend {
  static override readonly style = css`
    :host {
      background: white;
    }

    .root {
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .content {
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
    }

    .split-view {
      height: calc(100% - 4px);
      width: calc(100% - 4px);
      position: relative;
      margin: 2px;
    }

    .list-pane {
      width: 48%;
      height: 100%;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .list-content {
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
    }

    .grid-pane {
      width: 52%;
      height: 100%;
      position: relative;
      box-sizing: border-box;
    }

    .split-view.code-mode .grid-pane {
      display: none;
    }

    .split-view.code-mode::part(splitter) {
      display: none;
    }

    #commandList {
      position: absolute;
      inset: 0;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
    }

    #commandList.hidden {
      display: none;
    }

    #commandList {
      --wb-icon-outer-width: 22px;
    }

    #commandList i.wb-expander {
      background-size: 9px 9px;
      background-position-x: 6px;
      background-position-y: 6px;
      opacity: 0.55;
    }

    .code-view {
      position: absolute;
      inset: 0;
      display: none;
    }

    .code-view.visible {
      display: block;
    }

    node-projects-visualization-property-grid {
      width: 100%;
      height: 100%;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      flex: 0 0 auto;
      width: 100%;
      height: 36px;
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

    .toolbar .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      box-sizing: border-box;
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .toolbar .icon-btn:hover {
      background: #eee;
    }

    .drag-handle {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      cursor: grab;
    }

    .cmd {
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0 2px;
      background: white;
    }

    .cmd img {
      width: 12px;
      height: 12px;
      cursor: pointer;
    }
  `;

  static override readonly template = html`
    <div class="root">
      <div class="content">
        <node-projects-split-view
          id="splitView"
          class="split-view"
          orientation="horizontal"
        >
          <div id="listPane" class="list-pane">
            <div id="listContent" class="list-content">
              <div id="commandList"></div>
              <node-projects-code-view-monaco
                id="codeView"
                class="code-view"
                language="json"
              ></node-projects-code-view-monaco>
            </div>
            <div class="toolbar">
              <button
                id="addCommandBtn"
                class="primary"
                @click="[[this.addCommand()]]"
              >
                Add Command
              </button>
              <button id="codeToggleBtn" @click="[[this.toggleCodeView()]]">
                Code
              </button>
              <span class="spacer"></span>
              <button
                class="icon-btn"
                title="Help"
                @click="[[this.helpClicked()]]"
              >
                <svg viewBox="0 0 512 512" width="16" height="16">
                  <path
                    d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div class="grid-pane">
            <node-projects-visualization-property-grid
              id="propertygrid"
            ></node-projects-visualization-property-grid>
          </div>
        </node-projects-split-view>
      </div>
    </div>
  `;

  static readonly is = "node-projects-visualization-simple-script-editor";

  private _title: string;
  public override get title(): string {
    return this._title;
  }
  public override set title(value: string) {
    this._title = value;
  }

  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public visualizationHandler: VisualizationHandler;
  public visualizationShell: VisualizationShell;

  public scriptCommandsTypeInfo: any;
  public propertiesTypeInfo: any;

  public helpRequested = new TypedEvent<void>();
  public commandDescriptions: Record<string, ScriptCommandHelp> = {
    ...nativeScriptCommandDescriptions,
  };

  private _script: Script;

  private _commandListDiv: HTMLDivElement;
  private _commandListFancyTree: Wunderbaum;

  private _propertygrid: VisualizationPropertyGrid;

  private _splitView: HTMLElement;
  private _codeView: CodeViewMonaco;
  private _codeToggleBtn: HTMLButtonElement;
  private _addCommandBtn: HTMLButtonElement;
  private _showingCode = false;

  private _dragFromHandle = false;

  private _draggedNode: any = null;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._commandListDiv = this._getDomElement<HTMLDivElement>("commandList");
    this._propertygrid =
      this._getDomElement<VisualizationPropertyGrid>("propertygrid");

    this._splitView = this._getDomElement<HTMLElement>("splitView");
    this._codeView = this._getDomElement<CodeViewMonaco>("codeView");
    this._codeToggleBtn =
      this._getDomElement<HTMLButtonElement>("codeToggleBtn");
    this._addCommandBtn =
      this._getDomElement<HTMLButtonElement>("addCommandBtn");

    const listContent = this._getDomElement<HTMLElement>("listContent");
    listContent.addEventListener("mousedown", (ev) => {
      this._dragFromHandle = !!(ev.target as HTMLElement)?.closest(
        ".drag-handle",
      );
    });

    document.addEventListener(
      "dragend",
      () => {
        this._draggedNode = null;
      },
      true,
    );
    listContent.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer) {
        const isMove = ev.dataTransfer.types.includes(SAME_TREE_MOVE_MIME);
        ev.dataTransfer.dropEffect = isMove ? "move" : "copy";
      }
    });
    listContent.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const isMove = ev.dataTransfer?.types.includes(SAME_TREE_MOVE_MIME);
      if (isMove && this._draggedNode) {
        const children = this._commandListFancyTree.root.children;
        const last = children?.[children.length - 1];
        if (last) this._draggedNode.moveTo(last, "after");
        this._draggedNode.setClass("wb-drag-source", false);
      } else {
        const type = ev.dataTransfer?.getData("text/plain");
        if (type) {
          const command = { type };
          this._commandListFancyTree.root.addChildren(
            this.createTreeItem(<any>command),
          );
        }
      }
    });

    this.shadowRoot.adoptedStyleSheets = [
      wunderbaumStyle,
      defaultStyle,
      SimpleScriptEditor.style,
    ];
  }

  async ready() {
    this._parseAttributesToProperties();
    this._bindingsParse(null, true);
    this._assignEvents();

    let editComplex = async (data: { value: any; propertyPath: string }) => {
      let pg = new VisualizationPropertyGrid();
      pg.visualizationHandler = this.visualizationHandler;
      pg.visualizationShell = this.visualizationShell;
      pg.serviceContainer = this.serviceContainer;
      pg.instanceServiceContainer = this.instanceServiceContainer;
      pg.bindableObjectsTarget = "script";

      pg.getTypeInfo = (obj, type) =>
        typeInfoFromJsonSchema(this.propertiesTypeInfo, obj, type);
      pg.showHead = false;
      pg.typeName = "IScriptMultiplexValue";
      pg.title = 'Complex for "' + data.propertyPath + '"';
      if (typeof data.value === "object") pg.selectedObject = data.value ?? {};
      else pg.selectedObject = {};

      pg.bindingDoubleClicked = (b) => {
        if (b.bindabletype == "property") {
          pg.setPropertyValue("source", "property");
        } else if (b.bindabletype == "context") {
          pg.setPropertyValue("source", "context");
        } else {
          pg.setPropertyValue("source", "signal");
        }
        pg.setPropertyValue("name", b.fullName);
        pg.refresh();
      };
      let res = await this.visualizationShell.openConfirmation(pg, {
        x: 100,
        y: 100,
        width: 400,
        height: 500,
        parent: this,
      });
      if (res) {
        this._propertygrid.setPropertyValue(
          data.propertyPath,
          pg.selectedObject,
        );
        this._propertygrid.refresh();
      }
    };

    let editFormula = async (data: { value: string; propertyPath: string }) => {
      const editor = new CodeViewMonaco();
      editor.language = "javascript";
      editor.style.position = "relative";
      editor.code = data.value ?? "";
      const res = await this.visualizationShell.openConfirmation(editor, {
        title: "Edit formula",
        x: 100,
        y: 50,
        width: 700,
        height: 450,
        parent: this,
      });
      if (res) {
        this._propertygrid.setPropertyValue(data.propertyPath, editor.code);
        this._propertygrid.refresh();
      }
    };

    const signalSources = [
      "signal",
      "property",
      "elementProperty",
      "signalInProperty",
      "event",
      "parameter",
      "context",
      "complexString",
      "complexSignal",
      "expression",
    ];

    const identifierRegex = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    const jsReservedWords = new Set([
      "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do",
      "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof",
      "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while",
      "with", "yield", "let", "static", "enum", "await", "implements", "package", "protected",
      "interface", "private", "public", "null", "true", "false", "undefined", "arguments", "eval",
    ]);

    const signalSourceDescriptions: Record<string, string> = {
      signal: "read the value from a Signal",
      property: "read the value from a property of the customControl (not usable in screens)",
      elementProperty: "a property defined on the element raising the event",
      signalInProperty: "read the value from a Signal (wich name is in the Property)",
      event: "read the value of a property of the event object",
      parameter: "a parameter you hand over",
      context: "a value of the context",
      complexString: "a string with signals (contained in {})",
      complexSignal: "read the value from a signal wich name is build here (it can contain other signals in {})",
      expression: "js expression, 'ctx' is context object",
    };

    let editSignalList = async (data: {
      value: IfSignal[];
      propertyPath: string;
    }) => {
      const arr: IfSignal[] = (data.value ?? []).map((v) => ({
        ...v,
      }));

      const getVarNameError = (i: number): string | null => {
        const raw = (arr[i].varName ?? "").trim();
        if (!raw) return null;
        if (!identifierRegex.test(raw)) return `"${raw}" is not a valid JavaScript variable name.`;
        if (jsReservedWords.has(raw)) return `"${raw}" is a reserved word and cannot be used as a variable name.`;
        if (arr.some((e, j) => j !== i && (e.varName ?? "").trim() === raw)) return `"${raw}" is used by more than one signal.`;
        return null;
      };

      const controlStyle = "height:22px; box-sizing:border-box; font-size:12px;";

      const container = document.createElement("div");
      container.style.cssText =
        "display:flex; flex-direction:column; gap:6px; padding:8px; height:100%; box-sizing:border-box; overflow-y:auto; font-size:12px;";

      const header = document.createElement("div");
      header.style.cssText = "display:flex; align-items:center; gap:4px; font-weight:bold;";
      const headerName = document.createElement("span");
      headerName.textContent = "Name";
      headerName.style.cssText = "flex:0 0 120px;";
      const headerType = document.createElement("span");
      headerType.textContent = "Typ";
      headerType.style.cssText = "flex:0 0 130px;";
      const headerSignal = document.createElement("span");
      headerSignal.textContent = "Signal";
      headerSignal.style.cssText = "flex:1 1 auto;";
      const headerSpacer = document.createElement("span");
      headerSpacer.style.cssText = "flex:0 0 22px;";
      header.append(headerName, headerType, headerSignal, headerSpacer);
      container.appendChild(header);

      const rowsContainer = document.createElement("div");
      rowsContainer.style.cssText =
        "display:flex; flex-direction:column; gap:4px;";
      container.appendChild(rowsContainer);

      const descPanel = document.createElement("div");
      descPanel.style.cssText =
        "flex:0 0 auto; margin-top:4px; padding-top:6px; border-top:1px solid #ccc; font-size:12px;";
      const descTitle = document.createElement("div");
      descTitle.style.cssText = "font-weight:bold; margin-bottom:2px;";
      const descText = document.createElement("div");
      descText.style.cssText = "color:#333; white-space:pre-line;";
      descPanel.append(descTitle, descText);

      const showSourceDescription = (source: string) => {
        descTitle.textContent = "Typ: " + source;
        descText.textContent = signalSourceDescriptions[source] ?? "";
      };

      const varNameInputs: HTMLInputElement[] = [];

      const revalidate = () => {
        arr.forEach((_, i) => {
          const input = varNameInputs[i];
          if (!input) return;
          const err = getVarNameError(i);
          input.title = err ?? `Variable name used in the formula (defaults to __${i} if empty)`;
          input.style.borderColor = err ? "#c0392b" : "";
          input.style.backgroundColor = err ? "#fdecea" : "";
        });
      };

      const renderRows = () => {
        rowsContainer.innerHTML = "";
        varNameInputs.length = 0;
        arr.forEach((entry, i) => {
          const row = document.createElement("div");
          row.style.cssText = "display:flex; align-items:center; gap:4px;";

          const varNameInput = document.createElement("input");
          varNameInput.value = entry.varName ?? "";
          varNameInput.placeholder = "__" + i;
          varNameInput.style.cssText = controlStyle + " flex:0 0 120px; min-width: 120px; font-family:monospace;";
          varNameInput.oninput = () => {
            entry.varName = varNameInput.value || undefined;
            revalidate();
          };
          varNameInputs.push(varNameInput);
          row.appendChild(varNameInput);

          const sourceSelect = document.createElement("select");
          sourceSelect.style.cssText = controlStyle + " flex:0 0 130px;";
          for (const s of signalSources) {
            const opt = document.createElement("option");
            opt.value = s;
            opt.textContent = s;
            if (entry.source === s) opt.selected = true;
            sourceSelect.appendChild(opt);
          }
          sourceSelect.onchange = () => {
            entry.source = <any>sourceSelect.value;
            showSourceDescription(sourceSelect.value);
          };
          sourceSelect.onfocus = () => showSourceDescription(sourceSelect.value);
          row.appendChild(sourceSelect);

          const nameInput = document.createElement("input");
          nameInput.value = entry.name ?? "";
          nameInput.placeholder = "e.g. srm.rbg{__tagRoot}.error";
          nameInput.style.cssText = controlStyle + " flex:1 1 auto;";
          nameInput.oninput = () => {
            entry.name = nameInput.value;
          };
          row.appendChild(nameInput);

          const delBtn = document.createElement("button");
          delBtn.title = "Remove signal";
          delBtn.style.cssText = controlStyle + " flex:0 0 22px; width:22px; padding:0; display:flex; align-items:center; justify-content:center;";
          const delIcon = document.createElement("img");
          delIcon.src = assetsPath + "icons/delete.svg";
          delIcon.style.cssText = "width:12px; height:12px;";
          delBtn.appendChild(delIcon);
          delBtn.onclick = () => {
            arr.splice(i, 1);
            renderRows();
          };
          row.appendChild(delBtn);

          rowsContainer.appendChild(row);
        });
        revalidate();
      };
      renderRows();

      const addBtn = document.createElement("button");
      addBtn.textContent = "+ Add signal";
      addBtn.style.cssText = controlStyle + " align-self:flex-start; padding:0 8px;";
      addBtn.onclick = () => {
        arr.push({ source: "signal", name: "" });
        renderRows();
      };
      container.appendChild(addBtn);

      showSourceDescription(arr[0]?.source ?? "signal");
      container.appendChild(descPanel);

      const res = await this.visualizationShell.openConfirmation(container, {
        title: "Edit signals",
        x: 100,
        y: 50,
        width: 500,
        height: 400,
        parent: this,
      });
      if (res) {
        this._propertygrid.setPropertyValue(data.propertyPath, arr);
        this._propertygrid.refresh();
      }
    };

    this._propertygrid.visualizationHandler = this.visualizationHandler;
    this._propertygrid.visualizationShell = this.visualizationShell;
    this._propertygrid.serviceContainer = this.serviceContainer;
    this._propertygrid.instanceServiceContainer = this.instanceServiceContainer;
    this._propertygrid.bindableObjectsTarget = "script";

    this._propertygrid.setNameColumnWidth(130);

    this._propertygrid.getTypeInfo = (obj, type) => {
      const info = typeInfoFromJsonSchema(this.scriptCommandsTypeInfo, obj, type);
      // trueCommands/elseCommands of "If" are edited as nested tree nodes, not in the property grid
      if (info && (type === "If" || obj?.type === "If")) {
        info.properties = info.properties.filter(
          (p) => p.name !== "trueCommands" && p.name !== "elseCommands",
        );
      }
      return info;
    };
    this._propertygrid.getSpecialEditorForType = async (
      property: IProperty,
      currentValue,
      propertyPath: string,
      wbRender: WbRenderEventType,
      additionalInfo?: any,
    ) => {
      //@ts-ignore
      if (!property.specialAllreadyAdded) {
        //@ts-ignore
        property.specialAllreadyAdded = true;
        if (property.format === "collection") {
          //TODO: create a collection edt. in property grid control used
        } else if (property.format === "signalList") {
          let rB = document.createElement("button");
          rB.style.height = "calc(100% - 6px)";
          rB.style.position = "relative";
          rB.style.display = "flex";
          rB.style.justifyContent = "center";
          rB.style.width = "20px";
          rB.style.boxSizing = "content-box";
          rB.innerText = "del";
          rB.onclick = () => {
            this._propertygrid.setPropertyValue(propertyPath, undefined);
            this._propertygrid.refresh();
          };
          wbRender.nodeElem.insertAdjacentElement("afterbegin", rB);

          const arr: IfSignal[] = Array.isArray(currentValue) ? currentValue : [];
          let d = document.createElement("div");
          d.style.display = "flex";
          let sp = document.createElement("span");
          sp.innerText = arr
            .map(
              (v, i) =>
                (v?.varName || "__" + i) + ": " + (v?.source ?? "") + ":" + (v?.name ?? ""),
            )
            .join(", ");
          sp.style.overflow = "hidden";
          sp.style.whiteSpace = "nowrap";
          sp.style.textOverflow = "ellipsis";
          sp.style.flexGrow = "1";
          sp.title = JSON.stringify(arr);
          d.appendChild(sp);
          let b = document.createElement("button");
          b.innerText = "...";
          b.onclick = () => {
            editSignalList({ value: arr, propertyPath });
          };
          d.appendChild(b);
          wbRender.nodeElem.style.display = "flex";
          return d;
        } else if (property.format === "formula") {
          const wrapper = document.createElement("div");
          wrapper.style.cssText =
            "display:flex; width:100%; height:100%; align-items:stretch;";

          const editor = new CodeViewMonaco();
          editor.language = "javascript";
          editor.singleRow = true;
          editor.style.cssText =
            "flex:1 1 auto; min-width:0; height:100%; position:relative; overflow:hidden;";
          editor.code = currentValue ?? "";
          editor.addEventListener("code-changed", () => {
            this._propertygrid.setPropertyValue(propertyPath, editor.code);
          });
          wrapper.appendChild(editor);

          const expandBtn = document.createElement("button");
          expandBtn.innerText = "...";
          expandBtn.title = "Open in larger editor";
          expandBtn.style.cssText = "flex:0 0 28px; width:20px;";
          expandBtn.onclick = () =>
            editFormula({ value: editor.code, propertyPath });
          wrapper.appendChild(expandBtn);

          wbRender.nodeElem.style.display = "flex";
          return wrapper;
        } else if (
          (typeof currentValue === "object" && currentValue !== null) ||
          property.format === "complex"
        ) {
          let rB = document.createElement("button");
          rB.style.height = "calc(100% - 6px)";
          rB.style.position = "relative";
          rB.style.display = "flex";
          rB.style.justifyContent = "center";
          rB.style.width = "20px";
          rB.style.boxSizing = "content-box";
          rB.innerText = "del";
          rB.onclick = () => {
            this._propertygrid.setPropertyValue(propertyPath, undefined);
            this._propertygrid.refresh();
          };
          wbRender.nodeElem.insertAdjacentElement("afterbegin", rB);

          let d = document.createElement("div");
          d.style.display = "flex";
          let sp = document.createElement("span");
          if (currentValue)
            sp.innerText =
              (currentValue.source ?? "") + ": " + (currentValue.name ?? "");
          else sp.innerText = "";
          sp.style.overflow = "hidden";
          sp.style.whiteSpace = "nowrap";
          sp.style.textOverflow = "ellipsis";
          sp.style.flexGrow = "1";
          sp.title = JSON.stringify(currentValue);
          d.appendChild(sp);
          let b = document.createElement("button");
          b.innerText = "...";
          b.onclick = () => {
            editComplex({ value: currentValue, propertyPath });
          };
          d.appendChild(b);
          wbRender.nodeElem.style.display = "flex";
          return d;
        } else {
          let b = document.createElement("button");
          b.style.height = "calc(100% - 6px)";
          b.style.position = "relative";
          b.style.display = "flex";
          b.style.justifyContent = "center";
          b.style.width = "20px";
          b.style.boxSizing = "content-box";
          b.title = "complex property value";
          b.style.opacity = "0.2";
          b.innerText = "...";
          b.onclick = () => {
            editComplex({ value: currentValue, propertyPath });
          };
          wbRender.nodeElem.insertAdjacentElement("afterbegin", b);
          wbRender.nodeElem.style.display = "flex";
        }
      }

      return null;
    };
    this._propertygrid.propertyNodeContextMenu.on((data) => {
      ContextMenu.show(
        [
          {
            title: "edit complex value",
            action: async () => {
              editComplex(data);
            },
          },
          {
            title: "edit string",
            action: async () => {
              const v = prompt("enter value:");
              if (v) {
                this._propertygrid.setPropertyValue(data.propertyPath, v);
                this._propertygrid.refresh();
              }
            },
          },
          {
            title: "remove complex value",
            action: async () => {
              this._propertygrid.setPropertyValue(data.propertyPath, undefined);
              this._propertygrid.refresh();
            },
          },
        ],
        data.event,
      );
    });
  }

  helpClicked() {
    const iframe = document.createElement("iframe");
    iframe.srcdoc = simpleScriptEditorHelpHtml;
    iframe.style.cssText =
      "width:100%; height:100%; border:none; display:block;";
    this.visualizationShell.openModal(iframe, {
      title: "Simple Script Editor Help",
      parent: this,
      x: -650,
      y: -100,
      width: 620,
      height: 620,
    });
    this.helpRequested.emit();
  }

  toggleCodeView() {
    if (!this._showingCode) {
      const json = JSON.stringify(
        { commands: this.getScriptCommands() },
        null,
        2,
      );
      this._codeView.update(json);
      this._showCodeView(true);
      return;
    }

    const parsed = this._parseCodeViewScript();
    if (!parsed) return;
    this._showCodeView(false);
    this.loadScript(parsed);
  }

  private _showCodeView(show: boolean) {
    this._codeView.classList.toggle("visible", show);
    this._commandListDiv.classList.toggle("hidden", show);
    this._splitView.classList.toggle("code-mode", show);
    this._addCommandBtn.disabled = show;
    this._codeToggleBtn.innerText = show ? "Visual" : "Code";
    this._showingCode = show;
    if (show) requestAnimationFrame(() => this._codeView.activated());
  }

  /** Parses+validates the code view's JSON. Returns null (and alerts) on invalid JSON. */
  private _parseCodeViewScript(): Script | null {
    let parsed: any;
    try {
      parsed = JSON.parse(this._codeView.getText());
    } catch (e) {
      alert("Invalid JSON:\n" + (e as Error).message);
      return null;
    }
    if (!Array.isArray(parsed?.commands)) {
      alert('The JSON must have a "commands" array.');
      return null;
    }
    return parsed;
  }

  loadScript(script: Script) {
    this._script = script;
    if (this._commandListFancyTree) {
      this._commandListFancyTree.destroy();
      this._commandListDiv = this._getDomElement<HTMLDivElement>("commandList");
    }

    let commandListTreeItems = [];

    for (let c of this._script.commands) {
      c = ScriptUpgrades.upgradeScriptCommand(c);
      commandListTreeItems.push(this.createTreeItem(c));
    }

    this._commandListFancyTree = new Wunderbaum({
      ...defaultOptions,
      element: this._commandListDiv,
      icon: false,
      source: commandListTreeItems,
      activate: (e) => {
        this._propertygrid.selectedObject = e.node.data.data.item ?? null;
      },
      render: (e) => {
        const isBranch = !!e.node.data.data?.branch;

        if (e.isNew) {
          e.nodeElem.oncontextmenu = (ev) => {
            ev.preventDefault();
            return false;
          };

          const leadingSpacer = document.createElement("span");
          leadingSpacer.style.cssText = "display:inline-block; width:24px;";
          e.nodeElem.prepend(leadingSpacer);

          if (!isBranch) {
            const handle = document.createElement("div");
            handle.className = "drag-handle";
            handle.title = "Drag to reorder";
            handle.innerHTML =
              '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            e.nodeElem.prepend(handle);

            const rowElem = e.nodeElem.parentElement;

            const spacer = document.createElement("span");
            spacer.style.cssText = "display:inline-block; width:32px;";
            e.nodeElem.appendChild(spacer);

            const cmd = document.createElement("div");
            cmd.className = "cmd";

            const copyImg = document.createElement("img");
            copyImg.src = assetsPath + "icons/copy.svg";
            copyImg.title = "Duplicate";
            copyImg.onclick = () => {
              const clone = structuredClone(e.node.data.data.item);
              const newNode = e.node.parent.addChildren(
                this.createTreeItem(clone),
              );
              newNode.moveTo(e.node, "after");
            };

            const delImg = document.createElement("img");
            delImg.src = assetsPath + "icons/delete.svg";
            delImg.title = "Remove";
            delImg.onclick = () => e.node.remove();

            cmd.append(copyImg, delImg);
            rowElem.appendChild(cmd);

            //@ts-ignore
            e.nodeElem._reservedRowWidth =
              leadingSpacer.offsetWidth + spacer.offsetWidth;
          } else {
            //@ts-ignore
            e.nodeElem._reservedRowWidth = leadingSpacer.offsetWidth;
          }
        }

        //@ts-ignore
        const reserved: number = e.nodeElem._reservedRowWidth ?? 0;
        if (reserved) {
          const titleSpan =
            e.nodeElem.querySelector<HTMLSpanElement>("span.wb-title");
          if (titleSpan) {
            const w = parseFloat(titleSpan.style.width);
            if (!isNaN(w))
              titleSpan.style.width = Math.max(0, w - reserved) + "px";
          }
        }
      },
      dnd: {
        guessDropEffect: true,
        preventRecursion: true,
        preventVoidMoves: false,
        serializeClipboardData: false,
        dragStart: (e) => {
          if (!this._dragFromHandle) return false;
          this._draggedNode = e.node;
          e.event.dataTransfer.effectAllowed = "move";
          e.event.dataTransfer.dropEffect = "move";
          e.event.dataTransfer.setData(SAME_TREE_MOVE_MIME, "1");
          return true;
        },
        dragEnd: () => {
          this._draggedNode = null;
        },
        dragEnter: (e) => {
          const isMove =
            e.event.dataTransfer?.types.includes(SAME_TREE_MOVE_MIME);
          e.event.dataTransfer.dropEffect = isMove ? "move" : "copy";
          const isBranchTarget = !!e.node.data.data?.branch;
          return isBranchTarget ? new Set(["over"]) : new Set(["before", "after"]);
        },
        dragOver: (e) => {
          const isMove =
            e.event.dataTransfer?.types.includes(SAME_TREE_MOVE_MIME);
          e.event.dataTransfer.dropEffect = isMove ? "move" : "copy";
        },
        drop: async (e) => {
          const isMove =
            e.event.dataTransfer?.types.includes(SAME_TREE_MOVE_MIME);
          if (e.region === "over") {
            if (isMove && this._draggedNode) {
              this._draggedNode.moveTo(e.node, <any>"appendChild");
              this._draggedNode.setClass("wb-drag-source", false);
            } else {
              const type = e.event.dataTransfer?.getData("text/plain");
              if (type) {
                e.node.addChildren(this.createTreeItem(<any>{ type }));
              }
            }
            return;
          }
          const region = e.region == "before" ? "before" : "after";
          if (isMove && this._draggedNode) {
            this._draggedNode.moveTo(e.node, region);
            this._draggedNode.setClass("wb-drag-source", false);
          } else {
            const type = e.event.dataTransfer?.getData("text/plain");
            if (type) {
              const command = { type };
              const ti = this.createTreeItem(<any>command);
              const newNode = e.node.parent.addChildren(ti);
              newNode.moveTo(e.node, region);
            }
          }
        },
      },
    });

    this._commandListFancyTree.root.children?.[0]?.setActive();
  }

  private createTreeItem(currentItem: ScriptCommands): any {
    if (currentItem.type === "If") {
      const ifCommand = <If>currentItem;
      ifCommand.trueCommands ??= [];
      ifCommand.elseCommands ??= [];
      return {
        title: "If",
        expanded: true,
        data: { item: currentItem },
        children: [
          {
            title: "true",
            expanded: true,
            data: { branch: "true" },
            children: ifCommand.trueCommands.map((c) => this.createTreeItem(c)),
          },
          {
            title: "else",
            expanded: true,
            data: { branch: "else" },
            children: ifCommand.elseCommands.map((c) => this.createTreeItem(c)),
          },
        ],
      };
    }
    return {
      title: currentItem.type,
      data: { item: currentItem },
    };
  }

  /** Reconstructs a ScriptCommand (and, for "If", its true/else branches) from a tree node. */
  private nodeToCommand(node: any): ScriptCommands {
    const item: ScriptCommands = node.data.data.item;
    if (item.type === "If") {
      const trueNode = node.children?.find((c: any) => c.data.data?.branch === "true");
      const elseNode = node.children?.find((c: any) => c.data.data?.branch === "else");
      (<If>item).trueCommands = (trueNode?.children ?? []).map((c: any) => this.nodeToCommand(c));
      (<If>item).elseCommands = (elseNode?.children ?? []).map((c: any) => this.nodeToCommand(c));
    }
    return item;
  }

  /** Walks up from `node` to the nearest branch ("true"/"else") container node, if any. */
  private _getBranchContainerNode(node: any): any {
    let n = node;
    while (n) {
      if (n.data?.data?.branch) return n;
      n = n.parent;
    }
    return null;
  }

  async addCommand() {
    const picker = new SimpleScriptCommandPicker();
    picker.loadCommands(this.scriptCommandsTypeInfo, this.commandDescriptions);

    picker.title = "Add Script Command";

    picker.commandTypeChosen.on(() => {
      if (picker.selectedType) {
        const command = { type: picker.selectedType };
        const ti = this.createTreeItem(<any>command);
        const branchContainer = this._getBranchContainerNode(
          this._commandListFancyTree.activeNode,
        );
        if (branchContainer) branchContainer.addChildren(ti);
        else this._commandListFancyTree.addChildren(ti);
      }
    });

    const abortController = new AbortController();
    picker.closeRequested.on(() => abortController.abort());

    await this.visualizationShell.openModal(picker, {
      title: "Add Script Command",
      x: 300,
      y: 50,
      width: 620,
      height: 400,
      parent: this,
      abortSignal: abortController.signal,
    });
  }

  getScriptCommands() {
    if (this._showingCode) {
      const parsed = this._parseCodeViewScript();
      if (parsed) this.loadScript(parsed);
    }

    let children = this._commandListFancyTree.root.children;
    return children.map((x) => this.nodeToCommand(x));
  }
}

customElements.define(SimpleScriptEditor.is, SimpleScriptEditor);
