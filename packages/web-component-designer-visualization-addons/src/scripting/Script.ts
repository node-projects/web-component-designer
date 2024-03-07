import { ScriptCommands } from "./ScriptCommands.js";

export class Script {
    name?: string;
    commands: ScriptCommands[];
    parameters?: Record<string, any>;
}