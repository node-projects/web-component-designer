import { BindingTarget } from "../../../item/BindingTarget.js";
import { IDesignItem } from "../../../item/IDesignItem.js";
import { IPropertiesService } from "../IPropertiesService.js";
import { IProperty } from "../IProperty.js";
import { PropertyType } from "../PropertyType.js";
import { AbstractPropertiesService } from "./AbstractPropertiesService.js";

export class WebcomponentManifestPropertiesService extends AbstractPropertiesService implements IPropertiesService {

  listNeedsRefresh(designItem: IDesignItem): boolean {
    return true;
  }

  private _name: string;
  get name() { return this._name; }

  private _propertiesList: Record<string, IProperty[]>;

  constructor(name: string, manifest: any) {
    super();
    this._name = name;
    this._parseManifest(manifest);
  }

  private _parseManifest(manifest) {
    this._propertiesList = {};
    let declarations = [];
    for (let m of manifest.modules) {
      if (m.declarations)
        declarations.push(...m.declarations);
    }
    for (let m of manifest.modules) {
      for (let e of m.exports) {
        if (e.kind == 'custom-element-definition') {
          let properties: IProperty[] = [];
          let declaration = declarations.find(x => x.name == e.declaration.name);
          if (declaration) {
            if (declaration.members) {
              for (let d of declaration.members) {
                if (d.kind == 'field' && d.privacy !== 'private' && d.privacy !== 'protected') {
                  let pType = PropertyType.property;
                  if (declaration.attributes)
                    pType = declaration.attributes.find(x => x.fieldName == d.name) != null ? PropertyType.propertyAndAttribute : PropertyType.property;
                  properties.push({ name: d.name, service: this, propertyType: pType, type: this.manifestClassPropertyTypeToEditorPropertyType(d.type?.text) });
                }
              }
              this._propertiesList[e.name] = properties;
            }
          } else {
            console.warn('declaration for ' + e.declaration.name + ' not found', manifest);
          }
        }
      }
    }
  }

  private manifestClassPropertyTypeToEditorPropertyType(type: string) {
    if (type) {
      if (type.toLowerCase() === 'boolean')
        return 'boolean';
      if (type.toLowerCase() === 'number')
        return 'number';
    }
    return type;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return this._propertiesList[designItem.name] != null;
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