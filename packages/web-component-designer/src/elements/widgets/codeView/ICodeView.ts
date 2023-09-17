import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IDisposable } from '../../../interfaces/IDisposable.js';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export interface ICodeView extends IUiCommandHandler, IDisposable, HTMLElement {
  update(code: string);
  getText();
  setSelection(position: IStringPosition);
  focusEditor();
  onTextChanged: TypedEvent<string>;
}