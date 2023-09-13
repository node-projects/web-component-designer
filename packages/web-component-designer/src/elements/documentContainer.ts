import { BaseCustomWebComponentLazyAppend, css, cssFromString, debounce, TypedEvent } from "@node-projects/base-custom-webcomponent"
import { DesignerTabControl } from './controls/DesignerTabControl.js';
import { DesignerView } from './widgets/designerView/designerView.js';
import { ServiceContainer } from './services/ServiceContainer.js';
import { InstanceServiceContainer } from './services/InstanceServiceContainer.js';
import { ICodeView } from './widgets/codeView/ICodeView.js';
import { IStringPosition } from './services/htmlWriterService/IStringPosition.js';
import { IDemoView } from './widgets/demoView/IDemoView.js';
import { IUiCommandHandler } from '../commandHandling/IUiCommandHandler.js';
import { IUiCommand } from '../commandHandling/IUiCommand.js';
import { IDisposable } from '../interfaces/IDisposable.js';
import { ISelectionChangedEvent } from "./services/selectionService/ISelectionChangedEvent.js";
import { SimpleSplitView } from './controls/SimpleSplitView.js';
import { IStylesheet } from "./services/stylesheetService/IStylesheetService.js";

export class DocumentContainer extends BaseCustomWebComponentLazyAppend implements IUiCommandHandler, IDisposable {
  public designerView: DesignerView;
  public codeView: ICodeView & HTMLElement;
  public demoView: IDemoView & HTMLElement;

  public additionalData: any;

  private _firstLoad = true;
  private _stylesheetChangedEventRegistered: boolean;

  private _additionalStyle: string;
  public set additionalStyleString(style: string) {
    this._additionalStyle = style;
    this.designerView.additionalStyles = [cssFromString(style)];
  };
  public get additionalStyleString() {
    return this._additionalStyle;
  };

  private _additionalStylesheets: IStylesheet[];
  public set additionalStylesheets(stylesheets: IStylesheet[]) {
    this._additionalStylesheets = stylesheets;
    if (this.designerView.instanceServiceContainer.stylesheetService)
      this.designerView.instanceServiceContainer.stylesheetService.setStylesheets(stylesheets);
    if (!this._stylesheetChangedEventRegistered) {
      this._stylesheetChangedEventRegistered = true;
      this.designerView.instanceServiceContainer.stylesheetService.stylesheetChanged.on(e => this.additionalStylesheetChanged.emit({ name: e.name, newStyle: e.newStyle, oldStyle: e.oldStyle, changeSource: e.changeSource }));
    }
  };
  public get additionalStylesheets() {
    return this._additionalStylesheets;
  };
  public additionalStylesheetChanged = new TypedEvent<{ name: string, newStyle: string, oldStyle: string, changeSource: 'extern' | 'styleupdate' | 'undo' }>;

  public onContentChanged = new TypedEvent<void>();

  private _serviceContainer: ServiceContainer;
  private _content: string = '';
  private _tabControl: DesignerTabControl;
  private _selectionPosition: IStringPosition;
  private _splitDiv: SimpleSplitView;
  private _designerDiv: HTMLDivElement;
  private _codeDiv: HTMLDivElement;
  private refreshInSplitViewDebounced: (...args: any) => any;
  private _disableChangeNotificationDesigner: boolean;
  private _disableChangeNotificationEditor: boolean;

