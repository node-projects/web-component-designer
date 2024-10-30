import { ScriptCommands, SetElementProperty } from "./ScriptCommands";

//For upgradeing changed script commands
export class ScriptUpgrades {
    static upgradeScriptCommand(scriptCommand: ScriptCommands) {
        if (scriptCommand.type === 'SetElementProperty') {
            return ScriptUpgrades.upgradeSetElementProperty(scriptCommand);
        }
        return scriptCommand;
    }

    static upgradeSetElementProperty(scriptCommand: SetElementProperty): SetElementProperty {
        if (<string>scriptCommand.targetSelectorTarget === 'currentScreen') {
            scriptCommand.targetSelector = 'container';
        } else if (<string>scriptCommand.targetSelectorTarget === 'parentScreen') {
            scriptCommand.targetSelector = 'container';
            scriptCommand.parentIndex = 1;
        } else if (<string>scriptCommand.targetSelectorTarget === 'currentElement') {
            scriptCommand.targetSelector = 'element';
        } else if (<string>scriptCommand.targetSelectorTarget === 'parentElement') {
            scriptCommand.targetSelector = 'element';
            scriptCommand.parentIndex = 1;
        }
        return scriptCommand;
    }
}