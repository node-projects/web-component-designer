import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class FontPropertyEditor extends BasePropertyEditor<HTMLSelectElement> {

  static fontList: string[];
  constructor(property: IProperty) {
    super(property);

    let element = document.createElement("select");
    if (property.readonly)
      element.disabled = true;
    this.element = element;

    FontPropertyEditor.addFontsToSelect(element);
    this.element.onchange = (e) => this._valueChanged(this.element.value);
  }

  static async addFontsToSelect(select: HTMLSelectElement) {
    if (!FontPropertyEditor.fontList) {
      try {
        //@ts-ignore
        if (window.queryLocalFonts) {
          //@ts-ignore
          const fonts = await window.queryLocalFonts();
          //@ts-ignore
          FontPropertyEditor.fontList = [...new Set(fonts.map(y => y.family))];
        }
      } catch {
        // Use the default fonts when local font access is denied or blocked.
      }
      if (!FontPropertyEditor.fontList?.length)
        FontPropertyEditor.fontList = ["Verdana", "Arial", "Tahoma", "Trebuchet MS", "Times New Roman", "Georgia", "Garamond", "Courier New", "Brush Script MT"];
    }
    FontPropertyEditor.parseFontList(select);
  }

  private static parseFontList(select: HTMLSelectElement) {
    for (let v of FontPropertyEditor.fontList) {
      let option = document.createElement("option");
      option.value = <any>v;
      option.text = v;
      select.appendChild(option);
    }

  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.value = value;
  }
}