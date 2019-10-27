import { IPoint } from "../../../interfaces/ipoint.js";

export interface IContainerService {
    CanEnterContainer(element: HTMLElement);
    GetContainerInternalOffset(element: HTMLElement);
    EnterCOntainer(element: HTMLElement, relativePosition: IPoint);
}