import { BaseCustomWebComponentLazyAppend, css, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { ICodeView } from './ICodeView.js';
import type { Ace } from "ace-builds";
import { IStringPosition } from '../../services/htmlWriterService/IStringPosition.js';
import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { CommandType } from '../../../commandHandling/CommandType.js';
import { IDisposable } from '../../../interfaces/IDisposable.js';

export class CodeViewJar extends BaseCustomWebComponentLazyAppend implements ICodeView, IDisposable {
  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public code: string;
  public onTextChanged = new TypedEvent<string>();

  private _aceEditor: Ace.Editor;
  private _editor: HTMLDivElement;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
    `;

  constructor() {
    super();

    this.style.display = 'block';
    this._editor = document.createElement("div");
    this._editor.style.height = '100%';
    this._editor.style.width = '100%';

    
    
    //@ts-ignore
    if (window.importShim)
      //@ts-ignore
      importShim("codejar").then(x => { debugger; CodeJar(this._editor, hljs.highlightElement) });
    else
      //@ts-ignore
      import("codejar").then(x => { debugger; CodeJar(this._editor, hljs.highlightElement) });

      let jar = 

    this.shadowRoot.appendChild(this._editor)
  }
  dispose(): void {
    this._aceEditor.destroy();
  }

  executeCommand(command: IUiCommand) {
    switch (command.type) {
      case CommandType.undo:
        this._aceEditor.execCommand('undo');
        break;
      case CommandType.redo:
        this._aceEditor.execCommand('redo');
        break;
      case CommandType.copy:
        let text = this._aceEditor.getCopyText();
        this._aceEditor.execCommand("copy");
        navigator.clipboard.writeText(text);
        break;
      case CommandType.paste:
        navigator.clipboard.readText().then(text => {
          this._aceEditor.execCommand("paste", text)
        });
        break;
      case CommandType.cut:
        text = this._aceEditor.getCopyText();
        this._aceEditor.execCommand("cut");
        navigator.clipboard.writeText(text);
        break;
      case CommandType.delete:
        this._aceEditor.execCommand("delete");
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
      this._aceEditor.focus();
    });
  }

  ready() {
    //@ts-ignore
    this._aceEditor = ace.edit(this._editor, {
      theme: "ace/theme/chrome",
      mode: "ace/mode/html",
      value: "",
      autoScrollEditorIntoView: true,
      fontSize: "14px",
      showPrintMargin: false,
      displayIndentGuides: true,
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });
    //own snippet completer: http://plnkr.co/edit/6MVntVmXYUbjR0DI82Cr?p=preview
    this._aceEditor.renderer.attachToShadowRoot();

    let observer = new MutationObserver((m) => {
      this._aceEditor.setAutoScrollEditorIntoView(false);
      this._aceEditor.setAutoScrollEditorIntoView(true);
    });
    let config = { attributes: true, childList: true, characterData: true };
    observer.observe(this.shadowRoot.querySelector('.ace_content'), config);

    this._aceEditor.on('change', () => this.onTextChanged.emit(this._aceEditor.getValue()));
  }

  update(code) {
    this._aceEditor.setValue(code);
    this._aceEditor.clearSelection();
  }
  getText() {
    return this._aceEditor.getValue();
  }

  setSelection(position: IStringPosition) {
    let point1 = this._aceEditor.session.getDocument().indexToPosition(position.start, 0);
    let point2 = this._aceEditor.session.getDocument().indexToPosition(position.start + position.length, 0);
    //@ts-ignore
    this._aceEditor.selection.setRange({ start: point1, end: point2 });
    //@ts-ignore
    this._aceEditor.scrollToLine(point1.row);
  }
  //TODO: reset undo stack, when and why?
  //bind to global und and redo
  //editor.getSession().setUndoManager(new ace.UndoManager())
}

customElements.define('node-projects-code-view-ace', CodeViewAce);