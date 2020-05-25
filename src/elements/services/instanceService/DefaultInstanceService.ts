import { IInstanceService } from './IInstanceService';
import { IElementDefinition } from '../elementsService/IElementDefinition';

export class DefaultInstanceService implements IInstanceService {
  async getElement(definition: IElementDefinition): Promise<HTMLElement> {
    if (definition.import) {
      let importUri = definition.import;
      if (importUri[0] === '.' || importUri[0] === '/')
        importUri = '../../../../../../../..' + (importUri[0] === '/' ? '' : '/') + importUri;
      await import(importUri);
    }
    let element = document.createElement(definition.tag);
    if (definition.defaultWidth)
      element.style.width = definition.defaultWidth; // '60px';
    if (definition.defaultHeight)
      element.style.height = definition.defaultHeight; '20px';
    element.style.position = 'absolute'

    switch (definition.tag) {
      case "div":
        element.innerHTML = "div";
        break;
      case "input":
        (<HTMLInputElement>element).type = "text";
    }

    if (definition.defaultContent) {
      if (typeof definition.defaultContent === "string") {
        element.innerHTML = definition.defaultContent
      } else {
        element.appendChild(definition.defaultContent);
      }
    }
    return element;
  }
}