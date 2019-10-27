export interface IProperty {
    name: string;
    type?: object;
    defaultValue?: any; // if not set, show it in the propertygrid
    // editor: () => void;
}