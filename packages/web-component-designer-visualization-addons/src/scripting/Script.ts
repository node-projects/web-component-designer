import { ScriptCommands } from "./ScriptCommands";

export class Script {
    name?: string;
    commands: ScriptCommands[];
    parameters?: Record<string, any>;
}