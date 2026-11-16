import type { ServiceContainer } from '../ServiceContainer.js';
import { DefaultTranslationService } from './DefaultTranslationService.js';

const owners = new WeakMap<Node, ServiceContainer>();
const fallback = new DefaultTranslationService();

export function setDesignerUiTranslation(element: Element, key: string, attribute = 'text', params?: Readonly<Record<string, string>>) {
  element.setAttribute('data-wcd-i18n-' + attribute, key);
  if (params) element.setAttribute('data-wcd-i18n-params', JSON.stringify(params));
  else element.removeAttribute('data-wcd-i18n-params');
  const value = designerTranslation(element).translate(key, params);
  if (attribute === 'text') element.textContent = value;
  else element.setAttribute(attribute, value);
}

/** Finds the host translator for a designer UI control, including controls in nested shadow roots. */
export function designerTranslation(element: Node) {
  return designerUiServiceContainer(element)?.translationService ?? fallback;
}

export function designerUiServiceContainer(element: Node): ServiceContainer | undefined {
  for (let node = element; node; node = node.parentNode ?? (node as ShadowRoot).host) {
    const owner = owners.get(node);
    if (owner) return owner;
  }
  return undefined;
}

/** Bind explicitly marked UI labels only. Input values and the editable canvas are never traversed. */
export function bindDesignerUiTranslation(root: Node & ParentNode, container: ServiceContainer): { dispose(): void } {
  let disposed = false;
  let language: { dispose(): void };
  const observers = new Map<Node, MutationObserver>();
  owners.set(root, container);
  const refresh = () => {
    if (disposed) return;
    const visit = (scope: Node & ParentNode) => {
      const owner = owners.get(scope);
      if (owner && owner !== container) return;
      if (!observers.has(scope)) {
        const Observer = scope.ownerDocument?.defaultView?.MutationObserver ?? MutationObserver;
        const observer = new Observer(refresh);
        observer.observe(scope, { childList: true, subtree: true, attributes: true,
          attributeFilter: ['data-wcd-i18n-text', 'data-wcd-i18n-title', 'data-wcd-i18n-placeholder', 'data-wcd-i18n-aria-label', 'data-wcd-i18n-params'] });
        observers.set(scope, observer);
      }
      const walk = (element: Element) => {
        // Document and third-party editor contents have their own text and lifecycle.
        if (element.id === 'placeholder' || element.id === 'node-projects-designer-canvas-canvas'
          || element.localName === 'node-projects-designer-canvas' || /code-view|codeview/.test(element.localName)) return;
        for (const attribute of ['text', 'title', 'placeholder', 'aria-label']) {
          const key = element.getAttribute('data-wcd-i18n-' + attribute);
          if (key == null) continue;
          const params = element.getAttribute('data-wcd-i18n-params');
          const value = container.translationService.translate(key, params ? JSON.parse(params) : undefined);
          if (attribute === 'text') {
            if (element.textContent !== value) element.textContent = value;
          } else if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
        }
        if (element.shadowRoot) visit(element.shadowRoot);
        for (const child of [...element.children]) walk(child);
      };
      if (scope.nodeType === 1) walk(scope as Element);
      else for (const child of [...scope.children]) walk(child);
    };
    visit(root);
    for (const [scope, observer] of observers) {
      if (root.isConnected && scope !== root && !(scope as ShadowRoot).host?.isConnected) { observer.disconnect(); observers.delete(scope); }
    }
  };
  const subscribe = () => {
    language?.dispose();
    language = container.translationService.languageChanged?.on(refresh);
    refresh();
  };
  const services = container.servicesChanged.on(event => { if (event.serviceName === 'translationService') subscribe(); });
  subscribe();
  return { dispose() {
    disposed = true; language?.dispose(); services.dispose(); owners.delete(root);
    for (const observer of observers.values()) observer.disconnect();
    observers.clear();
  } };
}
