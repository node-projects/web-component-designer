import { BaseCustomWebComponentLazyAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { ICodeView } from './ICodeView.js';
import { IActivateable } from '../../../interfaces/IActivateable.js';
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition.js';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { CommandType } from '../../../commandHandling/CommandType.js';

export class CodeViewMonaco extends BaseCustomWebComponentLazyAppend implements ICodeView, IActivateable, IUiCommandHandler {

  dispose(): void {
    this._monacoEditor.dispose();
  }

  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public code: string;
  public onTextChanged = new TypedEvent<string>();

  //@ts-ignore
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
      <div id="container" style="width: 100%; height: 100%; position: absolute;"></div>
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
    let style: { default: CSSStyleSheet };

    //@ts-ignore
    if (window.importShim)
      //@ts-ignore
      style = await importShim("monaco-editor/min/vs/editor/editor.main.css", { assert: { type: 'css' } })
    else
      //@ts-ignore
      style = await import("monaco-editor/min/vs/editor/editor.main.css", { assert: { type: 'css' } })

    this.shadowRoot.adoptedStyleSheets = [style.default, this.constructor.style];

    this._editor = this._getDomElement<HTMLDivElement>('container')

    //@ts-ignore
    require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });

    //@ts-ignore
    require(['vs/editor/editor.main'], () => {
      //@ts-ignore
      this._monacoEditor = monaco.editor.create(this._editor, {
        automaticLayout: true,
        wordWrapColumn: 1000,
        wordWrap: 'wordWrapColumn',
        value: this.code,
        language: 'html',
        minimap: {
          size: 'fill'
        },
        fixedOverflowWidgets: true,
        scrollbar: {
          useShadows: false,
          verticalHasArrows: true,
          horizontalHasArrows: true,
          vertical: 'visible',
          horizontal: 'visible'
        }
      });

      //@ts-ignore
      monaco.editor.defineTheme('myTheme', {
        base: 'vs',
        inherit: true,
        //@ts-ignore
        rules: [{ background: 'EDF9FA' }],
        colors: {
          'editor.selectionBackground': '#add6ff',
          'editor.inactiveSelectionBackground': '#add6ff'
        }
      });
      //@ts-ignore
      monaco.editor.setTheme('myTheme');

      this._monacoEditor.layout();
      let changeContentListener = this._monacoEditor.getModel().onDidChangeContent(e => {
        this.onTextChanged.emit(this._monacoEditor.getValue())
      })
      this._monacoEditor.onDidChangeModel(e => {
        changeContentListener.dispose();
        changeContentListener = this._monacoEditor.getModel().onDidChangeContent(e => {
          this.onTextChanged.emit(this._monacoEditor.getValue())
        })
      })
    });
  }

  focusEditor() {
    requestAnimationFrame(() => {
      this.focus();
      this._monacoEditor.focus();
    });
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
    //@ts-ignore
    setTimeout(() => this._monacoEditor.revealRangeInCenter(new monaco.Range(point1.lineNumber, point1.column, point2.lineNumber, point2.column), 1));
  }
}

customElements.define('node-projects-code-view-monaco', CodeViewMonaco);