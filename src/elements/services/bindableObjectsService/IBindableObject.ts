import { BindableObjectType } from "./BindableObjectType";

export interface IBindableObject {
    readonly type: BindableObjectType
    readonly name: string;
    readonly fullName: string;
    readonly children?: false | IBindableObject[];
}