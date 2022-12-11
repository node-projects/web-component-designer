import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

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
    this.element.value = value === undefined ? null : value;
  }
}