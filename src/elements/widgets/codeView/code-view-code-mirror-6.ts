import { BaseCustomWebComponentLazyAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { ICodeView } from './ICodeView.js';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition.js';
import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { CommandType } from '../../../commandHandling/CommandType.js';
import { IDisposable } from '../../../interfaces/IDisposable.js';
import type { EditorView } from 'codemirror';

export class CodeViewCodeMirror6 extends BaseCustomWebComponentLazyAppend implements ICodeView, IDisposable {
  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public code: string;
  public onTextChanged = new TypedEvent<string>();
  public mode: string = 'xml';

  private _editor: EditorView;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      background: white;
    }
    .cm-editor {
      height: 100%
    }`;

  static override readonly template = html`
    <div id="container" style="width: 100%; height: 100%; overflow: auto;">
    </div>`;
  private _cm: any;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    import("codemirror").then(async cm => {
      this._cm = cm;
      let js = await import("@codemirror/lang-javascript");
      let html = await import("@codemirror/lang-html");
      this._editor = new cm.EditorView({
        extensions: [cm.basicSetup, js.javascript(), html.html()],
        parent: this._getDomElement<HTMLTextAreaElement>('container')
      })
    });
  }

  ready() {
    /* this._codeMirrorEditor.on('change', () => this.onTextChanged.emit(this._codeMirrorEditor.getValue()))*/
  }

  dispose(): void {
  }

  async executeCommand(command: IUiCommand) {
    let cmds = await import("@codemirror/commands");
    switch (command.type) {
      case CommandType.undo:
        cmds.undo(this._editor);
        break;
      case CommandType.redo:
        cmds.redo(this._editor);
        break;
      case CommandType.copy:
        const text = this._codeMirrorEditor.getSelection();
        navigator.clipboard.writeText(text);
        break;
      case CommandType.paste:
        navigator.clipboard.readText().then(text => {
          this._codeMirrorEditor.replaceSelection(text);
        });
        break;
      case CommandType.cut:
        const textc = this._codeMirrorEditor.getSelection();
        navigator.clipboard.writeText(textc);
        this._codeMirrorEditor.replaceSelection('');
        break;
      case CommandType.delete:
        this._codeMirrorEditor.replaceSelection('');
        break;
    }
  }

  canExecuteCommand(command: IUiCommand) {
    switch (command.type) {
      case CommandType.undo:
      case CommandType.redo:
      case CommandType.copy:
      case CommandType.paste:
      case CommandType.cut:
      case CommandType.delete:
        return true;
    }
    return false;
  }

  focusEditor() {
    requestAnimationFrame(() => {
      this.focus();
      this._editor.focus();
    });
  }

  update(code) {
    this._editor.dispatch({
      changes: { from: 0, to: this._editor.state.doc.length, insert: code }
    });
  }
  getText() {
    return this._editor.state.doc.toString();
  }

  setSelection(position: IStringPosition) {
    this._editor.dispatch({
      selection: { anchor: position.start, head: position.start + position.length }
    });
  }
}

customElements.define('node-projects-code-view-code-mirror-6', CodeViewCodeMirror6);