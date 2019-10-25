import { IPoint } from "../../interfaces/ipoint";

export interface IContainerHandler {
    CanEnterContainer(element: HTMLElement);
    GetContainerInternalOffset(element: HTMLElement);
    EnterCOntainer(element: HTMLElement, relativePosition: IPoint);
}