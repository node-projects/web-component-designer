import { IPoint } from "../../../interfaces/ipoint.js";
import { IService } from '../IService';

export interface IContainerService extends IService {
    CanEnterContainer(element: HTMLElement);
    GetContainerInternalOffset(element: HTMLElement);
    EnterCOntainer(element: HTMLElement, relativePosition: IPoint);
}