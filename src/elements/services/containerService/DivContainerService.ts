import { IPoint } from '../../../interfaces/ipoint.js';
import { IContainerService } from './IContainerService.js';

export class DivContainerService implements IContainerService {
    
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
