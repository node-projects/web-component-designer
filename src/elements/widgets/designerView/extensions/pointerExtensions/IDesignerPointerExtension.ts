import { IDisposable } from "../../../../../interfaces/IDisposable.js";

export interface IDesignerPointerExtension extends IDisposable {
  refresh(event: PointerEvent);
  style? : CSSStyleSheet;
}