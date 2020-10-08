import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";

export class NumberPropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);
   
    let element = document.createElement('input');
    element.type = "number";
    element.min = <string><any>property.min;
    element.max = <string><any>property.max;
    element.step = <string><any>property.step;
    element.onchange = (e) => this._valueChanged(element.value);
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (valueType == 'none')
      this.element.value = null;
    else
      this.element.value = value;
  }
}