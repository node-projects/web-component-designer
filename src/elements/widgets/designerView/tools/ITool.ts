import { IDisposable } from "../../../../interfaces/IDisposable";
import { ServiceContainer } from "../../../services/ServiceContainer.js";
import { IDesignerCanvas } from "../IDesignerCanvas";

//TODO: in tools dispose should be renamed, tools will be reused, so maybe cancel would be better
export interface ITool extends IDisposable {
  readonly cursor: string;
  activated(serviceContainer: ServiceContainer);
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element);
  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element);
}