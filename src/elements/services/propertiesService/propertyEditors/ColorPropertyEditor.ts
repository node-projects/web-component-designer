import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";
import { w3color } from "../../../helper/w3color";

export class ColorPropertyEditor extends BasePropertyEditor<HTMLInputElement> {
  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('input');
    element.type = 'color'
    element.onchange = (e) => {
      let w3Col = w3color.toColorObject(element.value);
      this._valueChanged(w3Col.toNameOrHexString())
    };
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (valueType == 'none')
      this.element.value = '#000000';
    else {
      let w3Col = w3color.toColorObject(value);
      this.element.value = w3Col.toHexString();
    }
  }
}