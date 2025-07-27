import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { IUiCommand, InstanceServiceContainer, ServiceContainer } from '@node-projects/web-component-designer';
import { IDemoView } from '@node-projects/web-component-designer/src/elements/widgets/demoView/IDemoView';

export class ZplDemoView extends BaseCustomWebComponentConstructorAppend implements IDemoView {

    static override readonly template = html`<h2>Label generated via http://api.labelary.com/</h2><br><img id="image">`;

    static override readonly style = css`
        :host {
            display: block;
            overflow: hidden;
            background: white;
            height: 100%;
            width: 100%;
            position: relative;
        }
        #image {
            border: solid 1px black;
        }`;

    constructor() {
        super();
    }

    executeCommand: (command: IUiCommand) => void;
    canExecuteCommand: (command: IUiCommand) => boolean;

    dispose(): void { }

    async display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string) {
        const width = 4;
        const height = 6;
        const dpmm = '24dpmm';

        const response = await fetch(`http://api.labelary.com/v1/printers/${dpmm}/labels/${width}x${height}/${0}`, {
            method: "POST",
            body: code,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'image/png'
            },
        });
        (<HTMLIFrameElement>this._getDomElement('image')).src = URL.createObjectURL(await response.blob());;
    }
}

customElements.define('node-projects-zpl-demo-view', ZplDemoView);