import { BaseCustomWebComponentLazyAppend, css, html } from '@node-projects/base-custom-webcomponent';
import { ICodeView } from "./ICodeView";
import type * as monaco from 'monaco-editor';
import { IActivateable } from '../../../interfaces/IActivateable';
import { IStringPosition } from '../../services/serializationService/IStringPosition';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler';
import { IUiCommand } from '../../../commandHandling/IUiCommand';
import { CommandType } from '../../../commandHandling/CommandType';

export class CodeViewMonaco extends BaseCustomWebComponentLazyAppend implements ICodeView, IActivateable, IUiCommandHandler {

  dispose(): void {
    this._monacoEditor.dispose();
  }

  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public code: string;

  private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
  private _editor: HTMLDivElement;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
    `;

  static override readonly template = html`
      <style>@import "/node_modules/monaco-editor/min/vs/editor/editor.main.css";</style>
      <div id="container" style="width: 100%; height: 100%;"></div>
  `;

  executeCommand(command: IUiCommand) {
    switch (command.type) {
      case CommandType.undo:
        this._monacoEditor.trigger('source', 'undo', null);
        break;
      case CommandType.redo:
        this._monacoEditor.trigger('source', 'redo', null);
        break;
      case CommandType.copy:
        this._monacoEditor.trigger('source', 'editor.action.clipboardCopyAction', null);
        break;
      case CommandType.paste:
        this._monacoEditor.trigger('source', 'editor.action.clipboardPasteAction', null);
        break;
      case CommandType.cut:
        break;
      case CommandType.delete:
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

  async ready() {
    this._editor = this._getDomElement<HTMLDivElement>('container')

    //@ts-ignore
    require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });

    //@ts-ignore
    require(['vs/editor/editor.main'], () => {
      //@ts-ignore
      this._monacoEditor = monaco.editor.create(this._editor, {
        automaticLayout: true,
        value: this.code,
        language: 'html',
        minimap: {
          //@ts-ignore
          size: 'fill'
        }
      });

      this._monacoEditor.layout();
    });
  }

  focusEditor() {
    this.focus();
    this._monacoEditor.focus();
  }

  activated() {
    if (this._monacoEditor)
      this._monacoEditor.layout();
  }

  update(code) {
    this.code = code;
    if (this._monacoEditor) {
      this._monacoEditor.setValue(code);
    }
  }

  getText() {
    return this._monacoEditor.getValue();
  }

  setSelection(position: IStringPosition) {
    let model = this._monacoEditor.getModel();
    let point1 = model.getPositionAt(position.start);
    let point2 = model.getPositionAt(position.start + position.length);
    this._monacoEditor.setSelection({ startLineNumber: point1.lineNumber, startColumn: point1.column, endLineNumber: point2.lineNumber, endColumn: point2.column });
    this._monacoEditor.revealLineInCenter(point1.lineNumber);
  }
}

customElements.define('node-projects-code-view-monaco', CodeViewMonaco);