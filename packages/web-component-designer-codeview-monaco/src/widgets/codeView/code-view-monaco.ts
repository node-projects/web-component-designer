import { BaseCustomWebComponentLazyAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { CommandType, IActivateable, ICodeView, InstanceServiceContainer, IStringPosition, IUiCommand, IUiCommandHandler } from '@node-projects/web-component-designer';
import type * as monacoType from 'monaco-editor';

export class CodeViewMonaco extends BaseCustomWebComponentLazyAppend implements ICodeView, IActivateable, IUiCommandHandler {
  private static _monaco: { editor: typeof monacoType.editor, Range: typeof monacoType.Range };
  private static _monacoStyle: CSSStyleSheet;
  public static async getMonacoLib() {
    if (CodeViewMonaco._monaco) {
      return CodeViewMonaco._monaco;
    }
    const monaco = await import('monaco-editor');
    CodeViewMonaco._monaco = monaco;
    //@ts-ignore
    CodeViewMonaco._monacoStyle = (await import("monaco-editor/min/vs/editor/editor.main.css", { with: { type: 'css' } })).default;
    return monaco;
  }

  private _disableSelectionAfterSel: boolean;

  dispose(): void {
    this._monacoEditor?.dispose();
  }

  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  public onTextChanged = new TypedEvent<string>();
  public language: string = 'html';
  public singleRow: boolean = false;

  private _theme: string = 'vs';
  public get theme(): string {
    return this._theme;
  }
  public set theme(value: string) {
    this._theme = value;
    CodeViewMonaco.getMonacoLib().then(monaco => monaco.editor.setTheme(value));
  }

  #code: string = null;
  get code() {
    if (this._monacoEditor)
      return this._monacoEditor.getModel().getValue();
    return null;
  }
  set code(v) {
    this.#code = v;
    if (this._monacoEditor)
      this._monacoEditor.getModel().setValue(v);
  }

  #readOnly = false;
  get readOnly() {
    return this.#readOnly;
  }
  set readOnly(v) {
    this.#readOnly = v;
    if (this._monacoEditor)
      this._monacoEditor.updateOptions({ readOnly: v })
  }

  static readonly properties = {
    code: String,
    language: String,
    theme: String,
    singleRow: Boolean,
    readOnly: Boolean
  }

  private _monacoEditor: monacoType.editor.IStandaloneCodeEditor;
  private _editor: HTMLDivElement;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _disableSelection: boolean;
  private _disableSelectionAfterUpd: boolean;

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
    `;

  static override readonly template = html`<div id="container" style="overflow: hidden; width: 100%; height: 100%; position: absolute;"></div>`;

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

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this.addEventListener("keydown", e => e.stopPropagation());
  }

  async ready() {
    this._parseAttributesToProperties();

    const monaco = await CodeViewMonaco.getMonacoLib();
    this.shadowRoot.adoptedStyleSheets = [CodeViewMonaco._monacoStyle, (<any>this.constructor).style];

    this._editor = this._getDomElement<HTMLDivElement>('container');

    const resizeObserver = new ResizeObserver(() => {
      if (this._editor.offsetWidth > 0) {

        let options: monacoType.editor.IStandaloneEditorConstructionOptions = {
          automaticLayout: true,
          theme: this._theme,
          language: this.language,
          value: this.#code,
          fixedOverflowWidgets: true,
          minimap: {
            size: 'fill'
          },
          readOnly: this.#readOnly
        }
        if (this.singleRow) {
          options.minimap.enabled = false;
          options.lineNumbers = 'off';
          options.glyphMargin = false;
          options.folding = false;
          options.lineDecorationsWidth = 0;
          options.lineNumbersMinChars = 0;
        } else {
          options.scrollbar = {};
          options.scrollbar.useShadows = false;
          options.scrollbar.verticalHasArrows = true;
          options.scrollbar.horizontalHasArrows = true;
          options.scrollbar.vertical = 'visible';
          options.scrollbar.horizontal = 'visible';
        }

        this._monacoEditor = monaco.editor.create(this._editor, options);

        let selectionTimeout;
        let disableCursorChange;
        let changeContentListener = this._monacoEditor.getModel().onDidChangeContent(e => {
          if (selectionTimeout) {
            clearTimeout(selectionTimeout);
            selectionTimeout = null;
            this._disableSelection = false;
          }
          disableCursorChange = true;
          setTimeout(() => {
            disableCursorChange = false;
          }, 50);
          this.onTextChanged.emit(this._monacoEditor.getValue());
          this.dispatchEvent(new CustomEvent('code-changed'));
        });
        this._monacoEditor.onDidChangeModel(e => {
          changeContentListener.dispose();
          changeContentListener = this._monacoEditor.getModel().onDidChangeContent(e => {
            if (selectionTimeout) {
              clearTimeout(selectionTimeout);
              selectionTimeout = null;
              this._disableSelection = false;
            }
            disableCursorChange = true;
            setTimeout(() => {
              disableCursorChange = false;
            }, 50);
            this.onTextChanged.emit(this._monacoEditor.getValue());
            this.dispatchEvent(new CustomEvent('code-changed'));
          });
        });
        this._monacoEditor.onDidChangeCursorPosition(e => {
          const sel = this._monacoEditor.getSelection();
          const offsetStart = this._monacoEditor.getModel().getOffsetAt(sel.getStartPosition());
          const offsetEnd = this._monacoEditor.getModel().getOffsetAt(sel.getEndPosition());
          if (this._instanceServiceContainer && !this._disableSelectionAfterUpd && !this._disableSelectionAfterSel && !disableCursorChange) {
            this._disableSelection = true;
            if (selectionTimeout)
              clearTimeout(selectionTimeout);
            selectionTimeout = setTimeout(() => {
              selectionTimeout = null;
              this._instanceServiceContainer.selectionService.setSelectionByTextRange(offsetStart, offsetEnd);
              this._disableSelection = false;
            }, 50);
          }
        });

        this._monacoEditor.focus();

        resizeObserver.disconnect();
      };
    });

    resizeObserver.observe(this._editor);
  }

  focusEditor() {
    requestAnimationFrame(() => {
      this.focus();
      if (this._monacoEditor)
        this._monacoEditor.focus();
    });
  }

  activated() {
    if (this._monacoEditor)
      if (this._monacoEditor)
        this._monacoEditor.layout();
  }

  update(code: string, instanceServiceContainer?: InstanceServiceContainer) {
    this.#code = code;
    this._instanceServiceContainer = instanceServiceContainer;
    if (this._monacoEditor) {
      this._disableSelectionAfterUpd = true;
      if (this._monacoEditor)
        this._monacoEditor.setValue(code);
      this._disableSelectionAfterUpd = false;
      CodeViewMonaco.getMonacoLib().then(monaco => {
        monaco.editor.setTheme(this._theme);
        monaco.editor.setModelLanguage(this._monacoEditor.getModel(), this.language);
      });
    }
  }

  getText() {
    return this._monacoEditor.getValue();
  }

  setSelection(position: IStringPosition) {
    if (this._monacoEditor && !this._disableSelection && !this._disableSelectionAfterSel && position) {
      this._disableSelectionAfterSel = true;
      let model = this._monacoEditor.getModel();
      let point1 = model.getPositionAt(position.start);
      let point2 = model.getPositionAt(position.start + position.length);
      setTimeout(() => {
        this._monacoEditor.setSelection({ startLineNumber: point1.lineNumber, startColumn: point1.column, endLineNumber: point2.lineNumber, endColumn: point2.column });
        CodeViewMonaco.getMonacoLib().then(monaco => {
          this._monacoEditor.revealRangeInCenterIfOutsideViewport(new monaco.Range(point1.lineNumber, point1.column, point2.lineNumber, point2.column), 1);
        });
        setTimeout(() => {
          this._disableSelectionAfterSel = false;
        }, 50);
      }, 50);
    }
  }
}

customElements.define('node-projects-code-view-monaco', CodeViewMonaco);