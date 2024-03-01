import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { IUiCommand, InstanceServiceContainer, ServiceContainer } from '@node-projects/web-component-designer';
import { IDemoView } from '@node-projects/web-component-designer/src/elements/widgets/demoView/IDemoView';

export class ZplDemoView extends BaseCustomWebComponentConstructorAppend implements IDemoView {

    static override readonly template = html`<iframe id="iframe"></iframe>`;

    static override readonly style = css`
        :host {
            display: block;
            overflow: hidden;
            background: white;
            height: 100%;
            width: 100%;
            position: relative;
        }
        iframe {
            height: 100%;
            width: 100%;
        }`;

    constructor() {
        super();
    }

    executeCommand: (command: IUiCommand) => void;
    canExecuteCommand: (command: IUiCommand) => boolean;

    dispose(): void { }

    async display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string) {
        const url = "https://labelary.com/viewer.html?zpl=" + encodeURIComponent(code);
        (<HTMLIFrameElement>this._getDomElement('iframe')).src = url;
    }
}

customElements.define('node-projects-zpl-demo-view', ZplDemoView);