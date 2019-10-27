import { html, PolymerElement } from '@polymer/polymer';
import { customElement, property } from "@polymer/decorators";

@customElement('sample-document')
export class SampleDocument extends PolymerElement {

    @property({ type: String })
    mainPage = 'designer';

    static get template() {
        return html`
            <style>
              designer-tab.single {
                color: white;
                background: var(--dark-grey);
                width: 100%;
                height: 41px;
                margin: 0;
                padding: 0;
                border: none;
              }
              designer-tab.single span {
                box-shadow: none;
              }
              iron-pages  {
                height: 100%;
                overflow: auto;
              }
              canvas-view {
                overflow: auto;
              }
            </style>
            <designer-tabs attr-for-selected="name" selected="{{mainPage}}">
              <designer-tab name="designer">
                <button>Designer</button>
              </designer-tab>
              <designer-tab name="preview">
                <button on-click="_viewDemo">Preview</button>
              </designer-tab>
              <designer-tab name="code">
                <button on-click="_viewCode">Code</button>
              </designer-tab>
            </designer-tabs>
            <iron-pages selected="[[mainPage]]" attr-for-selected="name" selected-attribute="visible">
              <canvas-view name="designer" id="viewContainer" style="height:100%"></canvas-view>
              <div name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
              <demo-view id="demoView" name="preview"></demo-view>
              <help-view name="help"></help-view>
            </iron-pages>
        `;
    }

    private _viewDemo() {
        //@ts-ignore
        if (!window.codeView.get)
            return;
        //@ts-ignore
        (this.$.demoView as DemoView).display(window.codeView.get());
    }

    private _viewCode() {
        this.dispatchEvent(new CustomEvent('update-code', { bubbles: true, composed: true, detail: { target: this.$.viewContainer, node: this } }));
    }
}