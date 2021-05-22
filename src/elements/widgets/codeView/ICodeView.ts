import { IUiCommandHandler } from "../../../commandHandling/IUiCommandHandler";
import { IDisposable } from "../../../interfaces/IDisposable";
import { IStringPosition } from "../../services/htmlWriterService/IStringPosition";

export interface ICodeView extends IUiCommandHandler, IDisposable {
  update(code: string);
  getText();
  setSelection(position: IStringPosition);
  focusEditor();
}