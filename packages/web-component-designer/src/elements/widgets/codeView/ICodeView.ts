import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IDisposable } from '../../../interfaces/IDisposable.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition.js';
import { TypedEvent } from '@node-projects/base-custom-webcomponent';

export interface ICodeView extends IUiCommandHandler, IDisposable, HTMLElement {
  update(code: string, instanceServiceContainer?: InstanceServiceContainer) : void;
  getText(): string;
  setSelection(position: IStringPosition): void;
  focusEditor(): void;
  onTextChanged: TypedEvent<string>;
  readOnly?: boolean;
}