
enum Token {
  Name,
  Value,
  InQuote
}

export class CssEntry {
  constructor(name: string, value: string, important: boolean) {
    this.name = name.trim();
    this.value = value.trim();
    this.important = important;
  }
  name: string;
  value: string;
  important: boolean;
}

export class CssAttributeParser {

  entries: CssEntry[] = [];

  public parse(text: string, quoteType: string = '\'') {
    this.entries = [];

    let name = '';
    let value = '';
    let token = Token.Name;

    for (let n = 0; n < text.length; n++) {
      let c = text[n];
      if (token === Token.Name) {
        if (c === ':')
          token = Token.Value;
        else if (c === ';') {
          name = '';
        } else
          name += c;
      } else if (token === Token.Value) {
        if (c === ';') {
          const entry = this.createEntry(name, value);
          this.entries.push(entry);
          name = '';
          value = '';
          token = Token.Name;
        } else {
          if (c === quoteType) {
            token = Token.InQuote;
          }
          value += c;
        }
      } else if (token === Token.InQuote) {
        if (c === '\\') {
          value += c;
          n++;
          c = text[n];
          value += c;
        } else if (c === quoteType) {
          value += c;
          token = Token.Value;
        } else {
          value += c;
        }
      }
    }

    if (name.trim() !== '') {
      this.entries.push(this.createEntry(name, value));
    }
  }

  private createEntry(name: string, value: string) {
    const match = value.match(/\s*!\s*important\s*$/i);
    if (!match)
      return new CssEntry(name, value, false);

    return new CssEntry(name, value.substring(0, match.index), true);
  }
}
