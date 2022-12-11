import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { ImageButtonListSelector } from "../../../controls/ImageButtonListSelector.js";
import { PropertiesHelper } from "../services/PropertiesHelper.js";
import { assetsPath } from "../../../../Constants.js";

export class ImageButtonListPropertyEditor extends BasePropertyEditor<ImageButtonListSelector> {

  constructor(property: IProperty) {
    super(property);

    const selector = new ImageButtonListSelector()
    selector.property = property.name;
    selector.unsetValue = property.defaultValue;
    const propName = PropertiesHelper.camelToDashCase(property.name);
    if (property.type == 'enum') {
      for (let v of property.enumValues) {
        let button = document.createElement("button");
        button.dataset.value = <string>v[1];
        let img = document.createElement("img");
        img.title = <string>v[1];
        img.src = assetsPath + 'images/chromeDevtools/' + propName + '-' + v[1] + '-icon.svg';
        button.appendChild(img);
        selector.appendChild(button);
      }
    } else {
      for (let v of property.values) {
        let button = document.createElement("button");
        button.dataset.value = v;
        let img = document.createElement("img");
        img.title = v;
        img.src = assetsPath + 'images/chromeDevtools/' + propName + '-' + v + '-icon.svg';
        button.appendChild(img);
        selector.appendChild(button);
      }
    }
    selector.valueChanged.on((e) => this._valueChanged(e.newValue));
    this.element = selector;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.value = value;
  }
}