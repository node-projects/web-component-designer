import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class AnglePropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('input');
    element.type = "number";
    if (property.readonly)
      element.readOnly = true;
    element.min = <string><any>property.min ?? '0';
    element.max = <string><any>property.max ?? '360';
    element.step = <string><any>property.step;
    element.onchange = (e) => this._valueChanged(element.value == '' ? null : (element.valueAsNumber + 'deg'));
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.valueAsNumber = value === undefined ? null : parseFloat(value);
  }
}