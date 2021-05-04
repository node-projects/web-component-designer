import { IStringPosition } from "../../services/serializationService/IStringPosition";

export interface ICodeView {
  update(code: string);
  getText();
  setSelection(position: IStringPosition);
  focusEditor();
}