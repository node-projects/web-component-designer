import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";

export class TextPropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('input');
    element.type = "text";
    element.onchange = (e) => this._valueChanged(element.value);
    element.onfocus = (e) => {
      element.selectionStart = 0;
      element.selectionEnd = element.value?.length;
    }
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (value == null)
      this.element.value = "";
    else
      this.element.value = value;
  }
}