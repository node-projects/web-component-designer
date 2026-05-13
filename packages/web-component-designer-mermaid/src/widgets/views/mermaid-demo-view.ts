import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { IUiCommand, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";
import { IDemoView } from "@node-projects/web-component-designer/src/elements/widgets/demoView/IDemoView.js";

export class MermaidDemoView extends BaseCustomWebComponentConstructorAppend implements IDemoView {
    static override readonly template = html`<div id="preview"></div>`;

    static override readonly style = css`
        :host {
            background: white;
            display: block;
            height: 100%;
            overflow: auto;
            position: relative;
            width: 100%;
        }

        #preview {
            box-sizing: border-box;
            min-height: 100%;
            padding: 24px;
            width: 100%;
        }
    `;

    executeCommand(command: IUiCommand) {
    }

    canExecuteCommand(command: IUiCommand) {
        return false;
    }

    dispose(): void {
    }

    async display(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string) {
        const preview = this._getDomElement<HTMLDivElement>("preview");
        const mermaid = await import("mermaid");
        const id = "mermaid-preview-" + crypto.randomUUID();

        mermaid.default.initialize({ startOnLoad: false, securityLevel: "strict" });
        const result = await mermaid.default.render(id, code || "flowchart TD\n    A[Node]");
        preview.innerHTML = result.svg;
    }
}

customElements.define("node-projects-mermaid-demo-view", MermaidDemoView);
