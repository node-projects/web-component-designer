import { IElementsService } from './IElementsService.js';
import { IElementsJson } from './IElementsJson.js';
import { IElementDefinition } from './IElementDefinition.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';

// Reads a Json File and provides the Elements listed there
export class JsonFileElementsService implements IElementsService {
  private _name: string;
  get name() { return this._name; }

  private _elementList: IElementDefinition[];
  private _resolveStored: ((value: IElementDefinition[]) => void)[];
  private _rejectStored: ((errorCode: number) => void)[];

  public getElements(): Promise<IElementDefinition[]> {
    if (this._elementList)
      return Promise.resolve(this._elementList);
    if (!this._resolveStored) {
      this._resolveStored = [];
      this._rejectStored = [];
    }
    return new Promise((resolve, reject) => { this._resolveStored.push(resolve); this._rejectStored.push(reject); });
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
      if (this._resolveStored) {
        this._resolveStored.forEach(x => x(this._elementList));
        this._resolveStored = null;
        this._rejectStored = null;
      }
    }).catch(err => {
      if (this._rejectStored) {
        this._rejectStored.forEach(x => x(err));
        this._resolveStored = null;
        this._rejectStored = null;
      }
    });
  }

  private isIElementDefintion(object: string | IElementDefinition): object is IElementDefinition {
    return object != null && (<IElementDefinition>object).tag != null;
  }
}