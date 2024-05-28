import { sleep } from "@node-projects/web-component-designer/dist/elements/helper/Helper.js";
import { generateEventCodeFromBlockly } from "../blockly/BlocklyJavascriptHelper.js";
import { parseBindingString } from "../helpers/BindingsHelper.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";
import { VisualisationElementScript } from "../interfaces/VisualisationElementScript.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { Script } from "./Script.js";
import { ScriptCommands } from "./ScriptCommands.js";
import Long from 'long'

export type contextType = { event: Event, element: Element, root: HTMLElement, parameters?: Record<string, any>, relativeSignalsPath?: string };

export class ScriptSystem {

  _visualizationHandler: VisualizationHandler;

  constructor(visualizationHandler: VisualizationHandler) {
    this._visualizationHandler = visualizationHandler;
  }

  async execute(scriptCommands: ScriptCommands[], outerContext: contextType) {
    for (let c of scriptCommands) {
      this.runScriptCommand(c, outerContext);
    }
  }

  async runScriptCommand<T extends ScriptCommands>(command: T, context: contextType) {
    switch (command.type) {

      case 'OpenUrl': {
        window.open(await this.getValue(command.url, context), command.target);
        break;
      }

      case 'Delay': {
        const value = await this.getValue(command.value, context);
        await sleep(value)
        break;
      }

      case 'Console': {
        const target = await this.getValue(command.target, context);
        const message = await this.getValue(command.message, context);
        console[target](message);
        break;
      }

      case 'ToggleSignalValue': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(this.getSignaName(signal, context));
        await this._visualizationHandler.setState(this.getSignaName(signal, context), !state?.val);
        break;
      }
      case 'SetSignalValue': {
        const signal = await this.getValue(command.signal, context);
        await this._visualizationHandler.setState(this.getSignaName(signal, context), await this.getValue(command.value, context));
        break;
      }
      case 'IncrementSignalValue': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(this.getSignaName(signal, context));
        await this._visualizationHandler.setState(this.getSignaName(signal, context), state.val + await this.getValue(command.value, context));
        break;
      }
      case 'DecrementSignalValue': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(this.getSignaName(signal, context));
        await this._visualizationHandler.setState(this.getSignaName(signal, context), <any>state.val - await this.getValue(command.value, context));
        break;
      }
      case 'CalculateSignalValue': {
        const formula = await this.getValue(command.formula, context);
        const targetSignal = await this.getValue(command.targetSignal, context);
        let nm = await this.parseStringWithValues(formula, context);
        let result = eval(nm);
        await this._visualizationHandler.setState(this.getSignaName(targetSignal, context), result);
        break;
      }

      case 'SetBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(this.getSignaName(signal, context));
        let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
        const newVal = Long.fromNumber(<number>state.val).or(mask).toNumber();
        await this._visualizationHandler.setState(this.getSignaName(signal, context), newVal);
        break;
      }
      case 'ClearBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(this.getSignaName(signal, context));
        let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
        mask.negate();
        const newVal = Long.fromNumber(<number>state.val).and(mask).toNumber();
        await this._visualizationHandler.setState(this.getSignaName(signal, context), newVal);
        break;
      }
      case 'ToggleBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(this.getSignaName(signal, context));
        let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
        const newVal = Long.fromNumber(<number>state.val).xor(mask).toNumber();
        await this._visualizationHandler.setState(this.getSignaName(signal, context), newVal);
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
        const name = await this.getValue(command.name, context);
        const value = await this.getValue(command.value, context);
        let elements = this.getTargetFromTargetSelector(context, command.targetSelectorTarget, command.targetSelector);
        for (let e of elements) {
          if (command.target == 'attribute') {
            e.setAttribute(name, value);
          } else if (command.target == 'property') {
            e[name] = value;
          } else if (command.target == 'css') {
            (<HTMLElement>e).style[name] = value;
          }
        }
        break;
      }
    }
  }

  getTargetFromTargetSelector(context: contextType, targetSelectorTarget: 'currentScreen' | 'parentScreen' | 'currentElement' | 'parentElement', targetSelector: string): Iterable<Element> {
    let host = (<ShadowRoot>context.element.getRootNode()).host;
    if (targetSelector == 'currentElement')
      host = context.element;
    else if (targetSelector == 'parentElement')
      host = context.element.parentElement;
    else if (targetSelector == 'parentScreen')
      host = (<ShadowRoot>host.getRootNode()).host;
    let elements: Iterable<Element> = [host];
    if (targetSelector)
      elements = host.shadowRoot.querySelectorAll(targetSelector);
    return elements;
  }

  async getValue<T>(value: string | number | boolean | IScriptMultiplexValue, outerContext: contextType): Promise<any> {
    if (typeof value === 'object') {
      switch ((<IScriptMultiplexValue>value).source) {
        case 'property': {
          return outerContext.root[(<IScriptMultiplexValue>value).name];
        }
        case 'signal': {
          let sng = await this._visualizationHandler.getState(this.getSignaName((<IScriptMultiplexValue>value).name, outerContext));
          return sng.val;
        }
        case 'event': {
          let obj = outerContext.event;
          if ((<IScriptMultiplexValue>value).name)
            obj = ScriptSystem.extractPart(obj, (<IScriptMultiplexValue>value).name);
          return obj;
        }
        case 'parameter': {
          return outerContext.parameters[(<IScriptMultiplexValue>value).name];
        }

        case 'complexString': {
          let text = (<IScriptMultiplexValue>value).name;
          if (text != null) {
            return await this.parseStringWithValues(text, outerContext);
          }
          return null;
        }

        case 'complexSignal': {
          let text = (<IScriptMultiplexValue>value).name;
          if (text != null) {
            const signal = await this.parseStringWithValues(text, outerContext);
            return await this._visualizationHandler.getState(this.getSignaName(signal, outerContext));
          }
          return null;
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
      return eval('ctx.' + name.substring(1))
    }
    return await this._visualizationHandler.getState(this.getSignaName(name, context));
  }

  async parseStringWithValues(text: string, context: contextType) {
    const parsed = parseBindingString(text);
    let results = await Promise.all(parsed.signals.map(x => this.getStateOrFieldOrParameter(this.getSignaName(x, context), context)));
    let nm = '';
    for (let i = 0; i < parsed.parts.length - 1; i++) {
      let v = results[i].val;
      if (v == null)
        v = '';
      nm += v + parsed.parts[i + 1];
    }
    return nm;
  }

  getSignaName(name: string, outerContext: contextType) {
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

  async assignAllScripts(source: string, javascriptCode: string, shadowRoot: ShadowRoot, instance: HTMLElement, assignExternalScript?: (element: Element, event: string, scriptData: any) => void): Promise<VisualisationElementScript> {
    const allElements = shadowRoot.querySelectorAll('*');
    let jsObject: VisualisationElementScript = null;
    if (javascriptCode) {
      try {
        const scriptUrl = URL.createObjectURL(new Blob([javascriptCode], { type: 'application/javascript' }));
        jsObject = await import(scriptUrl);
        if (jsObject.init) {
          jsObject.init(instance);
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
                e.addEventListener(evtName, (evt) => this.execute(scriptObj.commands, { event: evt, element: e, root: instance, parameters: scriptObj.parameters, relativeSignalsPath: scriptObj.relativeSignalsPath }));
              } else if ('blocks' in scriptObj) {
                let compiledFunc: Awaited<ReturnType<typeof generateEventCodeFromBlockly>> = null;
                e.addEventListener(evtName, async (evt) => {
                  if (!compiledFunc)
                    compiledFunc = await generateEventCodeFromBlockly(scriptObj);
                  compiledFunc(evt, shadowRoot, (<{ parameters: any }>scriptObj).parameters, (<{ relativeSignalsPath: string }>scriptObj).relativeSignalsPath ?? '');
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