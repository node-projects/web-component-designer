import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent"

export class ParameterEditor extends BaseCustomWebComponentConstructorAppend {

    static override style = css`
        :host {
            display: grid;
            grid-template-columns: 80px 80px 80px auto;
            overflow-y: auto;
            align-content: start;
            height: 100%;
            padding: 10px;
            gap: 5px;
            box-sizing: border-box;
        }
        
        span {
            font-size: 10px;
        }`;

    static override template = html`
        <span></span>
        <span>name</span>
        <span>type</span>
        <span>value</span>
        <template repeat:item="[[this._parameterArray]]">
            <button @click="[[this._remove(index)]]" style="width: 40px; height: 20px; align-self: center;">del</button>
            <input type="text" value="{{?item.key}}">
            <select value="{{item.type}}" @change="[[this._bindingsRefresh()]]">
                <option>null</string>
                <option>string</string>
                <option>number</string>
                <option>boolean</string>
            </select>
            <input hidden="[[item.type !== 'string']]" type="text" value="{{?item.value}}">
            <input hidden="[[item.type !== 'number']]" type="number" value="{{item.value}}">
            <input hidden="[[item.type !== 'boolean']]" type="checkbox" checked="{{item.value}}">
            <div hidden="[[item.type !== 'null']]">-null-</div>
        </template>
        <button @click="[[this._add()]]" style="width: 40px; height: 20px; align-self: center;">add</button>`;

    public static is = 'node-projects-visualization-parameter-editor';

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    ready() {
        this._bindingsParse();
    }

    protected _parameterArray: { key: string, type: string, value: any }[];

    setParametersObject(value: Record<string, any>) {
        if (value != null)
            this._parameterArray = Object.keys(value).map(x => ({ key: x, type: typeof value[x] === 'object' ? 'null' : typeof value[x], value: value[x] }));
        else
            this._parameterArray = [];
        this._bindingsRefresh();
    }

    getParametersObject() {
        let hasPar = false;
        const obj = {};
        for (const p of this._parameterArray) {
            if (p.key) {
                hasPar = true;
                obj[p.key] = null;
                switch (p.type) {
                    case 'string':
                        obj[p.key] = p.value.toString();
                        break;
                    case 'number':
                        const f = parseFloat(p.value);
                        obj[p.key] = isNaN(f) ? 0 : f;
                        break;
                    case 'boolean':
                        obj[p.key] = !!p.value;
                        break;
                }
            }
        }
        return hasPar ? obj : null;
    }

    _remove(index: number) {
        this._parameterArray.splice(index, 1);
        this._bindingsRefresh();
    }

    _add() {
        this._parameterArray.push(<any>{ type: 'null' });
        this._bindingsRefresh();
    }
}

customElements.define(ParameterEditor.is, ParameterEditor);