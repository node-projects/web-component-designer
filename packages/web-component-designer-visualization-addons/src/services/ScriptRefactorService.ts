import { BindingTarget, IDesignItem, IRefactorService, IRefactoring } from "@node-projects/web-component-designer";
import { Script } from "../scripting/Script.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";

export class ScriptRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): (IRefactoring & { refactor: (newValue) => void })[] {
        const refactorings: (IRefactoring & { refactor: (newValue) => void })[] = [];
        for (let d of designItems) {
            for (let a of d.attributes()) {
                if (a[0][0] == '@') {
                    const sc = a[1];
                    if (sc[0] == '{') {
                        const script = JSON.parse(sc) as Script;
                        if ('commands' in script) {
                            for (let c of script.commands) {
                                for (let p in c) {
                                    const cp = c[p];
                                    if (cp != null && typeof cp === 'object') {
                                        let mp = cp as IScriptMultiplexValue;
                                        if (mp.source === 'signal') {
                                            refactorings.push({ name: mp.name, itemType: 'signal', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: c.type + '/' + p + '[signal]', refactor: newValue => mp.name = newValue });
                                        } else if (mp.source === 'property') {
                                            refactorings.push({ name: mp.name, itemType: 'property', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: c.type + '/' + p + '[property]', refactor: newValue => mp.name = newValue });
                                        } else if (mp.source === 'complexString') {
                                            for (let m of mp.name.matchAll(/\{(.*?)\}/g)) {
                                                let full = m[0];
                                                let nm = m[1];
                                                if (nm[0] === '?') {
                                                    let prefix = '?';
                                                    nm = nm.substring(1);
                                                    if (nm[0] === '?') {
                                                        prefix = '??';
                                                        nm = nm.substring(1);
                                                    }
                                                    refactorings.push({ name: nm, itemType: 'property', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: c.type + '/' + p + '[complexString]->property', refactor: newValue => mp.name = mp.name.replace(full, '{' + prefix + newValue + '}') });
                                                } else {
                                                    refactorings.push({ name: nm, itemType: 'signal', target: BindingTarget.event, targetName: a[0], service: this, designItem: d, type: 'script', sourceObject: script, display: c.type + '/' + p + '[complexString]->signal', refactor: newValue => mp.name = mp.name.replace(full, '{' + newValue + '}') });
                                                }
                                            }
                                        }
                                    }
                                }
                                switch (c.type) {
                                    case 'SetSignalValue':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'ToggleSignalValue':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'IncrementSignalValue':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'DecrementSignalValue':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'SetBitInSignal':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'ClearBitInSignal':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'ToggleBitInSignal':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'OpenScreen':
                                        if (c.screen && typeof c.screen === 'string')
                                            refactorings.push({ name: c.screen, itemType: 'screen', target: BindingTarget.event, targetName: a[0], display: c.type + '/screen', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.screen = newValue });
                                        break;
                                    case 'OpenDialog':
                                        if (c.screen && typeof c.screen === 'string')
                                            refactorings.push({ name: c.screen, itemType: 'screen', target: BindingTarget.event, targetName: a[0], display: c.type + '/screen', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.screen = newValue });
                                        break;
                                    case 'CalculateSignalValue':
                                        if (c.targetSignal && typeof c.targetSignal === 'string')
                                            refactorings.push({ name: c.targetSignal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/targetSignal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.targetSignal = newValue });
                                        break;
                                    case 'SubscribeSignal':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'UnsubscribeSignal':
                                        if (c.signal && typeof c.signal === 'string')
                                            refactorings.push({ name: c.signal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/signal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.signal = newValue });
                                        break;
                                    case 'ShowMessageBox':
                                        if (c.resultSignal && typeof c.resultSignal === 'string')
                                            refactorings.push({ name: c.resultSignal, itemType: 'signal', target: BindingTarget.event, targetName: a[0], display: c.type + '/resultSignal', service: this, designItem: d, type: 'script', sourceObject: script, refactor: newValue => c.resultSignal = newValue });
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