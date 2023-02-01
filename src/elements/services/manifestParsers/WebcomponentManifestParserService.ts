import { BindingTarget } from '../../item/BindingTarget.js';
import { IElementDefinition } from '../elementsService/IElementDefinition.js';
import { IElementsService } from '../elementsService/IElementsService.js';
import { IPropertiesService, RefreshMode } from '../propertiesService/IPropertiesService.js';
import { IProperty } from '../propertiesService/IProperty.js';
import { PropertyType } from '../propertiesService/PropertyType.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { AbstractPropertiesService } from '../propertiesService/services/AbstractPropertiesService.js';

export class WebcomponentManifestParserService extends AbstractPropertiesService implements IElementsService, IPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  private _name: string;
  get name() { return this._name; }

  private _packageData: any;
  private _elementList: IElementDefinition[];
  private _propertiesList: Record<string, IProperty[]>;
  private _resolveStored: ((value: IElementDefinition[]) => void)[];
  private _rejectStored: ((errorCode: number) => void)[];
  private _importPrefix = '';

  constructor(name: string, fileOrObject: string | object, importPrefix = '') {
    super();
    this._name = name;
    this._importPrefix = importPrefix;
    if (typeof fileOrObject === 'string') {
      this._importPrefix = this._importPrefix ?? fileOrObject.split('/').slice(0, -1).join('/');
      import(fileOrObject, { assert: { type: 'json' } }).then(module => {
        this._packageData = module.default;
        this._parseManifest();
      }).catch(err => {
        if (this._rejectStored) {
          this._rejectStored.forEach(x => x(err));
          this._resolveStored = null;
          this._rejectStored = null;
        }
      });
    } else {
      this._packageData = fileOrObject;
      this._parseManifest();
    }
  }

  private _parseManifest() {
    this._elementList = [];
    this._propertiesList = {};
    for (let m of this._packageData.modules) {
      for (let e of m.exports) {
        if (e.kind == 'custom-element-definition') {
          this._elementList.push({ tag: e.name, import: this._importPrefix + (this._importPrefix.endsWith('/') ? '' : '/') + e.declaration.module });
          let properties: IProperty[] = [];
          let declaration = m.declarations.find(x => x.name == e.declaration.name);
          for (let d of declaration.members) {
            if (d.kind == 'field') {
              let pType = PropertyType.property;
              if (declaration.attributes)
                pType = declaration.attributes.find(x => x.fieldName == d.name) != null ? PropertyType.propertyAndAttribute : PropertyType.property;
              const p = this.manifestClassPropertyTypeToEditorPropertyType(d.type?.text);
              properties.push({ name: d.name, service: this, propertyType: pType, type: p[0], values: p[1] });
            }
          }
          this._propertiesList[e.name] = properties;
        }
      }
      if (this._resolveStored) {
        this._resolveStored.forEach(x => x(this._elementList));
        this._resolveStored = null;
        this._rejectStored = null;
      }
    }
  }

  private manifestClassPropertyTypeToEditorPropertyType(type: string): [type: string, values?: string[]] {
    if (type) {
      if (type.toLowerCase() === 'boolean')
        return ['boolean'];
      if (type.toLowerCase() === 'number')
        return ['number'];
      if (type.toLowerCase() === 'string')
        return ['string'];
      if (type.startsWith("'") && type.includes("|")) {
        const values = type.split("|").map(x => x.trim()).map(x => x.substring(1, x.length - 1));
        return ['list', values]
      }
    }
    return [type];
  }

  async getElements(): Promise<IElementDefinition[]> {
    if (this._packageData)
      return Promise.resolve(this._elementList);
    if (!this._resolveStored) {
      this._resolveStored = [];
      this._rejectStored = [];
    }
    return new Promise((resolve, reject) => { this._resolveStored.push(resolve); this._rejectStored.push(reject); });
  }


  override isHandledElement(designItem: IDesignItem): boolean {
    if (this._elementList)
      return this._elementList.find(x => x.tag == designItem.name) != null
    return false
  }

  override getProperties(designItem: IDesignItem): IProperty[] {
    return this._propertiesList[designItem.name];
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this._propertiesList[designItem.name].find(x => x.name == name);
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return this._propertiesList[designItem.name].find(x => x.name == property.name).propertyType == PropertyType.attribute ? BindingTarget.attribute : BindingTarget.property
  }
}