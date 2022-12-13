import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { w3color } from '../../../helper/w3color.js';

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
    if (!value)
      this.element.value = null;
    else {
      let w3Col = w3color.toColorObject(value);
      this.element.value = w3Col.toHexString();
    }
  }
}