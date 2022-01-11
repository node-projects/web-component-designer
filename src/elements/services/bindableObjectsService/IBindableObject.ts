import { BindableObjectType } from "./BindableObjectType";

export interface IBindableObject<T> {
    readonly type: BindableObjectType
    readonly name: string;
    readonly fullName: string;
    readonly children?: false | IBindableObject<T>[];
    readonly originalObject?: T;
}