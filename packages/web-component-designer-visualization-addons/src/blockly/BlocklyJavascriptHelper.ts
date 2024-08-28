//import Blockly from 'blockly';
import { VisualizationHandler } from '../interfaces/VisualizationHandler.js';
import './components/components.js';

//TODO: remove imports, only leave Runtime
const prefix = `function extractPart(obj, propertyPath) {
    let retVal = obj;
    for (let p of propertyPath.split('.')) {
        retVal = retVal?.[p];
    }
    return retVal;
}

function delay(ms) {
    return new Promise(res => {
        setTimeout(() => res(), ms);
    });
}

export async function run(eventData, shadowRoot, parameters, relativeSignalsPath, visualizationHandler, context) {
`;
const postfix = `}`;

export async function generateEventCodeFromBlockly(data: any): Promise<(event: Event, shadowRoot: ShadowRoot, parameters: Record<string, any>, relativeSignalsPath: string, visualizationHandler: VisualizationHandler, context: any) => void> {
    //@ts-ignore
    const workspace = new Blockly.Workspace();
    //@ts-ignore
    Blockly.serialization.workspaces.load(data, workspace);
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('eventData');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('shadowRoot');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('extractPart');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('parameters');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('relativeSignalsPath');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('delay');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('visualizationHandler');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('context');
    //@ts-ignore
    let code = Blockly.JavaScript.workspaceToCode(workspace);
    const scriptUrl = URL.createObjectURL(new Blob([prefix + code + postfix], { type: 'application/javascript' }));
    const scripObj = await import(scriptUrl);
    return scripObj.run;
}