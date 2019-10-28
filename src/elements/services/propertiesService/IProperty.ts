export interface IProperty {
    name: string;
    type?: string; // -> string, number, list, color, thickness, css-length
    default?: any;
    min?: number;
    max?: number;
    values?: string[]; // list selectable values
    createEditor?: (property: IProperty) => HTMLElement;
}