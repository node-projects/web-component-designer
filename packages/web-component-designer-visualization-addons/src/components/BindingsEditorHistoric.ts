import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';

export class BindingsEditorHistoric extends BaseCustomWebComponentConstructorAppend {

    static override readonly template = html`
        <span style="position:absolute;left:30px;top:26px;">from</span>
        <span style="position:absolute;left:30px;top:77px;">count</span>
        <span style="position:absolute;left:30px;top:123px;">limit</span>
        <span style="position:absolute;left:30px;top:150px;">round</span>
        <span style="position:absolute;left:55px;top:181px;">return newest entries</span>
        <span style="position:absolute;left:55px;top:201px;">remove border values</span>
        <span style="position:absolute;left:30px;top:301px;">step</span>
        <span style="position:absolute;left:30px;top:270px;">aggregate</span>
        <span style="position:absolute;left:30px;top:227px;">ignore null</span>
        <input type="datetime-local" value="{{this.historic.from}}" style="position:absolute;left:75.9219px;top:26px;width:184px;">
        <span style="position:absolute;left:31px;top:52px;">to</span>
        <input type="datetime-local" value="{{this.historic.to}}" style="position:absolute;left:76px;top:51.4375px;width:184px;">
        <input type="number" value="{{this.historic.count}}" style="position:absolute;left:76px;top:78.4415px;width:184px;">
        <input type="number" value="{{this.historic.limit}}" style="position:absolute;left:76px;top:125.5px;width:184px;">
        <input type="number" value="{{this.historic.round}}" style="position:absolute;left:76px;top:152px;width:184px;">
        <input type="number" value="{{this.historic.step}}" style="position:absolute;left:75.921875px;top:301px;width:184px;">
        <select value="{{?this.historic.aggregate}}" @change="[[this.refresh()]]" style="position:absolute;left:142px;top:273px;width:118px;height:21px;">
            <option>none</option>
            <option>minmax</option>
            <option>max</option>
            <option>min</option>
            <option>average</option>
            <option>total</option>
            <option>count</option>
            <option>percentile</option>
            <option>quantile</option>
            <option>integral</option>
        </select>
        <select value="{{this.historic.ignoreNull}}" style="position:absolute;left:142px;top:230px;width:119px;height:21px;">
            <option>false</option>
            <option>true</option>
            <option>0</option>
        </select>
        <input type="checkbox" checked="{{this.historic.returnNewestEntries}}" style="position:absolute;left:35px;top:184px;">
        <input type="checkbox" checked="{{this.historic.removeBorderValues}}" style="position:absolute;left:35px;top:204px;">
        <div style="position:absolute;left:266px;top:26px;width:135px;height:201px;border:1px solid black;">
            <div style="position:absolute;left:25px;top:36px;width:117px;height:154px;grid-template-columns:20px 1fr;display:grid;">
                <input type="checkbox" checked="{{this.historic.from}}" style="grid-column:1;grid-row:1;">
                <span>from</span>
                <input type="checkbox" checked="{{this.historic.ack}}">
                <span>ack</span>
                <input type="checkbox" checked="{{this.historic.q}}">
                <span>q</span>
                <input type="checkbox" checked="{{this.historic.user}}">
                <span>user</span>
                <input type="checkbox" checked="{{this.historic.comment}}">
                <span>comment</span>
                <input type="checkbox" checked="{{this.historic.id}}">
                <span>id</span>
            </div>
            <span style="position:absolute;left:8px;top:6px;">include fields</span>
        </div>
        <span style="position:absolute;left:31.8203px;top:390px;">update all (ms)</span>
        <input value="{{this.historic.reloadInterval}}" type="number" style="position:absolute;left:142px;top:390px;width:119px;">
        <span css:visibility="[[this.historic.aggregate == 'percentile' ? 'visible' : 'collapse']]" id="lblPercentile" style="position:absolute;left:30px;top:325px;">percentile</span>
        <input css:visibility="[[this.historic.aggregate == 'percentile' ? 'visible' : 'collapse']]" value="{{this.historic.percentile}}" type="number" id="percentile" style="position:absolute;left:109px;top:325px;width:151px;">
        <span css:visibility="[[this.historic.aggregate == 'integral' ? 'visible' : 'collapse']]" id="lblIntegral" style="position:absolute;left:30px;top:325px;">integral unit</span>
        <input css:visibility="[[this.historic.aggregate == 'integral' ? 'visible' : 'collapse']]" value="{{this.historic.integralUnit}}" type="number" id="integralUnit" style="position:absolute;left:126px;top:325px;width:134px;">
        <select css:visibility="[[this.historic.aggregate == 'integral' ? 'visible' : 'collapse']]" value="{{this.historic.integralInterpolation}}" style="position:absolute;left:178.93px;top:349px;width:81px;height:21px;">
            <option>none</option>
            <option>linear</option>
        </select>
        <span css:visibility="[[this.historic.aggregate == 'integral' ? 'visible' : 'collapse']]" style="position:absolute;left:29.9219px;top:346px;">integral interpolation</span>
        <input css:visibility="[[this.historic.aggregate == 'quantile' ? 'visible' : 'collapse']]" value="{{this.historic.quantile}}" type="number" id="quantile" style="position:absolute;left:107px;top:325px;width:153px;">
        <span css:visibility="[[this.historic.aggregate == 'quantile' ? 'visible' : 'collapse']]" id="lblQuantile" style="position:absolute;left:30px;top:325px;">quantile</span>
        <span style="position:absolute;left:34px;top:417px;">instance</span>
        <input type="text" value="{{?this.historic.instance}}" style="position:absolute;left:104px;top:419px;width:155px;">`;

    static override readonly style = css`
        :host {
            box-sizing: border-box;
        }`;

    static readonly is = 'node-projects-visualization-bindings-editor-historic';

    historic: any;

    static readonly properties = {
        historic: Object
    }

    constructor(historic: any) {
        super();
        this._restoreCachedInititalValues();

        this.historic = historic ?? { reloadInterval: 2000 };
    }

    ready() {
        this._bindingsParse();
    }

    #refreshing = false;
    refresh() {
        if (!this.#refreshing) {
            this.#refreshing = true;
            this._bindingsRefresh(null, true);
            this.#refreshing = false;
        }
    }
}

customElements.define(BindingsEditorHistoric.is, BindingsEditorHistoric)