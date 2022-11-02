import { IProperty } from '../../services/propertiesService/IProperty';
import { ServiceContainer } from '../../services/ServiceContainer';
import { BaseCustomWebComponentLazyAppend, css, DomHelper } from '@node-projects/base-custom-webcomponent';
import { IPropertyEditor } from '../../services/propertiesService/IPropertyEditor';
import { IDesignItem } from '../../item/IDesignItem';
import { IPropertiesService } from '../../services/propertiesService/IPropertiesService';
import { ValueType } from '../../services/propertiesService/ValueType';
import { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem';
import { ContextMenu } from '../../helper/contextMenu/ContextMenu';
import { PropertyType } from '../../services/propertiesService/PropertyType';

export class PropertyGridPropertyList extends BaseCustomWebComponentLazyAppend {

  private _div: HTMLDivElement;
  private _propertyMap: Map<IProperty, { isSetElement: HTMLElement, editor: IPropertyEditor }> = new Map();
  private _serviceContainer: ServiceContainer;
  private _propertiesService: IPropertiesService;
  private _designItems: IDesignItem[];

  static override get style() {
    return css`
    :host{
      display: block;
      height: 100%;
      overflow: auto;
      box-sizing: border-box;
    }
    .content-wrapper {
      padding: .5em;
      display: grid;
      grid-template-columns: 11px auto minmax(80px, 1fr);
      align-items: center;
      grid-auto-rows: minmax(24px, auto);
      align-items: center;
    }
    label, input, select {
      display: inline-block;
      color: white;
      background: transparent;
      margin: 2px 0;
      padding: 0 2px 0 4px;
      width: 110px;
      white-space: nowrap;
    }
    label, .style-label {
      box-sizing: border-box;
      display: inline-block;
      font-size: 13px;
      width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 2px;
    }
    label[for] {
      cursor: pointer;
    }
    input, select {
      height: 24px;
      border: 1px solid var(--input-border-color, #596c7a);
      border-radius: 0;
      /*-webkit-appearance: none;*/
      box-sizing: border-box;
      font-size: 11px;
      width: 100%;
      padding:0;
      padding-left: 3px;
      margin:0;
    }
    /*input {
      margin-left: 4px;
    }*/
    input[disabled] {
      color: #BDBDBD;
    }
    select {
      background: transparent;
    }
    select:focus option {
      color: black;
    }
    .unset-value {
      color: lightslategray
    }
    .unset-value:focus {
      color: white
    }
    `;
  }

  constructor(serviceContainer: ServiceContainer) {
    super();
    this._restoreCachedInititalValues();

    this._serviceContainer = serviceContainer;

    this._div = document.createElement("div");
    this._div.className = "content-wrapper";
    this.shadowRoot.appendChild(this._div);
  }

  public setPropertiesService(propertiesService: IPropertiesService) {
    if (this._propertiesService != propertiesService) {
      this._propertiesService = propertiesService;
      DomHelper.removeAllChildnodes(this._div);
      this._propertyMap.clear();
    }
  }

  public createElements(designItem: IDesignItem) {
    if (this._propertiesService.listNeedsRefresh(designItem) || this._propertyMap.size == 0) {
      DomHelper.removeAllChildnodes(this._div);
      this._propertyMap.clear();
      if (this._propertiesService) {
        let properties = this._propertiesService.getProperties(designItem);
        if (properties) {
          for (const p of properties) {
            let editor: IPropertyEditor;
            if (p.createEditor)
              editor = p.createEditor(p);
            else {
              editor = this._serviceContainer.forSomeServicesTillResult("editorTypesService", x => x.getEditorForProperty(p));
            }
            if (editor) {
              let rectContainer = document.createElement("div")
              rectContainer.style.width = '20px';
              rectContainer.style.height = '20px';
              rectContainer.style.display = 'flex';
              rectContainer.style.alignItems = 'center';
              let rect = document.createElement("div")
              rect.style.width = '7px';
              rect.style.height = '7px';
              rect.style.border = '1px white solid';
              if (p.propertyType != PropertyType.complex)
                rectContainer.appendChild(rect);
              this._div.appendChild(rectContainer);
              rect.oncontextmenu = (event) => {
                event.preventDefault();
                this.openContextMenu(event, p);
              }

              if (p.type == 'addNew') {
                let input = <HTMLInputElement>editor.element;
                input.disabled = true;
                let label = document.createElement("input");
                label.value = p.name;
                label.onkeyup = e => {
                  if (e.key == 'Enter' && label.value) {
                    p.name = label.value;
                    label.disabled = true;
                    input.disabled = false;
                    input.focus();
                  }
                }
                this._div.appendChild(label);

              } else {
                let label = document.createElement("label");
                label.htmlFor = p.name;
                label.textContent = p.name;
                label.title = p.name;
                this._div.appendChild(label);
              }

              editor.element.id = p.name;
              this._div.appendChild(editor.element);

              this._propertyMap.set(p, { isSetElement: rect, editor: editor });
            }
          }
        }
      }
    }
  }

  public openContextMenu(event: MouseEvent, property: IProperty) {
    const ctxMenu: IContextMenuItem[] = [
      { title: 'clear', action: (e) => property.service.clearValue(this._designItems, property) },
    ];
    if (this._serviceContainer.config.openBindingsEditor) {
      ctxMenu.push(...[
        { title: '-' },
        {
          title: 'edit binding', action: () => {
            let target = this._propertiesService.getPropertyTarget(this._designItems[0], property);
            let binding = this._propertiesService.getBinding(this._designItems, property);
            this._serviceContainer.config.openBindingsEditor(property, this._designItems, binding, target);
          }
        }
      ]);
    };
    ContextMenu.show(ctxMenu, event);
  }

  public designItemsChanged(designItems: IDesignItem[]) {
    this._designItems = designItems;
    for (let m of this._propertyMap) {
      m[1].editor.designItemsChanged(designItems);
    }
  }

  public refreshForDesignItems(items: IDesignItem[]) {
    for (let m of this._propertyMap) {
      let s = this._propertiesService.isSet(items, m[0]);
      let v = this._propertiesService.getValue(items, m[0]);
      m[1].isSetElement.title = s;
      if (s == ValueType.none) {
        m[1].isSetElement.style.background = '';
        v = this._propertiesService.getUnsetValue(items, m[0]);
      }
      else if (s == ValueType.all)
        m[1].isSetElement.style.background = 'white';
      else if (s == ValueType.some)
        m[1].isSetElement.style.background = 'gray';
      else if (s == ValueType.bound)
        m[1].isSetElement.style.background = 'orange';

      m[1].editor.refreshValueWithoutNotification(s, v);
    }
  }
}

customElements.define('node-projects-property-grid-property-list', PropertyGridPropertyList);