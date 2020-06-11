import { BindableObjectType } from "./BindableObjectType";

export interface IBindableObject {
    readonly type: BindableObjectType
    readonly name: string;
    readonly children?: IBindableObject[];
}