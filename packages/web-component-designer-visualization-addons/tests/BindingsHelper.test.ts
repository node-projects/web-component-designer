/** @jest-environment jsdom */

import { beforeAll, describe, expect, test } from '@jest/globals';
import type { SpecialValueHandler } from '../src/helpers/BindingsHelper.js';
import type { VisualizationHandler, State } from '../src/interfaces/VisualizationHandler.js';
import { BindingTarget } from '@node-projects/web-component-designer/dist/elements/item/BindingTarget.js';

let BindingsHelper: typeof import('../src/helpers/BindingsHelper.js').BindingsHelper;
let parseBindingString: typeof import('../src/helpers/BindingsHelper.js').parseBindingString;
let VisualizationBindingsRefactorService: typeof import('../src/services/VisualizationBindingsRefactorService.js').VisualizationBindingsRefactorService;

beforeAll(async () => {
  if (!CSSStyleSheet.prototype.replaceSync)
    CSSStyleSheet.prototype.replaceSync = () => { };
  ({ BindingsHelper, parseBindingString } = await import('../src/helpers/BindingsHelper.js'));
  ({ VisualizationBindingsRefactorService } = await import('../src/services/VisualizationBindingsRefactorService.js'));
});

class TestVisualizationHandler implements VisualizationHandler {
  values = new Map<string, any>();
  callbacks = new Map<string, Set<(id: string, state: State) => void>>();
  subscribeCalls: string[] = [];
  unsubscribeCalls: string[] = [];
  getStateCalls: string[] = [];
  setStateCalls: { id: string, value: any, ack?: boolean }[] = [];
  objects = new Map<string, any>();
  getObjectCalls: string[] = [];

  getNormalizedSignalName(id: string, relativeSignalPath = '') {
    return relativeSignalPath + id;
  }

  async getState(id: string): Promise<State> {
    this.getStateCalls.push(id);
    return { val: this.values.get(id) };
  }

  async setState(id: string, value: any, ack?: boolean): Promise<void> {
    this.setStateCalls.push({ id, value, ack });
    this.values.set(id, value);
  }

  subscribeState(id: string, callback: (id: string, state: State) => void) {
    this.subscribeCalls.push(id);
    let callbacks = this.callbacks.get(id);
    if (!callbacks) {
      callbacks = new Set();
      this.callbacks.set(id, callbacks);
    }
    callbacks.add(callback);
    return callback;
  }

  unsubscribeState(id: string, callback: (id: string, state: State) => void) {
    this.unsubscribeCalls.push(id);
    this.callbacks.get(id)?.delete(callback);
  }

  emit(id: string, value: any) {
    this.values.set(id, value);
    for (const callback of this.callbacks.get(id) ?? [])
      callback(id, { val: value });
  }

  async getHistoricData() {
    return { values: [] };
  }

  async getObject(id: string): Promise<any> {
    this.getObjectCalls.push(id);
    return this.objects.get(id);
  }

  getAllNames() {
    return [];
  }

