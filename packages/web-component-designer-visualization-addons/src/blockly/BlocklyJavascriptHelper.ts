//import Blockly from 'blockly';
import './components/components.js';

//TODO: remove imports, only leave Runtime
const prefix = `function extractPart(obj, propertyPath) {
    let retVal = obj;
    for (let p of propertyPath.split('.')) {
        retVal = retVal?.[p];
    }
    return retVal;
}

export async function run(eventData, shadowRoot, parameters) {
`;
const postfix = `}`;

export async function generateEventCodeFromBlockly(data: any): Promise<(event: Event, shadowRoot: ShadowRoot, parameters: Record<string, any>) => void> {
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
    Blockly.JavaScript.addReservedWords('IOB');
    //@ts-ignore
    Blockly.JavaScript.addReservedWords('RUNTIME');
    //@ts-ignore
    let code = Blockly.JavaScript.workspaceToCode(workspace);
    const scriptUrl = URL.createObjectURL(new Blob([prefix + code + postfix], { type: 'application/javascript' }));
    const scripObj = await import(scriptUrl);
    return scripObj.run;
}