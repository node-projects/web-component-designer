import { IBindableObject } from "./IBindableObject";

export interface IBindableObjectsService {
    getBindableObject(name: string): IBindableObject;
    getBindableObjects(parent?: IBindableObject, recursive?: boolean): IBindableObject[];
}