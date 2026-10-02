import { BaseCustomWebComponentLazyAppend, css } from '@node-projects/base-custom-webcomponent';
import { BindingTarget } from '@node-projects/web-component-designer/dist/elements/item/BindingTarget.js';
import { IBinding } from '@node-projects/web-component-designer/dist/elements/item/IBinding.js';
import { IDesignItem } from '@node-projects/web-component-designer/dist/elements/item/IDesignItem.js';
import { ContextMenu } from '@node-projects/web-component-designer/dist/elements/helper/contextMenu/ContextMenu.js';
import { ClassBindingsPropertiesService } from './ClassBindingsPropertiesService.js';

export class PropertyGridClassBindings extends BaseCustomWebComponentLazyAppend {
  private _items: IDesignItem[] = [];
  private _service = new ClassBindingsPropertiesService();
  private _rows: HTMLDivElement;
  private _add: HTMLButtonElement;
  private _toggle: HTMLButtonElement;
  private _signature: string;
  private _editing = false;

  static override readonly style = css`
    :host { display: block; grid-column: 1 / -1; min-width: 0; color: var(--wcd-color-text, white); }
    :host([hidden]) { display: none !important; }
    .header, .row { display: flex; align-items: center; gap: 8px; min-height: 28px; }
    .row { padding-left: 16px; }
    button { font: inherit; color: inherit; background: transparent; border: none; cursor: pointer; padding: 4px; }
    button:focus-visible { outline: 2px solid var(--wcd-color-accent, #e91e63); outline-offset: -2px; }
    button:disabled { opacity: .5; cursor: default; }
    .toggle, .name { text-align: left; }
    .toggle { flex: 1; }
    .name { flex: 0 1 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .summary { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--wcd-color-text-muted, #bdbdbd); }
    .message { padding: 4px 16px; font-size: 12px; color: var(--wcd-color-text-muted, #bdbdbd); }
    dialog { box-sizing: border-box; width: min(420px, calc(100vw - 32px)); color: inherit; background: var(--wcd-property-grid-background, var(--wcd-color-surface-raised, #2f3545)); border: 1px solid var(--wcd-color-border, #596c7a); padding: 16px; }
    dialog::backdrop { background: #0006; }
    form, label { display: grid; gap: 8px; }
    form { gap: 16px; }
    h3 { font: inherit; font-weight: 600; margin: 0; }
    input { box-sizing: border-box; width: 100%; padding: 6px; font: inherit; color: inherit; background: transparent; border: 1px solid var(--wcd-color-border, #596c7a); }
    .help { font-size: 12px; color: var(--wcd-color-text-muted, #bdbdbd); }
    .error { color: var(--wcd-color-error, #ff8a80); font-size: 12px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .actions button { border: 1px solid var(--wcd-color-border, #596c7a); padding: 6px 12px; }
    [hidden] { display: none !important; }
    :host([appearance="modern"]) { color: var(--_wcd-pg-text); font-size: 13px; }
    :host([appearance="modern"]) .header {
      padding: 5px 12px;
      min-height: 38px;
      background: var(--_wcd-pg-raised);
      border-bottom: 1px solid var(--_wcd-pg-border);
    }
    :host([appearance="modern"]) .toggle { font-weight: 600; }
    :host([appearance="modern"]) .row {
      display: grid;
      grid-template-columns: minmax(0, .85fr) minmax(0, 1fr) 28px;
      padding: 5px 12px 5px 24px;
      min-height: 38px;
      border-bottom: 1px solid var(--_wcd-pg-border);
    }
    :host([appearance="modern"]) .row:hover,
    :host([appearance="modern"]) .row:focus-within { background: var(--_wcd-pg-hover); }
    :host([appearance="modern"]) .summary { color: var(--_wcd-pg-muted); }
    :host([appearance="modern"]) button { border-radius: 4px; }
    :host([appearance="modern"]) button:hover { background: var(--_wcd-pg-hover); }
    :host([appearance="modern"]) button:focus-visible { outline-color: var(--wcd-color-focus, var(--_wcd-pg-accent)); }
    :host([appearance="modern"]) dialog {
      padding: 24px;
      border-radius: 10px;
      color: var(--_wcd-pg-text);
      background: var(--_wcd-pg-surface);
      border-color: var(--_wcd-pg-border);
      box-shadow: 0 16px 64px #0003;
    }
    :host([appearance="modern"]) h3 { font-size: 16px; }
    :host([appearance="modern"]) input { border-radius: 5px; border-color: var(--_wcd-pg-border); padding: 8px; }
    :host([appearance="modern"]) input:focus-visible { outline: 2px solid var(--wcd-color-focus, var(--_wcd-pg-accent)); outline-offset: 1px; }
    :host([appearance="modern"]) .help { color: var(--_wcd-pg-muted); }
    :host([appearance="modern"]) .actions button { border-color: var(--_wcd-pg-border); }
    :host([appearance="modern"]) .actions button[type="submit"] {
      background: var(--_wcd-pg-accent);
      color: var(--wcd-color-accent-text, light-dark(white, #162b48));
      border-color: transparent;
    }
  `;

