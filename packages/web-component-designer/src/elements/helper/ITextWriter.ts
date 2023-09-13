export interface ITextWriter {
  get position(): number;
  isLastCharNewline(): boolean;
  levelRaise(): void
  levelShrink(): void
  write(text: string): void
  writeLine(text: string): void
  writeIndent(): void
  writeNewline(): void
  getString(): string
}