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
import type { IPropertyGridExtension } from './IPropertyGridExtensionProvider.js';

export class PropertyGridPropertyList extends BaseCustomWebComponentLazyAppend {

  static readonly observedAttributes = ['appearance'];
  attributeChangedCallback() {
    for (const { extension } of this._extensions)
      extension.element.setAttribute('appearance', this.getAttribute('appearance') ?? 'classic');
  }

  private _div: HTMLDivElement;
  private _propertyMap: Map<IProperty, { isSetElement: HTMLElement, labelElement: HTMLElement, editor: IPropertyEditor, rowElement: HTMLElement }> = new Map();
  private _serviceContainer: ServiceContainer;
  private _propertiesService: IPropertiesService;
  private _designItems: IDesignItem[];
  private _lastClassType: any;
  private _addCounter: number = 0;
  private _extensions: { property: IProperty, extension: IPropertyGridExtension }[] = [];

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
      grid-template-columns: var(--wcd-property-grid-columns, 11px minmax(80px, auto) minmax(120px, 1fr));
      row-gap: var(--wcd-property-grid-row-gap, 0);
      align-items: center;
      grid-auto-rows: minmax(24px, auto);
      align-items: center;
    }
    .property-row { display: contents; }
    .property-row[hidden] { display: none; }
    .property-status { padding: 0; margin: 0; font-size: 0; }
    label, input, select {
      display: inline-block;
      color: var(--wcd-color-text, white);
      background: transparent;
      margin: 2px 0;
      padding: 0 2px 0 4px;
      width: 110px;
      white-space: nowrap;
    }
    label, .style-label {
      box-sizing: border-box;
      display: inline-block;
      font-size: var(--wcd-property-grid-label-font-size, 13px);
      width: auto;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 2px;
    }
    input, select {
      padding:0;
      padding-left: 3px;
    }
    input, select {
      border: none;
    }
    .editor-control, .property-row > input, .property-row > select {
      border: 1px solid var(--wcd-input-border-color, var(--input-border-color, var(--wcd-color-border, #596c7a)));
      border-radius: var(--wcd-property-grid-editor-border-radius, 0);
    }
    .editor-control, input, select {
      height: var(--wcd-property-grid-editor-height, 24px);
      box-sizing: border-box;
      font-size: 11px;
      width: 100%;
      margin: 0;
      /*min-width: 0;*/
    }
    .editor-control:focus, input:focus, select:focus {
      outline: none;
      box-shadow: none;
    }
    /*input {
      margin-left: 4px;
    }*/
    .editor-control[disabled], input[disabled], select[disabled] {
      color: var(--wcd-color-text-muted, #BDBDBD);
    }
    select {
      background: transparent;
    }
    select:focus option {
      color: var(--wcd-property-grid-select-option-color, black);
    }
    .unset-value {
      color: var(--wcd-property-grid-unset-value-color, var(--wcd-color-text-muted, lightslategray))
    }
    .unset-value > * {
      color: var(--wcd-property-grid-unset-value-color, var(--wcd-color-text-muted, lightslategray))
    }
    .unset-value:focus {
      color: var(--wcd-color-text, white)
    }
    .group-header {
      grid-column: 1 / 3;
      font-size: 10px;
      font-family: monospace;
    }
    .group-header[clickable]:hover {
      cursor:pointer;
      color: var(--wcd-property-grid-group-header-hover-color, orange);
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
      color: var(--wcd-property-grid-group-header-hover-color, orange);
      text-decoration: underline;
    }
    .dragOverProperty {
      outline: 2px dashed var(--wcd-property-grid-drop-target-color, orange);
      outline-offset: -2px;
    }
    :host([appearance="modern"]) {
      font-family: var(--wcd-property-grid-font-family, system-ui, sans-serif);
      color: var(--_wcd-pg-text);
    }
    :host([appearance="modern"]) .content-wrapper {
      padding: 0;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-auto-rows: auto;
    }
    :host([appearance="modern"]) .property-row {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: minmax(0, .85fr) minmax(0, 1fr) 28px;
      align-items: center;
      min-height: var(--wcd-property-grid-row-height, 40px);
      padding: 5px 12px;
      gap: 8px;
      border-bottom: 1px solid var(--_wcd-pg-border);
    }
    :host([appearance="modern"]) .property-row[hidden] { display: none; }
    :host([appearance="modern"]) .property-row:hover,
    :host([appearance="modern"]) .property-row:focus-within { background: var(--_wcd-pg-hover); }
    :host([appearance="modern"]) .property-row > * { min-width: 0; }
    :host([appearance="modern"]) .property-label { grid-column: 1; grid-row: 1; color: inherit; }
    :host([appearance="modern"]) .editor-control { grid-column: 2; grid-row: 1; }
    :host([appearance="modern"]) .property-row.hide-label .editor-control { grid-column: 1 / 3 !important; }
    :host([appearance="modern"]) .property-actions {
      grid-column: 3;
      grid-row: 1;
      justify-content: center;
      width: 28px !important;
      height: 28px !important;
      margin-left: 0 !important;
    }
    :host([appearance="modern"]) .property-status {
      position: relative;
      width: 26px !important;
      height: 26px !important;
      background: transparent !important;
      border: none !important;
      border-radius: 4px;
      color: var(--_wcd-pg-muted);
      font-size: 18px;
    }
    :host([appearance="modern"]) .property-status:hover { background: var(--_wcd-pg-raised) !important; }
    :host([appearance="modern"]) .property-status::after {
      content: '';
      position: absolute;
      top: 3px;
      right: 1px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    :host([appearance="modern"]) .property-status[data-value-type="all"]::after { background: var(--_wcd-pg-muted); }
    :host([appearance="modern"]) .property-status[data-value-type="some"]::after { background: var(--_wcd-pg-muted); }
    :host([appearance="modern"]) .property-status[data-value-type="bound"]::after { background: var(--_wcd-pg-accent); }
    :host([appearance="modern"]) .property-status[data-value-type="fromStylesheet"]::after { background: var(--wcd-property-grid-stylesheet-indicator-color, #b79735); }
    :host([appearance="modern"]) input,
    :host([appearance="modern"]) select,
    :host([appearance="modern"]) .editor-control {
      color: inherit;
      font-size: 13px;
      height: var(--wcd-property-grid-editor-height, 28px);
      border-color: var(--wcd-input-border-color, transparent);
      border-radius: var(--wcd-property-grid-editor-border-radius, 4px);
    }
    :host([appearance="modern"]) input:not([type="checkbox"]),
    :host([appearance="modern"]) select { padding-inline: 6px; }
    :host([appearance="modern"]) input:hover,
    :host([appearance="modern"]) select:hover { border-color: var(--wcd-input-border-color, var(--_wcd-pg-border)); }
    :host([appearance="modern"]) input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--_wcd-pg-accent); }
    :host([appearance="modern"]) input:focus-visible,
    :host([appearance="modern"]) select:focus-visible,
    :host([appearance="modern"]) button:focus-visible {
      outline: 2px solid var(--wcd-color-focus, var(--_wcd-pg-accent));
      outline-offset: 1px;
    }
    :host([appearance="modern"]) .unset-value { color: var(--wcd-property-grid-unset-value-color, var(--_wcd-pg-muted)); }
    :host([appearance="modern"]) .group-header {
      grid-column: 1;
      padding: 10px 12px;
      font: inherit;
      font-weight: 600;
      color: var(--_wcd-pg-text);
      background: var(--_wcd-pg-raised);
    }
    :host([appearance="modern"]) .group-desc { padding-right: 12px; font-size: 12px; }
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
      for (const { extension } of this._extensions) extension.dispose?.();
      this._extensions = [];
    }
  }

  public async createElements(designItem: IDesignItem): Promise<boolean> {
    if (!this._shouldCreateElements(designItem))
      return true;

    const properties = await this._propertiesService?.getProperties(designItem);
    return this._rebuildElements(designItem, properties);
  }

  private _shouldCreateElements(designItem: IDesignItem): boolean {
    if (!this._propertiesService)
      return false;
    if (this._propertyMap.size == 0)
      return true;

    const refreshMode = this._propertiesService.getRefreshMode(designItem);
    return refreshMode !== RefreshMode.none && (refreshMode !== RefreshMode.fullOnClassChange || this._lastClassType !== designItem.element.constructor);
  }

  private _rebuildElements(designItem: IDesignItem, properties: IProperty[] | IPropertyGroup[]): boolean {
    this._lastClassType = designItem.element.constructor;
    DomHelper.removeAllChildnodes(this._div);
    this._propertyMap.clear();
    for (const { extension } of this._extensions) extension.dispose?.();
    this._extensions = [];

    if (properties?.length) {
      for (let p of properties) {
        if ('properties' in p)
          this.createPropertyGroups(<IPropertyGroup>p);
        else
          this.createPropertyEditors(<IProperty>p);
      }
      return true;
    }

    return false;
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
      property.rowElement.hidden = !property.rowElement.hidden;
      for (const { property: extensionProperty, extension } of this._extensions)
        if (extensionProperty === p) extension.element.hidden = property.rowElement.hidden;
    }
  }

  private createPropertyEditors(property: IProperty, isInGroup?: boolean) {
    let editor: IPropertyEditor;
    let labelHolder: HTMLElement;
    if (property.createEditor)
      editor = property.createEditor(property);
    else {
      editor = this._serviceContainer.forSomeServicesTillResult("propertyEditorTypesService", x => x.getEditorForProperty(property));
    }
    if (editor) {
      const row = document.createElement('div');
      row.className = 'property-row';
      if (property.hideLabel)
        row.classList.add('hide-label');
      let rectContainer = document.createElement("div")
      rectContainer.className = 'property-actions';
      if (isInGroup)
        rectContainer.style.marginLeft = '10px';
      rectContainer.style.width = '20px';
      rectContainer.style.height = '20px';
      rectContainer.style.display = 'flex';
      rectContainer.style.alignItems = 'center';
      let rect = document.createElement('button');
      rect.type = 'button';
      rect.className = 'property-status';
      rect.textContent = '⋯';
      rect.setAttribute('aria-label', `Actions for ${property.displayName ?? property.name}`);
      rect.disabled = property.readonly === true;
      rect.style.width = '7px';
      rect.style.height = '7px';
      rect.style.border = '1px white solid';
      rect.style.cursor = 'pointer';
      if (property.propertyType != PropertyType.complex)
        rectContainer.appendChild(rect);
      row.appendChild(rectContainer);
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
          row.appendChild(dl);
          label.setAttribute('list', dl.id);
        }
        row.appendChild(label);
      } else {
        if (property.hideLabel) {
          labelHolder = document.createElement("span");
        } else if (!property.renamable) {
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
          row.appendChild(label);
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
          row.appendChild(label);
        }
      }
      if (property.name)
        editor.element.id = property.name;
      if (editor.element instanceof HTMLElement)
        editor.element.classList.add('editor-control');
      if (property.hideLabel)
        (<HTMLElement>editor.element).style.gridColumn = '2 / 4';
      labelHolder.classList.add('property-label');
      row.appendChild(editor.element);
      this._div.appendChild(row);

      for (const provider of this._serviceContainer.propertyGridExtensions) {
        const extension = provider.createExtension(property);
        if (extension) {
          extension.element.setAttribute('appearance', this.getAttribute('appearance') ?? 'classic');
          extension.element.style.gridColumn = '1 / -1';
          this._extensions.push({ property, extension });
          this._div.appendChild(extension.element);
        }
      }

      this._propertyMap.set(property, { isSetElement: rect, labelElement: labelHolder, editor: editor, rowElement: row });
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
    for (const { property: extensionProperty, extension } of this._extensions)
      if (extensionProperty === property)
        ctxMenuItems = [...(ctxMenuItems ?? []), ...(extension.getContextMenuItems?.(this._designItems) ?? [])];
    ContextMenu.show(ctxMenuItems, event);
  }

  public designItemsChanged(designItems: IDesignItem[]) {
    this._designItems = designItems;
    for (const { extension } of this._extensions) extension.refresh(designItems);
    for (let m of this._propertyMap) {
      m[1].editor.designItemsChanged(designItems);
    }
  }

  public refreshForDesignItems(items: IDesignItem[]) {
    for (const { extension } of this._extensions) extension.refresh(items);
    for (let m of this._propertyMap) {
      PropertyGridPropertyList.refreshIsSetElementAndEditorForDesignItems(m[1].isSetElement, m[0], items, this._propertiesService, m[1].editor);
    }
  }

  public static refreshIsSetElementAndEditorForDesignItems(isSetElement: HTMLElement, property: IProperty, items: IDesignItem[], propertiesService: IPropertiesService, editor?: IPropertyEditor) {
    if (items && items.length) {
      let s = propertiesService.isSet(items, property);
      isSetElement.dataset.valueType = s;
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
