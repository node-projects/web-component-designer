import { IBindableObject } from './IBindableObject.js';

export interface IBindableObjectsService {
  readonly name: string;
  getBindableObject(fullName: string): Promise<IBindableObject<any>>;
  getBindableObjects(parent?: IBindableObject<any>): Promise<IBindableObject<any>[]>;
}