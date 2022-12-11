import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { MetricsEditor } from '../../../controls/MetricsEditor.js';

export class MetricsPropertyEditor extends BasePropertyEditor<MetricsEditor> {

  constructor(property: IProperty) {
    super(property);

    const selector = new MetricsEditor()
    selector.property = property.name;
    
    //selector.valueLeftChanged.on((e) => this._valueChanged(e.newValue));
    this.element = selector;
  }

  refreshValue(valueType: ValueType, value: any) {
    //this.element.valueLeft = value;
  }
}