import { BindingTarget } from "../../../item/BindingTarget.js";
import { IDesignItem } from "../../../item/IDesignItem.js";
import { IPropertiesService, RefreshMode } from "../IPropertiesService.js";
import { IProperty } from "../IProperty.js";
import { IPropertyGroup } from "../IPropertyGroup.js";
import { PropertyType } from "../PropertyType.js";
import { AbstractPropertiesService } from "./AbstractPropertiesService.js";

export class WebcomponentManifestPropertiesService extends AbstractPropertiesService implements IPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }

  private _name: string;
  get name() { return this._name; }

  private _propertiesList: Record<string, IProperty[]>;

  constructor(name: string, manifest: any, recreateElementsOnPropertyChange?: boolean) {
    super(recreateElementsOnPropertyChange);
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
                    const p = WebcomponentManifestPropertiesService.manifestClassPropertyTypeToEditorPropertyType(d.type?.text, d.type?.editor);
                  if (d.name)
                    properties.push({ name: d.name, service: this, propertyType: pType, type: p[0], values: p[1], description: d.description });
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

  public static manifestClassPropertyTypeToEditorPropertyType(type: string, editor: string): [type: string, values?: string[]] {
    if (editor) {
      if (editor.toLowerCase() === 'color')
        return ['color'];
    }
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

  override isHandledElement(designItem: IDesignItem): boolean {
    return this._propertiesList[designItem.name] != null;
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    return this._propertiesList[designItem.name];
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this._propertiesList[designItem.name].find(x => x.name == name);
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return this._propertiesList[designItem.name].find(x => x.name == property.name).propertyType == PropertyType.attribute ? BindingTarget.attribute : BindingTarget.property
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    return designItems[0].element[property.propertyName ?? property.name];
  }
}