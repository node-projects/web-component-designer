import { IProperty } from '../../services/propertiesService/IProperty';
import { ServiceContainer } from '../../services/ServiceContainer';
import { BaseCustomWebComponent, css } from '../../controls/BaseCustomWebComponent';
import { IPropertyEditor } from '../../services/propertiesService/IPropertyEditor';
import { ContextMenuHelper } from '../../helper/contextMenu/ContextMenuHelper';
import { IDesignItem } from '../../item/IDesignItem';
import { IPropertiesService } from '../../services/propertiesService/IPropertiesService';

export class PropertyGridPropertyList extends BaseCustomWebComponent {

  private _div: HTMLDivElement;
  private _propertyMap: Map<IProperty, { isSetElement: HTMLElement, editor: IPropertyEditor }> = new Map();
  private _serviceContainer: ServiceContainer;
  private _propertiesService: IPropertiesService;

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
      grid-auto-rows: 30px;
      align-items: baseline;
    }
    label, input, select {
      display: inline-block;
      color: white;
      background: transparent;
      height: 24px;
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
      border: 1px solid var(--input-border-color, #596c7a);
      border-radius: 5px;
      box-sizing: border-box;
      font-size: 11px;
      width: 100%;
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

  constructor(serviceContainer: ServiceContainer, propertiesService: IPropertiesService) {
    super();

    this._serviceContainer = serviceContainer;
    this._propertiesService = propertiesService;

    this._div = document.createElement("div");
    this._div.className = "content-wrapper";
    this.shadowRoot.appendChild(this._div);
  }

  public createElements(designItem: IDesignItem) {
    let properties = this._propertiesService.getProperties(designItem);
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
          { title: 'clear', action: (e) => alert('clear') },
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

  public refreshForDesignItems(items: IDesignItem[]) {
    for (let m of this._propertyMap) {
      let s = this._propertiesService.isSet(items, m[0]);
      let v = this._propertiesService.getValue(items, m[0]);
      if (s == 'none') {
        m[1].isSetElement.style.background = '';
      }
      else if (s == 'all')
        m[1].isSetElement.style.background = 'white';
      else if (s == 'some')
        m[1].isSetElement.style.background = 'gray';
      else if (s == 'bound')
        m[1].isSetElement.style.background = 'orange';

      m[1].editor.refreshValue(s, v);
    }
  }
}

customElements.define('node-projects-property-grid-property-list', PropertyGridPropertyList);