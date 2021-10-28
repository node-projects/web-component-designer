import { IDisposable } from "../../../../interfaces/IDisposable";
import { IDesignerCanvas } from "../IDesignerCanvas";

//TODO: in tools dispose should be renamed, tools will be reused, so maybe cancel would be better
export interface ITool extends IDisposable {
  readonly cursor: string
  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element)
}