import { sleep } from "@node-projects/web-component-designer";
import { generateEventCodeFromBlockly } from "../blockly/BlocklyJavascriptHelper.js";
import { parseBindingString } from "../helpers/BindingsHelper.js";
import { IScriptMultiplexValue } from "../interfaces/IScriptMultiplexValue.js";
import { VisualisationElementScript } from "../interfaces/VisualisationElementScript.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { Script } from "./Script.js";
import { ScriptCommands } from "./ScriptCommands.js";

import Long from 'long'
import { VisualizationUiHandler } from "../interfaces/VisualizationUiHandler.js";


export class ScriptSystem {

  _visualizationHandler: VisualizationHandler;
  _visualizationUiHandler: VisualizationUiHandler;

  constructor(visualizationHandler: VisualizationHandler, visualizationUiHandler: VisualizationUiHandler) {
    this._visualizationHandler = visualizationHandler;
  }

  async execute(scriptCommands: ScriptCommands[], outerContext: { event: Event, element: Element, root: HTMLElement }) {
    for (let c of scriptCommands) {
      this.runScriptCommand(c, outerContext);
    }
  }

  async runScriptCommand<T extends ScriptCommands>(command: T, context) {
    switch (command.type) {
      case 'CloseDialog': {
        //const dialogdId = await this.getValue(c.dialogId, outerContext);                
        this._visualizationUiHandler.closeDialog(<HTMLElement>context.element);
        break;
      }

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

      case 'SwitchLanguage': {
        const language = await this.getValue(command.language, context);
        this._visualizationUiHandler.switchLanguage(language);
        break;
      }

      case 'ToggleSignalValue': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(signal);
        await this._visualizationHandler.setState(signal, !state?.value);
        break;
      }
      case 'SetSignalValue': {
        const signal = await this.getValue(command.signal, context);
        await this._visualizationHandler.setState(signal, await this.getValue(command.value, context));
        break;
      }
      case 'IncrementSignalValue': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(signal);
        await this._visualizationHandler.setState(signal, state.value + await this.getValue(command.value, context));
        break;
      }
      case 'DecrementSignalValue': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(signal);
        await this._visualizationHandler.setState(signal, <any>state.value - await this.getValue(command.value, context));
        break;
      }
      case 'CalculateSignalValue': {
        const formula = await this.getValue(command.formula, context);
        const targetSignal = await this.getValue(command.targetSignal, context);
        let parsed = parseBindingString(formula);
        let results = await Promise.all(parsed.signals.map(x => this._visualizationHandler.getState(x)));
        let nm = '';
        for (let i = 0; i < parsed.parts.length - 1; i++) {
          let v = results[i].value;
          if (v == null)
            return;
          nm += v + parsed.parts[i + 1];
        }
        let result = eval(nm);
        await this._visualizationHandler.setState(targetSignal, result);
        break;
      }

      case 'SetBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(signal);
        let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
        const newVal = Long.fromNumber(<number>state.value).or(mask).toNumber();
        await this._visualizationHandler.setState(signal, newVal);
        break;
      }
      case 'ClearBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(signal);
        let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
        mask.negate();
        const newVal = Long.fromNumber(<number>state.value).and(mask).toNumber();
        await this._visualizationHandler.setState(signal, newVal);
        break;
      }
      case 'ToggleBitInSignal': {
        const signal = await this.getValue(command.signal, context);
        let state = await this._visualizationHandler.getState(signal);
        let mask = Long.fromNumber(1).shiftLeft(command.bitNumber);
        const newVal = Long.fromNumber(<number>state.value).xor(mask).toNumber();
        await this._visualizationHandler.setState(signal, newVal);
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
        let host = (<ShadowRoot>context.element.getRootNode()).host;
        if (command.targetSelectorTarget == 'currentElement')
          host = context.element;
        else if (command.targetSelectorTarget == 'parentElement')
          host = context.element.parentElement;
        else if (command.targetSelectorTarget == 'parentScreen')
          host = (<ShadowRoot>host.getRootNode()).host;
        let elements: Iterable<Element> = [host];
        if (command.targetSelector)
          elements = host.shadowRoot.querySelectorAll(command.targetSelector);
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

  async getValue<T>(value: string | number | boolean | IScriptMultiplexValue, outerContext: { event: Event, element: Element, root: HTMLElement }): Promise<any> {
    if (typeof value === 'object') {
      switch ((<IScriptMultiplexValue>value).source) {
        case 'property': {
          return outerContext.root[(<IScriptMultiplexValue>value).name];
        }
        case 'signal': {
          let sng = await this._visualizationHandler.getState((<IScriptMultiplexValue>value).name);
          return sng.value;
        }
        case 'event': {
          let obj = outerContext.event;
          if ((<IScriptMultiplexValue>value).name)
            obj = ScriptSystem.extractPart(obj, (<IScriptMultiplexValue>value).name);
          return obj;
        }
      }
    }
    return value;
  }

  static extractPart(obj: any, propertyPath: string) {
    let retVal = obj;
    for (let p of propertyPath.split('.')) {
      retVal = retVal?.[p];
    }
    return retVal;
  }

  async assignAllScripts(source: string, javascriptCode: string, shadowRoot: ShadowRoot, instance: HTMLElement): Promise<VisualisationElementScript> {
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
                e.addEventListener(evtName, (evt) => this.execute(scriptObj.commands, { event: evt, element: e, root: instance }));
              } else if ('blocks' in scriptObj) {
                let compiledFunc: Awaited<ReturnType<typeof generateEventCodeFromBlockly>> = null;
                e.addEventListener(evtName, async (evt) => {
                  if (!compiledFunc)
                    compiledFunc = await generateEventCodeFromBlockly(scriptObj);
                  compiledFunc(evt, shadowRoot);
                });
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