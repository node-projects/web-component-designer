import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { ICodeView } from "./ICodeView";
import { IActivateable } from '../../../interfaces/IActivateable';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler';
import { IUiCommand } from '../../../commandHandling/IUiCommand';
import { CommandType } from '../../../commandHandling/CommandType';

export class CodeViewSimple extends BaseCustomWebComponentConstructorAppend implements ICodeView, IActivateable, IUiCommandHandler {

  dispose(): void {
  }

  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public onTextChanged = new TypedEvent<string>();

  private _text: HTMLTextAreaElement;
  private _editor: HTMLDivElement;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    textarea {
      height: 100%;
      width: 100%;
      resize: none;
      white-space: nowrap;
      box-sizing: border-box;
    }
    `;

  static override readonly template = html`
      <div id="container" style="width: 100%; height: 100%; position: absolute;">
        <textarea id="text"></textarea>
      </div>
  `;

  executeCommand(command: IUiCommand) {
  }

  canExecuteCommand(command: IUiCommand) {
    return false;
  }

  async ready() {
    this._editor = this._getDomElement<HTMLDivElement>('container');
    this._text = this._getDomElement<HTMLTextAreaElement>('text');
  }

  focusEditor() {
    requestAnimationFrame(() => {
      this.focus();
      this._text.focus();
    });
  }

  activated() {
  }

  update(code) {
    this._text.value = code;
  }

  getText() {
    return this._text.value;
  }

  setSelection(position: IStringPosition) {
    this._text.setSelectionRange(position.start, position.start + position.length);
  }
}

customElements.define('node-projects-code-view-simple', CodeViewSimple);