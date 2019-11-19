export class LitElementPropertiesService {
  constructor() {
    this.name = "lit";
  }

  isHandledElement(designItem) {
    let proto = designItem.element.constructor.__proto__;

    while (proto != null) {
      if (proto.name == 'LitElement') return true;
      if (proto.name == undefined || proto.name == 'HTMLElement' || proto.name == 'Element' || proto.name == 'Node' || proto.name == 'HTMLElement') return false;
      proto = proto.__proto__;
    }

    return false;
  }

  getProperties(designItem) {
    if (!this.isHandledElement(designItem)) return null;
    let list = designItem.element.constructor._classProperties; // @ts-ignore

    for (const litProperty of list) {}

    return null;
  }

  setValue(designItem, property, value) {}

  getValue(designItem, property) {
    return null;
  }

}