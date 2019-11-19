export class PolymerPropertiesService {
  isHandledElement(element) {
    return element.constructor.polymerElementVersion != null;
  }

  getProperties(element) {
    let properties = [];
    let list = element.constructor.properties;

    for (const name in list) {
      const polymerProperty = list[name];

      if (polymerProperty === String) {
        let property = {
          name: name,
          type: "string"
        };
        properties.push(property);
      } else if (polymerProperty === Object) {
        let property = {
          name: name,
          type: "string"
        };
        properties.push(property);
      } else if (polymerProperty === Number) {
        let property = {
          name: name,
          type: "number"
        };
        properties.push(property);
      } else if (polymerProperty === Date) {
        let property = {
          name: name,
          type: "date"
        };
        properties.push(property);
      } else {
        if (polymerProperty.type === String) {
          let property = {
            name: name,
            type: "string"
          };
          properties.push(property);
        } else if (polymerProperty.type === Object) {
          let property = {
            name: name,
            type: "string"
          };
          properties.push(property);
        } else if (polymerProperty.type === Number) {
          let property = {
            name: name,
            type: "number"
          };
          properties.push(property);
        } else if (polymerProperty.type === Date) {
          let property = {
            name: name,
            type: "date"
          };
          properties.push(property);
        } else {
          let property = {
            name: name,
            type: "string"
          };
          properties.push(property);
        }
      }
    }

    return properties;
  }

}