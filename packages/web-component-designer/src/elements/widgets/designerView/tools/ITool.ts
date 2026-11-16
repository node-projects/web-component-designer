import { IDisposable } from '../../../../interfaces/IDisposable.js';
import { ServiceContainer } from "../../../services/ServiceContainer.js";
import { IDesignerCanvas } from '../IDesignerCanvas.js';

//TODO: in tools dispose should be renamed, tools will be reused, so maybe cancel would be better
export interface ITool extends IDisposable {
  readonly cursor: string;
  activated(serviceContainer: ServiceContainer);
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element);
  /** Return a known gesture target, or undefined to request normal hit testing. */
  getElementForPointerEvent?(event: PointerEvent): Element | undefined;
  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement?: Element);
  doubleClickEventHandler?(designerCanvas: IDesignerCanvas, event: MouseEvent): void;
}