import { IPropertyEditorT } from '../IPropertyEditor.js';
import { IProperty } from '../IProperty.js';
import { ValueType } from '../ValueType.js';
import { IDesignItem } from '../../../item/IDesignItem.js';

export abstract class BasePropertyEditor<T extends HTMLElement> implements IPropertyEditorT<T> {

  public element: T;
  public property: IProperty;
  public designItems: IDesignItem[];

  protected disableChangeNotification: boolean = false;

  constructor(property: IProperty) {
    this.property = property;
  }

  protected async _valueChanged(newValue) {
    if (!this.disableChangeNotification) {
      if (this.designItems && this.designItems.length) {
        const cg = this.designItems[0].openGroup("set property: " + this.property.name);
        for (let d of this.designItems) {
          if (newValue == null)
            this.property.service.clearValue([d], this.property, 'value');
          else
            await this.property.service.setValue([d], this.property, newValue);
        }
        cg.commit();
      }
    }
  }

  public designItemsChanged(designItems: IDesignItem[]) {
    this.designItems = designItems;
  }

  abstract refreshValue(valueType: ValueType, value: any);

  public refreshValueWithoutNotification(valueType: ValueType, value: any) {
    if (valueType == ValueType.none)
      this.element.classList.add('unset-value');
    else
      this.element.classList.remove('unset-value');
    this.disableChangeNotification = true;
    try {
      this.refreshValue(valueType, value);
    } catch (err) {
      console.error(err);
    }
    this.disableChangeNotification = false;
  }
}