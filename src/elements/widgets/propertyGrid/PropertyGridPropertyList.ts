import { IProperty } from '../../services/propertiesService/IProperty';
import { ServiceContainer } from '../../services/ServiceContainer';
import { BaseCustomWebComponentLazyAppend, css, DomHelper } from '@node-projects/base-custom-webcomponent';
import { IPropertyEditor } from '../../services/propertiesService/IPropertyEditor';
import { ContextMenuHelper } from '../../helper/contextMenu/ContextMenuHelper';
import { IDesignItem } from '../../item/IDesignItem';
import { IPropertiesService } from '../../services/propertiesService/IPropertiesService';
import { ValueType } from '../../services/propertiesService/ValueType';

export class PropertyGridPropertyList extends BaseCustomWebComponentLazyAppend {

  private _div: HTMLDivElement;
  private _propertyMap: Map<IProperty, { isSetElement: HTMLElement, editor: IPropertyEditor }> = new Map();
  private _serviceContainer: ServiceContainer;
  private _propertiesService: IPropertiesService;
  private _designItems: IDesignItem[];

  static get style() {
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
      grid-template-columns: 11px auto 1fr;
      align-items: center;
      grid-auto-rows: 24px;
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
      margin-right: 20px;
      font-size: 13px;
      width: 90px;
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
    `;
  }

  constructor(serviceContainer: ServiceContainer) {
    super();

    this._serviceContainer = serviceContainer;

    this._div = document.createElement("div");
    this._div.className = "content-wrapper";
    this.shadowRoot.appendChild(this._div);
  }

  public setPropertiesService(propertiesService: IPropertiesService) {
    this._propertiesService = propertiesService;
    DomHelper.removeAllChildnodes(this._div);
    this._propertyMap.clear();
  }

  public createElements(designItem: IDesignItem) {
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
          let rect = document.createElement("div")
          rect.style.width = '5px';
          rect.style.height = '5px';
          rect.style.border = '1px white solid';
          this._div.appendChild(rect);
          ContextMenuHelper.addContextMenu(rect, [
            { title: 'clear', action: (e) => p.service.clearValue(this._designItems, p) },
            { title: 'new binding', action: (e) => alert('new binding() ' + p.name) }
          ]);

          let label = document.createElement("label");
          label.htmlFor = p.name;
          label.textContent = p.name;
          this._div.appendChild(label);

          editor.element.id = p.name;
          this._div.appendChild(editor.element);

          this._propertyMap.set(p, { isSetElement: rect, editor: editor });
        }
      }
    }
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