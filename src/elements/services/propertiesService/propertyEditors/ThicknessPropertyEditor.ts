import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { ThicknessEditor } from '../../../controls/ThicknessEditor.js';

export class ThicknessPropertyEditor extends BasePropertyEditor<ThicknessEditor> {

  constructor(property: IProperty) {
    super(property);

    const selector = new ThicknessEditor()
    selector.property = property.name;
    
    selector.valueLeftChanged.on((e) => this._valueChanged(e.newValue));
    this.element = selector;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.valueLeft = value;
  }
}