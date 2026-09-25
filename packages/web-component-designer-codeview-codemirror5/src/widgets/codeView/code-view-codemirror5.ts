import { BaseCustomWebComponentLazyAppend, css, cssFromString, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { ICodeView, IDisposable, IUiCommand, CommandType, IStringPosition } from '@node-projects/web-component-designer';
import CodeMirror from 'codemirror5';

export class CodeViewCodeMirror5 extends BaseCustomWebComponentLazyAppend implements ICodeView, IDisposable {
  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public code: string = '';
  private _disposed = false;
  private _focusFrame: number;
  private _onChange = () => {
    this.code = this._codeMirrorEditor.getValue();
    this.onTextChanged.emit(this.code);
  };
  public onTextChanged = new TypedEvent<string>();
  public mode: string = 'xml';

  private _codeMirrorEditor: CodeMirror.EditorFromTextArea;
  private _editor: HTMLTextAreaElement;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }`;

  static override readonly template = html`
    <div  style="width: 100%; height: 100%; overflow: auto;">
      <textarea id="textarea"></textarea>
    </div>`;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    //@ts-ignore
    import("codemirror5/lib/codemirror.css", { with: { type: 'css' } }).then(x => { if (!this._disposed) this.shadowRoot.adoptedStyleSheets = [cssFromString(x.default), ...this.shadowRoot.adoptedStyleSheets]; });
    //@ts-ignore
    import("codemirror5/addon/fold/foldgutter.css", { with: { type: 'css' } }).then(x => { if (!this._disposed) this.shadowRoot.adoptedStyleSheets = [cssFromString(x.default), ...this.shadowRoot.adoptedStyleSheets]; });

    this.style.display = 'block';

  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    cancelAnimationFrame(this._focusFrame);
    if (this._codeMirrorEditor) {
      this._codeMirrorEditor.off('change', this._onChange);
      this._codeMirrorEditor.toTextArea();
      this._codeMirrorEditor = null;
    }
  }

  executeCommand(command: IUiCommand) {
    if (!this._codeMirrorEditor) return;
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
          this._codeMirrorEditor?.replaceSelection(text);
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
    if (!this._codeMirrorEditor) return false;
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
    cancelAnimationFrame(this._focusFrame);
    this._focusFrame = requestAnimationFrame(() => {
      if (this._disposed) return;
      this.focus();
      this._codeMirrorEditor?.focus();
    });
  }

  ready() {
    if (this._disposed) return;
    this._editor = this._getDomElement<HTMLTextAreaElement>('textarea');
    this._editor.value = this.code ?? '';
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

    this._codeMirrorEditor = CodeMirror.fromTextArea(this._editor, config);
    this._codeMirrorEditor.setSize('100%', '100%');
    this._codeMirrorEditor.on('change', this._onChange);
  }

  update(code) {
    if (this._disposed) return;
    this.code = code;
    this._codeMirrorEditor?.setValue(code);
  }
  getText() {
    return this._codeMirrorEditor?.getValue() ?? this.code ?? '';
  }

  setSelection(position: IStringPosition) {
    if (!this._codeMirrorEditor || !position) return;
    let point1 = this._codeMirrorEditor.posFromIndex(position.start);
    let point2 = this._codeMirrorEditor.posFromIndex(position.start + position.length);
    this._codeMirrorEditor.setSelection(point1, point2);
  }
}

customElements.define('node-projects-code-view-codemirror5', CodeViewCodeMirror5);