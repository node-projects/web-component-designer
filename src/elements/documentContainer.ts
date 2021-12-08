import { BaseCustomWebComponentLazyAppend, css, debounce } from "@node-projects/base-custom-webcomponent"
import { DesignerTabControl } from "./controls/DesignerTabControl";
import { DesignerView } from "./widgets/designerView/designerView";
import { ServiceContainer } from "./services/ServiceContainer";
import { InstanceServiceContainer } from "./services/InstanceServiceContainer";
import { ICodeView } from '../elements/widgets/codeView/ICodeView';
import { IDesignItem } from '../elements/item/IDesignItem';
import { IStringPosition } from './services/htmlWriterService/IStringPosition';
import { IDemoView } from './widgets/demoView/IDemoView';
import { IUiCommandHandler } from "../commandHandling/IUiCommandHandler";
import { IUiCommand } from "../commandHandling/IUiCommand";
import { IDisposable } from "../interfaces/IDisposable";
import { ISelectionChangedEvent } from "./services/selectionService/ISelectionChangedEvent.js";

export class DocumentContainer extends BaseCustomWebComponentLazyAppend implements IUiCommandHandler, IDisposable {
  public designerView: DesignerView;
  public codeView: ICodeView & HTMLElement;
  public demoView: IDemoView & HTMLElement;

  public additionalData: any;

  private _serviceContainer: ServiceContainer;
  private _content: string = '';
  private _tabControl: DesignerTabControl;
  private _selectionPosition: IStringPosition;
  private _splitDiv: HTMLDivElement;
  private _designerDiv: HTMLDivElement;
  private _codeDiv: HTMLDivElement;
  private refreshInSplitViewDebounced: (...args: any) => any;

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
      }
      .split-div {
        display: grid;
        grid-template-rows: 1fr 1fr;
      }
      `;
  }

  constructor(serviceContainer: ServiceContainer, content?: string) {
    super();

    this.refreshInSplitViewDebounced = debounce(this.refreshInSplitView, 200)
    this._serviceContainer = serviceContainer;
    if (content != null)
      this._content = content;

    let div = document.createElement("div");
    this._tabControl = new DesignerTabControl();
    div.appendChild(this._tabControl);
    this.designerView = new DesignerView();
    this.designerView.setAttribute('exportparts', 'canvas');
    this._designerDiv = document.createElement("div");
    this._tabControl.appendChild(this._designerDiv);
    this._designerDiv.title = 'Designer';
    this._designerDiv.appendChild(this.designerView);
    this.designerView.initialize(this._serviceContainer);
    this.designerView.instanceServiceContainer.selectionService.onSelectionChanged.on(e => this.designerSelectionChanged(e))

    this.codeView = new serviceContainer.config.codeViewWidget();
    this._codeDiv = document.createElement("div");
    this._tabControl.appendChild(this._codeDiv);
    this._codeDiv.title = 'Code';
    this._codeDiv.appendChild(this.codeView);
    this.codeView.onTextChanged.on(text => {
      if (this._tabControl.selectedIndex === 2) {
        this._content = text;
        this.refreshInSplitViewDebounced();
      }
    })

    this._splitDiv = document.createElement("div");
    this._splitDiv.title = 'Split';
    this._splitDiv.className = 'split-div';
    this._tabControl.appendChild(this._splitDiv);
    this.demoView = new serviceContainer.config.demoViewWidget();
    this.demoView.title = 'Preview';
    this._tabControl.appendChild(this.demoView);
    queueMicrotask(() => {
      this.shadowRoot.appendChild(div);
      this._tabControl.selectedIndex = 0;
    });
  }

  refreshInSplitView() {
    this.designerView.parseHTML(this._content);
  }

  designerSelectionChanged(e: ISelectionChangedEvent) {
    let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
    if (primarySelection) {
      let designItemsAssignmentList: Map<IDesignItem, IStringPosition> = new Map();
      this._content = this.designerView.getHTML(designItemsAssignmentList);
      this._selectionPosition = designItemsAssignmentList.get(primarySelection);
      this.codeView.setSelection(this._selectionPosition);
      this._selectionPosition = null;
    }
  }

  dispose(): void {
    this.codeView.dispose();
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
      else if (this._tabControl.selectedIndex === 2) {

      }
      else if (this._tabControl.selectedIndex === 3)
        this.demoView.display(this._serviceContainer, this.designerView.instanceServiceContainer, this._content);
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
      } else if (i.oldIndex === 1) {
        this._content = this.codeView.getText();
      } else if (i.oldIndex === 2) {
        this._designerDiv.appendChild(this.designerView);
        this._codeDiv.appendChild(this.codeView);
      }

      if (i.newIndex === 0 || i.newIndex === 2)
        this.designerView.parseHTML(this._content);
      if (i.newIndex === 1 || i.newIndex === 2) {
        this.codeView.update(this._content);
        if (this._selectionPosition) {
          this.codeView.setSelection(this._selectionPosition);
          this._selectionPosition = null;
        }
        if (i.changedViaClick) {
          this.codeView.focusEditor();
        }
      }
      if (i.newIndex === 2) {
        this._splitDiv.appendChild(this.designerView);
        this._splitDiv.appendChild(this.codeView);
      }
      if (i.newIndex === 3) {
        this.demoView.display(this._serviceContainer, this.designerView.instanceServiceContainer, this._content);
      }
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