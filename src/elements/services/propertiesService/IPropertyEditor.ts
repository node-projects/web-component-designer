import { IDesignItem } from "../../item/IDesignItem";
import { IProperty } from "./IProperty";
import { ValueType } from "./ValueType";

export interface IPropertyEditor {
  readonly element: Element;
  property: IProperty;
  designItems: IDesignItem[];
  designItemsChanged(designItems: IDesignItem[]);
  refreshValue(valueType: ValueType, value: any);
  refreshValueWithoutNotification(valueType: ValueType, value: any);
}

export interface IPropertyEditorT<T extends Element> extends IPropertyEditor {
  readonly element: T;
  property: IProperty;
  designItems: IDesignItem[];
  designItemsChanged(designItems: IDesignItem[]);
  refreshValue(valueType: ValueType, value: any);
  refreshValueWithoutNotification(valueType: ValueType, value: any);
}