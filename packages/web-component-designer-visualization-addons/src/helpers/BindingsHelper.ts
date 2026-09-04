import { TypedEvent, cssFromString } from "@node-projects/base-custom-webcomponent";
import { VisualizationBinding } from "../interfaces/VisualizationBinding.js";
import { State, VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget.js";
import { PropertiesHelper } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/PropertiesHelper.js";

//;,[ are not allowed in bindings, so they could be used for a short form...

export type SpecialValueHandler = { valueProvider: (propertyName: string, context: { element: Element, binding?: namedBinding, relativeSignalPath: string, root: HTMLElement, [key: string]: any }) => Promise<any> | any, valueChangedCallbacks: Map<string, (() => void)[]> }

export const bindingPrefixProperty = 'bind-prop:';
export const bindingPrefixAttribute = 'bind-attr:';
export const bindingPrefixClass = 'bind-class:';
export const bindingPrefixCss = 'bind-css:';
export const bindingPrefixCssVar = 'bind-cssvar:';
export const bindingPrefixContent = 'bind-content:';
export const bindingPrefixVisible = 'bind-visible:';
export const bindingPrefixInsideCss = 'bind(';
export const bindingPrefixInsideCssVarName = '--tmpBinding_';

export const bindingsInCssRegex = /{{(.*)}}/;

export type namedBinding = [name: string, binding: VisualizationBinding];

type Cleanup = () => void;
type StateChangeCallback = (id: string, value: State) => void;

interface SharedStateSubscription {
  callbacks: Set<StateChangeCallback>;
  callback: StateChangeCallback;
  subscriptionResult: any;
  revision: number;
  hasValue: boolean;
  value?: State;
}

interface CompiledConverterValue {
  value: any;
  evaluate?: (values: any[], previousResult: any, context: any) => any;
}

interface CompiledConverterCondition {
  matches: (value: number) => boolean;
  value: CompiledConverterValue;
}

interface CompiledConverter {
  exactValues: Map<string, CompiledConverterValue>;
  conditions: CompiledConverterCondition[];
}

export function isLit(element: Element) {
  //@ts-ignore
  return element.constructor?.elementProperties != null;
}

export function parseBindingString(id: string) {
  const parts: string[] = [];
  const signals: string[] = [];
  let start = 0;
  for (let n = 0; n < id.length; n++) {
    if (id[n] == '{') {
      parts.push(id.substring(start, n));
      start = n + 1;
    } else if (id[n] == '}') {
      signals.push(id.substring(start, n));
      start = n + 1;
    }
  }
  parts.push(id.substring(start));
  return { parts, signals };
}

function bindSpecialValue(handler: SpecialValueHandler, name: string, context: Parameters<SpecialValueHandler['valueProvider']>[1], valueChanged: (value: any) => void): Cleanup {
  let active = true;
  let revision = 0;
  const loadValue = () => {
    const currentRevision = ++revision;
    const value = handler.valueProvider(name, context);
    if (value instanceof Promise)
      value.then(v => active && currentRevision === revision && valueChanged(v));
    else if (active)
      valueChanged(value);
  };

  loadValue();
  if (!handler.valueChangedCallbacks)
    handler.valueChangedCallbacks = new Map();
  let callbacks = handler.valueChangedCallbacks.get(name);
  if (!callbacks) {
    callbacks = [];
    handler.valueChangedCallbacks.set(name, callbacks);
  }
  callbacks.push(loadValue);

  return () => {
    active = false;
    const index = callbacks.indexOf(loadValue);
    if (index >= 0)
      callbacks.splice(index, 1);
    if (callbacks.length === 0 && handler.valueChangedCallbacks.get(name) === callbacks)
      handler.valueChangedCallbacks.delete(name);
  };
}

export function getNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }

  return current;
}

function observeProperty(bindingsHelper: BindingsHelper, owner: Element, propertyName: string, valueChanged: (value: any) => void, supportsNestedPath = false): Cleanup {
  const isNested = supportsNestedPath && propertyName.includes('.');
  const readValue = isNested
    ? () => getNestedProperty(owner, propertyName)
    : () => owner[propertyName];
  valueChanged(readValue());
  if (isNested)
    return () => { };

  const callback = () => valueChanged(readValue());
  const eventName = bindingsHelper.getChangedEventName(owner, propertyName);
  owner.addEventListener(eventName, callback);
  return () => owner.removeEventListener(eventName, callback);
}

function observeAttribute(owner: Element, attributeName: string, valueChanged: (value: string) => void): Cleanup {
  valueChanged(owner.getAttribute(attributeName));
  const observer = new MutationObserver(() => valueChanged(owner.getAttribute(attributeName)));
  observer.observe(owner, { attributes: true, attributeFilter: [attributeName] });
  return () => observer.disconnect();
}

class IndirectSignal {
  private bindingsHelper: BindingsHelper;
  private parts: string[];
  private signals: string[];
  private values: string[];
  private unsubscribeTargetValue: Cleanup;
  private cleanupCalls: Cleanup[] = [];
  private combinedName: string;
  private disposed = false;
  private valueChangedCb: (value: any) => void
  private visualizationHandler: VisualizationHandler;
  private element: Element;
  private relativeSignalPath: string;

