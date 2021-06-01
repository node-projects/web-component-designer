import { IDisposable } from "../../../../interfaces/IDisposable";
import { IDesignerView } from "../IDesignerView";

//TODO: in tools dispose should be renamed, tools will be reused, so maybe cancel would be better
export interface ITool extends IDisposable {
  readonly cursor: string
  pointerEventHandler(designerView: IDesignerView, event: PointerEvent, currentElement: Element)
}