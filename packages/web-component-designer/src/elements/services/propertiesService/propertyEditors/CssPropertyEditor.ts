import { IDesignItem } from '../../../item/IDesignItem.js';
import { appendCssImportant, splitCssImportant } from '../../../helper/CssImportant.js';
import { IPropertiesService } from '../IPropertiesService.js';
import { IProperty } from '../IProperty.js';
import { IPropertyEditor } from '../IPropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class CssPropertyEditor implements IPropertyEditor {
  public element: HTMLDivElement;
  public property: IProperty;
  public designItems: IDesignItem[];

  private _innerEditor: IPropertyEditor;
  private _importantButton: HTMLButtonElement;
  private _value: any;
  private _disableChangeNotification = false;

  constructor(property: IProperty, createInnerEditor: (property: IProperty) => IPropertyEditor) {
    this.property = property;

    const innerProperty = {
      ...property,
      service: this._createServiceProxy(property.service)
    };
    this._innerEditor = createInnerEditor(innerProperty);

    this._importantButton = document.createElement('button');
    this._importantButton.type = 'button';
    this._importantButton.textContent = '!';
    this._importantButton.title = '!important';
    this._importantButton.disabled = property.readonly === true;
    this._importantButton.style.width = '18px';
    this._importantButton.style.height = '18px';
    this._importantButton.style.margin = '-2px 0 0 -2px';
    this._importantButton.style.padding = '0';
    this._importantButton.style.border = '1px solid var(--input-border-color, #596c7a)';
    this._importantButton.style.background = 'transparent';
    this._importantButton.style.color = 'lightslategray';
    this._importantButton.style.fontWeight = 'bold';
    this._importantButton.style.lineHeight = '16px';
    this._importantButton.style.cursor = 'pointer';
    this._importantButton.onclick = async () => {
      if (this._disableChangeNotification || !this.designItems?.length || this._value == null || this._value === '')
        return;

      this._setImportant(!this._isImportant());
      await this.property.service.setValue(this.designItems, this.property, this._appendImportant(this._value));
      this.designItems[0].instanceServiceContainer.designerCanvas.extensionManager.refreshAllExtensions(this.designItems);
    };

    this.element = document.createElement('div');
    this.element.style.display = 'grid';
    this.element.style.gridTemplateColumns = 'minmax(0, 1fr) 18px';
    this.element.style.alignItems = 'center';
    this.element.style.gap = '2px';
    this.element.appendChild(this._innerEditor.element);
    this.element.appendChild(this._importantButton);
  }

  private _createServiceProxy(service: IPropertiesService): IPropertiesService {
    const proxy = Object.create(service);
    proxy.setValue = async (designItems, property, value) =>
      service.setValue(designItems, this.property, this._appendImportant(value));
    proxy.previewValue = async (designItems, property, value) =>
      service.previewValue?.(designItems, this.property, this._appendImportant(value));
    proxy.removePreviewValue = async (designItems, property) =>
      service.removePreviewValue?.(designItems, this.property);
    proxy.clearValue = (designItems, property, clearType) =>
      service.clearValue(designItems, this.property, clearType);
    return proxy;
  }

  private _appendImportant(value: any) {
    if (typeof value !== 'string')
      return value;

    this._value = value;
    return appendCssImportant(value, this._isImportant());
  }

  public designItemsChanged(designItems: IDesignItem[]) {
    this.designItems = designItems;
    this._innerEditor.designItemsChanged(designItems);
  }

  private _refreshImportant(valueType: ValueType, value: any) {
    const parsedValue = typeof value === 'string' ? splitCssImportant(value) : { value, important: false };
    this._value = parsedValue.value;
    this._setImportant(parsedValue.important);
    this._importantButton.disabled = this.property.readonly === true || valueType == ValueType.none || parsedValue.value == null || parsedValue.value === '';
    this._importantButton.style.cursor = this._importantButton.disabled ? 'default' : 'pointer';
  }

  private _isImportant() {
    return this._importantButton.dataset.checked === 'true';
  }

  private _setImportant(important: boolean) {
    this._importantButton.dataset.checked = important ? 'true' : 'false';
    this._importantButton.style.background = important ? 'orange' : 'transparent';
    this._importantButton.style.color = important ? 'black' : 'lightslategray';
  }

  refreshValue(valueType: ValueType, value: any) {
    this._refreshImportant(valueType, value);
    this._innerEditor.refreshValue(valueType, this._value);
  }

  public refreshValueWithoutNotification(valueType: ValueType, value: any) {
    if (valueType == ValueType.none)
      this.element.classList.add('unset-value');
    else
      this.element.classList.remove('unset-value');

    this._disableChangeNotification = true;
    try {
      this._refreshImportant(valueType, value);
      this._innerEditor.refreshValueWithoutNotification(valueType, this._value);
    } catch (err) {
      console.error(err);
    }
    this._disableChangeNotification = false;
  }
}
