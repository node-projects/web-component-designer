import { IInstanceService } from './IInstanceService';
import { IElementDefintion } from '../elementsService/IElementDefinition';

export class DefaultInstanceService implements IInstanceService {
    
    getElement(definition: IElementDefintion): HTMLElement {
        let element = document.createElement(definition.tag);
        element.style.width = '60px';
        element.style.height = '20px';
        element.style.position = 'absolute'

        switch (definition.tag) {
            case "div":
                element.innerHTML = "div";
                break;
            case "input":
                (<HTMLInputElement>element).type = "text";
        }
        return element;
    }
}