  constructor(bindingsHelper: BindingsHelper, visualizationHandler: VisualizationHandler, id: string, valueChangedCb: (value: State) => void, element: Element, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler) {
    this.bindingsHelper = bindingsHelper;
    this.visualizationHandler = visualizationHandler;
    this.valueChangedCb = valueChangedCb;
    this.element = element;
    this.relativeSignalPath = relativeSignalPath;
    this.parseIndirectBinding(id);
    this.values = new Array(this.signals.length);

    const bindSignalFromProperty = (owner: Element, propertyName: string, index: number) => {
      let currentSignalName: string;
      let subscriptionCleanup: Cleanup = () => { };
      const switchSignal = (propertyValue: any) => {
        let signalName = propertyValue;
        if (typeof signalName === 'string' && signalName[0] === '.')
          signalName = visualizationHandler.getNormalizedSignalName(signalName, relativeSignalPath, element);
        if (signalName === currentSignalName)
          return;
        subscriptionCleanup();
        currentSignalName = signalName;
        if (typeof signalName === 'string') {
          const callback = (changedId: string, value: State) => this.handleValueChanged(value.val, index);
          subscriptionCleanup = bindingsHelper.subscribeToState(signalName, callback);
        } else {
          subscriptionCleanup = () => { };
        }
      };
      this.cleanupCalls.push(observeProperty(bindingsHelper, owner, propertyName, switchSignal, true));
      this.cleanupCalls.push(() => subscriptionCleanup());
    };

    try {
      for (let i = 0; i < this.signals.length; i++) {
        const signal = this.signals[i];
        if (signal.startsWith('?@') || signal.startsWith('#@')) {
          const owner = signal[0] === '?' ? root : element;
          this.cleanupCalls.push(observeAttribute(owner, signal.substring(2), value => this.handleValueChanged(value, i)));
        } else if (signal.startsWith('??') || signal.startsWith('##') || signal.startsWith('?$') || signal.startsWith('#$')) {
          const owner = signal[0] === '?' ? root : element;
          this.cleanupCalls.push(observeProperty(bindingsHelper, owner, signal.substring(2), value => this.handleValueChanged(value, i), true));
        } else if (signal[0] === '§') {
          const name = signal.substring(1);
          if (!specialValueHandler)
            throw new Error(`No special value handler registered for "${signal}"`);
          this.cleanupCalls.push(bindSpecialValue(specialValueHandler, name, { element, relativeSignalPath, root }, value => this.handleValueChanged(value, i)));
        } else if (signal[0] === '?' || signal[0] === '#') {
          bindSignalFromProperty(signal[0] === '?' ? root : element, signal.substring(1), i);
        } else {
          const callback = (changedId: string, value: State) => this.handleValueChanged(value.val, i);
          this.cleanupCalls.push(bindingsHelper.subscribeToState(signal, callback));
        }
      }
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  private parseIndirectBinding(id: string) {
    let { parts, signals } = parseBindingString(id);
    this.parts = parts;
    this.signals = signals;

    for (let n = 0; n < signals.length; n++) {
      if (signals[n][0] == '.')
        signals[n] = this.visualizationHandler.getNormalizedSignalName(signals[n], this.relativeSignalPath, this.element);
    }
  }

  handleValueChanged(value: any, index: number) {
    if (this.disposed)
      return;
    this.values[index] = value;
    let nm = this.parts[0];
    for (let i = 0; i < this.parts.length - 1; i++) {
      let v = this.values[i];
      if (v == null)
        return;
      nm += v + this.parts[i + 1];
    }
    if (nm[0] == '.')
      nm = this.visualizationHandler.getNormalizedSignalName(nm, this.relativeSignalPath, this.element);
    if (this.combinedName != nm) {
      if (this.unsubscribeTargetValue) {
        this.unsubscribeTargetValue();
      }
      if (!this.disposed) {
        this.combinedName = nm;
        const cb = (id: string, value: State) => this.valueChangedCb(value);
        this.unsubscribeTargetValue = this.bindingsHelper.subscribeToState(nm, cb);
      }
    }
  }

  dispose() {
    this.disposed = true;
    if (this.unsubscribeTargetValue) {
      this.unsubscribeTargetValue();
      this.unsubscribeTargetValue = null;
    }
    for (const cleanup of this.cleanupCalls)
      cleanup();
    this.cleanupCalls.length = 0;
  }

  setState(value) {
    if (!this.disposed && this.combinedName) {
      this.visualizationHandler.setState(this.combinedName, value);
    }
  }
}

export class BindingsHelper {
  _visualizationHandler: VisualizationHandler;
  namedConverterCallback: (converter: string, value: any, element: Element, binding: namedBinding) => any;
  private _stateSubscriptions = new Map<string, SharedStateSubscription>();
  private _scheduledUpdates = new Set<() => void>();
  private _updateFlushScheduled = false;
  private _compiledConverters = new WeakMap<VisualizationBinding, { converter: Record<string, any>, argumentsKey: string, compiled: CompiledConverter }>();

  constructor(visualizationHandler: VisualizationHandler) {
    this._visualizationHandler = visualizationHandler;
  }

  private scheduleUpdate(update: () => void) {
    this._scheduledUpdates.add(update);
    if (this._updateFlushScheduled)
      return;
    this._updateFlushScheduled = true;
    queueMicrotask(() => {
      this._updateFlushScheduled = false;
      const updates = [...this._scheduledUpdates];
      this._scheduledUpdates.clear();
      for (const scheduledUpdate of updates)
        scheduledUpdate();
    });
  }

  getChangedEventName(element: Element, propertyName: string) {
    const posColon = propertyName.indexOf('::');
    if (posColon >= 0)
      return propertyName.substring(posColon + 2);
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement)
      return 'change';
    const eventName = PropertiesHelper.camelToDashCase(propertyName);
    return isLit(element) ? eventName : eventName + '-changed';
  }

  private getParsedTargetName(propertyName: string, bindingTarget: BindingTarget) {
    if (bindingTarget === BindingTarget.cssvar || bindingTarget === BindingTarget.class)
      return BindingsHelper.dotToCamelCase(propertyName);
    if (bindingTarget === BindingTarget.attribute)
      return propertyName;
    return PropertiesHelper.dashToCamelCase(propertyName);
  }

  //Not allowed chars in Var Names: |{}(),;:[]

  parseBinding(element: Element, name: string, value: string, bindingTarget: BindingTarget, prefix: string): namedBinding {
    //Loooks like:
    //a:var1;b:var2;expression
    //=varname => two way
    //!varname => inverted
    //{...} => json
    let propname = name.substring(prefix.length);
    if (bindingTarget === BindingTarget.cssvar)
      propname = '--' + propname;
    if (!value.startsWith('{')) {
      let binding: VisualizationBinding = {
        signal: value,
        target: bindingTarget
      }

      if (value[0] === '=') {
        value = value.substring(1);
        binding.signal = value;
        if (value.includes('::')) {
          const parts = value.split('::');
          value = parts[0];
          binding.signal = value;
          binding.events = parts[1].split(',');
        }
        binding.twoWay = true;
        if (!binding.events) {
          binding.events = [this.getChangedEventName(element, propname)];
          if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLSelectElement) && !isLit(element)) {
            //Binding could be a lit element but not yet loaded
            binding.maybeLitElement = true;
            binding.litEventNames = binding.events;
          }
        }
      }

      if (value[0] === '!') {
        binding.signal = value.substring(1);
        binding.inverted = true;
      }

      if (binding.signal.includes(';')) {
        const parts = binding.signal.split(';');
        binding.expression = parts.pop();
        binding.signal = parts.join(';');
      }

      return [this.getParsedTargetName(propname, bindingTarget), binding];
    }

