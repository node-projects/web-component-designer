export class DesignItem {
  constructor(element, serviceContainer, instanceServiceContainer) {
    this.element = element;
    this.serviceContainer = serviceContainer;
    this.instanceServiceContainer = instanceServiceContainer;
  }

  static GetOrCreateDesignItem(element, serviceContainer, instanceServiceContainer) {
    if (!element) return null;
    let designItem = element[DesignItem._designItemSymbol];

    if (!designItem) {
      designItem = new DesignItem(element, serviceContainer, instanceServiceContainer);
      element[DesignItem._designItemSymbol] = designItem;
    }

    return designItem;
  }

  static RemoveDesignItemFromElement(element) {
    if (!element) return null;
    delete element[DesignItem._designItemSymbol];
  }

}
DesignItem._designItemSymbol = Symbol('DesignItem');