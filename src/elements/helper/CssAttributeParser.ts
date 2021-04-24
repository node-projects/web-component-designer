
enum Token {
  Name,
  Value,
  InQuote
}

export class CssEntry {
  constructor(name: string, value: string) {
    this.name = name.trim();
    this.value = value.trim();
  }
  name: string;
  value: string;
}

export class CssAttributeParser {
  
  entries: CssEntry[] = [];
  
  public parse(text: string) {
    this.entries = [];
    
    let name = '';
    let value = '';
    let token = Token.Name;

    for (let n = 0; n < text.length; n++) {
      let c = text[n];
      if (token === Token.Name) {
        if (c === ':')
          token = Token.Value;
        else
          name += c;
      } else if (token === Token.Value) {
        if (c === ';') {
          this.entries.push(new CssEntry(name, value));
          name = '';
          value = '';
          token = Token.Name;
        } else {
          if (c === '\'') {
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
        } if (c === '\'') {
          value += c;
          token = Token.Value;
        }
      }
    }

    if (name.trim() !== '') {
      this.entries.push(new CssEntry(name, value));
    }
  }
}