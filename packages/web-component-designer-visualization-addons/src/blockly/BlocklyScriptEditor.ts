import { BaseCustomWebComponentConstructorAppend, html, css } from '@node-projects/base-custom-webcomponent';
//import Blockly from 'blockly';

export class BlocklyScriptEditor extends BaseCustomWebComponentConstructorAppend {

    static override readonly template = html`
        <div id="blocklyDiv" style="position: absolute; width: 100%; height: 100%;"></div>
    `;

    static override readonly style = css`
        :host {
            box-sizing: border-box;
            position: absolute;
            height: 100%;
            width: 100%;
            display: block;
        }`;

    static readonly is = 'node-projects-blockly-script-editor';

    blocklyDiv: HTMLDivElement;
    workspace: any;
    resizeObserver: ResizeObserver;
    private _toolbox: any;

    constructor(toolbox: any) {
        super();
        super._restoreCachedInititalValues();

        this._toolbox = toolbox;
        this.blocklyDiv = this._getDomElement<HTMLDivElement>('blocklyDiv');

        this._assignEvents();
        this.createBlockly();
    }

    createBlockly() {
        const renderer = 'zelos';
        const themename = 'webui';

        //@ts-ignore
        const theme = Blockly.Theme.defineTheme(themename, {
            //@ts-ignore
            'base': Blockly.Themes.Zelos,
            'blockStyles': {
                "hat_blocks": {
                    "colourPrimary": "#4a148c"
                }
            },
            'categoryStyles': {
                'start_category': {
                    colour: '#4a148c'
                },
                'system_category': {
                    colour: '#01579b',
                }
            },
        });

        //@ts-ignore
        this.workspace = Blockly.inject(this.blocklyDiv, {
            theme: theme,
            toolbox: this._toolbox,
            renderer: renderer,
            trashcan: true,
            zoom: {
                controls: true,
                wheel: false,
                startScale: 0.7,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2,
                pinch: false
            },
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            },
            maxInstances: { 'start_event': 1 },
        });

        //@ts-ignore
        const zoomToFit = new ZoomToFitControl(this.workspace);
        zoomToFit.init();
    }

    ready() {
        //@ts-ignore
        Blockly.svgResize(this.workspace);

        this.resizeObserver = new ResizeObserver((entries) => {
            //@ts-ignore
            Blockly.svgResize(this.workspace)
        });
        this.resizeObserver.observe(this);
    }

    public save(): any {
        //@ts-ignore
        const state = Blockly.serialization.workspaces.save(this.workspace);
        return state;
    }

    public load(data: any) {
        //@ts-ignore
        Blockly.serialization.workspaces.load(data, this.workspace);
    }
}
customElements.define(BlocklyScriptEditor.is, BlocklyScriptEditor);
