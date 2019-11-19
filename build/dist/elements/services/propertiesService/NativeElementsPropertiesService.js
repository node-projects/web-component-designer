export class NativeElementsPropertiesService {
  constructor() {
    this.name = "native";
  }

  isHandledElement(designItem) {
    switch (designItem.element.localName) {
      case 'input':
      case 'button':
      case 'a':
      case 'div':
        return true;
    }

    return false;
  }

  getProperties(designItem) {
    if (!this.isHandledElement(designItem)) return null;
    return null;
  }

  setValue(designItem, property, value) {}

  getValue(designItem, property) {
    return null;
  }

}