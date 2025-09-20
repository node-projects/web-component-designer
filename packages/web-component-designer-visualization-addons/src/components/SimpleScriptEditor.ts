import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { Script } from "../scripting/Script.js";
import { ScriptCommands } from "../scripting/ScriptCommands.js";
import { ContextMenu, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
import { IProperty, typeInfoFromJsonSchema } from "@node-projects/propertygrid.webcomponent";
import { defaultOptions } from "@node-projects/web-component-designer-widgets-wunderbaum";
import { Wunderbaum } from 'wunderbaum';
//@ts-ignore
import wunderbaumStyle from 'wunderbaum/dist/wunderbaum.css' with { type: 'css' };
import { WbRenderEventType } from "types";
import { VisualizationPropertyGrid } from "./VisualizationPropertyGrid.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { VisualizationShell } from "../interfaces/VisualizationShell.js";
import '@node-projects/splitview.webcomponent';
import { ScriptUpgrades } from "../scripting/ScriptUpgrader.js";

export class SimpleScriptEditor extends BaseCustomWebComponentConstructorAppend {
  static override readonly style = css`
        :host {
            background: white;
        }
        .list{
            display: grid;
            grid-template-columns: 1fr 40px;
            width: calc(100% - 6px);
            box-sizing: border-box;
            margin: 3px;
        }

        .list button{
            padding: 5px 10px;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            margin-right: 5px;
            margin-left: 5px;
        }

        node-projects-visualization-property-grid {
            width: 100%;
            height: 100%;
        }
    `;

  static override readonly template = html`
        <div style="width:100%; height:100%; overflow: hidden;">
            <node-projects-split-view style="height: 100%; width: 100%; position: relative;" orientation="horizontal">
                <div style="width: 40%;  position: relative;">
                    <div style="width:calc(100% - 4px); height:calc(100% - 4px)">
                        <div id="commandList" style="overflow-x: hidden; overflow-y: auto; width:100%; height: calc(100% - 34px);"></div>
                        <div class="list">
                            <select id="possibleCommands" style="width: 100%"></select>  
                            <button @click="[[this.addItem()]]">Add</button>
                        </div>
                    </div>
                </div>
                <div style="width: 60%; position: relative;">
                    <node-projects-visualization-property-grid id="propertygrid"></node-projects-visualization-property-grid>
                </div>
            </node-projects-split-view>
        </div>
    `;

  static readonly is = 'node-projects-visualization-simple-script-editor';

  public serviceContainer: ServiceContainer;
  public instanceServiceContainer: InstanceServiceContainer;
  public visualizationHandler: VisualizationHandler;
  public visualizationShell: VisualizationShell;

  public scriptCommandsTypeInfo: any;
  public propertiesTypeInfo: any;

  private _script: Script;

  private _commandListDiv: HTMLDivElement;
  private _commandListFancyTree: Wunderbaum;

  private _possibleCommands: HTMLSelectElement;
  private _propertygrid: VisualizationPropertyGrid;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._commandListDiv = this._getDomElement<HTMLDivElement>('commandList');
    this._possibleCommands = this._getDomElement<HTMLSelectElement>('possibleCommands');
    this._propertygrid = this._getDomElement<VisualizationPropertyGrid>('propertygrid');

    this.shadowRoot.adoptedStyleSheets = [wunderbaumStyle, SimpleScriptEditor.style];
  }

  async ready() {
    this.addPossibleCommands();

    this._parseAttributesToProperties();
    this._bindingsParse(null, true);
    this._assignEvents();

    let editComplex = async (data: { value: any, propertyPath: string }) => {
      let pg = new VisualizationPropertyGrid();
      pg.visualizationHandler = this.visualizationHandler;
      pg.visualizationShell = this.visualizationShell;
      pg.serviceContainer = this.serviceContainer;
      pg.instanceServiceContainer = this.instanceServiceContainer;
      pg.bindableObjectsTarget = 'script';

      pg.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(this.propertiesTypeInfo, obj, type);
      pg.showHead = false;
      pg.typeName = 'IScriptMultiplexValue';
      pg.title = 'Complex for "' + data.propertyPath + '"';
      if (typeof data.value === 'object')
        pg.selectedObject = data.value ?? {};
      else
        pg.selectedObject = {};

      pg.bindingDoubleClicked = (b) => {
        if (b.bindabletype == 'property') {
          pg.setPropertyValue('source', 'property');
        } else if (b.bindabletype == 'context') {
          pg.setPropertyValue('source', 'context');
        } else {
          pg.setPropertyValue('source', 'signal');
        }
        pg.setPropertyValue('name', b.fullName)
        pg.refresh();
      }
      let res = await this.visualizationShell.openConfirmation(pg, { x: 100, y: 100, width: 400, height: 500, parent: this });
      if (res) {
        this._propertygrid.setPropertyValue(data.propertyPath, pg.selectedObject);
        this._propertygrid.refresh();
      }
    }

    this._propertygrid.visualizationHandler = this.visualizationHandler;
    this._propertygrid.visualizationShell = this.visualizationShell;
    this._propertygrid.serviceContainer = this.serviceContainer;
    this._propertygrid.instanceServiceContainer = this.instanceServiceContainer;
    this._propertygrid.bindableObjectsTarget = 'script';

    this._propertygrid.getTypeInfo = (obj, type) => typeInfoFromJsonSchema(this.scriptCommandsTypeInfo, obj, type);
    this._propertygrid.getSpecialEditorForType = async (property: IProperty, currentValue, propertyPath: string, wbRender: WbRenderEventType, additionalInfo?: any) => {
      //@ts-ignore
      if (!property.specialAllreadyAdded) {
        //@ts-ignore
        property.specialAllreadyAdded = true
        if ((typeof currentValue === 'object' && currentValue !== null) || property.format === 'complex') {
          let rB = document.createElement('button');
          rB.style.height = 'calc(100% - 6px)';
          rB.style.position = 'relative';
          rB.style.display = 'flex';
          rB.style.justifyContent = 'center';
          rB.style.width = '20px';
          rB.style.boxSizing = 'content-box';
          rB.innerText = 'del';
          rB.onclick = () => {
            this._propertygrid.setPropertyValue(propertyPath, undefined);
            this._propertygrid.refresh();
          }
          wbRender.nodeElem.insertAdjacentElement('afterbegin', rB);

          let d = document.createElement('div');
          d.style.display = 'flex';
          let sp = document.createElement('span');
          if (currentValue)
            sp.innerText = (currentValue.source ?? '') + ': ' + (currentValue.name ?? '');
          else
            sp.innerText = '';
          sp.style.overflow = 'hidden';
          sp.style.whiteSpace = 'nowrap';
          sp.style.textOverflow = 'ellipsis';
          sp.style.flexGrow = '1';
          sp.title = JSON.stringify(currentValue);
          d.appendChild(sp);
          let b = document.createElement('button');
          b.innerText = '...';
          b.onclick = () => {
            editComplex({ value: currentValue, propertyPath })
          }
          d.appendChild(b);
          wbRender.nodeElem.style.display = 'flex';
          return d;
        } else {
          let b = document.createElement('button');
          b.style.height = 'calc(100% - 6px)';
          b.style.position = 'relative';
          b.style.display = 'flex';
          b.style.justifyContent = 'center';
          b.style.width = '20px';
          b.style.boxSizing = 'content-box';
          b.title = 'complex property value';
          b.style.opacity = '0.2';
          b.innerText = '...';
          b.onclick = () => {
            editComplex({ value: currentValue, propertyPath })
          }
          wbRender.nodeElem.insertAdjacentElement('afterbegin', b);
          wbRender.nodeElem.style.display = 'flex';
        }
      }

      return null;
    }
    this._propertygrid.propertyNodeContextMenu.on((data) => {
      ContextMenu.show([{
        title: 'edit complex value',
        action: async () => {
          editComplex(data);
        }
      },
      {
        title: 'edit string',
        action: async () => {
          const v = prompt("enter value:");
          if (v) {
            this._propertygrid.setPropertyValue(data.propertyPath, v);
            this._propertygrid.refresh();
          }
        }
      },
      {
        title: 'remove complex value',
        action: async () => {
          this._propertygrid.setPropertyValue(data.propertyPath, undefined);
          this._propertygrid.refresh();
        }
      }], data.event);
    })
  }

  //Converter from TypscriptJsonSchema to our Property list...

  private async addPossibleCommands() {
    let commands = Object.keys(this.scriptCommandsTypeInfo.definitions).filter(x => this.scriptCommandsTypeInfo.definitions[x].type == 'object');

    for (let c of commands) {
      if (c == 'ScriptCommands')
        continue;
      let option = document.createElement('option');
      option.innerText = c;
      this._possibleCommands.add(option);
    }
  }

  loadScript(script: Script) {
    this._script = script;

    let commandListTreeItems = [];

    for (let c of this._script.commands) {
      c = ScriptUpgrades.upgradeScriptCommand(c);
      commandListTreeItems.push(this.createTreeItem(c));
    };

    this._commandListFancyTree = new Wunderbaum({
      ...defaultOptions,
      element: this._commandListDiv,
      icon: false,
      source: commandListTreeItems,
      activate: (e) => {
        this._propertygrid.selectedObject = e.node.data.data.item;
      },
      render: (e) => {
        if (e.isNew) {
          let span = e.nodeElem;
          span.oncontextmenu = (ev) => {
            e.node.setActive();
            if (e.node.data.contextMenu) {
              e.node.data.contextMenu(ev, e.node.data, e.node);
            }
            ev.preventDefault();
            return false;
          }
        }
      },
      dnd: {
        guessDropEffect: true,
        preventRecursion: true,
        preventVoidMoves: false,
        serializeClipboardData: false,
        dragStart: (e) => {
          e.event.dataTransfer.effectAllowed = "move";
          e.event.dataTransfer.dropEffect = "move";
          return true;
        },
        dragEnter: (e) => {
          e.event.dataTransfer.dropEffect = 'move';
          return true;
        },
        dragOver: (e) => {
          e.event.dataTransfer.dropEffect = 'move';
        },
        drop: async (e) => {
          e.sourceNode.moveTo(e.node, e.region == 'before' ? 'before' : 'after');
        }
      }
    });
  }

  private createTreeItem(currentItem: ScriptCommands) {
    let cti = {
      title: currentItem.type,
      data: { item: currentItem },
      contextMenu: (e, data, node) => {
        ContextMenu.show([{ title: 'Remove Item', action: (e) => node.remove() }], e);
      }
    };
    return cti;
  }

  addItem() {
    const cmdName = this._possibleCommands.value;
    const command = { type: cmdName }
    const ti = this.createTreeItem(<any>command);
    this._commandListFancyTree.addChildren(ti);
  }

  getScriptCommands() {
    let children = this._commandListFancyTree.root.children;
    return children.map(x => x.data.data.item);
  }
}

customElements.define(SimpleScriptEditor.is, SimpleScriptEditor);