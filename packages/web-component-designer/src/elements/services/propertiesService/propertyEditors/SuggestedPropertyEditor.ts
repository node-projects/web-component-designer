import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

/** Editable values with an unfiltered native dropdown for suggestions. */
export class SuggestedPropertyEditor extends BasePropertyEditor<HTMLDivElement> {
  private _input: HTMLInputElement;
  private _select: HTMLSelectElement;

  constructor(property: IProperty) {
    super(property);
    this.element = document.createElement('div');
    this.element.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) 22px;align-items:stretch;min-width:0';
    this._input = document.createElement('input');
    this._input.type = 'text';
    this._input.readOnly = !!property.readonly;
    this._input.setAttribute('aria-label', property.displayName || property.name);
    this._input.style.cssText = 'width:100%;min-width:0;border:0;background:transparent;height:100%';
    this._input.onfocus = () => this._input.select();
    this._input.onkeydown = event => {
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        this._input.blur();
      }
    };
    this._input.onchange = () => {
      this._syncSelect();
      void this._valueChanged(this._input.value);
    };
    this._select = document.createElement('select');
    this._select.setAttribute('aria-label', (property.displayName || property.name) + ' suggestions');
    this._select.title = 'Choose a suggested value';
    this._select.disabled = !!property.readonly;
    this._select.style.cssText = 'width:22px;min-width:0;padding:0;border:0;background:transparent;height:100%;text-indent:-9999px;cursor:pointer';
    const custom = document.createElement('option');
    custom.value = '';
    custom.textContent = 'Custom value';
    custom.disabled = true;
    this._select.append(custom);
    for (const value of property.values ?? []) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      option.style.textIndent = '0';
      this._select.append(option);
    }
    this._select.onchange = () => {
      this._input.value = this._select.value;
      void this._valueChanged(this._input.value);
    };
    this.element.append(this._input, this._select);
  }

  private _syncSelect() {
    this._select.value = this._input.value;
    if (this._select.selectedIndex < 0) this._select.selectedIndex = 0;
  }

  refreshValue(valueType: ValueType, value: any) {
    this._input.value = value == null ? '' : String(value);
    this._syncSelect();
  }
}
