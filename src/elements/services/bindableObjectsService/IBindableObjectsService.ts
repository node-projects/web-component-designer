import { IBindableObject } from "./IBindableObject";

export interface IBindableObjectsService {
  getBindableObject(fullName: string): Promise<IBindableObject>;
  getBindableObjects(parent?: IBindableObject): Promise<IBindableObject[]>;
}