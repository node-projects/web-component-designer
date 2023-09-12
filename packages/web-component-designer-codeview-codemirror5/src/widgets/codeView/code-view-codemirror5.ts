import { BaseCustomWebComponentLazyAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { ICodeView, IDisposable, IUiCommand, CommandType, IStringPosition } from '@node-projects/web-component-designer';
import CodeMirror from 'codemirror5';

export class CodeViewCodeMirror5 extends BaseCustomWebComponentLazyAppend implements ICodeView, IDisposable {
  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public code: string;
  public onTextChanged = new TypedEvent<string>();
  public mode: string = 'xml';

  private _codeMirrorEditor: CodeMirror.Editor;
  private _editor: HTMLTextAreaElement;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }`;

  static override readonly template = html`
    <div  style="width: 100%; height: 100%; overflow: auto;">
      <div id="textarea"></div>
    </div>`;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    //@ts-ignore
    import("codemirror5/lib/codemirror.css", { assert: { type: 'css' } }).then(x => this.shadowRoot.adoptedStyleSheets = [x.default, ...this.shadowRoot.adoptedStyleSheets]);
    //@ts-ignore
    import("codemirror5/addon/fold/foldgutter.css", { assert: { type: 'css' } }).then(x => this.shadowRoot.adoptedStyleSheets = [x.default, ...this.shadowRoot.adoptedStyleSheets]);

    this.style.display = 'block';
    this._editor = this._getDomElement<HTMLTextAreaElement>('textarea');
  }

  dispose(): void {
  }

  executeCommand(command: IUiCommand) {
    switch (command.type) {
      case CommandType.undo:
        this._codeMirrorEditor.undo();
        break;
      case CommandType.redo:
        this._codeMirrorEditor.redo();
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
      this._codeMirrorEditor.focus();
    });
  }

  ready() {
    const config: CodeMirror.EditorConfiguration = {
      tabSize: 3,
      lineNumbers: true,
      mode: this.mode,
      //@ts-ignore
      htmlMode: true,
      lineWrapping: true,
      //@ts-ignore
      extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); } },
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
    };

    this._codeMirrorEditor = CodeMirror(this._editor, config);
    this._codeMirrorEditor.setSize('100%', '100%');
    this._codeMirrorEditor.on('change', () => this.onTextChanged.emit(this._codeMirrorEditor.getValue()))
  }

  update(code) {
    this._codeMirrorEditor.setValue(code);
  }
  getText() {
    return this._codeMirrorEditor.getValue();
  }

  setSelection(position: IStringPosition) {
    let point1 = this._codeMirrorEditor.posFromIndex(position.start);
    let point2 = this._codeMirrorEditor.posFromIndex(position.start + position.length);
    this._codeMirrorEditor.setSelection(point1, point2);
  }
}

customElements.define('node-projects-code-view-codemirror5', CodeViewCodeMirror5);