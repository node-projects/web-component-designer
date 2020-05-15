import { BaseCustomWebComponent, css, html } from "./controls/BaseCustomWebComponent";
import { DesignerTabControl } from "./controls/DesignerTabControl";
import { DesignerView } from "./widgets/designerView/designerView";
import { CodeViewAce } from "./widgets/codeView/code-view-ace";
import { ServiceContainer } from "./services/ServiceContainer";
import { InstanceServiceContainer } from "./services/InstanceServiceContainer";
import { DemoView } from './widgets/demoView/demoView';

export class DocumentContainer extends BaseCustomWebComponent {

  _tabControl: DesignerTabControl;

  _designerView: DesignerView;
  _codeView: CodeViewAce;
  _demoView: DemoView;
  _serviceContainer: ServiceContainer;
  _content: string;

  static get style() {
    return css`
      div {
        height: 100%;
        display: flex;
        flex-direction: column;
      }                            
      canvas-view {
        overflow: auto;
      }`;
  }

  static get template() {
    return html`
        <div>
          <node-projects-designer-tab-control selected-index="0" id="tabControl">
            <node-projects-designer-view title="Designer" name="designer" id="designerView" style="height:100%">
            </node-projects-designer-view>
            <node-projects-code-view-ace title="Code" name="code" id="codeView"></node-projects-code-view-ace>
            <node-projects-demo-view title="Preview" name="preview" id="demoView"></node-projects-demo-view>
          </node-projects-designer-tab-control>
        </div>`;
  }

  constructor(serviceContainer: ServiceContainer, content?: string) {
    super();
    this._serviceContainer = serviceContainer;
    this._content = content;
  }

  set content(value: string) {
    this._content = value;
    if (this._tabControl.selectedIndex === 0)
      this._designerView.parseHTML(this._content);
    else if (this._tabControl.selectedIndex === 1)
      this._codeView.update(this._content);
    else if (this._tabControl.selectedIndex === 2)
      this._demoView.display(this._content);
  }
  get content() {
    if (this._tabControl.selectedIndex === 0)
      this._content = this._designerView.getHTML();
    else if (this._tabControl.selectedIndex === 1)
      this._content = this._codeView.getText();
    return this._content;
  }

  ready() {
    this._tabControl = this._getDomElement('tabControl');
    this._designerView = this._getDomElement('designerView');
    this._codeView = this._getDomElement('codeView');
    this._demoView = this._getDomElement('demoView');
    this._designerView.serviceContainer = this._serviceContainer;

    this._tabControl.onSelectedTabChanged.on((i) => {
      if (i.oldIndex === 0)
        this._content = this._designerView.getHTML();
      else if (i.oldIndex === 1)
        this._content = this._codeView.getText();

      if (i.newIndex === 0)
        this._designerView.parseHTML(this._content);
      else if (i.newIndex === 1)
        this._codeView.update(this._content)
      else if (i.newIndex === 2)
        this._demoView.display(this._content);
    });
  }


  public get instanceServiceContainer(): InstanceServiceContainer {
    return this._designerView.instanceServiceContainer;
  }
}

//@ts-ignore
customElements.define("node-projects-document-container", DocumentContainer);