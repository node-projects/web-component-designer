import { BaseCustomWebComponent, css } from '@node-projects/base-custom-webcomponent';
import { ICodeView } from "./ICodeView";
import type { Ace } from "ace-builds";

class CodeViewAceCompleter {
  getCompletions(editor, session, pos, prefix, callback) {
    if (prefix.length === 0) { callback(null, []); return }


    let wordList = ['t-t', 'visu-conveyor']; //todo: get word list from custom elements 
    {
      callback(null, wordList.map((w) => {
        return { name: w, value: w, score: 1, meta: "tag" }
      }));
    }
  }
}

export class CodeViewAce extends BaseCustomWebComponent implements ICodeView {
  canvasElement: HTMLElement;
  elementsToPackages: Map<string, string>;

  private _aceEditor: Ace.Editor;
  private _editor: HTMLDivElement;

  static readonly style = css`
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

    this.shadowRoot.appendChild(this._editor)
  }

  oneTimeSetup() {
    //@ts-ignore
    let langTools = ace.require("ace/ext/language_tools");
    langTools.addCompleter(new CodeViewAceCompleter());
  }

  ready() {
    //@ts-ignore
    this._aceEditor = ace.edit(this._editor, {
      theme: "ace/theme/chrome",
      mode: "ace/mode/html",
      value: "test",
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
  }

  update(code) {
    this._aceEditor.setValue(code);
    this._aceEditor.clearSelection();
  }
  getText() {
    return this._aceEditor.getValue();
  }

  //todo reset undo stack, when and why?
  //bind to global und and redo
  //editor.getSession().setUndoManager(new ace.UndoManager())
}

customElements.define('node-projects-code-view-ace', CodeViewAce);