  getSignalInformation(): any {
    return null;
  }
}

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('BindingsHelper runtime', () => {
  test('shares subscriptions and initial reads for the same signal', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('shared', 7);
    const helper = new BindingsHelper(handler);
    const first = document.createElement('div');
    const second = document.createElement('div');

    const disposeFirst = helper.applyBinding(first, ['value', { signal: 'shared', target: BindingTarget.property }], '', null);
    const disposeSecond = helper.applyBinding(second, ['value', { signal: 'shared', target: BindingTarget.property }], '', null);
    await flushMicrotasks();

    expect(handler.subscribeCalls).toEqual(['shared']);
    expect(handler.getStateCalls).toEqual(['shared']);
    expect(first['value']).toBe(7);
    expect(second['value']).toBe(7);

    disposeFirst();
    expect(handler.unsubscribeCalls).toEqual([]);
    disposeSecond();
    expect(handler.unsubscribeCalls).toEqual(['shared']);
  });

  test('switches only the changed dynamic source', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('first', 1);
    handler.values.set('second', 2);
    handler.values.set('fixed', 10);
    const helper = new BindingsHelper(handler);
    const root = document.createElement('div');
    const element = document.createElement('div');
    root['signalName'] = 'first';

    const dispose = helper.applyBinding(element, ['value', {
      signal: 'dynamic:?signalName;fixed:fixed',
      expression: 'dynamic + fixed',
      twoWay: true,
      events: ['change'],
      target: BindingTarget.property
    }], '', root);
    await flushMicrotasks();
    expect(element['value']).toBe(11);

    root['signalName'] = 'second';
    root.dispatchEvent(new Event('signal-name-changed'));
    await flushMicrotasks();

    expect(element['value']).toBe(12);
    expect(handler.subscribeCalls).toEqual(['first', 'fixed', 'second']);
    expect(handler.unsubscribeCalls).toEqual(['first']);

    root.dispatchEvent(new Event('signal-name-changed'));
    await flushMicrotasks();
    expect(handler.subscribeCalls).toEqual(['first', 'fixed', 'second']);
    expect(handler.unsubscribeCalls).toEqual(['first']);

    element['value'] = 20;
    element.dispatchEvent(new Event('change'));
    expect(handler.setStateCalls).toEqual([{ id: 'second', value: 20, ack: undefined }]);

    dispose();
    expect(handler.unsubscribeCalls).toEqual(['first', 'fixed', 'second']);
  });

  test('switches an indirect property source without rebuilding its binding', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('selector-one', 'one');
    handler.values.set('selector-two', 'two');
    handler.values.set('device.one', 1);
    handler.values.set('device.two', 2);
    const helper = new BindingsHelper(handler);
    const root = document.createElement('div');
    const element = document.createElement('div');
    root['selectorSignal'] = 'selector-one';

    const dispose = helper.applyBinding(element, ['value', {
      signal: 'device.{?selectorSignal}',
      target: BindingTarget.property
    }], '', root);
    await flushMicrotasks();
    expect(element['value']).toBe(1);

    root['selectorSignal'] = 'selector-two';
    root.dispatchEvent(new Event('selector-signal-changed'));
    await flushMicrotasks();
    expect(element['value']).toBe(2);
    expect(handler.subscribeCalls).toEqual(['selector-one', 'device.one', 'selector-two', 'device.two']);
    expect(handler.unsubscribeCalls).toEqual(['selector-one', 'device.one']);
    dispose();
  });

  test('binds screen and target attributes and observes their changes', async () => {
    const handler = new TestVisualizationHandler();
    const helper = new BindingsHelper(handler);
    const root = document.createElement('div');
    const element = document.createElement('input');
    root.setAttribute('screen-value', 'one');
    element.setAttribute('target-value', 'two');

    const disposeScreen = helper.applyBinding(element, ['screenValue', {
      signal: '?@screen-value',
      twoWay: true,
      events: ['change'],
      target: BindingTarget.property
    }], '', root);
    const disposeTarget = helper.applyBinding(element, ['targetValue', {
      signal: '#@target-value',
      target: BindingTarget.property
    }], '', root);

    expect(element['screenValue']).toBe('one');
    expect(element['targetValue']).toBe('two');
    expect(handler.subscribeCalls).toEqual([]);

    root.setAttribute('screen-value', 'three');
    element.setAttribute('target-value', 'four');
    await flushMicrotasks();
    expect(element['screenValue']).toBe('three');
    expect(element['targetValue']).toBe('four');

    element['screenValue'] = 'five';
    element.dispatchEvent(new Event('change'));
    expect(root.getAttribute('screen-value')).toBe('five');

    disposeScreen();
    disposeTarget();
    root.setAttribute('screen-value', 'ignored');
    element.setAttribute('target-value', 'ignored');
    await flushMicrotasks();
    expect(element['screenValue']).toBe('five');
    expect(element['targetValue']).toBe('four');
  });

  test('binds signal objects stored in screen and target properties', async () => {
    const handler = new TestVisualizationHandler();
    handler.objects.set('named-object', { id: 'named-object' });
    const helper = new BindingsHelper(handler);
    const root = document.createElement('div');
    const screenElement = document.createElement('div');
    const targetElement = document.createElement('div');
    const namedElement = document.createElement('div');
    root['signalObject'] = { id: 'screen-object' };
    targetElement['signalObject'] = { id: 'target-object' };

    const disposeScreen = helper.applyBinding(screenElement, ['value', {
      signal: '?$signalObject',
      target: BindingTarget.property
    }], '', root);
    const disposeTarget = helper.applyBinding(targetElement, ['value', {
      signal: '#$signalObject',
      target: BindingTarget.property
    }], '', root);
    const disposeNamed = helper.applyBinding(namedElement, ['value', {
      signal: '$named-object',
      target: BindingTarget.property
    }], '', root);
    await flushMicrotasks();
    expect(screenElement['value']).toEqual({ id: 'screen-object' });
    expect(targetElement['value']).toEqual({ id: 'target-object' });
    expect(namedElement['value']).toEqual({ id: 'named-object' });

    root['signalObject'] = { id: 'next-object' };
    root.dispatchEvent(new Event('signal-object-changed'));
    await flushMicrotasks();
    expect(screenElement['value']).toEqual({ id: 'next-object' });
    expect(handler.getObjectCalls).toEqual(['named-object']);

    disposeScreen();
    disposeTarget();
    disposeNamed();
  });

  test('uses screen and target attributes in indirect signal paths', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('device.one', 1);
    handler.values.set('device.two', 2);
    handler.values.set('device.three', 3);
    handler.values.set('device.four', 4);
    const helper = new BindingsHelper(handler);
    const root = document.createElement('div');
    const screenElement = document.createElement('div');
    const targetElement = document.createElement('div');
    root.setAttribute('device-id', 'one');
    targetElement.setAttribute('device-id', 'three');

    const disposeScreen = helper.applyBinding(screenElement, ['value', {
      signal: 'device.{?@device-id}',
      target: BindingTarget.property
    }], '', root);
    const disposeTarget = helper.applyBinding(targetElement, ['value', {
      signal: 'device.{#@device-id}',
      target: BindingTarget.property
    }], '', root);
    await flushMicrotasks();
    expect(screenElement['value']).toBe(1);
    expect(targetElement['value']).toBe(3);

    root.setAttribute('device-id', 'two');
    targetElement.setAttribute('device-id', 'four');
    await flushMicrotasks();
    expect(screenElement['value']).toBe(2);
    expect(targetElement['value']).toBe(4);
    expect(handler.unsubscribeCalls).toEqual(['device.one', 'device.three']);

    disposeScreen();
    disposeTarget();
  });

  test('keeps serialization output stable while sharing target-specific logic', () => {
    const helper = new BindingsHelper(new TestVisualizationHandler());
    const element = document.createElement('div');

    expect(helper.serializeBinding(element, 'value', { signal: 'source', target: BindingTarget.property }))
      .toEqual(['bind-prop:value', 'source']);
    expect(helper.serializeBinding(element, 'dataValue', { signal: 'source', target: BindingTarget.attribute }))
      .toEqual(['bind-attr:data-value', 'source']);
    expect(helper.serializeBinding(element, 'isActive', { signal: 'source', target: BindingTarget.class }))
      .toEqual(['bind-class:is-active', 'source']);
    expect(helper.serializeBinding(element, 'backgroundColor', { signal: 'source', target: BindingTarget.css }))
      .toEqual(['bind-css:background-color', 'source']);
    expect(helper.serializeBinding(element, '--mainColor', { signal: 'source', target: BindingTarget.cssvar }))
      .toEqual(['bind-cssvar:main.color', 'source']);
    expect(helper.serializeBinding(element, 'value', {
      signal: 'source',
      converter: { true: 'yes' },
      target: BindingTarget.property
    })).toEqual(['bind-prop:value', '{"signal":"source","converter":{"true":"yes"}}']);
  });

  test('coalesces bursts and skips identical primitive DOM and write-back updates', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('sensor', 1);
    const helper = new BindingsHelper(handler);
    const element = document.createElement('div');
    let writes = 0;
    let renderedValue: any;
    Object.defineProperty(element, 'value', {
      configurable: true,
      get: () => renderedValue,
      set: value => {
        writes++;
        renderedValue = value;
      }
    });

    const dispose = helper.applyBinding(element, ['value', {
      signal: 'sensor',
      writeBackSignal: 'mirror',
      target: BindingTarget.property
    }], '', null);
    await flushMicrotasks();
    expect(writes).toBe(1);
    expect(handler.setStateCalls).toEqual([{ id: 'mirror', value: 1, ack: true }]);

    handler.emit('sensor', 1);
    handler.emit('sensor', 1);
    await flushMicrotasks();
    expect(writes).toBe(1);

    handler.emit('sensor', 2);
    handler.emit('sensor', 3);
    await flushMicrotasks();
    expect(writes).toBe(2);
    expect(renderedValue).toBe(3);
    expect(handler.setStateCalls).toHaveLength(2);
    expect(handler.setStateCalls[1]).toEqual({ id: 'mirror', value: 3, ack: true });
    dispose();
  });

  test('routes all target types through the shared target writer', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('shared', 1);
    const helper = new BindingsHelper(handler);
    const propertyElement = document.createElement('div');
    const attributeElement = document.createElement('div');
    const classElement = document.createElement('div');
    const cssElement = document.createElement('div');
    const cssVarElement = document.createElement('div');
    const visibleElement = document.createElement('div');
    const disposers = [
      helper.applyBinding(propertyElement, ['value', { signal: 'shared', target: BindingTarget.property }], '', null),
      helper.applyBinding(attributeElement, ['data-value', { signal: 'shared', target: BindingTarget.attribute }], '', null),
      helper.applyBinding(classElement, ['active', { signal: 'shared', target: BindingTarget.class }], '', null),
      helper.applyBinding(cssElement, ['opacity', { signal: 'shared', target: BindingTarget.css }], '', null),
      helper.applyBinding(cssVarElement, ['--amount', { signal: 'shared', target: BindingTarget.cssvar }], '', null),
      helper.applyBinding(visibleElement, ['', { signal: 'shared', target: BindingTarget.visible }], '', null)
    ];
    await flushMicrotasks();

    expect(propertyElement['value']).toBe(1);
    expect(attributeElement.getAttribute('data-value')).toBe('1');
    expect(classElement.classList.contains('active')).toBe(true);
    expect(cssElement.style.opacity).toBe('1');
    expect(cssVarElement.style.getPropertyValue('--amount')).toBe('1');
    expect(visibleElement.style.visibility).toBe('');

    handler.emit('shared', 0);
    await flushMicrotasks();
    expect(classElement.classList.contains('active')).toBe(false);
    expect(cssElement.style.opacity).toBe('0');
    expect(visibleElement.style.visibility).toBe('collapse');
    expect(handler.subscribeCalls).toEqual(['shared']);
    for (const dispose of disposers)
      dispose();
  });

  test('removes native two-way listeners on disposal', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('sensor', 1);
    const helper = new BindingsHelper(handler);
    const element = document.createElement('input');
    const dispose = helper.applyBinding(element, ['value', {
      signal: 'sensor',
      twoWay: true,
      events: ['change'],
      type: 'number',
      target: BindingTarget.property
    }], '', null);
    await flushMicrotasks();

    element.value = '5';
    element.dispatchEvent(new Event('change'));
    expect(handler.setStateCalls.at(-1)).toEqual({ id: 'sensor', value: 5, ack: undefined });

    dispose();
    element.value = '6';
    element.dispatchEvent(new Event('change'));
    expect(handler.setStateCalls).toHaveLength(1);
  });

  test('removes TypedEvent two-way listeners on disposal', async () => {
    const { TypedEvent } = await import('@node-projects/base-custom-webcomponent');
    const handler = new TestVisualizationHandler();
    handler.values.set('sensor', 1);
    const helper = new BindingsHelper(handler);
    const element = document.createElement('div');
    element['valueChanged'] = new TypedEvent<void>();
    const dispose = helper.applyBinding(element, ['value', {
      signal: 'sensor',
      twoWay: true,
      events: ['valueChanged'],
      target: BindingTarget.property
    }], '', null);
    await flushMicrotasks();

    element['value'] = 5;
    element['valueChanged'].emit();
    expect(handler.setStateCalls.at(-1)).toEqual({ id: 'sensor', value: 5, ack: undefined });

    dispose();
    element['value'] = 6;
    element['valueChanged'].emit();
    expect(handler.setStateCalls).toHaveLength(1);
  });

  test('removes special-value callbacks and ignores late async values', async () => {
    const handler = new TestVisualizationHandler();
    const helper = new BindingsHelper(handler);
    const element = document.createElement('div');
    let resolveValue: (value: any) => void;
    const specialValueHandler: SpecialValueHandler = {
      valueProvider: () => new Promise(resolve => resolveValue = resolve),
      valueChangedCallbacks: new Map()
    };
    const dispose = helper.applyBinding(element, ['value', {
      signal: '§clock',
      target: BindingTarget.property
    }], '', null, specialValueHandler);

    expect(specialValueHandler.valueChangedCallbacks.get('clock')).toHaveLength(1);
    dispose();
    expect(specialValueHandler.valueChangedCallbacks.has('clock')).toBe(false);
    resolveValue(42);
    await flushMicrotasks();
    expect(element['value']).toBeUndefined();
  });

  test('uses precompiled exact, range, and template converters', async () => {
    const handler = new TestVisualizationHandler();
    handler.values.set('sensor', 5);
    const helper = new BindingsHelper(handler);
    const element = document.createElement('div');
    const dispose = helper.applyBinding(element, ['value', {
      signal: 'sensor',
      converter: {
        '5': 'exact ${__0}',
        '>=10': 'high ${__0}',
        '0-9': 'low'
      },
      target: BindingTarget.property
    }], '', null);
    await flushMicrotasks();
    expect(element['value']).toBe('exact 5');

    handler.emit('sensor', 7);
    await flushMicrotasks();
    expect(element['value']).toBe('low');

    handler.emit('sensor', 12);
    await flushMicrotasks();
    expect(element['value']).toBe('high 12');
    dispose();
  });
});

