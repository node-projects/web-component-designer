import { BindingTarget } from "../../../item/BindingTarget.js";
import { IDesignItem } from "../../../item/IDesignItem.js";
import { IPropertiesService } from "../IPropertiesService.js";
import { IProperty } from "../IProperty.js";
import { PropertyType } from "../PropertyType.js";
import { UnkownElementPropertiesService } from "./UnkownElementPropertiesService.js";

export class WebcomponentManifestPropertiesService extends UnkownElementPropertiesService implements IPropertiesService {

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
    for (let m of manifest.modules) {
      for (let e of m.exports) {
        if (e.kind == 'custom-element-definition') {
          let properties: IProperty[] = [];
          let declaration = m.declarations.find(x => x.name == e.declaration.name);
          for (let d of declaration.members) {
            if (d.kind == 'field') {
              let pType = PropertyType.property;
              if (declaration.attributes)
                pType = declaration.attributes.find(x => x.fieldName == d.name) != null ? PropertyType.propertyAndAttribute : PropertyType.property;
              properties.push({ name: d.name, service: this, propertyType: pType, type: this.manifestClassPropertyTypeToEditorPropertyType(d.type?.text) });
            }
          }
          this._propertiesList[e.name] = properties;
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