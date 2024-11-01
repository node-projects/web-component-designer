import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IBindableObject } from './IBindableObject.js';

export interface IBindableObjectsService {
  readonly name: string;
  hasObjectsForInstanceServiceContainer(instanceServiceContainer: InstanceServiceContainer);
  getBindableObject(fullName: string, instanceServiceContainer?: InstanceServiceContainer): Promise<IBindableObject<any>>;
  getBindableObjects(parent?: IBindableObject<any>, instanceServiceContainer?: InstanceServiceContainer): Promise<IBindableObject<any>[]>;
}