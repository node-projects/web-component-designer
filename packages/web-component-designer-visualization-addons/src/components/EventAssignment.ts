import { BaseCustomWebComponentConstructorAppend, Disposable, css, html } from "@node-projects/base-custom-webcomponent"
import { ContextMenu, copyTextToClipboard, getTextFromClipboard, IContextMenuItem, IDesignItem, IEvent, InstanceServiceContainer, PropertiesHelper } from "@node-projects/web-component-designer";
import { ParameterEditor } from "./ParameterEditor.js";
import { VisualizationShell } from "../interfaces/VisualizationShell.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { BlocklyScriptEditor } from "../blockly/BlocklyScriptEditor.js";
import { SimpleScriptEditor } from "./SimpleScriptEditor.js";

type scriptType = 'jsdirect' | 'js' | 'script' | 'blockly' | 'none' | 'empty';
export class EventAssignment extends BaseCustomWebComponentConstructorAppend {

    static override style = css`
        :host {
            display: grid;
            grid-template-columns: 20px 1fr auto;
            overflow-y: auto;
            align-content: start;
            height: 100%;
        }
        .rect {
            width: 7px;
            height: 7px;
            border: 1px solid black;
            justify-self: center;
            cursor: pointer;
            align-self: center;
            white-space: nowrap;
        }
        input.mth {
            width: 100%;
            box-sizing: border-box;
        }
        input::placeholder {
            font-size: 8px;
        }
        a {
            cursor: pointer;
            white-space: nowrap;
        }
        a:hover {
            cursor: pointer;
            text-decoration: underline;
        }
        button {
            cursor: pointer;
        }`;

    static override template = html`
        <template repeat:item="[[this.events]]">
            <div @click="[[this._ctxMenu(event, item)]]" @contextmenu="[[this._ctxMenu(event, item)]]" class="rect" title="[[this._getScriptType(item)]]" css:background-color="[[this._getScriptTypeColor(item)]]"></div>
            <a @click="[[this._showContextMenuAssignScript(event, item, false)]]" @contextmenu="[[this._ctxMenu(event, item)]]" title="[[item.name]]">[[item.name]]</a>
            <div>[[this._createControlsForScript(item)]]</div>
        </template>
        <span style="grid-column: 1 / span 3; margin-top: 8px; margin-left: 3px;">add event:</span>
        <input id="addEventInput" style="grid-column: 1 / span 3; margin: 5px;" @keypress="[[this._addEvent(event)]]" type="text">`;

    static editRowTemplate = html`
        <div style="display: flex; justify-content: flex-end;">
            <input value="[[this._getScriptName(item)]]" @keypress="[[this._changeScriptName(event, item)]]" hidden="[[this._getScriptType(item) !== 'js']]" placeholder="name" title="name" style="min-width: 50px; flex-basis: 30px; flex-grow: 2;" class="mth" type="text">
            <input value="[[this._getRelativeSignalsPath(item)]]" @keypress="[[this._changeRelativeSignalsPath(event, item)]]" placeholder="relative signals path" title="relative signals path" style="min-width: 50px; flex-basis: 20px; flex-grow: 1;" class="mth" type="text">
            <button css:background="[[this._hasParameters(item) ? 'lime' : '']]" style="display: flex; padding: 0; flex-grow: 0;" title="parameter" @click="[[this._editParameter(event, item)]]">p</button>
        </div>`;

    static scriptTypeColors = {
        'js': 'purple',
        'blockly': 'yellow',
        'script': 'lightgreen',
        'empty': 'pink'
    }

    static readonly is = 'node-projects-visualization-event-assignment';
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    ready() {
        this._bindingsParse();
    }

    private _blocklyToolbox: any;
    private _instanceServiceContainer: InstanceServiceContainer;
    private _selectionChangedHandler: Disposable;
    private _selectedItems: IDesignItem[];
    private _visualizationHandler: VisualizationHandler;
    private _visualizationShell: VisualizationShell;
    private _scriptCommandsTypeInfo: any;
    private _propertiesTypeInfo: any

    public events: IEvent[];

