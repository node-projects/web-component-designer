import { ITextWriter } from './ITextWriter.js';

export class SimpleTextWriter implements ITextWriter {
  private _textHolder: string = ''
  private _lastCharNewline = false;

  public get position(): number {
    return this._textHolder.length;
  }

  public isLastCharNewline() {
    return this._lastCharNewline;
  }

  public levelRaise() {
  }

  public levelShrink() {
  }

  public write(text: string) {
    this._textHolder += text;
    if (text.length) this._lastCharNewline = text[text.length - 1] === '\n';
  }

  public writeLine(text: string) {
    this.write(text);
  }

  public writeIndent() {
  }

  public writeNewline() {
  }

  public getString() {
    return this._textHolder;
  }
}