  constructor() {
    super();
    const header = document.createElement('div');
    header.className = 'header';
    this._toggle = document.createElement('button');
    this._toggle.type = 'button';
    this._toggle.className = 'toggle';
    this._toggle.textContent = '▾ Class bindings';
    this._toggle.setAttribute('aria-expanded', 'true');
    this._toggle.onclick = () => {
      this._rows.hidden = !this._rows.hidden;
      this._toggle.textContent = (this._rows.hidden ? '▸' : '▾') + ' Class bindings';
      this._toggle.setAttribute('aria-expanded', String(!this._rows.hidden));
    };
    this._add = document.createElement('button');
    this._add.type = 'button';
    this._add.textContent = '+';
    this._add.title = 'Add class binding…';
    this._add.setAttribute('aria-label', 'Add class binding');
    this._add.onclick = () => this.addBinding();
    header.append(this._toggle, this._add);
    this._rows = document.createElement('div');
    this.shadowRoot.append(header, this._rows);
  }

  refresh(items: IDesignItem[]) {
    const selectionChanged = this._items[0] !== items?.[0] || this._items.length !== items?.length;
    if (selectionChanged)
      this.shadowRoot.querySelector('dialog')?.close();
    this._items = items ?? [];
    const item = this._items.length === 1 ? this._items[0] : null;
    const bindings = item ? this._service.getBindings(item) : [];
    this._add.disabled = !item || !item.serviceContainer.config.openBindingsEditor;
    const signature = JSON.stringify(bindings.map(({ service, ...binding }) => binding));
    if (!selectionChanged && signature === this._signature)
      return;
    this._signature = signature;
    this._rows.replaceChildren();
    if (!item) {
      const message = document.createElement('div');
      message.className = 'message';
      message.textContent = 'Select one element to edit class bindings.';
      this._rows.appendChild(message);
      return;
    }
    for (const binding of bindings) {
      const row = document.createElement('div');
      row.className = 'row';
      const name = document.createElement('button');
      name.type = 'button';
      name.className = 'name';
      name.textContent = binding.targetName;
      name.title = `Edit class binding: ${binding.targetName}`;
      name.onclick = () => this.editBinding(item, binding);
      const summary = document.createElement('span');
      summary.className = 'summary';
      summary.textContent = '← ' + (binding.expression || binding.bindableObjectNames?.join(';') || binding.rawValue || 'binding');
      summary.title = summary.textContent;
      summary.ondblclick = () => this.editBinding(item, binding);
      const menu = document.createElement('button');
      menu.type = 'button';
      menu.textContent = '⋯';
      menu.setAttribute('aria-label', `Actions for class binding ${binding.targetName}`);
      const openMenu = (event: MouseEvent) => {
        event.preventDefault();
        ContextMenu.show([
          { title: 'Edit binding…', action: () => this.editBinding(item, binding) },
          { title: 'Rename class…', action: () => this.showNameDialog(item, binding) },
          { title: 'Remove binding', action: () => { this._service.remove(item, binding); this.refresh(this._items); } }
        ], event);
      };
      menu.onclick = openMenu;
      row.oncontextmenu = openMenu;
      row.append(name, summary, menu);
      this._rows.appendChild(row);
    }
  }

  public addBinding() {
    if (!this._add.disabled)
      this.showNameDialog(this._items[0]);
  }

  private async editBinding(item: IDesignItem, binding?: IBinding, name = binding?.targetName) {
    if (this._editing)
      return;
    const editor = item.serviceContainer.config.openBindingsEditor;
    if (editor) {
      this._editing = true;
      try {
        await editor(this._service.createProperty(name), [item], binding, BindingTarget.class);
        this.refresh(this._items);
      } finally {
        this._editing = false;
      }
    }
  }

  private showNameDialog(item: IDesignItem, binding?: IBinding, name = binding?.targetName ?? '') {
    if (this.shadowRoot.querySelector('dialog'))
      return;
    const dialog = document.createElement('dialog');
    const form = document.createElement('form');
    const title = document.createElement('h3');
    title.textContent = binding ? 'Rename class' : 'Add class binding';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Class name';
    const input = document.createElement('input');
    input.value = name;
    input.required = true;
    const help = document.createElement('span');
    help.className = 'help';
    help.textContent = 'Use lowercase names, e.g. is-active.';
    nameLabel.append(input, help);
    const error = document.createElement('div');
    error.className = 'error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.onclick = () => dialog.close();
    const save = document.createElement('button');
    save.type = 'submit';
    save.textContent = binding ? 'Save' : 'Next…';
    actions.append(cancel, save);
    form.append(title, nameLabel);
    form.append(error, actions);
    dialog.appendChild(form);
    this.shadowRoot.appendChild(dialog);
    dialog.onclose = () => dialog.remove();
    form.onsubmit = async event => {
      event.preventDefault();
      const newName = input.value.trim();
      const validation = this._service.validateName(item, newName, binding?.targetName);
      try {
        if (validation)
          throw new Error(validation);
        if (binding) {
          this._service.rename(item, binding, newName);
        }
        dialog.close();
        if (!binding)
          await this.editBinding(item, undefined, newName);
        this.refresh(this._items);
      } catch (exception) {
        error.textContent = exception.message;
        error.hidden = false;
      }
    };
    dialog.showModal();
    input.focus();
  }
}

customElements.define('node-projects-property-grid-class-bindings', PropertyGridClassBindings);
