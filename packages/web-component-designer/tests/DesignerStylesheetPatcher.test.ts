/**
 * @jest-environment jsdom
 */
import { expect, jest, test } from '@jest/globals';
import { patchStylesheetSelectorForDesigner } from '../src/elements/helper/DesignerStylesheetPatcher';

test('patches virtual root and forced pseudo classes for designer rendering', () => {
  const css = [
    ':root { --accent: red; }',
    '.button:hover { color: blue; }',
    '.field:focus-visible { outline: 1px solid red; }',
    '.wrapper:focus-within { border-color: green; }'
  ].join('\n');

  expect(patchStylesheetSelectorForDesigner(css, {
    forceHoverAttributeName: 'node-projects-force-hover',
    forceActiveAttributeName: 'node-projects-force-active',
    forceVisitedAttributeName: 'node-projects-force-visited',
    forceFocusAttributeName: 'node-projects-force-focus',
    forceFocusWithinAttributeName: 'node-projects-force-focus-within',
    forceFocusVisibleAttributeName: 'node-projects-force-focus-visible'
  })).toBe([
    ':host { --accent: red; }',
    '.button[node-projects-force-hover] { color: blue; }',
    '.field[node-projects-force-focus-visible] { outline: 1px solid red; }',
    '.wrapper[node-projects-force-focus-within] { border-color: green; }'
  ].join('\n'));
});

test('style design items patch rendered text without changing original content', async () => {
  if (!CSSStyleSheet.prototype.replaceSync)
    Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', { value() { } });
  const { DesignItem } = await import('../src/elements/item/DesignItem');
  const { StyleElementRenderedDesignItemService } = await import('../src/elements/services/renderedDesignItemService/StyleElementRenderedDesignItemService');

  const originalCss = ':root { --accent: red; }\n.button:hover { color: blue; }';
  const host = document.createElement('test-host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${originalCss}</style><div class="button"></div>`;
  const template = document.createElement('template');
  template.setAttribute('shadowrootmode', 'open');
  const style = document.createElement('style');
  style.textContent = originalCss;
  template.content.appendChild(style);

  const instanceServiceContainer = {
    designerCanvas: {
      lazyTriggerReparseDocumentStylesheets: jest.fn()
    }
  } as any;
  const serviceContainer = {
    renderedDesignItemServices: [new StyleElementRenderedDesignItemService()]
  } as any;
  const hostDesignItem = new DesignItem(host, host, serviceContainer, instanceServiceContainer);
  const templateDesignItem = new DesignItem(template, template, serviceContainer, instanceServiceContainer);
  (templateDesignItem as any)._attributes.set('shadowrootmode', 'open');
  const styleDesignItem = new DesignItem(style, style, serviceContainer, instanceServiceContainer);
  const textDesignItem = new DesignItem(style.firstChild, style.firstChild, serviceContainer, instanceServiceContainer);
  (hostDesignItem as any)._childArray = [templateDesignItem];
  (templateDesignItem as any)._parent = hostDesignItem;
  (templateDesignItem as any)._childArray = [styleDesignItem];
  (styleDesignItem as any)._parent = templateDesignItem;
  (styleDesignItem as any)._childArray = [textDesignItem];
  (textDesignItem as any)._parent = styleDesignItem;

  styleDesignItem.refreshRenderedDesignItem();

  expect(style.textContent).toBe(':host { --accent: red; }\n.button[node-projects-force-hover] { color: blue; }');
  expect(shadow.querySelector('style').textContent).toBe(':host { --accent: red; }\n.button[node-projects-force-hover] { color: blue; }');
  expect(styleDesignItem.content).toBe(originalCss);
  expect(instanceServiceContainer.designerCanvas.lazyTriggerReparseDocumentStylesheets).toHaveBeenCalledTimes(1);
});
