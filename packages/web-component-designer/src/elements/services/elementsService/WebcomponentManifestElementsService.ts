import { removeLeading, removeTrailing } from "../../helper/Helper.js";
import { IElementDefinition } from "./IElementDefinition.js";
import { IElementsService } from "./IElementsService.js";

export class WebcomponentManifestElementsService implements IElementsService {

  private _name: string;
  get name() { return this._name; }

  private _importPrefix: string;
  private _elementList: IElementDefinition[];
  private _resolveStored: ((value: IElementDefinition[]) => void)[];
  private _rejectStored: ((errorCode: number) => void)[];

  constructor(name: string, importPrefix: string, manifest: any) {
    this._name = name;
    this._importPrefix = importPrefix
    this._parseManifest(manifest);
  }

  private _parseManifest(manifest: any) {
    this._elementList = [];
    for (let m of manifest.modules) {
      for (let e of m.exports) {
        if (e.kind == 'custom-element-definition') {
          let elDef: IElementDefinition = { tag: e.name, import: removeTrailing(this._importPrefix, '/') + '/' + removeLeading(m.path, '/'), packageName: this._name, className: e.declaration.name }
          this._addElementDefinition(elDef);
        }
      }
      for (let d of m.declarations) {
        if (d.tagName) {
          let elDef: IElementDefinition = { tag: d.tagName, import: removeTrailing(this._importPrefix, '/') + '/' + removeLeading(m.path, '/'), packageName: this._name, className: d.name }
          this._addElementDefinition(elDef);
        }
      }
      if (this._resolveStored) {
        this._resolveStored.forEach(x => x(this._elementList));
        this._resolveStored = null;
        this._rejectStored = null;
      }
    }
  }

  private _addElementDefinition(elementDefinition: IElementDefinition) {
    if (!this._elementList.some(x => x.tag == elementDefinition.tag))
      this._elementList.push(elementDefinition);
  }

  async getElements(): Promise<IElementDefinition[]> {
    if (this._elementList)
      return Promise.resolve(this._elementList);
    if (!this._resolveStored) {
      this._resolveStored = [];
      this._rejectStored = [];
    }
    return new Promise((resolve, reject) => { this._resolveStored.push(resolve); this._rejectStored.push(reject); });
  }
}
