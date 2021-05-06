import { IDisposable } from "monaco-editor";
import { IUiCommandHandler } from "../../../commandHandling/IUiCommandHandler";
import { IStringPosition } from "../../services/serializationService/IStringPosition";

export interface ICodeView extends IUiCommandHandler, IDisposable {
  update(code: string);
  getText();
  setSelection(position: IStringPosition);
  focusEditor();
}