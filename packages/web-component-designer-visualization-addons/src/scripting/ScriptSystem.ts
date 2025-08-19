import { sleep } from "@node-projects/web-component-designer/dist/elements/helper/Helper.js";
import { generateEventCodeFromBlockly } from "../blockly/BlocklyJavascriptHelper.js";
import { parseBindingString } from "../helpers/BindingsHelper.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";
import { VisualisationElementScript } from "../interfaces/VisualisationElementScript.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { Script } from "./Script.js";
import { ScriptCommands, signalTarget } from "./ScriptCommands.js";
import Long from 'long'
import { ScriptUpgrades } from "./ScriptUpgrader.js";

export type contextType = { event: Event, element: Element, root: HTMLElement, parameters?: Record<string, any>, relativeSignalsPath?: string };

export class ScriptSystem {

  _visualizationHandler: VisualizationHandler;
  _subscriptionCallback = () => { };

  constructor(visualizationHandler: VisualizationHandler) {
    this._visualizationHandler = visualizationHandler;
  }

  async execute(scriptCommands: ScriptCommands[], outerContext: contextType) {
    for (let i = 0; i < scriptCommands.length; i++) {
      let c = scriptCommands[i];
      if (c.type == "Exit") {
        break;
      } else if (c.type == "Goto") {
        const label = await this.getValue(c.label, outerContext);
        i = scriptCommands.findIndex(x => x.type == "Label" && x.label == label);
        if (i < 0)
          break;
      } else if (c.type == "Condition") {
        const value1 = await this.getValue(c.value1, outerContext);
        const value2 = await this.getValue(c.value2, outerContext);
        const comparisonType = await this.getValue(c.comparisonType, outerContext);
        let res = false;
        switch (comparisonType) {
          case '==null': res = value1 == null; break;
          case '!=null': res = value1 != null; break;
          case '==true': res = value1 == true; break;
          case '==false': res = value1 == false; break;
          case '==': res = value1 == value2; break;
          case '!=': res = value1 != value2; break;
          case '>': res = value1 > value2; break;
          case '<': res = value1 < value2; break;
          case '>=': res = value1 >= value2; break;
          case '<=': res = value1 <= value2; break;
        }
        if (res) {
          await this.runExternalScript(await this.getValue(c.trueScriptName, outerContext), await this.getValue(c.trueScriptType, outerContext));
          const trueGotoLabel = await this.getValue(c.trueGotoLabel, outerContext);
          if (trueGotoLabel) {
            i = scriptCommands.findIndex(x => x.type == "Label" && x.label == trueGotoLabel);
            if (i < 0)
              break;
          }
        } else {
          await this.runExternalScript(await this.getValue(c.falseScriptName, outerContext), await this.getValue(c.falseScriptType, outerContext));
          const falseGotoLabel = await this.getValue(c.falseGotoLabel, outerContext);
          if (falseGotoLabel) {
            i = scriptCommands.findIndex(x => x.type == "Label" && x.label == falseGotoLabel);
            if (i < 0)
              break;
          }
        }
      } else
        await this.runScriptCommand(c, outerContext);
    }
  }

  async getValueFromTarget(target: signalTarget, name: string, context: contextType) {
    if (target === 'property') {
      return (<any>context).root[name];
    } else if (target === 'elementProperty') {
      return (<any>context).element[name];
    } else {
      return (await this._visualizationHandler.getState(this.getSignalName(name, context)))?.val;
    }
  }

  async setValueOnTarget(target: signalTarget, name: string, context: contextType, value: any) {
    if (target === 'property') {
      (<any>context).root[name] = value;
    } else if (target === 'elementProperty') {
      (<any>context).element[name] = value;
    } else {
      await this._visualizationHandler.setState(this.getSignalName(name, context), value);
    }
  }

  async runExternalScript(name: string, type: string) {
    //TODO...
  }

