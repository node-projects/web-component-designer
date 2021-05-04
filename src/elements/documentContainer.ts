import { BaseCustomWebComponentLazyAppend, css } from "@node-projects/base-custom-webcomponent"
import { DesignerTabControl } from "./controls/DesignerTabControl";
import { DesignerView } from "./widgets/designerView/designerView";
import { ServiceContainer } from "./services/ServiceContainer";
import { InstanceServiceContainer } from "./services/InstanceServiceContainer";
import { ICodeView } from '../elements/widgets/codeView/ICodeView';
import { IDesignItem } from '../elements/item/IDesignItem';
import { IStringPosition } from './services/serializationService/IStringPosition';
import { IDemoView } from './widgets/demoView/IDemoView';
import { IUiCommandHandler } from "../commandHandling/IUiCommandHandler";
import { IUiCommand } from "../commandHandling/IUiCommand";

export class DocumentContainer extends BaseCustomWebComponentLazyAppend implements IUiCommandHandler {
  public designerView: DesignerView;
  public codeView: ICodeView & HTMLElement;
  public demoView: IDemoView & HTMLElement;

  private _serviceContainer: ServiceContainer;
  private _content: string = '';
  private _tabControl: DesignerTabControl;
  private _selectionPosition: IStringPosition;

  static override get style() {
    return css`
      div {
        height: 100%;
        display: flex;
        flex-direction: column;
      }                            
      node-projects-designer-view {
        height: 100%;
        /*overflow: auto;*/
      }`;
  }

  constructor(serviceContainer: ServiceContainer, content?: string) {
    super();
    this._serviceContainer = serviceContainer;
    if (content != null)
      this._content = content;

    let div = document.createElement("div");
    this._tabControl = new DesignerTabControl();
    div.appendChild(this._tabControl);
    this.designerView = new DesignerView();
    this.designerView.title = 'Designer';
    this._tabControl.appendChild(this.designerView);
    this.designerView.initialize(this._serviceContainer);
    this.codeView = new serviceContainer.config.codeViewWidget();
    this.codeView.title = 'Code';
    this._tabControl.appendChild(this.codeView);
    this.demoView = new serviceContainer.config.demoViewWidget();
    this.demoView.title = 'Preview';
    this._tabControl.appendChild(this.demoView);
    queueMicrotask(() => {
      this.shadowRoot.appendChild(div);
      this._tabControl.selectedIndex = 0;
    });
  }

  executeCommand(command: IUiCommand) {
    if (this._tabControl.selectedIndex === 0)
      this.designerView.executeCommand(command);
    else if (this._tabControl.selectedIndex === 1)
      this.codeView.executeCommand(command);
  }

  canExecuteCommand(command: IUiCommand) {
    if (this._tabControl.selectedIndex === 0)
      return this.designerView.canExecuteCommand(command);
    else if (this._tabControl.selectedIndex === 1)
      return this.codeView.canExecuteCommand(command);
    return false;
  }

  set content(value: string) {
    this._content = value;

    if (this._tabControl) {
      if (this._tabControl.selectedIndex === 0)
        this.designerView.parseHTML(this._content);
      else if (this._tabControl.selectedIndex === 1)
        this.codeView.update(this._content);
      else if (this._tabControl.selectedIndex === 2)
        this.demoView.display(this._content);
    }
  }
  get content() {
    if (this._tabControl) {
      if (this._tabControl.selectedIndex === 0)
        this._content = this.designerView.getHTML();
      else if (this._tabControl.selectedIndex === 1)
        this._content = this.codeView.getText();
      return this._content;
    }
    return null;
  }

  ready() {
    this._tabControl.onSelectedTabChanged.on(i => {

      if (i.oldIndex === 0) {
        let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
        let designItemsAssignmentList: Map<IDesignItem, IStringPosition> = new Map();
        this._content = this.designerView.getHTML(designItemsAssignmentList);
        this._selectionPosition = designItemsAssignmentList.get(primarySelection);
      } else if (i.oldIndex === 1)
        this._content = this.codeView.getText();

      if (i.newIndex === 0)
        this.designerView.parseHTML(this._content);
      else if (i.newIndex === 1) {
        this.codeView.update(this._content);
        if (this._selectionPosition) {
          this.codeView.setSelection(this._selectionPosition);
          this._selectionPosition = null;
        }
        if (i.changedViaClick) {
          this.codeView.focusEditor();
        }
      } else if (i.newIndex === 2)
        this.demoView.display(this._content);
    });
    if (this._content)
      this.content = this._content;
  }

  public get instanceServiceContainer(): InstanceServiceContainer {
    return this.designerView.instanceServiceContainer;
  }
}

//@ts-ignore
customElements.define("node-projects-document-container", DocumentContainer);