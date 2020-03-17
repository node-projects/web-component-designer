import { IElementsService } from './IElementsService';
import { IElementsJson } from './IElementsJson';
import { IElementDefinition } from './IElementDefinition';

// Reads a Json File and provides the Elements listed there
export class JsonElementsService implements IElementsService {
  private _name: string;
  get name() { return this._name; }

  private _elementList: IElementDefinition[];
  private _resolveStored: (value: IElementDefinition[]) => void;

  getElements(): Promise<IElementDefinition[]> {
    if (this._elementList)
      return Promise.resolve(this._elementList);
    return new Promise((resolve) => this._resolveStored = resolve);
  }
  constructor(name: string, file: string) {
    this._name = name;
    let request = new XMLHttpRequest();
    request.open('GET', file);
    request.onreadystatechange = () => {
      if (request.readyState == 4) {
        let data = request.responseText;
        let parsed = JSON.parse(data) as IElementsJson;
        this._elementList = [];
        for (const i in parsed.elements) {
          let element = parsed.elements[i];
          if (this.isIElementDefintion(element))
            this._elementList.push(element)
          else
            this._elementList.push({ tag: element })
        }
        if (this._resolveStored)
          this._resolveStored(this._elementList);
      }
    }
    request.send();
  }

  isIElementDefintion(object: string | IElementDefinition): object is IElementDefinition {
    return object != null && (<IElementDefinition>object).tag != null;
  }
} 