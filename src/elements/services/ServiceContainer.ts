import { IPropertiesService } from './propertiesService/IPropertiesService.js';
import { IPlacementService } from './placementService/IPlacementService.js';
import { IElementsService } from './elementsService/IElementsService.js';
import { IInstanceService } from './instanceService/IInstanceService.js';
import { IEditorTypesService } from './propertiesService/IEditorTypesService.js';
import { BaseServiceContainer } from './BaseServiceContainer.js';
import { IHtmlWriterService } from './htmlWriterService/IHtmlWriterService.js';
import { ICodeView } from '../widgets/codeView/ICodeView.js';
import { IHtmlParserService } from './htmlParserService/IHtmlParserService.js';
import { IIntializationService } from './initializationService/IIntializationService.js';
import { IDemoView } from '../widgets/demoView/IDemoView.js';
import { DemoView } from '../widgets/demoView/demoView.js';
import { ITool } from '../widgets/designerView/tools/ITool.js';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType.js';
import { IDesignerExtensionProvider } from '../widgets/designerView/extensions/IDesignerExtensionProvider.js';
import { NamedTools } from '../widgets/designerView/tools/NamedTools.js';
import { IContextMenuExtension } from '../widgets/designerView/extensions/contextMenu/IContextMenuExtension.js';
import { GlobalContext } from './GlobalContext.js';
import { IBindingService } from './bindingsService/IBindingService.js';
import { IElementAtPointService } from './elementAtPointService/IElementAtPointService.js';
import { ISnaplinesProviderService } from "./placementService/ISnaplinesProviderService.js";
import { IExternalDragDropService } from './dragDropService/IExternalDragDropService.js';
import { ICopyPasteService } from "./copyPasteService/ICopyPasteService.js";
import { IDesignerPointerExtensionProvider } from "../widgets/designerView/extensions/pointerExtensions/IDesignerPointerExtensionProvider.js";
import { IModelCommandService } from "./modelCommandService/IModelCommandService.js";
import { IDesignViewConfigButtonsProvider } from "../widgets/designerView/extensions/buttons/IDesignViewConfigButtonsProvider.js";
import { IDemoProviderService } from "./demoProviderService/IDemoProviderService.js";
import { IBindableObjectsService } from "./bindableObjectsService/IBindableObjectsService.js";
import { IBindableObjectDragDropService } from "./bindableObjectsService/IBindableObjectDragDropService.js";
import { IDesignViewToolbarButtonProvider } from "../widgets/designerView/tools/toolBar/IDesignViewToolbarButtonProvider.js";
import { IElementInteractionService } from './elementInteractionService/IElementInteractionService.js';
import { IProperty } from "./propertiesService/IProperty.js";
import { IDesignItem } from "../item/IDesignItem.js";
import { IBinding } from '../item/IBinding.js';
import { BindingTarget } from '../item/BindingTarget.js';
import { IPropertyTabsService } from './propertiesService/IPropertyTabsService.js';
import { CodeViewSimple } from '../widgets/codeView/code-view-simple.js';
import { IUndoService } from './undoService/IUndoService.js';
import { ISelectionService } from './selectionService/ISelectionService.js';
import { IContentService } from './contentService/IContentService.js';
import { IStylesheetService } from './stylesheetService/IStylesheetService.js';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';
import { IDesignItemDocumentPositionService } from './designItemDocumentPositionService/IDesignItemDocumentPositionService.js';
import { IDragDropService } from './dragDropService/IDragDropService.js';
import { IDesignItemService } from './designItemService/IDesignItemService.js';
import { IEventsService } from './eventsService/IEventsService.js';
import { IPropertyGridDragDropService } from './dragDropService/IPropertyGridDragDropService.js';

interface ServiceNameMap {
  "propertyService": IPropertiesService;
  "containerService": IPlacementService;
  "snaplinesProviderService": ISnaplinesProviderService;
  "elementsService": IElementsService;
  "instanceService": IInstanceService;
  "editorTypesService": IEditorTypesService;
  "htmlWriterService": IHtmlWriterService;
  "htmlParserService": IHtmlParserService;
  "intializationService": IIntializationService;
  "bindingService": IBindingService;
  "bindableObjectsService": IBindableObjectsService;
  "bindableObjectDragDropService": IBindableObjectDragDropService;
  "elementAtPointService": IElementAtPointService;
  "externalDragDropService": IExternalDragDropService;
  "copyPasteService": ICopyPasteService;
  "modelCommandService": IModelCommandService
  "demoProviderService": IDemoProviderService;
  "elementInteractionService": IElementInteractionService;
  "propertyGroupsService": IPropertyTabsService;
  "dragDropService": IDragDropService;
  "designItemService": IDesignItemService;
  "eventsService": IEventsService;
  "propertyGridDragDropService": IPropertyGridDragDropService;
  
