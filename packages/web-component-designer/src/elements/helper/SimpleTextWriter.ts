import { ITextWriter } from './ITextWriter.js';

export class SimpleTextWriter implements ITextWriter {
  private _textHolder: string = ''

  public get position(): number {
    return this._textHolder.length;
  }

  public isLastCharNewline() {
    return this._textHolder[this._textHolder.length - 1] === '\n';
  }

  public levelRaise() {
  }

  public levelShrink() {
  }

  public write(text: string) {
    this._textHolder += text;
  }

  public writeLine(text: string) {
    this._textHolder += text;
  }

  public writeIndent() {
  }

  public writeNewline() {
  }

  public getString() {
    return this._textHolder;
  }
}