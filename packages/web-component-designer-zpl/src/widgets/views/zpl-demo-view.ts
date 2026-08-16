import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { IUiCommand, InstanceServiceContainer, ServiceContainer } from '@node-projects/web-component-designer';
import { IDemoView } from '@node-projects/web-component-designer/src/elements/widgets/demoView/IDemoView.js';
import { zplPreviewDpmm } from '../../barcodes/bwipRenderer.js';

export class ZplDemoView extends BaseCustomWebComponentConstructorAppend implements IDemoView {

    static override readonly template = html`<div id="side"><span>Label generated via http://api.labelary.com/</span></div><img id="image">`;

    static override readonly style = css`
        :host {
            display: block;
            overflow: hidden;
            background: white;
            height: 100%;
            width: 100%;
            position: relative;
        }
        #side {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 24px;
            background: var(--wcd-demo-view-toolbar-background, black);
        }
        #side > span {
            color: var(--wcd-color-text, white);
            rotate: 270deg;
            display: block;
            position: absolute;
            top: 304px;
            left: -305px;
            font-weight: 600;
            font-family: monospace;
            font-size: 24px;
            white-space: nowrap;
        }
        #image {
            border: solid 1px black;
            position: absolute;
            top: 0;
            left: 24px;
            border: 0;
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
        const dpmm = `${zplPreviewDpmm}dpmm`;

        const response = await fetch(`https://api.labelary.com/v1/printers/${dpmm}/labels/${width}x${height}/${0}`, {
            method: "POST",
            body: code,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'image/png'
            },
        });
        (<HTMLImageElement>this._getDomElement('image')).src = URL.createObjectURL(await response.blob());;
    }
}

customElements.define('node-projects-zpl-demo-view', ZplDemoView);
