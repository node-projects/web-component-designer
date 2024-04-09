import { IProperty, PropertyGrid } from '@node-projects/propertygrid.webcomponent'
import { BindableObjectsBrowser } from '@node-projects/web-component-designer-widgets-wunderbaum';
import { WbRenderEventType } from "types";
import { VisualizationHandler } from '../interfaces/VisualizationHandler';
import { VisualizationShell } from '../interfaces/VisualizationShell';
import { CodeViewMonaco } from '@node-projects/web-component-designer-codeview-monaco';
import { ServiceContainer } from '@node-projects/web-component-designer';

export class VisualizationPropertyGrid extends PropertyGrid {

    public serviceContainer: ServiceContainer;
    public visualizationHandler: VisualizationHandler;
    public visualizationShell: VisualizationShell;

    public override async getEditorForType(property: IProperty, currentValue, propertyPath: string, wbRender: WbRenderEventType, additionalInfo?: any): Promise<HTMLElement> {
        if (this.getSpecialEditorForType) {
            let edt = await this.getSpecialEditorForType(property, currentValue, propertyPath, wbRender, additionalInfo);
            if (edt)
                return edt;
        }
        
        switch (property.format) {
            case 'screen': {
                let editor = document.createElement('select');
                editor.style.width = '100%';
                for (let v of await this.visualizationHandler.getAllNames('screen')) {
                    const op = document.createElement('option');
                    op.value = v;
                    op.innerText = v;
                    editor.appendChild(op);
                }
                editor.onchange = () => {
                    this.setPropertyValue(propertyPath, editor.value);
                };
                editor.value = currentValue;
                return editor;
            }
            case 'signal': {
                let cnt = document.createElement('div');
                cnt.style.display = 'flex';
                let inp = document.createElement('input');
                inp.value = currentValue ?? '';
                inp.style.flexGrow = '1';
                inp.style.width = '0';
                inp.onchange = (e) => this.setPropertyValue(propertyPath, inp.value);
                inp.onfocus = (e) => {
                    inp.selectionStart = 0;
                    inp.selectionEnd = inp.value?.length;
                }
                cnt.appendChild(inp);
                let btn = document.createElement('button');
                btn.textContent = '...';
                btn.onclick = async () => {
                    let b = new BindableObjectsBrowser();
                    b.initialize(this.serviceContainer);
                    b.title = 'select signal...';
                    const abortController = new AbortController();
                    b.objectDoubleclicked.on(() => {
                        abortController.abort();
                        inp.value = b.selectedObject.fullName;
                        this.setPropertyValue(propertyPath, inp.value);
                    });
                    let res = await this.visualizationShell.openConfirmation(b, { x: 100, y: 100, width: 400, height: 300, parent: this, abortSignal: abortController.signal });
                    if (res) {
                        inp.value = b.selectedObject.fullName;
                        this.setPropertyValue(propertyPath, inp.value);
                    }
                }
                cnt.appendChild(btn);
                return cnt;

            }
            case 'html':
            case 'script': {
                let editor = document.createElement('div');
                editor.style.boxSizing = 'border-box';
                editor.style.width = '100%';
                editor.style.display = 'flex';

                let inp = document.createElement('textarea');
                inp.style.boxSizing = 'border-box';
                inp.value = currentValue ?? '';
                inp.style.width = '100%';
                inp.onblur = e => { this.setPropertyValue(propertyPath, inp.value); }
                editor.appendChild(inp);

                let btn = document.createElement('button');
                btn.innerHTML = '...';
                btn.style.boxSizing = 'border-box';
                btn.onclick = async () => {
                    let cvm = new CodeViewMonaco();
                    if (property.format == 'html') {
                        cvm.language = 'html';
                    } else {
                        let monacoInfo = {
                            content: `declare global {
                            var context: { event: Event, element: Element };
                        }`, filePath: 'global.d.ts'
                        }
                        //@ts-ignore
                        monaco.languages.typescript.typescriptDefaults.setExtraLibs([monacoInfo]);
                        cvm.language = 'javascript';
                    }
                    cvm.code = inp.value;
                    cvm.style.position = 'relative';
                    let res = await this.visualizationShell.openConfirmation(cvm, { x: 200, y: 200, width: 600, height: 400, parent: this });
                    if (res) {
                        inp.value = cvm.getText();
                        this.setPropertyValue(propertyPath, inp.value);
                    }
                }
                editor.appendChild(btn);

                return editor;
            }
        }
        
        return super.getEditorForType(property, currentValue, propertyPath, wbRender, additionalInfo);
    }
}

customElements.define("node-projects-visualization-property-grid", VisualizationPropertyGrid);
