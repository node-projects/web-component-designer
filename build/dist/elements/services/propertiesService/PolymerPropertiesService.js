export class PolymerPropertiesService {
  constructor() {
    this.name = "polymer";
    /*private _camelToDashCase(text: string){
        return text.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
    }*/
  }

  isHandledElement(designItem) {
    return designItem.element.constructor.polymerElementVersion != null;
  }

  getProperties(designItem) {
    if (!this.isHandledElement(designItem)) return null;
    let properties = [];
    let list = designItem.element.constructor.properties;

    for (const name in list) {
      const polymerProperty = list[name];

      if (polymerProperty === String) {
        let property = {
          name: name,
          type: "string",
          service: this
        };
        properties.push(property);
      } else if (polymerProperty === Object) {
        let property = {
          name: name,
          type: "string",
          service: this
        };
        properties.push(property);
      } else if (polymerProperty === Number) {
        let property = {
          name: name,
          type: "number",
          service: this
        };
        properties.push(property);
      } else if (polymerProperty === Date) {
        let property = {
          name: name,
          type: "date",
          service: this
        };
        properties.push(property);
      } else {
        if (polymerProperty.type === String) {
          let property = {
            name: name,
            type: "string",
            service: this
          };
          properties.push(property);
        } else if (polymerProperty.type === Object) {
          let property = {
            name: name,
            type: "string",
            service: this
          };
          properties.push(property);
        } else if (polymerProperty.type === Number) {
          let property = {
            name: name,
            type: "number",
            service: this
          };
          properties.push(property);
        } else if (polymerProperty.type === Date) {
          let property = {
            name: name,
            type: "date",
            service: this
          };
          properties.push(property);
        } else {
          let property = {
            name: name,
            type: "string",
            service: this
          };
          properties.push(property);
        }
      }
    }

    return properties;
  }

  setValue(designItem, property, value) {//let oldValue = (<HTMLElement>designItem.element)[property.name];
    //let doFunc = () => (<HTMLElement>designItem.element).setAttribute(this._camelToDashCase(property.name), value);
    //let undoFunc = () => (<HTMLElement>designItem.element).setAttribute(this._camelToDashCase(property.name), oldValue);

    /*serviceContainer.actionHistory.add(UndoItemType.Update, this.activeElement,
        {
          type: detail.type, name: detail.name,
          new: { value: detail.value },
          old: { value: oldValue }
        });*/
  }

  getValue(designItem, property) {
    return designItem.element[property.name];
  }

}