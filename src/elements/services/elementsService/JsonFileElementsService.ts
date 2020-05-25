import { IElementsService } from './IElementsService';
import { IElementsJson } from './IElementsJson';
import { IElementDefinition } from './IElementDefinition';

// Reads a Json File and provides the Elements listed there
export class JsonFileElementsService implements IElementsService {
  private _name: string;
  get name() { return this._name; }

  private _elementList: IElementDefinition[];
  private _resolveStored: (value: IElementDefinition[]) => void;
  private _rejectStored: (errorCode: number) => void;

  public getElements(): Promise<IElementDefinition[]> {
    if (this._elementList)
      return Promise.resolve(this._elementList);
    return new Promise((resolve, reject) => { this._resolveStored = resolve; this._rejectStored = reject; });
  }

  constructor(name: string, file: string) {
    let prefix = file.lastIndexOf('/') >= 0 ? file.substring(0, file.lastIndexOf('/') + 1) : '';
    this._name = name;
    let request = new XMLHttpRequest();
    request.open('GET', file);
    request.onreadystatechange = () => {
      if (request.readyState == 4) {
        if (request.status == 200) {
          let data = request.responseText;
          let parsed = JSON.parse(data) as IElementsJson;
          this._elementList = [];
          for (const i in parsed.elements) {
            let element = parsed.elements[i];
            if (this.isIElementDefintion(element)) {
              if (element.import && element.import[0] == '.') {
                element.import = prefix + element.import;
              }
              this._elementList.push(element)
            }
            else
              this._elementList.push({ tag: element })
          }
          if (this._resolveStored)
            this._resolveStored(this._elementList);
        } else {
          this._rejectStored(request.status);
        }
      }
    }
    request.send();
  }

  private isIElementDefintion(object: string | IElementDefinition): object is IElementDefinition {
    return object != null && (<IElementDefinition>object).tag != null;
  }
} 