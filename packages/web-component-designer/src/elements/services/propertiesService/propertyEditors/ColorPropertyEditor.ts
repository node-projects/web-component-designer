import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { ColorInput } from '../../../controls/ColorEditor.js';

export class ColorPropertyEditor extends BasePropertyEditor<ColorInput> {
  constructor(property: IProperty) {
    super(property);

    let element = document.createElement('node-projects-color-input') as ColorInput;
    if (property.readonly)
      element.readOnly = true;
    element.onchange = async (e) => {
      await this.property.service.removePreviewValue?.(this.designItems, this.property);
      this._valueChanged(element.value);
    };
    element.oninput = async (e) => {
      await this.property.service.previewValue?.(this.designItems, this.property, element.value);
    };
    this.element = element;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (!value)
      this.element.value = 'rgba(0, 0, 0, 1)';
    else
      this.element.value = value;
  }
}
