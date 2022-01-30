import { EventNames } from '../../../../enums/EventNames.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class TextTool implements ITool {

  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  readonly cursor = 'text';

  private _text: SVGTextElement;

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);
    //const offset = 50;

    addEventListener("keyup", function(event){
      if(event.key === 'Enter') {
        console.log("Enter Pressed");
        event.preventDefault();
      }
    });

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        this._text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        this._text.setAttribute("x", currentPoint.x.toString());
        this._text.setAttribute("y", currentPoint.y.toString());

        break;


        case EventNames.KeyUp:
        //if(event.key === 'Enter'){

        //}
        break;

    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) 
  { }
}