  //Factories for Instance Service Containers
  "undoService": (designerCanvas: IDesignerCanvas) => IUndoService;
  "selectionService": (designerCanvas: IDesignerCanvas) => ISelectionService;
  "contentService": (designerCanvas: IDesignerCanvas) => IContentService;
  "stylesheetService": (designerCanvas: IDesignerCanvas) => IStylesheetService;
  "designItemDocumentPositionService": (designerCanvas: IDesignerCanvas) => IDesignItemDocumentPositionService;
}

export class ServiceContainer extends BaseServiceContainer<ServiceNameMap>  {

  readonly config: {
    codeViewWidget: new (...args: any[]) => ICodeView & HTMLElement;
    demoViewWidget: new (...args: any[]) => IDemoView & HTMLElement;
    openBindingsEditor?: (property: IProperty, designItems: IDesignItem[], binding: IBinding, bindingTarget: BindingTarget) => Promise<void>
  } = {
      codeViewWidget: CodeViewSimple,
      demoViewWidget: DemoView
    };

  public readonly designerExtensions: Map<(ExtensionType | string), IDesignerExtensionProvider[]> = new Map();

  removeDesignerExtensionOfType(container: (ExtensionType | string), lambda: new (...args: any[]) => IDesignerExtensionProvider): void {
    const extContainer = this.designerExtensions.get(container);
    for (let i = 0; i < extContainer.length; i++) {
      if (extContainer[i].constructor === lambda) {
        extContainer.splice(i, 1);
      }
    }
  }

  public readonly designViewConfigButtons: IDesignViewConfigButtonsProvider[] = [];

  public readonly designViewToolbarButtons: IDesignViewToolbarButtonProvider[] = [];

  public readonly designerPointerExtensions: IDesignerPointerExtensionProvider[] = [];

  public designerContextMenuExtensions: IContextMenuExtension[];

  public readonly globalContext: GlobalContext = new GlobalContext(this);

  public readonly options = {
    zoomDesignerBackground: true
  };

  public readonly designerTools: Map<string | NamedTools, ITool> = new Map();

  get bindingService(): IBindingService {
    return this.getLastService('bindingService');
  }

  get bindableObjectsServices(): IBindableObjectsService[] {
    return this.getServices('bindableObjectsService');
  }

  get bindableObjectDragDropService(): IBindableObjectDragDropService {
    return this.getLastService('bindableObjectDragDropService');
  }

  get propertyGridDragDropService(): IPropertyGridDragDropService {
    return this.getLastService('propertyGridDragDropService');
  }

  get dragDropService(): IDragDropService {
    return this.getLastService('dragDropService');
  }

  get elementInteractionServices(): IElementInteractionService[] {
    return this.getServices('elementInteractionService');
  }

  get propertiesServices(): IPropertiesService[] {
    return this.getServices('propertyService');
  }

  get propertyGroupService(): IPropertyTabsService {
    return this.getLastService('propertyGroupsService');
  }

  get containerServices(): IPlacementService[] {
    return this.getServices('containerService');
  }

  get snaplinesProviderService(): ISnaplinesProviderService {
    return this.getLastService('snaplinesProviderService');
  }

  get elementsServices(): IElementsService[] {
    return this.getServices('elementsService');
  }

  get eventsService(): IEventsService[] {
    return this.getServices('eventsService');
  }

  get instanceServices(): IInstanceService[] {
    return this.getServices('instanceService');
  }

  get editorTypesServices(): IEditorTypesService[] {
    return this.getServices('editorTypesService');
  }

  get htmlWriterService(): IHtmlWriterService {
    return this.getLastService('htmlWriterService');
  }

  get htmlParserService(): IHtmlParserService {
    return this.getLastService('htmlParserService');
  }

  get intializationService(): IIntializationService {
    return this.getLastService('intializationService');
  }

  get elementAtPointService(): IElementAtPointService {
    return this.getLastService('elementAtPointService');
  }

  get externalDragDropService(): IExternalDragDropService {
    return this.getLastService('externalDragDropService');
  }

  get copyPasteService(): ICopyPasteService {
    return this.getLastService('copyPasteService');
  }

  get modelCommandService(): IModelCommandService {
    return this.getLastService('modelCommandService');
  }

  get demoProviderService(): IDemoProviderService {
    return this.getLastService('demoProviderService');
  }

  get designItemService(): IDesignItemService {
    return this.getLastService('designItemService');
  }
}