import { BindableObjectType } from './BindableObjectType.js';

export interface IBindableObject<T> {
    readonly bindabletype?: 'signal' | 'property'
    readonly specialType?: string //e.g. signalProperty
    readonly type: BindableObjectType
    readonly name: string;
    readonly fullName: string;
    readonly children?: false | IBindableObject<T>[];
    readonly originalObject?: T;
}