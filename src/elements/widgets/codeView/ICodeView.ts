import { IUiCommandHandler } from "../../../commandHandling/IUiCommandHandler";
import { IStringPosition } from "../../services/serializationService/IStringPosition";

export interface ICodeView extends IUiCommandHandler {
  update(code: string);
  getText();
  setSelection(position: IStringPosition);
  focusEditor();
}