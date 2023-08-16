import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';

export class FontPropertyEditor extends BasePropertyEditor<HTMLSelectElement> {

  static fontList: string[];
  constructor(property: IProperty) {
    super(property);

    let element = document.createElement("select");
    this.element = element;

    if (FontPropertyEditor.fontList) {
      this.parseFontList();
      //@ts-ignore
    } else if (window.queryLocalFonts) {
      //@ts-ignore
      window.queryLocalFonts().then(x => {
        //@ts-ignore
        FontPropertyEditor.fontList = [...new Set(x.map(y => y.family))];
        this.parseFontList();
      })
    } else {
      FontPropertyEditor.fontList = ["Verdana", "Arial", "Tahoma", "Trebuchet MS", "Times New Roman", "Georgia", "Garamond", "Courier New", "Brush Script MT"];
      this.parseFontList();
    }
  }

  parseFontList() {
    for (let v of FontPropertyEditor.fontList) {
      let option = document.createElement("option");
      option.value = <any>v;
      option.text = v;
      this.element.appendChild(option);
    }
    this.element.onchange = (e) => this._valueChanged(this.element.value);
  }

  refreshValue(valueType: ValueType, value: any) {
    this.element.value = value;
  }
}