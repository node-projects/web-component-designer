import { IBindableObject } from "./IBindableObject";

export interface IBindableObjectsService {
  readonly name: string;
  getBindableObject(fullName: string): Promise<IBindableObject>;
  getBindableObjects(parent?: IBindableObject): Promise<IBindableObject[]>;
}