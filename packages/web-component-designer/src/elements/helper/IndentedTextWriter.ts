import { ITextWriter } from './ITextWriter.js';

export class IndentedTextWriter implements ITextWriter  {
  private _textHolder: string = ''
  private _lastCharNewline = false;
  public readonly indent: number = 4;
  public level: number = 0;

  public get position(): number {
    return this._textHolder.length;
  }

  public isLastCharNewline() {
    return this._lastCharNewline;
  }

  public levelRaise() {
    this.level++;
  }

  public levelShrink() {
    this.level--;
  }

  public write(text: string) {
    this._textHolder += text;
    if (text.length) this._lastCharNewline = text[text.length - 1] === '\n';
  }

  public writeLine(text: string) {
    this.writeIndent();
    this.write(text);
    this.writeNewline();
  }

  public writeIndent() {
    this.write(''.padEnd(this.level * this.indent, ' '));
  }

  public writeNewline() {
    this._textHolder += '\n';
    this._lastCharNewline = true;
  }

  public getString() {
    return this._textHolder;
  }
}