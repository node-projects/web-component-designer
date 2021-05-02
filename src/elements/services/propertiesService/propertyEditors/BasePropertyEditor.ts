import { IPropertyEditorT } from "../IPropertyEditor";
import { IDesignItem } from "../../../..";
import { IProperty } from "../IProperty";
import { ValueType } from '../ValueType';

export abstract class BasePropertyEditor<T extends HTMLElement> implements IPropertyEditorT<T> {

  public element: T;
  public property: IProperty;
  public designItems: IDesignItem[];

  protected disableChangeNotification: boolean = false;

  constructor(property: IProperty) {
    this.property = property;
  }

  protected _valueChanged(newValue) {
    if (!this.disableChangeNotification)
      this.property.service.setValue(this.designItems, this.property, newValue);
  }

  public designItemsChanged(designItems: IDesignItem[]) {
    this.designItems = designItems;
  }

  abstract refreshValue(valueType: ValueType, value: any);

  public refreshValueWithoutNotification(valueType: ValueType, value: any) {
    if (valueType == ValueType.none)
      this.element.style.color = 'lightslategray';
    else
      this.element.style.color = 'white';
    this.disableChangeNotification = true;
    this.refreshValue(valueType, value);
    this.disableChangeNotification = false;
  }
}