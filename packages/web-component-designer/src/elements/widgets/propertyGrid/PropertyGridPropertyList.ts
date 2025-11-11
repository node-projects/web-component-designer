import { IProperty } from '../../services/propertiesService/IProperty.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { BaseCustomWebComponentLazyAppend, css, DomHelper } from '@node-projects/base-custom-webcomponent';
import { IPropertyEditor } from '../../services/propertiesService/IPropertyEditor.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IPropertiesService, RefreshMode } from '../../services/propertiesService/IPropertiesService.js';
import { ValueType } from '../../services/propertiesService/ValueType.js';
import { ContextMenu } from '../../helper/contextMenu/ContextMenu.js';
import { PropertyType } from '../../services/propertiesService/PropertyType.js';
import { IPropertyGroup } from '../../services/propertiesService/IPropertyGroup.js';
import { dragDropFormatNameBindingObject, dragDropFormatNamePropertyGrid } from '../../../Constants.js';
import { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem.js';

export class PropertyGridPropertyList extends BaseCustomWebComponentLazyAppend {

  private _div: HTMLDivElement;
  private _propertyMap: Map<IProperty, { isSetElement: HTMLElement, labelElement: HTMLElement, editor: IPropertyEditor }> = new Map();
  private _serviceContainer: ServiceContainer;
  private _propertiesService: IPropertiesService;
  private _designItems: IDesignItem[];
  private _lastClassType: any;
  private _addCounter: number = 0;

  public propertyGroupHover: (group: IPropertyGroup, part: 'name' | 'desc') => boolean;
  public propertyGroupClick: (group: IPropertyGroup, part: 'name' | 'desc') => void;
  public propertyContextMenuProvider: (designItems: IDesignItem[], property: IProperty) => IContextMenuItem[];

  public get propertiesService() {
    return this._propertiesService;
  }

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
      grid-template-columns: 11px minmax(80px, auto) minmax(80px, auto);
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
      width: auto;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 2px;
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
    .unset-value > * {
      color: lightslategray
    }
    .unset-value:focus {
      color: white
    }
    .group-header {
      grid-column: 1 / 3;
      font-size: 10px;
      font-family: monospace;
    }
    .group-header[clickable]:hover {
      cursor:pointer;
      color: orange;
      text-decoration: underline;
    }
    .group-header::after{
      content: " ▾";
      font-size: 14px;
    }
    .group-header.expanded::after{
      content: " ▴";
      font-size: 14px;
    }
    .group-desc {
      display: inline-flex;
      flex-direction: row-reverse;
      font-size: 10px;
      text-decoration: underline;
    }
    .group-desc[clickable]:hover {
      cursor:pointer;
      color: orange;
      text-decoration: underline;
    }
    .dragOverProperty {
      outline: 2px dashed orange;
      outline-offset: -2px;
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

  public async createElements(designItem: IDesignItem): Promise<boolean> {
    if (this._propertiesService && (this._propertiesService.getRefreshMode(designItem) !== RefreshMode.none && (this._propertiesService.getRefreshMode(designItem) !== RefreshMode.fullOnClassChange || this._lastClassType !== designItem.element.constructor)) || this._propertyMap.size == 0) {
      this._lastClassType = designItem.element.constructor;
      DomHelper.removeAllChildnodes(this._div);
      this._propertyMap.clear();
      if (this._propertiesService) {
        let properties = await this._propertiesService.getProperties(designItem);
        if (properties?.length) {
          for (let p of properties) {
            if ('properties' in p)
              this.createPropertyGroups(<IPropertyGroup>p);
            else
              this.createPropertyEditors(<IProperty>p);
          }
          return true;
        }
      }
      return false;
    }
    return true;
  }

  private createPropertyGroups(group: IPropertyGroup) {
    let header = document.createElement('span');
    header.addEventListener('click', () => { this.expandOrCollapsePropertyGroups(group); header.classList.toggle('expanded') });
    header.innerHTML = group.name.replaceAll("\n", "<br>");
    header.className = 'group-header';
    this._div.appendChild(header);
    let desc = document.createElement('span');
    desc.innerHTML = group.description ?? '';
    desc.className = 'group-desc';
    if (this.propertyGroupHover) {
      header.onmouseenter = () => {
        if (this.propertyGroupHover(group, 'name'))
          header.setAttribute('clickable', '')
        else
          header.removeAttribute('clickable')
      }
      header.onclick = () => {
        if (this.propertyGroupClick)
          this.propertyGroupClick(group, 'name');
      }
      desc.onmouseenter = () => {
        if (this.propertyGroupHover(group, 'desc'))
          desc.setAttribute('clickable', '')
        else
          desc.removeAttribute('clickable')
      }
      desc.onclick = () => {
        if (this.propertyGroupClick)
          this.propertyGroupClick(group, 'desc');
      }
    }
    this._div.appendChild(desc);
    for (const p of group.properties)
      this.createPropertyEditors(p, true);
  }

  private expandOrCollapsePropertyGroups(propertyGroup: IPropertyGroup) {
    for (let p of propertyGroup.properties) {
      const property = this._propertyMap.get(p);
      const displayStyle = property.labelElement.style.display == 'none' ? 'flex' : 'none';
      if (property.editor.element)
        (<HTMLElement>property.editor.element).style.display = displayStyle;
      if (property.labelElement)
        property.labelElement.style.display = displayStyle;
      if (property.isSetElement.parentElement)
        property.isSetElement.parentElement.style.display = displayStyle;
    }
  }

  private createPropertyEditors(property: IProperty, isInGroup?: boolean) {
    let editor: IPropertyEditor;
    let labelHolder: HTMLElement;
    if (property.createEditor)
      editor = property.createEditor(property);
    else {
      editor = this._serviceContainer.forSomeServicesTillResult("editorTypesService", x => x.getEditorForProperty(property));
    }
    if (editor) {
      let rectContainer = document.createElement("div")
      if (isInGroup)
        rectContainer.style.marginLeft = '10px';
      rectContainer.style.width = '20px';
      rectContainer.style.height = '20px';
      rectContainer.style.display = 'flex';
      rectContainer.style.alignItems = 'center';
      let rect = document.createElement("div")
      rect.style.width = '7px';
      rect.style.height = '7px';
      rect.style.border = '1px white solid';
      rect.style.cursor = 'pointer';
      if (property.propertyType != PropertyType.complex)
        rectContainer.appendChild(rect);
      this._div.appendChild(rectContainer);
      if (property.readonly !== true) {
        rect.oncontextmenu = (event) => {
          event.preventDefault();
          this.openContextMenu(event, property);
        }
        rect.onclick = (event) => {
          event.preventDefault();
          this.openContextMenu(event, property);
        }
      }
      if (property.type == 'addNew') {
        let input = <HTMLInputElement>editor.element;
        input.disabled = true;
        input.id = "addNew_input_" + (++this._addCounter);
        let label = document.createElement("input");
        labelHolder = label;
        if (isInGroup) {
          label.style.marginLeft = '10px';
          label.style.width = 'calc(100% - 10px)';
        }
        label.value = property.name;
        label.type = "text";
        label.id = "addNew_label_" + this._addCounter;
        label.onkeyup = e => {
          if (e.key == 'Enter' && label.value) {
            property.name = label.value;
            label.disabled = true;
            input.disabled = false;
            input.focus();
          }
        }
        if (property.service.getPropertyNameSuggestions) {
          const sug = property.service.getPropertyNameSuggestions(null); //TODO: design items?
          const dl = document.createElement("datalist");
          dl.id = "addNew_" + this._addCounter + "_datalist";
          for (let s of sug) {
            const op = document.createElement("option");
            op.value = s;
            dl.append(op);
          }
          this._div.appendChild(dl);
          label.setAttribute('list', dl.id);
        }
        this._div.appendChild(label);
      } else {
        if (!property.renamable) {
          let label = document.createElement("label");
          labelHolder = label;
          if (isInGroup)
            label.style.marginLeft = '10px';
          label.htmlFor = property.name;
          label.textContent = property.displayName ?? property.name;
          label.title = property.description ?? ((property.displayName ?? property.name) + ' (type: ' + property.type + (property.defaultValue ? ', default: ' + property.defaultValue : '') + ', propertytype: ' + property.propertyType + ')');
          label.ondragleave = (e) => this._onDragLeave(e, property, label);
          label.ondragover = (e) => this._onDragOver(e, property, label);
          label.ondrop = (e) => this._onDrop(e, property, label);
          this._div.appendChild(label);
        } else {
          let label = document.createElement("input");
          labelHolder = label;
          if (isInGroup) {
            label.style.marginLeft = '10px';
            label.style.width = 'calc(100% - 10px)';
          }
          label.id = 'label_' + property.name;
          let input = <HTMLInputElement>editor.element;
          label.value = property.name;
          label.onkeyup = async e => {
            if (e.key == 'Enter' && label.value) {
              const pg = this._designItems[0].openGroup("rename property name from '" + property.name + "' to '" + label.value + "'");
              property.service.clearValue(this._designItems, property, 'all');
              property.name = label.value;
              await property.service.setValue(this._designItems, property, input.value);
              pg.commit();
              this._designItems[0].instanceServiceContainer.designerCanvas.extensionManager.refreshAllExtensions(this._designItems);
            }
          }
          this._div.appendChild(label);
        }
      }
      if (property.name)
        editor.element.id = property.name;
      this._div.appendChild(editor.element);

      this._propertyMap.set(property, { isSetElement: rect, labelElement: labelHolder, editor: editor });
    }
  }

  private _onDragLeave(event: DragEvent, property: IProperty, label: HTMLLabelElement) {
    event.preventDefault();
    label.classList.remove('dragOverProperty');
  }

  private _onDragOver(event: DragEvent, property: IProperty, label: HTMLLabelElement) {
    event.preventDefault();
    const hasTransferDataBindingObject = event.dataTransfer.types.indexOf(dragDropFormatNameBindingObject) >= 0;
    if (hasTransferDataBindingObject) {
      const ddService = this._serviceContainer.bindableObjectDragDropService;
      if (ddService) {
        const effect = ddService.dragOverOnProperty(event, property, this._designItems);
        if ((effect ?? 'none') != 'none') {
          label.classList.add('dragOverProperty');
          event.dataTransfer.dropEffect = effect;
        } else {
          label.classList.remove('dragOverProperty');
        }
      }
    }

    const hasPropertyGrid = event.dataTransfer.types.indexOf(dragDropFormatNamePropertyGrid) >= 0;
    if (hasPropertyGrid) {
      const ddService = this._serviceContainer.propertyGridDragDropService;
      if (ddService) {
        const effect = ddService.dragOverOnProperty(event, property, this._designItems);
        if ((effect ?? 'none') != 'none') {
          label.classList.add('dragOverProperty');
          event.dataTransfer.dropEffect = effect;
        } else {
          label.classList.remove('dragOverProperty');
        }
      }
    }
  }

  private _onDrop(event: DragEvent, property: IProperty, label: HTMLLabelElement) {
    event.preventDefault();
    label.classList.remove('dragOverProperty');
    const transferDataBindingObject = event.dataTransfer.getData(dragDropFormatNameBindingObject)
    if (transferDataBindingObject) {
      const bo = JSON.parse(transferDataBindingObject);
      const ddService = this._serviceContainer.bindableObjectDragDropService;
      if (ddService) {
        ddService.dropOnProperty(event, property, bo, this._designItems);
      }
    }

    const transferDataPropertyGrid = event.dataTransfer.getData(dragDropFormatNamePropertyGrid)
    if (transferDataPropertyGrid) {
      const dropObj = JSON.parse(transferDataPropertyGrid);
      const ddService = this._serviceContainer.propertyGridDragDropService;
      if (ddService) {
        ddService.dropOnProperty(event, property, dropObj, this._designItems);
      }
    }
  }

  public openContextMenu(event: MouseEvent, property: IProperty) {
    let ctxMenuItems: IContextMenuItem[];
    if (this.propertyContextMenuProvider)
      ctxMenuItems = this.propertyContextMenuProvider(this._designItems, property)
    if (!ctxMenuItems)
      ctxMenuItems = property.service.getContextMenu(this._designItems, property);
    ContextMenu.show(ctxMenuItems, event);
  }

  public designItemsChanged(designItems: IDesignItem[]) {
    this._designItems = designItems;
    for (let m of this._propertyMap) {
      m[1].editor.designItemsChanged(designItems);
    }
  }

  public refreshForDesignItems(items: IDesignItem[]) {
    for (let m of this._propertyMap) {
      PropertyGridPropertyList.refreshIsSetElementAndEditorForDesignItems(m[1].isSetElement, m[0], items, this._propertiesService, m[1].editor);
    }
  }

  public static refreshIsSetElementAndEditorForDesignItems(isSetElement: HTMLElement, property: IProperty, items: IDesignItem[], propertiesService: IPropertiesService, editor?: IPropertyEditor) {
    if (items && items.length) {
      let s = propertiesService.isSet(items, property);
      let v = propertiesService.getValue(items, property);
      isSetElement.title = property.name + ': ' + s;
      if (s == ValueType.none) {
        isSetElement.style.background = '';
        v = propertiesService.getUnsetValue(items, property);
      }
      else if (s == ValueType.all)
        isSetElement.style.background = 'white';
      else if (s == ValueType.some)
        isSetElement.style.background = 'gray';
      else if (s == ValueType.bound)
        isSetElement.style.background = 'orange';
      else if (s == ValueType.fromStylesheet) {
        v = propertiesService.getUnsetValue(items, property);
        isSetElement.style.background = 'yellow';
      }
      editor?.refreshValueWithoutNotification(s, v);
    } else {
      isSetElement.style.background = '';
    }
  }
}

customElements.define('node-projects-property-grid-property-list', PropertyGridPropertyList);