    let binding: VisualizationBinding = JSON.parse(value);
    binding.target = bindingTarget;

    if (binding.twoWay && (binding.events == null || binding.events.length == 0))
      binding.events = [this.getChangedEventName(element, propname)];
    return [this.getParsedTargetName(propname, bindingTarget), binding];
  }

  serializeBinding(element: Element, targetName: string, binding: VisualizationBinding): [name: string, value: string] {
    let bindingCopy = { ...binding };
    delete bindingCopy.type;
    if (!binding.twoWay) {
      delete bindingCopy.events;
      delete bindingCopy.expressionTwoWay;
    } else if ((binding.events != null && binding.events.length == 1)) {
      if ((element instanceof HTMLInputElement || element instanceof HTMLSelectElement) && binding.events?.[0] == "change")
        delete bindingCopy.events;
      else if (isLit(element) && binding.events?.[0] == targetName)
        delete bindingCopy.events;
      else if (!isLit(element) && binding.events?.[0] == targetName + '-changed')
        delete bindingCopy.events;
    }

    const eventsString = bindingCopy.twoWay && bindingCopy.events?.length > 0 ? '::' + bindingCopy.events.join(',') : '';

    const needsJson = ((eventsString !== '') && !!binding.expression?.includes('::')) ||
      !!binding.expressionTwoWay?.includes('::') || binding.signal.trim()[0] == '{';
    const supportsShortForm = binding.target == BindingTarget.property ||
      binding.target == BindingTarget.attribute || binding.target == BindingTarget.class ||
      binding.target == BindingTarget.css || binding.target == BindingTarget.cssvar;
    const hasOnlyShortFormOptions = !needsJson && supportsShortForm && !binding.expressionTwoWay &&
      binding.converter == null && !binding.historic && !binding.writeBackSignal;

    if (hasOnlyShortFormOptions && !binding.expression) {
      const name = this.getShortBindingAttributeName(targetName, binding.target, false);
      const supportsTwoWay = binding.target == BindingTarget.property || binding.target == BindingTarget.attribute;
      const value = (supportsTwoWay && binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') +
        binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString;
      return [name, value];
    }

    if (hasOnlyShortFormOptions && binding.expression &&
      !binding.expression.includes("\n") && !binding.expression.includes(";")) {
      const name = this.getShortBindingAttributeName(targetName, binding.target, true);
      const supportsTwoWay = binding.target == BindingTarget.attribute ||
        (binding.target == BindingTarget.property && targetName != 'textContent' && targetName != 'innerHTML');
      const value = (supportsTwoWay && binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') +
        binding.signal + ';' + binding.expression + eventsString;
      return [name, value];
    }

    if (binding.inverted === null || binding.inverted === false) {
      delete bindingCopy.inverted;
    }
    if (binding.expression === null || binding.expression === '') {
      delete bindingCopy.expression;
    }
    if (binding.expressionTwoWay === null || binding.expressionTwoWay === '') {
      delete bindingCopy.expressionTwoWay;
    }
    if (binding.twoWay === null || binding.twoWay === false) {
      delete bindingCopy.twoWay;
    }
    /*if (binding.type === null || binding.type === '') {
      delete bindingCopy.type;
    }*/
    delete bindingCopy.target;

    if (!binding.historic) {
      delete bindingCopy.historic;
    }

    return [this.getJsonBindingAttributeName(targetName, binding.target), JSON.stringify(bindingCopy)];
  }

  private getShortBindingAttributeName(targetName: string, target: BindingTarget, hasExpression: boolean) {
    if (target == BindingTarget.property && targetName == 'textContent')
      return bindingPrefixContent + 'text';
    if (target == BindingTarget.property && targetName == 'innerHTML')
      return bindingPrefixContent + 'html';
    if (target == BindingTarget.attribute)
      return bindingPrefixAttribute + PropertiesHelper.camelToDashCase(targetName);
    if (target == BindingTarget.class)
      return bindingPrefixClass + PropertiesHelper.camelToDashCase(targetName);
    if (target == BindingTarget.css)
      return bindingPrefixCss + PropertiesHelper.camelToDashCase(targetName);
    if (target == BindingTarget.cssvar)
      return hasExpression
        ? bindingPrefixCssVar + PropertiesHelper.camelToDashCase(targetName)
        : bindingPrefixCssVar + BindingsHelper.camelToDotCase(targetName.substring(2));
    return bindingPrefixProperty + PropertiesHelper.camelToDashCase(targetName);
  }

  private getJsonBindingAttributeName(targetName: string, target: BindingTarget) {
    if (target == BindingTarget.content || (target == BindingTarget.property && targetName == 'innerHTML'))
      return bindingPrefixContent + 'html';
    if (target == BindingTarget.property && targetName == 'textContent')
      return bindingPrefixContent + 'text';
    if (target == BindingTarget.attribute)
      return bindingPrefixAttribute + PropertiesHelper.camelToDashCase(targetName);
    if (target == BindingTarget.class)
      return bindingPrefixClass + BindingsHelper.camelToDotCase(targetName);
    if (target == BindingTarget.css)
      return bindingPrefixCss + PropertiesHelper.camelToDashCase(targetName);
    if (target == BindingTarget.cssvar)
      return bindingPrefixCssVar + BindingsHelper.camelToDotCase(targetName.substring(2));
    return bindingPrefixProperty + PropertiesHelper.camelToDashCase(targetName);
  }

  getBindingAttributeName(element: Element, propertyName: string, propertyTarget: BindingTarget) {
    if (propertyTarget == BindingTarget.attribute) {
      return bindingPrefixAttribute + PropertiesHelper.camelToDashCase(propertyName);
    }
    if (propertyTarget == BindingTarget.class) {
      return bindingPrefixClass + BindingsHelper.camelToDotCase(propertyName);
    }
    if (propertyTarget == BindingTarget.css) {
      return bindingPrefixCss + PropertiesHelper.camelToDashCase(propertyName);
    }
    if (propertyTarget == BindingTarget.visible) {
      return bindingPrefixVisible;
    }
    if (propertyTarget == BindingTarget.cssvar) {
      return bindingPrefixCssVar + BindingsHelper.camelToDotCase(propertyName);
    }
    if (propertyTarget == BindingTarget.property && propertyName == 'innerHTML') {
      return bindingPrefixContent + 'html';
    }
    if (propertyTarget == BindingTarget.property && propertyName == 'textContent') {
      return bindingPrefixContent + 'text';
    }
    return bindingPrefixProperty + PropertiesHelper.camelToDashCase(propertyName);
  }

  *getBindings(element: Element) {
    if (element.attributes) {
      for (let a of element.attributes) {
        if (a.name.startsWith(bindingPrefixProperty)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.property, bindingPrefixProperty);
        }
        else if (a.name.startsWith(bindingPrefixContent)) {
          yield this.parseBinding(element, a.name === 'bind-content:html' ? 'bind-prop:inner-h-t-m-l' : 'bind-prop:text-content', a.value, BindingTarget.property, bindingPrefixProperty);
        }
        else if (a.name.startsWith(bindingPrefixAttribute)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.attribute, bindingPrefixAttribute);
        }
        else if (a.name.startsWith(bindingPrefixClass)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.class, bindingPrefixClass);
        }
        else if (a.name.startsWith(bindingPrefixCss)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.css, bindingPrefixCss);
        }
        else if (a.name.startsWith(bindingPrefixCssVar)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.cssvar, bindingPrefixCssVar);
        }
        else if (a.name.startsWith(bindingPrefixVisible)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.visible, bindingPrefixVisible);
        }
      }
    }
  }

  applyAllBindings(rootElement: ParentNode, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler, skipChildrenFor?: (element: Element) => boolean): (() => void)[] {
    let retVal: (() => void)[] = [];
    const tw = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT);
    let e = <Element>tw.nextNode();
    while (e) {
      const bindings = this.getBindings(e);
      for (let b of bindings) {
        try {
          let applied = this.applyBinding(e, b, relativeSignalPath, root, specialValueHandler);
          let bindingDisposed = false;
          const disposeBinding = () => {
            if (!bindingDisposed) {
              bindingDisposed = true;
              applied();
            }
          };
          retVal.push(disposeBinding);

          if (b[1].maybeLitElement && e.localName.includes('-') && !customElements.get(e.localName)) {
            const el = e;
            const bnd = b;
            customElements.whenDefined(e.localName).then(() => {
              if (!bindingDisposed && isLit(el)) {
                bindingDisposed = true;
                applied();
                bnd[1].events = bnd[1].litEventNames;
                retVal.push(this.applyBinding(el, bnd, relativeSignalPath, root, specialValueHandler));
              }
            })
          }
        } catch (err) {
          console.warn("error applying binding", e, b, err)
        }
      }
      if (skipChildrenFor && skipChildrenFor(e)) {
        // Skip the whole subtree of e: advance to the next node that is NOT a descendant of e.
        // nextSibling() returns null WITHOUT moving the walker when e is the last child, so we must
        // walk up via parentNode() until a sibling exists, otherwise the following nextNode() would
        // descend into the skipped subtree anyway.
        let nn = <Element>tw.nextSibling();
        while (!nn && e) {
          e = <Element>tw.parentNode();
          nn = <Element>tw.nextSibling();
        }
        e = nn;
      } else {
        e = <Element>tw.nextNode();
      }
    }
    return retVal;
  }

  static #cssBindingsVarId = 0;

  async parseCssBindings(sheet: string, element: Element, relativeSignalPath: string, root: HTMLElement): Promise<[stylesheet: CSSStyleSheet, unsub: (() => void)[]]> {
    if (!sheet.includes(bindingPrefixInsideCss))
      return [cssFromString(sheet), []];

    const parser = (await import("@node-projects/css-parser"));
    const ast = parser.parse(sheet);

    const unsub: (() => void)[] = [];
    for (let r of ast.stylesheet.rules) {
      if (r.type === parser.CssTypes.rule) {
        for (const d of r.declarations) {
          if (d.type === parser.CssTypes.declaration) {
            if (d.value.includes(bindingPrefixInsideCss)) {
              const newValue = this.parseCssBinding(d.value, element, relativeSignalPath, root);
              d.value = newValue[0];
              unsub.push(...newValue[1]);
            }
          }
        }
      }
    }

    const newStyle = parser.stringify(ast, { indent: '', compress: true });
    return [cssFromString(newStyle), unsub];
  }

  parseCssBinding(value: string, element: Element, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler): [name: string, unsub: (() => void)[]] {
    value = value.trim();
    let res = '';
    let tmp = '';
    let inBind = false;
    let binding = '';
    let escape = false;
    let quote = null;
    let unsub: (() => void)[] = [];
    for (let n = 0; n < value.length; n++) {
      const c = value[n];
      if (inBind) {
        if (escape) {
          binding += c;
          escape = false;
        } else if (quote && c === '\\')
          escape = true;
        else if (c === quote)
          quote = null;
        else if (quote === null && c === ')') {
          const id = BindingsHelper.#cssBindingsVarId++;
          const varName = bindingPrefixInsideCssVarName + id;
          let bnd: namedBinding = [varName, { signal: binding, target: BindingTarget.cssvar }];
          if (binding.startsWith('{')) {
            bnd = JSON.parse(binding);
          }
          unsub.push(this.applyBinding(element, bnd, relativeSignalPath, root, specialValueHandler));
          res += 'var(' + varName + ')';
          inBind = false;
          binding = '';
        } else
          binding += c;
      } else if (c === '(') {
        if (tmp !== 'bind') {
          res += tmp;
          res += c;
        } else {
          inBind = true;
          if (value[n + 1] === '\'' || value[n + 1] === '"') {
            n++;
            quote = value[n];
          } else {
            quote = null;
          }
        }
        tmp = '';
      } else if (c === ' ' || c === ',' || c === '(' || c === '+' || c === '-' || c === '*' || c === '/') {
        res += tmp + c;
        tmp = '';
      } else {
        tmp += c;
      }
    }
    return [res + tmp, unsub];
  }

  /** @internal Shared fan-out avoids duplicate backend subscriptions and initial reads. */
  subscribeToState(id: string, callback: StateChangeCallback): Cleanup {
    let entry = this._stateSubscriptions.get(id);
    if (entry) {
      entry.callbacks.add(callback);
      if (entry.hasValue) {
        const value = entry.value;
        queueMicrotask(() => entry.callbacks.has(callback) && callback(id, value));
      }
    } else {
      entry = {
        callbacks: new Set([callback]),
        callback: null,
        subscriptionResult: null,
        revision: 0,
        hasValue: false
      };
      entry.callback = (changedId: string, value: State) => {
        entry.revision++;
        entry.hasValue = true;
        entry.value = value;
        for (const cb of entry.callbacks)
          cb(changedId, value);
      };
      this._stateSubscriptions.set(id, entry);
      try {
        entry.subscriptionResult = this._visualizationHandler.subscribeState(id, entry.callback);
        const initialRevision = entry.revision;
        this._visualizationHandler.getState(id).then(value => {
          if (this._stateSubscriptions.get(id) === entry && entry.revision === initialRevision)
            entry.callback(id, value);
        });
      } catch (error) {
        this._stateSubscriptions.delete(id);
        if (entry.subscriptionResult != null)
          this._visualizationHandler.unsubscribeState(id, entry.callback, entry.subscriptionResult);
        throw error;
      }
    }

    let active = true;
    return () => {
      if (!active)
        return;
      active = false;
      entry.callbacks.delete(callback);
      if (entry.callbacks.size === 0 && this._stateSubscriptions.get(id) === entry) {
        this._stateSubscriptions.delete(id);
        this._visualizationHandler.unsubscribeState(id, entry.callback, entry.subscriptionResult);
      }
    };
  }

  /**
   * ? = signal name from a root property; ?? = a root property value
   * # = signal name from a target property; ## = a target property value
   * ?$ = signal object from a root property; #$ = signal object from a target property
   * ?@ = a root attribute value; #@ = a target attribute value
   * $ = a signal configuration; § = a special value
  */
  applyBinding(element: Element, binding: namedBinding, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler): Cleanup {
    const cleanupCalls: Cleanup[] = [];
    let active = true;
    const cleanUp = () => {
      if (!active)
        return;
      active = false;
      this._scheduledUpdates.delete(evaluateAndApply);
      for (let i = cleanupCalls.length - 1; i >= 0; i--)
        cleanupCalls[i]();
      cleanupCalls.length = 0;
    };
    const addCleanup = (cleanup: Cleanup) => cleanupCalls.push(cleanup);

    const signals = binding[1].signal.split(';');
    const signalVars: string[] = new Array(signals.length);
    for (let i = 0; i < signals.length; i++) {
      let signal = signals[i];
      signalVars[i] = '__' + i;
      const aliasSeparator = signal.indexOf(':');
      if (aliasSeparator >= 0) {
        signalVars[i] = signal.substring(0, aliasSeparator);
        signal = signal.substring(aliasSeparator + 1);
        signals[i] = signal;
      }
    }

    const values = new Array(signals.length);
    const expressionArguments = [...signalVars, '__res', '__ctx'];
    if (binding[1].expression && !binding[1].compiledExpression) {
      binding[1].compiledExpression = binding[1].expression.includes('return ')
        ? new Function(<any>expressionArguments, binding[1].expression)
        : new Function(<any>expressionArguments, 'return ' + binding[1].expression);
    }
    const compiledConverter = this.getCompiledConverter(binding[1], expressionArguments);
    const context = { element, root, boundNames: binding[1].signal, boundTargetName: binding[0], boundTargetType: binding[1].target };
    const writeTarget = this.createTargetWriter(element, binding);
    let writeBackSignal = binding[1].writeBackSignal;
    if (writeBackSignal?.[0] === '.')
      writeBackSignal = relativeSignalPath + writeBackSignal;

    let currentValue: any;
    let previousResult: any;
    let lastOutput: any;
    let hasOutput = false;
    let hasApplied = false;
    let scheduled = false;

    const evaluateAndApply = () => {
      scheduled = false;
      if (!active)
        return;
      let value = currentValue;
      if (binding[1].compiledExpression) {
        value = binding[1].compiledExpression(...values, previousResult, context);
        previousResult = value;
      }
      if (binding[1].converter) {
        if (typeof binding[1].converter === 'string')
          value = this.namedConverterCallback(<string><never>binding[1].converter, value, element, binding);
        else
          value = this.applyCompiledConverter(value, compiledConverter, values, previousResult, context, binding[1].converterDefault);
      }
      if (binding[1].inverted)
        value = !value;

      hasApplied = true;
      const canCompareByValue = value === null || typeof value !== 'object';
      if (hasOutput && canCompareByValue && Object.is(lastOutput, value))
        return;
      hasOutput = true;
      lastOutput = value;

      if (writeBackSignal)
        this._visualizationHandler.setState(writeBackSignal, value, true);
      writeTarget(value);
    };

    const updateValue = (value: any, index: number, noParse: boolean) => {
      if (!active)
        return;
      if (!noParse && index === 0)
        value = BindingsHelper.parseValueWithType(value, binding);
      values[index] = value;
      currentValue = value;

      // Preserve immediate initialization for the common one-signal case, then
      // collapse bursts and multi-signal initialization into one microtask.
      if (!hasApplied && signals.length === 1) {
        evaluateAndApply();
      } else if (!scheduled) {
        scheduled = true;
        this.scheduleUpdate(evaluateAndApply);
      }
    };

    const setters: ((value: any) => void)[] = new Array(signals.length);
    const setSetter = (index: number, setter: (value: any) => void) => {
      setters[index] = setter;
      return () => {
        if (setters[index] === setter)
          setters[index] = null;
      };
    };

    const bindPropertyValue = (owner: Element, propertyName: string, index: number): Cleanup => {
      const setterCleanup = setSetter(index, value => owner[propertyName] = value);
      const propertyCleanup = observeProperty(this, owner, propertyName, value => updateValue(value, index, false));
      return () => {
        propertyCleanup();
        setterCleanup();
      };
    };

    const bindAttributeValue = (owner: Element, attributeName: string, index: number): Cleanup => {
      const setterCleanup = setSetter(index, value => value == null
        ? owner.removeAttribute(attributeName)
        : owner.setAttribute(attributeName, value));
      const attributeCleanup = observeAttribute(owner, attributeName, value => updateValue(value, index, false));
      return () => {
        attributeCleanup();
        setterCleanup();
      };
    };

    const bindResolvedSource = (source: string, index: number): Cleanup => {
      if (source.startsWith('?@') || source.startsWith('#@')) {
        const owner = source[0] === '?' ? root : element;
        return owner ? bindAttributeValue(owner, source.substring(2), index) : () => { };
      }
      if (source.startsWith('?$') || source.startsWith('#$')) {
        const owner = source[0] === '?' ? root : element;
        return owner ? bindPropertyValue(owner, source.substring(2), index) : () => { };
      }
      if (source[0] === '?' || source[0] === '#') {
        const owner = source[0] === '?' ? root : element;
        return owner ? bindPropertyValue(owner, source.substring(1), index) : () => { };
      }
      if (source[0] === '$') {
        let objectName = source.substring(1);
        if (objectName[0] === '.')
          objectName = this._visualizationHandler.getNormalizedSignalName(objectName, relativeSignalPath, element);
        let running = true;
        this._visualizationHandler.getObject(objectName).then(value => {
          if (running)
            updateValue(value, index, true);
        });
        return () => running = false;
      }
      if (source[0] === '§') {
        if (!specialValueHandler)
          throw new Error(`No special value handler registered for "${source}"`);
        return bindSpecialValue(specialValueHandler, source.substring(1), { element, binding, relativeSignalPath, root }, value => updateValue(value, index, true));
      }
      if (source.includes('{')) {
        const indirectSignal = new IndirectSignal(this, this._visualizationHandler, source, value => updateValue(value.val, index, false), element, relativeSignalPath, root, specialValueHandler);
        const setterCleanup = setSetter(index, value => indirectSignal.setState(value));
        return () => {
          indirectSignal.dispose();
          setterCleanup();
        };
      }

      let signalName = source;
      if (signalName[0] === '.')
        signalName = this._visualizationHandler.getNormalizedSignalName(signalName, relativeSignalPath, element);
      if (binding[1].historic) {
        const historic = binding[1].historic;
        if (historic.reloadInterval) {
          let running = true;
          let timerId: ReturnType<typeof setTimeout> = null;
          const loadHistoric = async () => {
            const result = await this._visualizationHandler.getHistoricData(signalName, historic);
            if (!active || !running)
              return;
            updateValue(result?.values, index, true);
            timerId = setTimeout(loadHistoric, historic.reloadInterval);
          };
          loadHistoric();
          return () => {
            running = false;
            if (timerId !== null)
              clearTimeout(timerId);
            timerId = null;
          };
        }
        let running = true;
        this._visualizationHandler.getHistoricData(signalName, historic).then(result => {
          if (running)
            updateValue(result?.values, index, true);
        });
        return () => running = false;
      }

      const callback = (id: string, value: State) => updateValue(value?.val, index, false);
      const subscriptionCleanup = this.subscribeToState(signalName, callback);
      const setterCleanup = setSetter(index, value => this._visualizationHandler.setState(signalName, value));
      return () => {
        subscriptionCleanup();
        setterCleanup();
      };
    };

    const bindSource = (source: string, index: number): Cleanup => {
      if (source.startsWith('?@') || source.startsWith('#@') || source.startsWith('?$') || source.startsWith('#$'))
        return bindResolvedSource(source, index);
      const prefix = source[0];
      if ((prefix !== '?' && prefix !== '#') || source[1] === prefix)
        return bindResolvedSource(source[1] === prefix ? source.substring(1) : source, index);

      const owner = prefix === '?' ? root : element;
      if (!owner)
        return () => { };
      const propertyName = source.substring(1);

      let sourceCleanup: Cleanup = () => { };
      let currentSource: string;
      const switchSource = (resolvedSource: any) => {
        const nextSource = typeof resolvedSource === 'string' ? resolvedSource : null;
        if (nextSource === currentSource)
          return;
        sourceCleanup();
        currentSource = nextSource;
        sourceCleanup = nextSource ? bindResolvedSource(nextSource, index) : () => { };
      };
      const propertyCleanup = observeProperty(this, owner, propertyName, switchSource);
      return () => {
        propertyCleanup();
        sourceCleanup();
      };
    };

    try {
      if (binding[1].twoWay)
        addCleanup(this.addTwoWayBinding(binding, element, value => setters[0]?.(value)));
      for (let i = 0; i < signals.length; i++) {
        if (typeof signals[i] === 'string')
          addCleanup(bindSource(signals[i], i));
      }
    } catch (error) {
      cleanUp();
      throw error;
    }

    return cleanUp;
  }

  private addTwoWayBinding(binding: namedBinding, element: Element, setter: (value: any) => void): Cleanup {
    if (binding[1].expressionTwoWay && !binding[1].compiledExpressionTwoWay) {
      binding[1].compiledExpressionTwoWay = binding[1].expressionTwoWay.includes('return ')
        ? new Function(<any>['value'], binding[1].expressionTwoWay)
        : new Function(<any>['value'], 'return ' + binding[1].expressionTwoWay);
    }

    const cleanupCalls: Cleanup[] = [];
    const callback = () => {
      let value = binding[1].target == BindingTarget.attribute
        ? element.getAttribute(binding[0])
        : element[binding[0]];
      value = BindingsHelper.parseValueWithType(value, binding);
      if (binding[1].compiledExpressionTwoWay)
        value = binding[1].compiledExpressionTwoWay(value);
      setter(value);
    };

    for (const eventName of binding[1].events ?? []) {
      const event = element[eventName];
      if (event instanceof TypedEvent) {
        const disposable = event.on(callback);
        cleanupCalls.push(() => disposable.dispose());
      } else {
        element.addEventListener(eventName, callback);
        cleanupCalls.push(() => element.removeEventListener(eventName, callback));
      }
    }
    return () => {
      for (const cleanup of cleanupCalls)
        cleanup();
      cleanupCalls.length = 0;
    };
  }

  private static parseValueWithType(value, binding: namedBinding) {
    if (binding[1].type) {
      switch (binding[1].type) {
        case 'number':
          return parseFloat(<any>value);
        case 'boolean':
          return value === true || value === 'true' || !!parseInt(<any>value);
        case 'string':
          return value?.toString();
        case 'integer':
          return parseInt(<any>value);
        //case 'bitOfNumber':
        //  return parseInt(<any>value);
      }
    }
    return value;
  }

  private compileConverter(converter: Record<string, any>, expressionArguments: string[]): CompiledConverter {
    const exactValues = new Map<string, CompiledConverterValue>();
    const conditions: CompiledConverterCondition[] = [];
    const compileValue = (value: any): CompiledConverterValue => {
      if (typeof value !== 'string')
        return { value };
      const fn = new Function(<any>expressionArguments, 'return `' + value + '`');
      return { value, evaluate: (values, previousResult, context) => fn(...values, previousResult, context) };
    };

    for (const key in converter) {
      const value = compileValue(converter[key]);
      exactValues.set(key, value);

      if (key.startsWith('>=')) {
        const threshold = parseFloat(key.substring(2));
        conditions.push({ matches: input => input >= threshold, value });
      } else if (key.startsWith('<=')) {
        const threshold = parseFloat(key.substring(2));
        conditions.push({ matches: input => input <= threshold, value });
      } else if (key[0] === '>') {
        const threshold = parseFloat(key.substring(1));
        conditions.push({ matches: input => input > threshold, value });
      } else if (key[0] === '<') {
        const threshold = parseFloat(key.substring(1));
        conditions.push({ matches: input => input < threshold, value });
      } else {
        const range = key.split('-');
        if (range.length > 1) {
          const minimum = range[0] === '' ? null : parseFloat(range[0]);
          const maximum = range[1] === '' ? null : parseFloat(range[1]);
          conditions.push({
            matches: input => (minimum === null || input >= minimum) && (maximum === null || maximum >= input),
            value
          });
        }
      }
    }
    return { exactValues, conditions };
  }

  private getCompiledConverter(binding: VisualizationBinding, expressionArguments: string[]) {
    if (!binding.converter || typeof binding.converter !== 'object')
      return null;
    const argumentsKey = expressionArguments.join('\0');
    const cached = this._compiledConverters.get(binding);
    if (cached?.converter === binding.converter && cached.argumentsKey === argumentsKey)
      return cached.compiled;
    const compiled = this.compileConverter(binding.converter, expressionArguments);
    this._compiledConverters.set(binding, { converter: binding.converter, argumentsKey, compiled });
    return compiled;
  }

  private applyCompiledConverter(value: any, converter: CompiledConverter, values: any[], previousResult: any, context: any, defaultValue: any) {
    const key = String(value);
    let convertedValue = converter.exactValues.get(key);
    let matched = converter.exactValues.has(key);
    if (!matched) {
      const numberValue = parseFloat(value);
      for (const condition of converter.conditions) {
        if (condition.matches(numberValue)) {
          convertedValue = condition.value;
          matched = true;
          break;
        }
      }
    }
    if (!matched)
      return defaultValue !== undefined ? defaultValue : value;
    return convertedValue.evaluate
      ? convertedValue.evaluate(values, previousResult, context)
      : convertedValue.value;
  }

  private createTargetWriter(element: Element, binding: namedBinding): (value: any) => void {
    const name = binding[0];
    switch (binding[1].target) {
      case BindingTarget.property:
        return value => element[name] = value;
      case BindingTarget.attribute:
        return value => {
          if (typeof value === 'boolean') {
            if (value)
              element.setAttribute(name, '');
            else
              element.removeAttribute(name);
          } else {
            element.setAttribute(name, value);
          }
        };
      case BindingTarget.css:
        return value => (<HTMLElement>element).style[name] = value;
      case BindingTarget.cssvar:
        return value => (<HTMLElement>element).style.setProperty(name, value);
      case BindingTarget.class:
        return value => (<HTMLElement>element).classList.toggle(name, !!value);
      case BindingTarget.visible:
        return value => (<HTMLElement>element).style.visibility = value ? '' : 'collapse';
      default:
        return () => { };
    }
  }

  public static camelToDotCase(text: string) {
    return text.replace(/([A-Z])/g, (g) => `.${g[0].toLowerCase()}`);
  }

  public static dotToCamelCase(text: string) {
    return text.replace(/\.([a-z])/g, (i) => i[1].toUpperCase());
  }
}

