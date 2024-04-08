import { ScriptCommands } from "./ScriptCommands.js";

export class Script {
    name?: string;
    relativeSignalsPath?: string;
    commands: ScriptCommands[];
    parameters?: Record<string, any>;
}