  static override get style() {
    return css`
      div {
        height: 100%;
        display: flex;
        flex-direction: column;
      }                            
      node-projects-designer-view {
        height: 100%;
        overflow: hidden;
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
    this.designerView.slot = 'top';
    this._designerDiv = document.createElement("div");
    this._tabControl.appendChild(this._designerDiv);
    this._designerDiv.title = 'Designer';
    this._designerDiv.appendChild(this.designerView);
    this.designerView.initialize(this._serviceContainer);
    this.designerView.instanceServiceContainer.selectionService.onSelectionChanged.on(e => this.designerSelectionChanged(e))
    this.designerView.designerCanvas.onContentChanged.on(() => this.designerContentChanged())

    this.codeView = new serviceContainer.config.codeViewWidget();
    this.codeView.slot = 'bottom';
    this.codeView.style.position = 'relative';
    this._codeDiv = document.createElement("div");
    this._tabControl.appendChild(this._codeDiv);
    this._codeDiv.title = 'Code';
    this._codeDiv.style.position = 'relative';
    this._codeDiv.appendChild(this.codeView);
    this.codeView.onTextChanged.on(text => {
      if (!this._disableChangeNotificationDesigner) {
        this._disableChangeNotificationEditor = true;
        if (this._tabControl.selectedIndex === 2) {
          this._content = text;
          this.refreshInSplitViewDebounced();
        }
      }
    })

    this._splitDiv = new SimpleSplitView();
    this._splitDiv.style.height = '100%';
    this._splitDiv.title = 'Split';
    this._tabControl.appendChild(this._splitDiv);
    this.demoView = new serviceContainer.config.demoViewWidget();
    this.demoView.title = 'Preview';
    this._tabControl.appendChild(this.demoView);
    queueMicrotask(() => {
      this.shadowRoot.appendChild(div);
      this._tabControl.selectedIndex = 0;
    });
  }

  async refreshInSplitView() {
    await this.designerView.parseHTML(this._content);
    this._disableChangeNotificationEditor = false;
  }

  designerSelectionChanged(e: ISelectionChangedEvent) {
    if (this._tabControl.selectedIndex === 2) {
      let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
      if (primarySelection) {
        this._content = this.designerView.getHTML();
        if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
          this._selectionPosition = this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
          this.codeView.setSelection(this._selectionPosition);
          this._selectionPosition = null;
        }
      }
    }
  }

  designerContentChanged() {
    this.onContentChanged.emit();

    if (!this._disableChangeNotificationEditor) {
      this._disableChangeNotificationDesigner = true;
      if (this._tabControl.selectedIndex === 2) {
        let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
        this._content = this.designerView.getHTML();
        this.codeView.update(this._content);
        if (primarySelection) {
          if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
            this._selectionPosition = this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
            if (this._selectionPosition)
              this.codeView.setSelection(this._selectionPosition);
            this._selectionPosition = null;
          }
        }
      }
      this._disableChangeNotificationDesigner = false;
    }
  }

  dispose(): void {
    this.codeView.dispose();
    this.demoView.dispose();
  }

  executeCommand(command: IUiCommand) {
    if (this._tabControl.selectedIndex === 0 || this._tabControl.selectedIndex === 2)
      this.designerView.executeCommand(command);
    else if (this._tabControl.selectedIndex === 1)
      this.codeView.executeCommand(command);
    else if (this._tabControl.selectedIndex === 3)
      this.demoView.executeCommand(command);
  }

  canExecuteCommand(command: IUiCommand) {
    if (this._tabControl.selectedIndex === 0 || this._tabControl.selectedIndex === 2) {
      if (this.designerView?.canExecuteCommand)
        return this.designerView.canExecuteCommand(command);
    } else if (this._tabControl.selectedIndex === 1) {
      if (this.codeView?.canExecuteCommand)
        return this.codeView.canExecuteCommand(command);
    } else if (this._tabControl.selectedIndex === 3) {
      if (this.demoView?.canExecuteCommand)
        return this.demoView.canExecuteCommand(command);
    }
    return false;
  }

  set content(value: string) {
    this._content = value;

    if (this._tabControl) {
      if (this._tabControl.selectedIndex === 0)
        this.designerView.parseHTML(this._content, this._firstLoad);
      else if (this._tabControl.selectedIndex === 1)
        this.codeView.update(this._content);
      else if (this._tabControl.selectedIndex === 2) {

      }
      else if (this._tabControl.selectedIndex === 3)
        this.demoView.display(this._serviceContainer, this.designerView.instanceServiceContainer, this._content, this.additionalStyleString);
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
        this._content = this.designerView.getHTML();
        if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
          this._selectionPosition = this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
        }
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
        this.demoView.display(this._serviceContainer, this.designerView.instanceServiceContainer, this._content, this.additionalStyleString);
      }
    });
    if (this._content) {
      this.content = this._content;
      this._firstLoad = false;
    }
  }

  public get instanceServiceContainer(): InstanceServiceContainer {
    return this.designerView.instanceServiceContainer;
  }
}

//@ts-ignore
customElements.define("node-projects-document-container", DocumentContainer);