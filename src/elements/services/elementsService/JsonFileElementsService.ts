import { IElementsService } from './IElementsService';
import { IElementsJson } from './IElementsJson';
import { IElementDefinition } from './IElementDefinition';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';

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
    this._name = name;
    LazyLoader.LoadText(file).then(data => {
      let parsed = JSON.parse(data) as IElementsJson;
      this._elementList = [];
      parsed.elements.forEach(element => {
        if (this.isIElementDefintion(element))
          this._elementList.push(element)
        else
          this._elementList.push({ tag: element })
      });
      if (this._resolveStored)
        this._resolveStored(this._elementList);
    }).catch(err => { if (this._rejectStored) this._rejectStored(err); })
  }

  private isIElementDefintion(object: string | IElementDefinition): object is IElementDefinition {
    return object != null && (<IElementDefinition>object).tag != null;
  }
}