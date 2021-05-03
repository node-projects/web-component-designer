import { IPropertyEditorT } from "../IPropertyEditor";
import { IDesignItem } from "../../../..";
import { IProperty } from "../IProperty";
import { ValueType } from '../ValueType';
import { PropertyChangeAction } from "../../undoService/transactionItems/PropertyChangeAction";

export abstract class BasePropertyEditor<T extends HTMLElement> implements IPropertyEditorT<T> {

  public element: T;
  public property: IProperty;
  public designItems: IDesignItem[];

  protected disableChangeNotification: boolean = false;

  constructor(property: IProperty) {
    this.property = property;
  }

  protected _valueChanged(newValue) {
    if (!this.disableChangeNotification) {
      if (this.designItems && this.designItems.length) {
        const cg = this.designItems[0].openGroup("set property: " + this.property.name);
        for (let d of this.designItems) {
          const oldValue = this.property.service.getValue([d], this.property);
          const action = new PropertyChangeAction(d, this.property, newValue, oldValue);
          d.instanceServiceContainer.undoService.execute(action);
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
    this.refreshValue(valueType, value);
    this.disableChangeNotification = false;
  }
}