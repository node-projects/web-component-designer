import { NumericStyleInput } from '../../../controls/NumericStyleInput.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { getCssNumericEditorConfig } from './UnitPropertyEditorConfig.js';

export class UnitPropertyEditor extends BasePropertyEditor<NumericStyleInput> {

  constructor(property: IProperty) {
    super(property);

    const config = getCssNumericEditorConfig(property);
    const selector = new NumericStyleInput();
    selector.units = config?.units ?? property.units ?? [];
    selector.fixedValues = config?.fixedValues ?? property.values;
    selector.unitValueConverter = args => config?.convertValue({ ...args, designItems: this.designItems });
    selector.unitSteps = config?.unitSteps ?? property.unitSteps ?? {};
    selector.step = property.step;
    selector.min = property.min;
    selector.max = property.max;
    selector.readOnly = property.readonly;
    selector.valueChanged.on(async (e) => this._valueChanged(e.newValue === '' ? null : e.newValue));
    selector.valuePreviewChanged.on(async (e) => this._previewValueChanged(e.newValue === '' ? null : e.newValue));
    selector.valuePreviewFinished.on(async (e) => {
      await this._removePreviewValue();
      if (e.wasCancelled)
        return;
      await this._valueChanged(e.newValue === '' ? null : e.newValue);
    });
    if (config?.addon) {
      const thisEditor = this;
      const context = {
        property,
        get value() {
          return selector.value;
        },
        get designItems() {
          return thisEditor.designItems;
        },
        setValue: async (value: string | null) => {
          selector.value = value ?? '';
          await this._valueChanged(value);
        },
        previewValue: async (value: string | null) => {
          selector.value = value ?? '';
          await this._previewValueChanged(value);
        },
        removePreviewValue: async () => this._removePreviewValue()
      };
      selector.addon = config.addon(context);
    }
    this.element = selector;
  }

  public override designItemsChanged(designItems: IDesignItem[]) {
    super.designItemsChanged(designItems);
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.value = value == null ? '' : String(value);
  }
}
