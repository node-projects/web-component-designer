import { IProperty } from '../../IProperty.js';
import { BasePropertyEditor } from '../BasePropertyEditor.js';
import { ValueType } from '../../ValueType.js';
import { MetricsEditor, MetricsEditorValueChangedEventArgs } from '../../../../controls/MetricsEditor.js';
import { PropertyType } from '../../PropertyType.js';

export class MetricsPropertyEditor extends BasePropertyEditor<MetricsEditor> {

  constructor(property: IProperty) {
    super(property);

    const selector = new MetricsEditor()
    selector.property = property.name;
    selector.style.height = 'auto';
    selector.style.border = 'none';
    selector.style.margin = '2px 0';
    selector.addEventListener('value-changed', (event: CustomEvent<MetricsEditorValueChangedEventArgs>) => this._metricValueChanged(event.detail));
    this.element = selector;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.refresh(this.designItems?.[0]?.element)
  }

  private async _metricValueChanged(detail: MetricsEditorValueChangedEventArgs) {
    if (!detail?.property || !this.designItems?.length || this.disableChangeNotification)
      return;

    const cssProperty: IProperty = {
      ...this.property,
      name: detail.property,
      propertyName: detail.property,
      propertyType: PropertyType.cssValue,
      type: 'css-length'
    };

    const value = detail.newValue == null || detail.newValue === '' || detail.newValue === this.element.unsetValue
      ? null
      : detail.newValue;

    if (value == null)
      this.property.service.clearValue(this.designItems, cssProperty, 'value');
    else
      await this.property.service.setValue(this.designItems, cssProperty, value);

    this.designItems[0].instanceServiceContainer?.designerCanvas?.extensionManager?.refreshAllExtensions(this.designItems);
  }
}