  async runScriptCommand<T extends ScriptCommands>(command: T, context: contextType) {
    switch (command.type) {

      case 'Comment':
      case 'Label':
      case 'Condition':
      case 'Goto':
      case 'Exit':
        {
          //Do nothing on this commands
          break;
        }

      case 'OpenUrl': {
        window.open(await this.getValue(command.url, context), command.target);
        break;
      }

      case 'Delay': {
        const value = await this.getValue(command.value ?? 500, context);
        await sleep(value)
        break;
      }

      case 'Console': {
        const target = await this.getValue(command.target ?? 'log', context);
        const message = await this.getValue(command.message, context);
        console[target](message);
        break;
      }

      case 'ToggleSignalValue': {
        const signal = await this.getValue(command.signal, context);
        const target = await this.getValue(command.target, context);
        let state = await this.getValueFromTarget(target, signal, context);
        await this._visualizationHandler.setState(this.getSignalName(signal, context), !state);
        break;
      }
      case 'SetSignalValue': {
        const signal = await this.getValue(command.signal, context);
        const target = await this.getValue(command.target, context);
        await this.setValueOnTarget(target, signal, context, await this.getValue(command.value, context));
        break;
      }
      case 'IncrementSignalValue': {
        const signal = await this.getValue(command.signal, context);
        const target = await this.getValue(command.target, context);
        let state = <number>await this.getValueFromTarget(target, signal, context);
        const val = <number>state + await this.getValue(command.value, context);
        await this.setValueOnTarget(target, signal, context, val);
        break;
      }
      case 'DecrementSignalValue': {
        const signal = await this.getValue(command.signal, context);
        const target = await this.getValue(command.target, context);
        let state = <number>await this.getValueFromTarget(target, signal, context);
        const val = <number>state - await this.getValue(command.value, context);
        await this.setValueOnTarget(target, signal, context, val);
        break;
      }
      case 'CalculateSignalValue': {
        const formula = await this.getValue(command.formula, context);
        const target = await this.getValue(command.target, context);
        const targetSignal = await this.getValue(command.targetSignal, context);
        let nm = await this.parseStringWithValues(formula, context);
        let result = eval(nm);
        await this.setValueOnTarget(target, targetSignal, context, result);
        break;
      }

      case 'SetBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        const bitNumber = await this.getValue(command.bitNumber ?? 0, context);
        const target = await this.getValue(command.target, context);
        let state = <number>await this.getValueFromTarget(target, signal, context);
        let mask = Long.fromNumber(1).shiftLeft(bitNumber);
        const newVal = Long.fromNumber(<number>state).or(mask).toNumber();
        await this.setValueOnTarget(target, signal, context, newVal);
        break;
      }
      case 'ClearBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        const bitNumber = await this.getValue(command.bitNumber ?? 0, context);
        const target = await this.getValue(command.target, context);
        let state = <number>await this.getValueFromTarget(target, signal, context);
        let mask = Long.fromNumber(1).shiftLeft(bitNumber);
        mask.negate();
        const newVal = Long.fromNumber(<number>state).and(mask).toNumber();
        await this.setValueOnTarget(target, signal, context, newVal);
        break;
      }
      case 'ToggleBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        const bitNumber = await this.getValue(command.bitNumber ?? 0, context);
        const target = await this.getValue(command.target, context);
        let state = <number>await this.getValueFromTarget(target, signal, context);
        let mask = Long.fromNumber(1).shiftLeft(bitNumber);
        const newVal = Long.fromNumber(<number>state).xor(mask).toNumber();
        await this.setValueOnTarget(target, signal, context, newVal);
        break;
      }

      case 'Javascript': {
        const script = await this.getValue(command.script, context);
        let mycontext: { event: Event, element: Element } = context;
        (<any>mycontext).shadowRoot = (<ShadowRoot>context.element.getRootNode());
        (<any>mycontext).instance = (<any>context).shadowRoot.host;
        if (!(<any>command).compiledScript)
          (<any>command).compiledScript = new Function('context', script);
        (<any>command).compiledScript(mycontext);
        break;
      }

      case 'SetElementProperty': {
        //@ts-ignore
        command = ScriptUpgrades.upgradeSetElementProperty(command);
        let name = await this.getValue(command.name, context);
        if (name === '')
          name = null;
        const value = await this.getValue(command.value, context);
        const parentIndex = await this.getValue(command.parentIndex ?? 0, context);
        const target = await this.getValue(command.target ?? 'property', context);
        const targetSelectorTarget = await this.getValue(command.targetSelectorTarget ?? 'container', context);
        const targetSelector = await this.getValue(command.targetSelector, context);
        const mode = await this.getValue(command.mode ?? 'toggle', context);
        let elements = this.getTargetFromTargetSelector(context, <any>targetSelectorTarget, parentIndex, targetSelector);
        for (let e of elements) {
          if (target == 'attribute') {
            e.setAttribute(name, value);
          } else if (target == 'property') {
            e[name] = value;
          } else if (target == 'css') {
            (<HTMLElement>e).style[name] = value;
          } else if (target == 'class') {
            if (mode === 'toggle') {
              (<HTMLElement>e).classList.toggle(name ?? value);
            } else if (mode === 'remove') {
              (<HTMLElement>e).classList.remove(name ?? value);
            } else {
              (<HTMLElement>e).classList.add(name ?? value);
            }
          }
        }
        break;
      }

      case 'SubscribeSignal': {
        const signal = await this.getValue(command.signal, context);
        const oneTime = await this.getValue(command.oneTime, context);
        if (oneTime) {
          let cb = () => {
            this._visualizationHandler.unsubscribeState(signal, cb, null);
          }
          this._visualizationHandler.subscribeState(signal, cb);
        }
        else
          this._visualizationHandler.subscribeState(signal, this._subscriptionCallback);
        break;
      }

      case 'UnsubscribeSignal': {
        const signal = await this.getValue(command.signal, context);
        this._visualizationHandler.unsubscribeState(signal, this._subscriptionCallback, null);
        break;
      }

      case 'WriteSignalsInGroup': {
        const group = await this.getValue(command.group, context);
        this._visualizationHandler.writeSignalsInGroup(group);
        break;
      }

      case 'ClearSignalsInGroup': {
        const group = await this.getValue(command.group, context);
        this._visualizationHandler.clearSignalsInGroup(group);
        break;
      }

      case 'RunScript': {
        const name = await this.getValue(command.name, context);
        const scriptType = await this.getValue(command.scriptType, context);
        this.runExternalScript(name, scriptType);
        break;
      }

      case 'ShowMessageBox': {
        let res = null;
        const buttons = await this.getValue(command.buttons, context);
        if (buttons == 'ok') {
          const message = await this.getValue(command.message, context);
          alert(message);
          res = 1;
        } else if (buttons == 'yesNo') {
          const message = await this.getValue(command.message, context);
          if (confirm(message))
            res = 1;
          else res = 2;
        }
        const resultSignal = await this.getValue(command.resultSignal, context);
        if (resultSignal) {
          this._visualizationHandler.setState(resultSignal, res);
        }
        break;
      }

      case 'Login':
      case 'Logout':
      case 'CloseDialog':
      case 'OpenDialog':
      case 'OpenScreen':
      case 'SwitchLanguage':
      case 'CopySignalValuesFromFolder':
      case 'ExportSignalValuesAsJson':
      case 'ImportSignalValuesFromJson': {
        alert('command: "' + command.type + '" is not yet implemented');
        break;
      }
    }
  }

  getTarget(context: contextType, targetSelectorTarget: 'element' | 'container', parentLevel: number) {
    if (targetSelectorTarget === 'container') {
      let el = (<ShadowRoot>context.element.getRootNode()).host
      for (let i = 0; i < (parentLevel ?? 0); i++)
        el = (<ShadowRoot>el.getRootNode()).host;
      return el;
    } else if (targetSelectorTarget === "element") {
      let el = context.element;
      for (let i = 0; i < (parentLevel ?? 0); i++)
        el = el.parentElement;
      return el;
    }
    return null;
  }

  getTargetFromTargetSelector(context: contextType, targetSelectorTarget: 'element' | 'container', parentLevel: number, targetSelector: string): Iterable<Element> {
    const target = this.getTarget(context, targetSelectorTarget, parentLevel);
    let elements: Iterable<Element> = [target];
    if (targetSelector) {
      if (targetSelectorTarget === 'container')
        elements = target.shadowRoot.querySelectorAll(targetSelector);
      else
        elements = target.querySelectorAll(targetSelector);
    }
    return elements;
  }

  async getValue<T>(value: T, outerContext: contextType): Promise<T> {
    if (value == null)
      return null;
    if (typeof value === 'object') {
      switch ((<IScriptMultiplexValue><any>value).source) {
        case 'property': {
          return outerContext.root[(<IScriptMultiplexValue><any>value).name];
        }
        case 'signal': {
          let sng = await this._visualizationHandler.getState(this.getSignalName((<IScriptMultiplexValue><any>value).name, outerContext));
          return <T>sng.val;
        }
        case 'event': {
          let obj = outerContext.event;
          if ((<IScriptMultiplexValue><any>value).name)
            obj = ScriptSystem.extractPart(obj, (<IScriptMultiplexValue><any>value).name);
          return <T>obj;
        }
        case 'parameter': {
          return outerContext.parameters[(<IScriptMultiplexValue><any>value).name];
        }
        case 'context': {
          const obj = ScriptSystem.extractPart(outerContext, (<IScriptMultiplexValue><any>value).name);
          return obj;
        }
        case 'complexString': {
          let text = (<IScriptMultiplexValue><any>value).name;
          if (text != null) {
            return <T>await this.parseStringWithValues(text, outerContext);
          }
          return null;
        }

        case 'complexSignal': {
          let text = (<IScriptMultiplexValue><any>value).name;
          if (text != null) {
            const signal = await this.parseStringWithValues(text, outerContext);
            const state = await this._visualizationHandler.getState(this.getSignalName(signal, outerContext));
            return <T>state.val;
          }
          return null;
        }

        case 'expression': {
          //@ts-ignore
          var ctx = outerContext;
          return eval((<any>value).name);
        }
      }
    }
    return value;
  }

  async getStateOrFieldOrParameter(name: string, context: contextType) {
    //use same shortcuts as in bindings. $ = signals object, § = access context
    if (name[0] === '§') {
      //@ts-ignore
      var ctx = context;
      return eval('ctx.' + name.substring(1));
    } else if (name[0] === '?' && name[1] === '??') {
      return context.root[name.substring(2)];
    } else if (name[0] === '?') {
      return await this._visualizationHandler.getState(this.getSignalName(context.root[name.substring(2)], context));
    }
    return await this._visualizationHandler.getState(this.getSignalName(name, context));
  }

  async parseStringWithValues(text: string, context: contextType) {
    const parsed = parseBindingString(text);
    let results = await Promise.all(parsed.signals.map(x => this.getStateOrFieldOrParameter(this.getSignalName(x, context), context)));
    let nm = parsed.parts[0];
    for (let i = 0; i < parsed.parts.length - 1; i++) {
      let v = results[i];
      if (typeof v === 'object')
        v = v.val;
      if (v == null)
        v = '';
      nm += v + parsed.parts[i + 1];
    }
    return nm;
  }

  getSignalName(name: string, outerContext: contextType) {
    if (name[0] === '.')
      return outerContext.relativeSignalsPath + name;
    return name;
  }

  static extractPart(obj: any, propertyPath: string) {
    let retVal = obj;
    for (let p of propertyPath.split('.')) {
      retVal = retVal?.[p];
    }
    return retVal;
  }

  public createScriptContext(root: HTMLElement, event: Event, element: Element, parameters: Record<string, any>, relativeSignalsPath: string): any {
    return { root, event, element, parameters, relativeSignalsPath };
  }

  async assignAllScripts(source: string, javascriptCode: string, shadowRoot: ShadowRoot, instance: HTMLElement, visualizationHandler: VisualizationHandler, contextCreator?: (root: HTMLElement, event: Event, element: Element, parameters: Record<string, any>, relativeSignalsPath: string) => any, assignExternalScript?: (element: Element, event: string, scriptData: any) => void, runInitalization?: (jsObject: VisualisationElementScript) => void): Promise<VisualisationElementScript> {
    const allElements = shadowRoot.querySelectorAll('*');
    contextCreator ??= this.createScriptContext;
    let jsObject: VisualisationElementScript = null;
    if (javascriptCode) {
      try {
        const scriptUrl = URL.createObjectURL(new Blob([javascriptCode], { type: 'application/javascript' }));
        jsObject = await import(scriptUrl);
        if (runInitalization)
          runInitalization(jsObject);
        else {
          if (jsObject.init) {
            jsObject.init(instance, shadowRoot);
          }
        }
      } catch (err) {
        console.error('error parsing javascript - ' + source, err)
      }
    }
    for (let e of allElements) {
      for (let a of e.attributes) {
        if (a.name[0] == '@') {
          try {
            let evtName = a.name.substring(1);
            let script = a.value.trim();
            if (script[0] == '{') {
              let scriptObj: Script = JSON.parse(script);
              if ('commands' in scriptObj) {
                e.addEventListener(evtName, (evt) => this.execute(scriptObj.commands, contextCreator(instance, evt, e, scriptObj.parameters, scriptObj.relativeSignalsPath)));
              } else if ('blocks' in scriptObj) {
                let compiledFunc: Awaited<ReturnType<typeof generateEventCodeFromBlockly>> = null;
                e.addEventListener(evtName, async (evt) => {
                  if (!compiledFunc)
                    compiledFunc = await generateEventCodeFromBlockly(scriptObj);
                  compiledFunc(evt, shadowRoot, (<{ parameters: any }>scriptObj).parameters, (<{ relativeSignalsPath: string }>scriptObj).relativeSignalsPath ?? '', visualizationHandler, contextCreator(instance, evt, e, (<any>scriptObj).parameters, (<any>scriptObj).relativeSignalsPath));
                });
              } else {
                if (assignExternalScript)
                  assignExternalScript(e, evtName, scriptObj);
                else {
                  if ('name' in scriptObj) {
                    //@ts-ignore
                    const nm = scriptObj.name;
                    e.addEventListener(evtName, (evt) => {
                      if (!jsObject[nm])
                        console.warn('javascript function named: ' + nm + ' not found, maybe missing a "export" ?');
                      else
                        jsObject[nm](evt, e, shadowRoot, instance, (<{ parameters: any }>scriptObj).parameters);
                    });
                  }
                }
              }
            } else {
              e.addEventListener(evtName, (evt) => {
                if (!jsObject[script])
                  console.warn('javascript function named: ' + script + ' not found, maybe missing a "export" ?');
                else
                  jsObject[script](evt, e, shadowRoot, instance);
              });
            }
          }
          catch (err) {
            console.warn('error assigning script', e, a);
          }
        }
      }
    }

    return jsObject;
  }
}