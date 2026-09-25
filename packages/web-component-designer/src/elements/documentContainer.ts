import { EditingDocument } from './EditingDocument.js';
import { BaseCustomWebComponentLazyAppend, css, cssFromString, TypedEvent } from "@node-projects/base-custom-webcomponent"
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
import { ISelectionRefreshEvent } from './services/selectionService/ISelectionRefreshEvent.js';
import { SimpleSplitView } from './controls/SimpleSplitView.js';
import { IStylesheet } from "./services/stylesheetService/IStylesheetService.js";

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

  private _document: EditingDocument;
  private _ownsDocument = false;
  private _initialLoad: Promise<void>;
  private _subscriptions: { dispose(): void }[] = [];
  private _documentSubscriptions: { dispose(): void }[] = [];
  private _refreshTimer: ReturnType<typeof setTimeout>;
  private _selectionTimer: ReturnType<typeof setTimeout>;
  private _readyCalled = false;
  private _disposed = false;
  public readonly onCommitError = new TypedEvent<unknown>();

  get editingDocument() { return this._document; }

  /** Ready for programmatic access, including code edits waiting for the debounce. */
  async whenReady() { await this.commitPendingChanges(); }

  async commitPendingChanges() {
    try { await this._initialLoad; }
    catch (error) {
      if (!this._document?.hasPendingChanges) throw error;
      this._initialLoad = Promise.resolve();
    }
    clearTimeout(this._refreshTimer);
    if (!this._document) throw new Error('No document is attached.');
    try {
      this._contentChangeSource = 'code';
      await this._document.commitPendingChanges();
    } finally {
      this._contentChangeSource = 'designer';
      this._disableChangeNotificationEditor = this._document?.hasPendingChanges ?? false;
    }
  }

  async attachDocument(document: EditingDocument) {
    await document.commitPendingChanges();
    if (this._document === document) return;
    if (this._document) await this.detachDocument();
    await this.designerView.attachDocument(document);
    this._document = document;
    this._ownsDocument = false;
    this._initialLoad = Promise.resolve();
    this.bindDocument();
    this._content = document.getHtml();
    this.codeView.update(this._content, this.instanceServiceContainer);
  }

  async detachDocument(): Promise<EditingDocument> {
    if (!this._document) return null;
    await this.commitPendingChanges();
    const document = this._document;
    for (const subscription of this._documentSubscriptions) subscription.dispose();
    this._documentSubscriptions = [];
    clearTimeout(this._selectionTimer);
    document.instanceServiceContainer.documentContainer = null;
    this.designerView.detachDocument();
    this._document = null;
    this._ownsDocument = false;
    this._stylesheetChangedEventRegistered = false;
    return document;
  }

  private bindDocument() {
    const container = this._document.instanceServiceContainer;
    container.documentContainer = this;
    this._documentSubscriptions.push(container.selectionService.onSelectionChanged.on(e => this.designerSelectionChanged(e)));
    this._documentSubscriptions.push(container.selectionService.onSelectionRefresh.on(e => this.designerSelectionChanged(e)));
    this._documentSubscriptions.push(container.onContentChanged.on(() => this.designerContentChanged()));
    this._documentSubscriptions.push(this._document.onPendingChangesChanged.on(() => {
      this._disableChangeNotificationEditor = this._document.hasPendingChanges;
      this._contentChangeSource = this._document.hasPendingChanges ? 'code' : 'designer';
      if (!this._document.hasPendingChanges) this.designerContentChanged(false);
    }));
    this._documentSubscriptions.push(this._document.onCommitError.on(error => this.onCommitError.emit(error)));
  }
  private _stylesheetChangedEventRegistered: boolean;

  private _additionalStyle: string;
  public set additionalStyleString(style: string) {
    this._additionalStyle = style;
    this.designerView.additionalStyles = [cssFromString(style)];
  };
  public get additionalStyleString() {
    return this._additionalStyle;
  };

  private _additionalStyles: CSSStyleSheet[];
  public set additionalStyles(value: CSSStyleSheet[]) {
    this._additionalStyles = value;
    this.designerView.additionalStyles = this._additionalStyles;
  };
  public get additionalStyles() {
    return this._additionalStyles;
  };

  private _additionalStylesheets: IStylesheet[];
  public set additionalStylesheets(stylesheets: IStylesheet[]) {
    this._additionalStylesheets = stylesheets;
    if (this.designerView.instanceServiceContainer.stylesheetService) {
      this.designerView.instanceServiceContainer.stylesheetService.setStylesheets(stylesheets);
      if (!this._stylesheetChangedEventRegistered) {
        this._stylesheetChangedEventRegistered = true;
        this._documentSubscriptions.push(this.designerView.instanceServiceContainer.stylesheetService.stylesheetChanged.on(e => this.additionalStylesheetChanged.emit({ name: e.name, newStyle: e.newStyle, oldStyle: e.oldStyle, changeSource: e.changeSource })));
      }
    }
  };
  public get additionalStylesheets() {
    return this._additionalStylesheets;
  };
  public additionalStylesheetChanged = new TypedEvent<{ name: string, newStyle: string, oldStyle: string, changeSource: 'extern' | 'styleupdate' | 'undo' }>;

  get readOnly() {
    return this.designerView?.readOnly;
  }
  set readOnly(v) {
    if (this.designerView)
      this.designerView.readOnly = v;
    if (this.codeView)
      this.codeView.readOnly = v;
  }

  public onContentChanged = new TypedEvent<{ source: 'designer' | 'code' }>();
  public onTabChanged = new TypedEvent<{ oldTab: 'designer' | 'code' | 'split' | 'preview', newTab: 'designer' | 'code' | 'split' | 'preview' }>();

  private _contentChangeSource: 'designer' | 'code' = 'designer';
  private _serviceContainer: ServiceContainer;
  private _content: string = '';
  private _tabControl: DesignerTabControl;
  private _selectionPosition: IStringPosition;
  private _lastCodeSelectionKey: string;
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

  constructor(serviceContainer: ServiceContainer, content?: string | EditingDocument, useIframe: boolean = false) {
    super();

    this.refreshInSplitViewDebounced = () => {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(() => { void this.refreshInSplitView(); }, 200);
    };
    this._serviceContainer = serviceContainer;
    if (typeof content === 'string')
      this._content = content;

    let div = document.createElement("div");
    this._tabControl = new DesignerTabControl();
    div.appendChild(this._tabControl);
    this.designerView = new DesignerView(useIframe);
    this.designerView.setAttribute('exportparts', 'canvas');
    this.designerView.slot = 'top';
    this._designerDiv = document.createElement("div");
    this._tabControl.appendChild(this._designerDiv);
    this._designerDiv.appendChild(this.designerView);
    this._designerDiv.dataset.title = 'Designer';
    this.designerView.initialize(this._serviceContainer, content instanceof EditingDocument ? content : undefined);
    this._document = this.designerView.editingDocument;
    this._ownsDocument = !(content instanceof EditingDocument);
    this._initialLoad = this._ownsDocument ? this.designerView.parseDesignerHTML(this._content, true) : this._document.commitPendingChanges();
    // Expose rejection through whenReady(), without an unhandled rejection before the caller awaits it.
    this._initialLoad.catch(() => { });
    this.bindDocument();

    this.codeView = new serviceContainer.config.codeViewWidget();
    this.codeView.slot = 'bottom';
    this.codeView.style.position = 'relative';
    this._codeDiv = document.createElement("div");
    this._tabControl.appendChild(this._codeDiv);
    this._codeDiv.style.position = 'relative';
    this._codeDiv.appendChild(this.codeView);
    this._codeDiv.dataset.title = 'Code';
    this._subscriptions.push(this.codeView.onTextChanged.on(text => {
      if (!this._disableChangeNotificationDesigner) {
        if (this._tabControl.selectedIndex === tabIndex.code || this._tabControl.selectedIndex === tabIndex.split) {
          this._disableChangeNotificationEditor = true;
          this._content = text;
          this._document?.setPendingHtml(text);
          this.refreshInSplitViewDebounced();
        }
      }
    }));

    this._splitDiv = new SimpleSplitView();
    this._splitDiv.style.height = '100%';
    this._splitDiv.dataset.title = 'Split';
    this._tabControl.appendChild(this._splitDiv);
    if (serviceContainer.config.demoViewWidget) {
      this.demoView = new serviceContainer.config.demoViewWidget();
      this.demoView.dataset.title = 'Preview';
      this._tabControl.appendChild(this.demoView);
    }
    queueMicrotask(() => {
      if (this._disposed) return;
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
    this._disableChangeNotificationEditor = this._document?.hasPendingChanges ?? false;
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

  designerSelectionChanged(e: ISelectionChangedEvent | ISelectionRefreshEvent) {
    if (this._tabControl.selectedIndex === tabIndex.split) {
      let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
      if (primarySelection) {
        if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
          this._selectionPosition = this.instanceServiceContainer.selectionService.selectedPart?.textRange
            ?? this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
          if (this._selectionPosition)
            this.setCodeViewSelection(this._selectionPosition);
          this._selectionPosition = null;
        }
      }
    }
  }

  designerContentChanged(notify = true) {
    if (!this._document) return;
    //event wenn text geändert......
    if (notify) this.onContentChanged.emit({ source: this._contentChangeSource });

    if (!this._disableChangeNotificationEditor) {
      this._disableChangeNotificationDesigner = true;
      if (this._tabControl.selectedIndex === tabIndex.code || this._tabControl.selectedIndex === tabIndex.split) {
        let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
        this._content = this._document.pendingHtml ?? this.designerView.getDesignerHTML();
        this.codeView.update(this._content, this.designerView.instanceServiceContainer);
        this._lastCodeSelectionKey = null;
        if (primarySelection) {
          if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
            this._selectionPosition = this.instanceServiceContainer.selectionService.selectedPart?.textRange
              ?? this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
            if (this._selectionPosition)
              this.setCodeViewSelection(this._selectionPosition);
            this._selectionPosition = null;
          }
        }
      }
      this._disableChangeNotificationDesigner = false;
    }
  }

  async dispose(): Promise<void> {
    if (this._disposed) return;
    const ownedDocument = this._ownsDocument ? this._document : null;
    await this.detachDocument();
    this._disposed = true;
    clearTimeout(this._refreshTimer);
    for (const subscription of this._subscriptions) subscription.dispose();
    this._subscriptions = [];
    this.codeView?.dispose();
    this.demoView?.dispose();
    this.designerView.dispose();
    if (ownedDocument) await ownedDocument.dispose();
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

  async setContentAsync(value: string) {
    this._content = value;
    this._document.setPendingHtml(value);
    await this.commitPendingChanges();
    if (this.currentView === 'code' || this.currentView === 'split')
      this.codeView.update(value, this.instanceServiceContainer);
    else if (this.currentView === 'preview')
      this.demoView.display(this._serviceContainer, this.instanceServiceContainer, value, this.additionalStyleString);
  }

  set content(value: string) {
    void this.setContentAsync(value).catch(error => this.onCommitError.emit(error));
  }
  get content() {
    if (this._tabControl) {
      if (this._tabControl.selectedIndex === tabIndex.designer)
        this._content = this._document.pendingHtml ?? this.designerView.getDesignerHTML();
      else if (this._tabControl.selectedIndex === tabIndex.code)
        this._content = this.codeView.getText();
      return this._content;
    }
    return null;
  }

  ready() {
    if (this._readyCalled) return;
    this._readyCalled = true;
    this._subscriptions.push(this._tabControl.onSelectedTabChanged.on(i => {
      if (!this._document) return;
      if (i.oldIndex === tabIndex.designer) {
        let primarySelection = this.instanceServiceContainer.selectionService.primarySelection;
        this._content = this._document.pendingHtml ?? this.designerView.getDesignerHTML();
        if (this.designerView.instanceServiceContainer.designItemDocumentPositionService) {
          this._selectionPosition = this.instanceServiceContainer.selectionService.selectedPart?.textRange
            ?? this.designerView.instanceServiceContainer.designItemDocumentPositionService.getPosition(primarySelection);
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
        void this.refreshInSplitView();
      if (i.newIndex === tabIndex.code || i.newIndex === tabIndex.split) {
        this.codeView.update(this._content, this.designerView.instanceServiceContainer);
        this._lastCodeSelectionKey = null;
        if (this._selectionPosition) {
          this.setCodeViewSelection(this._selectionPosition);
          clearTimeout(this._selectionTimer);
          this._selectionTimer = setTimeout(() => {
            if (this._selectionPosition)
              this.setCodeViewSelection(this._selectionPosition);
            this._selectionPosition = null;
          }, 20);
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


      this.onTabChanged.emit({ oldTab: <any>tabIndex[i.oldIndex], newTab: <any>tabIndex[i.newIndex] });
    }));
  }

  private async updateDesignerHtml() {
    if (!this._document || this._disposed) return;
    await this.commitPendingChanges();
  }

  private setCodeViewSelection(position: IStringPosition) {
    if (!position)
      return;

    const key = `${position.start}:${position.length}`;
    if (this._lastCodeSelectionKey === key)
      return;

    this._lastCodeSelectionKey = key;
    this.codeView.setSelection(position);
  }

  public get instanceServiceContainer(): InstanceServiceContainer {
    return this.designerView.instanceServiceContainer;
  }
}

customElements.define("node-projects-document-container", DocumentContainer);
