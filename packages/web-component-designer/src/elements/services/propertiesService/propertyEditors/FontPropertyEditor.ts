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

  static addFontsToSelect(select: HTMLSelectElement) {
    if (FontPropertyEditor.fontList) {
      FontPropertyEditor.parseFontList(select);
      //@ts-ignore
    } else if (window.queryLocalFonts) {
      //@ts-ignore
      window.queryLocalFonts().then(x => {
        //@ts-ignore
        FontPropertyEditor.fontList = [...new Set(x.map(y => y.family))];
        FontPropertyEditor.parseFontList(select);
      })
    } else {
      FontPropertyEditor.fontList = ["Verdana", "Arial", "Tahoma", "Trebuchet MS", "Times New Roman", "Georgia", "Garamond", "Courier New", "Brush Script MT"];
      FontPropertyEditor.parseFontList(select);
    }
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