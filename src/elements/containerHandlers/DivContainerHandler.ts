import { IContainerHandler } from "./IContainerHandler";
import { IPoint } from '../../interfaces/ipoint';

export class DivContainerHandler implements IContainerHandler {
    
    CanEnterContainer(element: HTMLElement) {
        throw new Error("Method not implemented.");
    }
    
    GetContainerInternalOffset(element: HTMLElement) {
        throw new Error("Method not implemented.");
    }

    EnterCOntainer(element: HTMLElement, relativePosition: IPoint) {
        throw new Error("Method not implemented.");
    }

}
