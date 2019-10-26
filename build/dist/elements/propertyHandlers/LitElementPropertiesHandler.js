export class LitElementPropertiesHandler {
  isHandledElement(element) {
    let proto = element.constructor.__proto__;

    while (proto != null) {
      if (proto.name == 'LitElement') return true;
      if (proto.name == undefined || proto.name == 'HTMLElement' || proto.name == 'Element' || proto.name == 'Node' || proto.name == 'HTMLElement') return false;
      proto = proto.__proto__;
    }

    return false;
  }

  getProperties(element) {
    let list = element.constructor._classProperties;

    for (const litProperty of list) {}

    return null;
  }

}