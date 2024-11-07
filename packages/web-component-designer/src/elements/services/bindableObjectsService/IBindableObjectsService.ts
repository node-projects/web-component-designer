import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { BindableObjectsTarget } from './BindableObjectsTarget.js';
import { IBindableObject } from './IBindableObject.js';

export interface IBindableObjectsService {
  readonly name: string;
  hasObjectsForInstanceServiceContainer(instanceServiceContainer: InstanceServiceContainer, source: BindableObjectsTarget);
  getBindableObject(fullName: string, instanceServiceContainer?: InstanceServiceContainer): Promise<IBindableObject<any>>;
  getBindableObjects(parent?: IBindableObject<any>, instanceServiceContainer?: InstanceServiceContainer): Promise<IBindableObject<any>[]>;
}