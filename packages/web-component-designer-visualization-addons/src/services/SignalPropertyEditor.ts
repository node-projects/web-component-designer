import { BasePropertyEditor, IProperty, ValueType } from "@node-projects/web-component-designer";
import { VisualizationShell } from "../interfaces/VisualizationShell.js";

export class SignalPropertyEditor extends BasePropertyEditor<HTMLElement> {

  _ip: HTMLInputElement;
  protected _container: HTMLDivElement;

  constructor(property: IProperty, shell: VisualizationShell) {
    super(property);

    this._container = document.createElement('div');
    this._container.style.display = 'flex';
    this._ip = document.createElement('input');
    this._ip.onchange = (e) => this._valueChanged(this._ip.value);
    this._ip.onfocus = (e) => {
      this._ip.selectionStart = 0;
      this._ip.selectionEnd = this._ip.value?.length;
    }
    this._container.appendChild(this._ip);
    let btn = document.createElement('button');
    btn.textContent = '...';
    btn.onclick = async () => {
      let b = shell.createBindableObjectBrowser();
      b.initialize(this.designItems[0].serviceContainer, this.designItems[0].instanceServiceContainer, 'property');
      b.title = 'select signal...';
      const abortController = new AbortController();
      b.objectDoubleclicked.on(() => {
        abortController.abort();
        this._ip.value = b.selectedObject.fullName;
        this._valueChanged(this._ip.value);
      });
      let res = await shell.openConfirmation(b, { x: 100, y: 100, width: 400, height: 300, abortSignal: abortController.signal });
      if (res) {
        this._ip.value = b.selectedObject.fullName;
        this._valueChanged(this._ip.value);
      }
    }
    this._container.appendChild(btn);
    this.element = this._container;
  }

  refreshValue(valueType: ValueType, value: any) {
    if (value == null)
      this._ip.value = "";
    else
      this._ip.value = value;
  }
}