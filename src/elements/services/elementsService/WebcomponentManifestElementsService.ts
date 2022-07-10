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
          let elDef: IElementDefinition = { tag: e.name, import: this._importPrefix + '/' + e.declaration.module, defaultWidth: "200px", defaultHeight: "200px", className: e.declaration.name }
          this._elementList.push(elDef);
        }
      }
      if (this._resolveStored) {
        this._resolveStored.forEach(x => x(this._elementList));
        this._resolveStored = null;
        this._rejectStored = null;
      }
    }
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