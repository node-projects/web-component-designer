/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from '@jest/globals';
import type { ServiceContainer } from '../src/elements/services/ServiceContainer';

CSSStyleSheet.prototype.replaceSync = function () { };
Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', { writable: true, value: [] });
globalThis.ResizeObserver = class { observe() { } unobserve() { } disconnect() { } };

const { ColorInput, ExtendedColorEditor } = await import('../src/elements/controls/ColorEditor');
const { bindDesignerUiTranslation } = await import('../src/elements/services/translationService/DesignerUiTranslation');

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

test('designer color inputs use the configured picker and commit named CSS colors', async () => {
  const storage = { load: jest.fn(() => [null, '#aabbcc']), save: jest.fn() };
  const container = {
    options: { colorEditor: 'basic', colorPaletteStorage: storage },
    servicesChanged: { on: () => ({ dispose() { } }) },
    translationService: { translate: (key: string) => key }
  };
  const input = new ColorInput();
  input.setAttribute('allow-none', '');
  document.body.append(input);
  const binding = bindDesignerUiTranslation(input, container as unknown as ServiceContainer);
  try {
    await settle();
    const button = input.shadowRoot.querySelector('button');
    button.click();
    expect(document.querySelector('node-projects-color-editor')).not.toBeNull();
    expect(storage.load).not.toHaveBeenCalled();
    button.click();

    container.options.colorEditor = 'extended';
    const change = jest.fn();
    input.addEventListener('change', change);
    button.click();
    await settle();
    const editor = document.querySelector('node-projects-extended-color-editor');
    const names = editor.shadowRoot.querySelector<HTMLDetailsElement>('#named-colors');
    const options = names.querySelectorAll('button');
    const slots = editor.shadowRoot.querySelectorAll<HTMLButtonElement>('#saved-colors button');
    const save = editor.shadowRoot.querySelector<HTMLButtonElement>('#save-color');
    expect(options).toHaveLength(149);
    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(save.disabled).toBe(true);
    slots[15].click();
    expect(slots[15].getAttribute('aria-pressed')).toBe('true');
    expect(save.disabled).toBe(false);

    names.open = true;
    const purple = [...options].find(option => option.textContent === 'rebeccapurple');
    expect(purple.querySelector('span').style.getPropertyValue('--palette-swatch')).toBe('rebeccapurple');
    purple.click();
    expect(input.value).toBe('rebeccapurple');
    expect(names.open).toBe(false);
    expect(change).toHaveBeenCalledTimes(2);

    save.click();
    await settle();
    expect(storage.save).toHaveBeenCalledWith(15, 'rebeccapurple');
    expect(change).toHaveBeenCalledTimes(2);

    slots[1].click();
    expect(input.value).toBe('#aabbcc');
    expect(slots[15].getAttribute('aria-pressed')).toBe('false');
    const noPaint = editor.shadowRoot.querySelector<HTMLButtonElement>('#no-paint');
    expect(noPaint.getAttribute('aria-label')).toBe('No paint');
    expect(noPaint.textContent).toBe('');
    noPaint.click();
    expect(input.value).toBe('none');
  } finally {
    binding.dispose();
  }
});

test('browser storage restores independent slots in a new picker', async () => {
  const first = new ExtendedColorEditor();
  const second = new ExtendedColorEditor();
  document.body.append(first, second);
  await settle();
  for (const [slot, editor] of [first, second].entries()) {
    editor.shadowRoot.querySelectorAll<HTMLButtonElement>('#saved-colors button')[slot].click();
    editor.value = slot === 0 ? '#123456' : 'rgba(4, 5, 6, 0.5)';
    editor.shadowRoot.querySelector<HTMLButtonElement>('#save-color').click();
  }
  await settle();

  const reopened = new ExtendedColorEditor();
  document.body.append(reopened);
  await settle();
  const slots = reopened.shadowRoot.querySelectorAll<HTMLButtonElement>('#saved-colors button');
  expect(slots).toHaveLength(16);
  expect([...slots].every(slot => !slot.textContent && !slot.disabled)).toBe(true);
  slots[0].click();
  expect(reopened.value).toBe('rgb(18, 52, 86)');
  slots[1].click();
  expect(reopened.value).toBe('rgba(4, 5, 6, 0.5)');
  expect(slots[1].style.getPropertyValue('--palette-swatch')).toBe('rgba(4, 5, 6, 0.5)');
  slots[2].click();
  expect(reopened.value).toBe('#800000');
});
