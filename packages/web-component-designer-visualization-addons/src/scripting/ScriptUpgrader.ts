import { ScriptCommands, SetElementProperty } from "./ScriptCommands";

//For upgradeing changed script commands
export class ScriptUpgrades {
    static upgradeScriptCommand(scriptCommand: ScriptCommands) {
        if (scriptCommand.type === 'SetElementProperty') {
            return ScriptUpgrades.upgradeSetElementProperty(scriptCommand);
        }
        if (scriptCommand.type === 'If') {
            scriptCommand.trueCommands = (scriptCommand.trueCommands ?? []).map(c => ScriptUpgrades.upgradeScriptCommand(c));
            scriptCommand.elseCommands = (scriptCommand.elseCommands ?? []).map(c => ScriptUpgrades.upgradeScriptCommand(c));
        }
        return scriptCommand;
    }

    static upgradeSetElementProperty(scriptCommand: SetElementProperty): SetElementProperty {
        if (<string>scriptCommand.targetSelectorTarget === 'currentScreen') {
            scriptCommand.targetSelectorTarget = 'container';
        } else if (<string>scriptCommand.targetSelectorTarget === 'parentScreen') {
            scriptCommand.targetSelectorTarget = 'container';
            scriptCommand.parentIndex = 1;
        } else if (<string>scriptCommand.targetSelectorTarget === 'currentElement') {
            scriptCommand.targetSelectorTarget = 'element';
        } else if (<string>scriptCommand.targetSelectorTarget === 'parentElement') {
            scriptCommand.targetSelectorTarget = 'element';
            scriptCommand.parentIndex = 1;
        }
        return scriptCommand;
    }
}