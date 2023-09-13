import { IDesignerCanvas } from "../../IDesignerCanvas.js";
import { IDesignerPointerExtension } from "./IDesignerPointerExtension.js";

export interface IDesignerPointerExtensionProvider {
  getExtension(designerView: IDesignerCanvas) : IDesignerPointerExtension;
  style? : CSSStyleSheet;
}