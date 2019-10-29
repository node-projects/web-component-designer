import { html, PolymerElement } from '@polymer/polymer';
import { customElement, property } from "@polymer/decorators";

@customElement('sample-document')
export class SampleDocument extends PolymerElement {

    @property({ type: String })
    mainPage = 'designer';

    @property({ type: Object })
    serviceContainer;

    static get template() {
        return html`
            <style>
              div {
                height: 100%;
                display: flex;
                flex-direction: column;
              }                            
              canvas-view {
                overflow: auto;
              }
            </style>
            <div>
              <designer-tab-control selected-index="0">              
                <canvas-view service-container="[[serviceContainer]]" title="Designer" name="designer" id="viewContainer" style="height:100%"></canvas-view>
                <div title="Preview" name="code" style="width:100%;height:100%;"><slot name="code"></slot></div>
                <demo-view title="Code" id="demoView" name="preview"></demo-view>
              </designer-tab-control>              
            </div>
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