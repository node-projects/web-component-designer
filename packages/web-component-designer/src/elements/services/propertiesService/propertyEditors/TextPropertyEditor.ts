import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class TextPropertyEditor extends BasePropertyEditor<HTMLInputElement> {

  private static _nextListId = 0;

  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('input');
    element.type = "text";
    if (property.readonly)
      element.readOnly = true;

    if (property.values?.length) {
      const listId = `wcd-text-property-editor-values-${TextPropertyEditor._nextListId++}`;
      const datalist = document.createElement('datalist');
      datalist.id = listId;

      for (const value of property.values) {
        const option = document.createElement('option');
        option.value = value;
        datalist.appendChild(option);
      }

      element.setAttribute('list', listId);
      element.appendChild(datalist);
    }

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