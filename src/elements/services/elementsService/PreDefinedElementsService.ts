import { IElementsService } from './IElementsService';
import { IElementsJson } from './IElementsJson';
import { IElementDefinition } from './IElementDefinition';

export class PreDefinedElementsService implements IElementsService {
  private _name: string;
  get name() { return this._name; }

  private _elementList: IElementDefinition[];

  public getElements(): Promise<IElementDefinition[]> {
    return Promise.resolve(this._elementList);
  }

  constructor(name: string, data: IElementsJson) {
    this._name = name;

    this._elementList = [];
    data.elements.forEach(element => {
      if (this.isIElementDefintion(element))
        this._elementList.push(element)
      else
        this._elementList.push({ tag: element })
    });
  }

  private isIElementDefintion(object: string | IElementDefinition): object is IElementDefinition {
    return object != null && (<IElementDefinition>object).tag != null;
  }
}