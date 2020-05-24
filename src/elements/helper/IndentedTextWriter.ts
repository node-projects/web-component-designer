export class IndentedTextWriter {
  private _textHolder: string = ''
  public readonly indent: number = 4;
  public level: number = 0;

  public levelRaise() {
    this.level++;
  }

  public levelShrink() {
    this.level--;
  }

  public write(text: string) {
    this._textHolder += text;
  }

  public writeLine(text: string) {
    this.writeIndent();
    this._textHolder += text;
    this.writeNewline();
  }

  public writeIndent() {
    this._textHolder += ''.padEnd(this.level * this.indent, ' ');
  }

  public writeNewline() {
    this._textHolder += '\n';
  }

  public getString() {
    return this._textHolder;
  }
}