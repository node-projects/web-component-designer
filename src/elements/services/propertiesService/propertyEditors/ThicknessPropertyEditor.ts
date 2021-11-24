import { IProperty } from "../IProperty";
import { BasePropertyEditor } from './BasePropertyEditor';
import { ValueType } from "../ValueType";
import { ThicknessEditor } from '../../../controls/ThicknessEditor';

export class ThicknessPropertyEditor extends BasePropertyEditor<ThicknessEditor> {

  constructor(property: IProperty) {
    super(property);

    const selector = new ThicknessEditor()
    selector.property = property.name;
    
    selector.valueChanged.on((e) => this._valueChanged(e.newValue));
    this.element = selector;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.value = value;
  }
}