test('parseBindingString splits without per-character string concatenation', () => {
  expect(parseBindingString('.devices.{room}.{sensor}')).toEqual({
    parts: ['.devices.', '.', ''],
    signals: ['room', 'sensor']
  });
});

test('binding refactoring preserves attribute source prefixes', () => {
  const binding: any = {
    bindableObjectNames: ['screen:?@theme', '#@state', '?$signalObject', '#$signalObject', '##value'],
    target: BindingTarget.property,
    targetName: 'value'
  };
  let savedBinding: any;
  const bindingService = {
    getBindings: () => [binding],
    setBinding: (_designItem: any, value: any) => savedBinding = value
  };
  const designItem: any = { serviceContainer: { bindingService } };
  const service = new VisualizationBindingsRefactorService();
  const refactorings: any[] = service.getRefactorings([designItem]);

  expect(refactorings.map(x => ({ name: x.name, prefix: x.prefix, itemType: x.itemType }))).toEqual([
    { name: 'theme', prefix: '?@', itemType: 'attribute' },
    { name: 'state', prefix: '#@', itemType: 'attribute' },
    { name: 'signalObject', prefix: '?$', itemType: 'signalObject' },
    { name: 'signalObject', prefix: '#$', itemType: 'signalObject' },
    { name: 'value', prefix: '##', itemType: 'property' }
  ]);

  service.refactor(refactorings[0], 'theme', 'palette');
  expect(savedBinding.bindableObjectNames).toEqual(['screen:?@palette', '#@state', '?$signalObject', '#$signalObject', '##value']);
});
