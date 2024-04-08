import { BindingTarget, IDesignItem, IRefactorService, IRefactoring } from "@node-projects/web-component-designer";
import { Script } from "../scripting/Script.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";

export class ScriptRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): (IRefactoring & { refactor: (newValue) => void })[] {
        let refactorings: (IRefactoring & { refactor: (newValue) => void })[] = [];
        for (let d of designItems) {
            for (let a of d.attributes()) {
                if (a[0][0] == '@') {
                    let sc = a[1];
                    if (sc[0] == '{') {
                        let script = JSON.parse(sc) as Script;
                        if ('commands' in script) {
                            for (let c of script.commands) {
                                for (let p in c) {
                                    let cp = c[p];
                                    if (typeof cp === 'object') {
                                        let mp = cp as IScriptMultiplexValue;
                                        if (mp.source == 'signal') {
                                            refactorings.push({ name: mp.name, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: c.type + '/' + p, refactor: newValue => mp.name = newValue });
                                        }
                                    }
                                }
                                switch (c.type) {
                                    case 'SetSignalValue':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'ToggleSignalValue':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'IncrementSignalValue':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'DecrementSignalValue':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'SetBitInSignal':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'ClearBitInSignal':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'ToggleBitInSignal':
                                        if (c.signal)
                                            refactorings.push({ name: c.signal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).signal = newValue });
                                        break;
                                    case 'OpenScreen':
                                        if (c.screen)
                                            refactorings.push({ name: c.screen, itemType: 'screenName', target: BindingTarget.event, targetName: a[0], display: c.type + '/screen', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).screen = newValue });
                                        break;
                                    case 'OpenDialog':
                                        if (c.screen)
                                            refactorings.push({ name: c.screen, itemType: 'screenName', target: BindingTarget.event, targetName: a[0], display: c.type + '/screen', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).screen = newValue });
                                        break;
                                    case 'CalculateSignalValue':
                                        if (c.targetSignal)
                                            refactorings.push({ name: c.targetSignal, itemType: 'bindableObject', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => (<any>c).targetSignal = newValue });
                                        break;

                                }
                            }
                        } else if ('blocks' in script) {

                        }
                        if ('parameters' in script) {
                            for (let p in script.parameters) {
                                if (typeof script.parameters[p] === 'string') {
                                    refactorings.push({ name: script.parameters[p], itemType: 'parameter', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: 'parameters/' + p, refactor: newValue => script.parameters[p] = newValue });
                                }
                            }
                        }
                    }
                }
            }
        }
        return refactorings;
    }

    refactor(refactoring: (IRefactoring & { refactor: (newValue) => void }), oldValue: string, newValue: string) {
        refactoring.refactor(newValue);
        let scriptString = JSON.stringify(refactoring.sourceObject);
        refactoring.designItem.setAttribute(refactoring.targetName, scriptString);
    }
}