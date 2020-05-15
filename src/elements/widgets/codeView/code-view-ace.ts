import { BaseCustomWebComponent, css } from "../../controls/BaseCustomWebComponent";
import { ICodeView } from "./ICodeView";
import type { Ace } from "ace-builds";

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

  ready() {
    //@ts-ignore
    this._aceEditor = ace.edit(this._editor, {
      theme: "ace/theme/chrome",
      mode: "ace/mode/html",
      value: "test"
    }
    );
    this._aceEditor.renderer.attachToShadowRoot();
    
    //this._aceEditor.$blockScrolling = Infinity;
    this._aceEditor.setOptions({ fontSize: "14px" });
  }

  update(code) {
    this._aceEditor.setValue(code);
    this._aceEditor.clearSelection();
  }
  getText() {
    return this._aceEditor.getValue();
  }
}

customElements.define('node-projects-code-view-ace', CodeViewAce);