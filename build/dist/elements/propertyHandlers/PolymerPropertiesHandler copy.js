export class PolymerPropertiesHandler {
  isHandledElement(element) {
    return element.constructor.polymerElementVersion != null;
  }

  getProperties(element) {
    let list = element.constructor.properties;

    for (const name in list) {
      const polymerProperty = list[name]; //polymerProperty.type
    }

    return null;
  }

}