import { IPoint } from "../../../interfaces/IPoint.js";
import { IService } from '../IService';

export interface IContainerService extends IService {
    CanEnterContainer(element: HTMLElement);
    GetContainerInternalOffset(element: HTMLElement);
    EnterContainer(element: HTMLElement, relativePosition: IPoint);
}