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
import { sleep } from "./helper/Helper.js";
import { ExtensionType } from "./widgets/designerView/extensions/ExtensionType.js";

enum tabIndex {
  designer = 0,
  code = 1,
  split = 2,
  preview = 3
}

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

  constructor(serviceContainer: ServiceContainer, content?: string, useIframe: boolean = false) {
    super();

    this.refreshInSplitViewDebounced = debounce(this.refreshInSplitView, 200)
    this._serviceContainer = serviceContainer;
    if (content != null)
      this._content = content;

    let div = document.createElement("div");
    this._tabControl = new DesignerTabControl();
    div.appendChild(this._tabControl);
    this.designerView = new DesignerView(useIframe);
    this.designerView.setAttribute('exportparts', 'canvas');
    this.designerView.slot = 'top';
    this._designerDiv = document.createElement("div");
    this._tabControl.appendChild(this._designerDiv);
    this._designerDiv.title = 'Designer';
    this._designerDiv.appendChild(this.designerView);
    this.designerView.initialize(this._serviceContainer);
    this.designerView.instanceServiceContainer.documentContainer = this;
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
        if (this._tabControl.selectedIndex === tabIndex.code || this._tabControl.selectedIndex === tabIndex.split) {
          this._disableChangeNotificationEditor = true;
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
      this._tabControl.selectedIndex = tabIndex.designer;
    });
  }

  async refreshInSplitView() {
    try {
      await this.updateDesignerHtml();
    } catch (err) {
      console.error(err);
    }
    this._disableChangeNotificationEditor = false;
  }

  get currentView(): 'designer' | 'split' | 'code' | 'preview' {
    if (this._tabControl.selectedIndex == tabIndex.designer)
      return 'designer'
    if (this._tabControl.selectedIndex == tabIndex.split)
      return 'split'
    if (this._tabControl.selectedIndex == tabIndex.code)
      return 'code'
    if (this._tabControl.selectedIndex == tabIndex.preview)
      return 'preview'
    return null;
  }
  set currentView(view: 'designer' | 'split' | 'code' | 'preview') {
    if (view == 'designer')
      this._tabControl.selectedIndex = tabIndex.designer;
    if (view == 'split')
      this._tabControl.selectedIndex = tabIndex.split;
    if (view == 'code')
      this._tabControl.selectedIndex = tabIndex.code;
    if (view == 'preview')
      this._tabControl.selectedIndex = tabIndex.preview;
  }

  designerSelectionChanged(e: ISelectionChangedEvent) {
    if (this._tabControl.selectedIndex === tabIndex.split) {
      let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
      if (primarySelection) {
        if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
          this._selectionPosition = this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
          if (this._selectionPosition)
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
      if (this._tabControl.selectedIndex === tabIndex.code || this._tabControl.selectedIndex === tabIndex.split) {
        let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
        this._content = this.designerView.getDesignerHTML();
        this.codeView.update(this._content, this.designerView.instanceServiceContainer);
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
    if (this._tabControl.selectedIndex === tabIndex.designer || this._tabControl.selectedIndex === tabIndex.split)
      this.designerView.executeCommand(command);
    else if (this._tabControl.selectedIndex === tabIndex.code)
      this.codeView.executeCommand(command);
    else if (this._tabControl.selectedIndex === tabIndex.preview)
      this.demoView.executeCommand(command);
  }

  canExecuteCommand(command: IUiCommand) {
    if (this._tabControl.selectedIndex === tabIndex.designer || this._tabControl.selectedIndex === tabIndex.split) {
      if (this.designerView?.canExecuteCommand)
        return this.designerView.canExecuteCommand(command);
    } else if (this._tabControl.selectedIndex === tabIndex.code) {
      if (this.codeView?.canExecuteCommand)
        return this.codeView.canExecuteCommand(command);
    } else if (this._tabControl.selectedIndex === tabIndex.preview) {
      if (this.demoView?.canExecuteCommand)
        return this.demoView.canExecuteCommand(command);
    }
    return false;
  }

  set content(value: string) {
    this._content = value;

    if (this._tabControl) {
      if (this._tabControl.selectedIndex === tabIndex.designer)
        this.updateDesignerHtml();
      else if (this._tabControl.selectedIndex === tabIndex.code)
        this.codeView.update(this._content, this.designerView.instanceServiceContainer);
      else if (this._tabControl.selectedIndex === tabIndex.split) {

      }
      else if (this._tabControl.selectedIndex === tabIndex.preview)
        this.demoView.display(this._serviceContainer, this.designerView.instanceServiceContainer, this._content, this.additionalStyleString);
    }
  }
  get content() {
    if (this._tabControl) {
      if (this._tabControl.selectedIndex === tabIndex.designer)
        this._content = this.designerView.getDesignerHTML();
      else if (this._tabControl.selectedIndex === tabIndex.code)
        this._content = this.codeView.getText();
      return this._content;
    }
    return null;
  }

  ready() {
    this._tabControl.onSelectedTabChanged.on(i => {
      if (i.oldIndex === tabIndex.designer) {
        let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
        this._content = this.designerView.getDesignerHTML();
        if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
          this._selectionPosition = this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
        }
      } else if (i.oldIndex === tabIndex.code) {
        this._content = this.codeView.getText();
      } else if (i.oldIndex === tabIndex.split) {
        this._designerDiv.appendChild(this.designerView);
        this._codeDiv.appendChild(this.codeView);
      } else if (i.oldIndex === tabIndex.preview) {
        if (this.demoView?.stopDisplay)
          this.demoView.stopDisplay();
      }

      if (i.newIndex === tabIndex.designer || i.newIndex === tabIndex.split)
        this.updateDesignerHtml();
      if (i.newIndex === tabIndex.code || i.newIndex === tabIndex.split) {
        this.codeView.update(this._content, this.designerView.instanceServiceContainer);
        if (this._selectionPosition) {
          this.codeView.setSelection(this._selectionPosition);
          sleep(20).then(x => {
            if (this._selectionPosition)
              this.codeView.setSelection(this._selectionPosition);
            this._selectionPosition = null;
          });
        }
        if (i.changedViaClick) {
          this.codeView.focusEditor();
        }
      }
      if (i.newIndex === tabIndex.split) {
        this._splitDiv.appendChild(this.designerView);
        this._splitDiv.appendChild(this.codeView);
      }
      if (i.newIndex === tabIndex.preview) {
        this.demoView.display(this._serviceContainer, this.designerView.instanceServiceContainer, this._content, this.additionalStyleString);
      }

      if (this._content) {
        this._firstLoad = false;
      }
    });
    if (this._content) {
      this.content = this._content;
      this._firstLoad = false;
    }
  }

  private async updateDesignerHtml() {
    if (this._firstLoad)
      return this.designerView.parseDesignerHTML(this._content, this._firstLoad);
    else {
      const html = this.designerView.getDesignerHTML();
      if (html != this._content)
        return this.designerView.parseDesignerHTML(this._content, this._firstLoad);
      else {
        this.instanceServiceContainer.undoService.clearTransactionstackIfNotEmpty();
        this.designerView.designerCanvas.overlayLayer.removeAllOverlays();
        this.designerView.designerCanvas.extensionManager.reapplyAllAppliedExtentions(null, [ExtensionType.Permanent, ExtensionType.Selection, ExtensionType.PrimarySelection, ExtensionType.PrimarySelectionContainer, ExtensionType.OnlyOneItemSelected, ExtensionType.MultipleItemsSelected]);
      }
    }
  }

  public get instanceServiceContainer(): InstanceServiceContainer {
    return this.designerView.instanceServiceContainer;
  }
}

customElements.define("node-projects-document-container", DocumentContainer);