    public initialize(visualizationHandler: VisualizationHandler, visualizationShell: VisualizationShell, scriptCommandsTypeInfo: any, propertiesTypeInfo: any, blocklyToolbox: any) {
        this._visualizationHandler = visualizationHandler;
        this._visualizationShell = visualizationShell;
        this._scriptCommandsTypeInfo = scriptCommandsTypeInfo;
        this._propertiesTypeInfo = propertiesTypeInfo;
        this._blocklyToolbox = blocklyToolbox;
    }

    public set instanceServiceContainer(value: InstanceServiceContainer) {
        this._instanceServiceContainer = value;
        this._selectionChangedHandler?.dispose()
        this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(e => {
            this.selectedItems = e.selectedElements;
        });
        this.selectedItems = this._instanceServiceContainer.selectionService.selectedElements;
    }

    protected _createControlsForScript(eventItem: IEvent) {
        const st = this._getScriptType(eventItem);
        switch (st) {
            case 'none':
                return '';
        }
        //@ts-ignore
        const ctl = this.constructor.editRowTemplate.content.cloneNode(true);
        return ctl;
    }

    protected _getScriptName(eventItem: IEvent) {
        if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
            const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
            if (val[0] === '{') {
                if (val.includes('name')) {
                    const parsed = JSON.parse(val);
                    return parsed.name;
                }
            } else {
                return val;
            }
        }
        return null;
    }

    protected async _changeScriptName(e: KeyboardEvent, eventItem: IEvent) {
        if (e.key == 'Enter') {
            if (this.selectedItems && this.selectedItems.length) {
                if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
                    const newValue = (<HTMLInputElement>e.target).value;
                    const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
                    if (val.startsWith('{')) {
                        const parsed = JSON.parse(val);
                        parsed.name = newValue;
                        this._selectedItems[0].setAttribute('@' + eventItem.name, JSON.stringify(parsed));
                    } else {
                        this._selectedItems[0].setAttribute('@' + eventItem.name, newValue);
                    }
                }
            }
        }
    }

    protected _getRelativeSignalsPath(eventItem: IEvent) {
        if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
            const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
            if (val[0] === '{' && val.includes('relativeSignalsPath')) {
                const parsed = JSON.parse(val);
                return parsed.relativeSignalsPath;
            }
        }
        return null;
    }

    protected async _changeRelativeSignalsPath(e: KeyboardEvent, eventItem: IEvent) {
        if (e.key == 'Enter') {
            if (this.selectedItems && this.selectedItems.length) {
                if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
                    const newValue = (<HTMLInputElement>e.target).value;
                    const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
                    if (val.startsWith('{')) {
                        const parsed = JSON.parse(val);
                        parsed.relativeSignalsPath = newValue;
                        this._selectedItems[0].setAttribute('@' + eventItem.name, JSON.stringify(parsed));
                    } else {
                        let obj = { name: val, relativeSignalsPath: newValue };
                        this._selectedItems[0].setAttribute('@' + eventItem.name, JSON.stringify(obj));
                    }
                }
            }
        }
    }

    protected _hasParameters(eventItem: IEvent) {
        if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
            const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
            return val.includes('parameters')
        }
        return false;
    }

    protected _getScriptTypeColor(eventItem: IEvent) {
        const st = this._getScriptType(eventItem);
        const color = EventAssignment.scriptTypeColors[st];
        return color ?? 'white';
    }

    protected _getScriptType(eventItem: IEvent): scriptType {
        if (this.selectedItems && this.selectedItems.length) {
            if (this.selectedItems[0].hasAttribute('@' + eventItem.name)) {
                const val = this.selectedItems[0].getAttribute('@' + eventItem.name);
                if (val.startsWith('{')) {
                    const parsed = JSON.parse(val);
                    if ('blocks' in parsed)
                        return 'blockly';
                    if ('commands' in parsed)
                        return 'script';
                    return 'js';
                } else if (val == '')
                    return 'empty';
                else
                    return 'js';
            }
        }
        return 'none';
    }

    protected _getEventMethodname(eventItem: IEvent): string {
        if (this.selectedItems.length)
            return this.selectedItems[0].getAttribute('@' + eventItem.name);
        return '';
    }

    protected _inputMthName(event: InputEvent, eventItem: IEvent) {
        let el = event.target as HTMLInputElement
        this.selectedItems[0].setAttribute('@' + eventItem.name, el.value);
    }

    protected _ctxMenu(e: MouseEvent, eventItem: IEvent) {
        e.preventDefault();
        const evtType = this._getScriptType(eventItem);
        if (evtType == 'empty')
            this._showContextMenuAssignScript(e, eventItem, true)
        else if (evtType != 'none') {
            let ctxMenu = [
                {
                    title: 'remove',
                    action: () => { this.selectedItems[0].removeAttribute('@' + eventItem.name); this._bindingsRefresh(); }
                }, {
                    title: '-'
                }, {
                    title: 'copy',
                    action: () => { copyTextToClipboard(this.selectedItems[0].getAttribute('@' + eventItem.name)); }
                }, {
                    title: 'paste',
                    action: async () => { this.selectedItems[0].setAttribute('@' + eventItem.name, await getTextFromClipboard()); this._bindingsRefresh(); }
                }];
            ContextMenu.show(ctxMenu, e);
        } else
            this._showContextMenuAssignScript(e, eventItem, true)
    }

    protected async _addEvent(e: KeyboardEvent) {
        if (e.key == 'Enter') {
            let ip = this._getDomElement<HTMLInputElement>('addEventInput');
            this._selectedItems[0].setAttribute('@' + PropertiesHelper.camelToDashCase(ip.value.replaceAll(' ', '-')), '');
            ip.value = '';
            this.scrollTop = 0;
            this.refresh();
        }
    }

    protected _createAssignScriptContextMenu(event: MouseEvent, eventItem: IEvent) {
        let ctxMenu: IContextMenuItem[] = [
            {
                title: 'Simple Script',
                action: () => {
                    this._editEvent('script', event, eventItem);
                }
            },
            {
                title: 'Javascript',
                action: () => {
                    let nm = prompt('name of function ?');
                    if (nm) {
                        this._selectedItems[0].setAttribute('@' + eventItem.name, nm);
                        this.refresh();
                        this._editEvent('js', null, eventItem);
                    }
                }
            },
            {
                title: 'Blockly',
                action: () => {
                    this._editBlockly(null, eventItem);
                }
            }
        ];

        const evtType = this._getScriptType(eventItem);
        if (evtType != 'none') {
            ctxMenu.push({
                title: '-'
            });
            ctxMenu.push({
                title: 'remove',
                action: () => { this.selectedItems[0].removeAttribute('@' + eventItem.name); this._bindingsRefresh(); }
            });
        }
        if (evtType != 'empty') {
            ctxMenu.push({
                title: '-'
            }, {
                title: 'copy',
                action: () => { copyTextToClipboard(this.selectedItems[0].getAttribute('@' + eventItem.name)); }
            }, {
                title: 'paste',
                action: async () => { this.selectedItems[0].setAttribute('@' + eventItem.name, await getTextFromClipboard()); this._bindingsRefresh(); }
            });
        }
        return ctxMenu;
    }

    protected async _showContextMenuAssignScript(event: MouseEvent, eventItem: IEvent, isCtxMenu: boolean) {
        event.preventDefault();
        const evtType = this._getScriptType(eventItem);
        if (evtType != 'none' && evtType != 'empty' && !isCtxMenu) {
            this._editEvent(evtType, event, eventItem);
        } else {
            let ctxMenu = this._createAssignScriptContextMenu(event, eventItem)
            ContextMenu.show(ctxMenu, event);
        }
    }

    protected async _editParameter(e: MouseEvent, eventItem: IEvent) {
        let selectedItem = this.selectedItems[0];
        const edt = new ParameterEditor();
        let existingParameter = {};
        edt.title = "ParameterEditor for '" + eventItem.name + "' of '" + selectedItem.name + "'";
        let data = selectedItem.getAttribute('@' + eventItem.name);
        if (data && data[0] == '{') {
            try {
                const parsed = JSON.parse(data);
                existingParameter = parsed.parameters;
            }
            catch { }
        }
        edt.setParametersObject(existingParameter);
        const result = await this._visualizationShell.openConfirmation(edt, { x: 100, y: 100, width: 700, height: 500 });
        if (result) {
            const par = edt.getParametersObject();
            let newObj = {
                name: data,
                parameters: par
            }
            if (data && data[0] == '{') {
                newObj = JSON.parse(data);
                newObj.parameters = par;
            }
            if (par == null)
                delete newObj.parameters;

            const newData = JSON.stringify(newObj);
            selectedItem.setAttribute('@' + eventItem.name, newData);
            this._bindingsRefresh();
        }
    }

    protected async _editBlockly(e: MouseEvent, eventItem: IEvent) {
        let selectedItem = this.selectedItems[0];
        const edt = new BlocklyScriptEditor(this._blocklyToolbox);
        edt.title = "Blockly Script for '" + eventItem.name + "' of '" + selectedItem.name + "'";
        let data = selectedItem.getAttribute('@' + eventItem.name);
        let parameters = null;
        let relativeSignalsPath = null;
        if (data) {
            const parsed = JSON.parse(data);
            parameters = parsed.parameters;
            relativeSignalsPath = parsed.relativeSignalsPath;
            edt.load(parsed);
        }
        const result = await this._visualizationShell.openConfirmation(edt, { x: 100, y: 100, width: 700, height: 500 });
        if (result) {
            const blockObj = edt.save();
            if (parameters) {
                blockObj.parameters = parameters;
            }
            if (relativeSignalsPath) {
                blockObj.relativeSignalsPath = relativeSignalsPath;
            }
            selectedItem.setAttribute('@' + eventItem.name, JSON.stringify(blockObj));
            this._bindingsRefresh();
        }
    }

    protected async _editJavascript(e: MouseEvent, eventItem: IEvent) {
        // todo ?
    }

    protected async _editSimpleScript(e: MouseEvent, eventItem: IEvent) {
        let selectedItem = this.selectedItems[0];
        let scriptString = <string>selectedItem.getAttribute('@' + eventItem.name);
        if (!scriptString || scriptString.startsWith('{')) {
            let script = { commands: [] };
            let parameters = null;
            let relativeSignalsPath = null;
            if (scriptString) {
                script = JSON.parse(scriptString);
                //@ts-ignore
                parameters = script.parameters;
                //@ts-ignore
                relativeSignalsPath = script.relativeSignalsPath;
            }
            let sc = new SimpleScriptEditor();
            sc.serviceContainer = selectedItem.serviceContainer;
            sc.instanceServiceContainer = selectedItem.instanceServiceContainer;
            sc.scriptCommandsTypeInfo = this._scriptCommandsTypeInfo;
            sc.propertiesTypeInfo = this._propertiesTypeInfo;
            sc.visualizationShell = this._visualizationShell;
            sc.visualizationHandler = this._visualizationHandler;

            sc.loadScript(script);
            sc.title = "Script '" + eventItem.name + "' on " + selectedItem.name;

            let res = await this._visualizationShell.openConfirmation(sc, { x: 100, y: 100, width: 600, height: 500 });
            if (res) {
                let scriptCommands = sc.getScriptCommands();
                if (scriptCommands && scriptCommands.length) {
                    const sc = { commands: scriptCommands };
                    if (parameters) {
                        //@ts-ignore
                        sc.parameters = parameters;
                    }
                    if (relativeSignalsPath) {
                        //@ts-ignore
                        sc.relativeSignalsPath = relativeSignalsPath;
                    }
                    let json = JSON.stringify(sc);
                    selectedItem.setAttribute('@' + eventItem.name, json);
                    this._bindingsRefresh();
                }
            }
        }
    }

    public async _editEvent(evtType: scriptType, e: MouseEvent, eventItem: IEvent) {
        if (evtType == 'js') {
            this._editJavascript(e, eventItem);
        } else if (evtType == 'blockly') {
            this._editBlockly(e, eventItem);
        } else {
            this._editSimpleScript(e, eventItem);
        }
    }

    public refresh() {
        if (this._selectedItems != null && this._selectedItems.length) {
            this.events = this._selectedItems[0].serviceContainer.getLastServiceWhere('eventsService', x => x.isHandledElementFromEventsService(this._selectedItems[0])).getPossibleEvents(this._selectedItems[0]);
        } else {
            this.events = [];
        }
        this._bindingsRefresh();
    }

    get selectedItems() {
        return this._selectedItems;
    }
    set selectedItems(items: IDesignItem[]) {
        if (this._selectedItems != items) {
            this._selectedItems = items;
            this.refresh();
        }
    }
}

customElements.define(EventAssignment.is, EventAssignment);