import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { UnitEditor } from './UnitEditor.js';

export class UnitPropertyEditor extends BasePropertyEditor<UnitEditor> {

    constructor(property: IProperty) {
        super(property);

        let element = new UnitEditor();
        this.element = element;
    }

    refreshValue(valueType: ValueType, value: any) {
    }
}