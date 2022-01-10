import { IPropertiesService } from "./propertiesService/IPropertiesService";
import { IPlacementService } from './placementService/IPlacementService';
import { IElementsService } from './elementsService/IElementsService';
import { IInstanceService } from './instanceService/IInstanceService';
import { IEditorTypesService } from './propertiesService/IEditorTypesService';
import { BaseServiceContainer } from './BaseServiceContainer';
import { IHtmlWriterService } from './htmlWriterService/IHtmlWriterService';
import { CodeViewMonaco } from "../widgets/codeView/code-view-monaco";
import { ICodeView } from "../widgets/codeView/ICodeView";
import { IHtmlParserService } from "./htmlParserService/IHtmlParserService";
import { IIntializationService } from "./initializationService/IIntializationService";
import { IDemoView } from '../widgets/demoView/IDemoView';
import { DemoView } from '../widgets/demoView/demoView';
import { ITool } from "../widgets/designerView/tools/ITool";
import { ExtensionType } from "../widgets/designerView/extensions/ExtensionType";
import { IDesignerExtensionProvider } from "../widgets/designerView/extensions/IDesignerExtensionProvider";
import { NamedTools } from "../widgets/designerView/tools/NamedTools";
import { IContextMenuExtension } from "../widgets/designerView/extensions/contextMenu/IContextMenuExtension";
import { GlobalContext } from './GlobalContext';
import { IBindingService } from "./bindingsService/IBindingService";
import { IElementAtPointService } from './elementAtPointService/IElementAtPointService';
import { ISnaplinesProviderService } from "./placementService/ISnaplinesProviderService.js";
import { IPrepareElementsForDesignerService } from './instanceService/IPrepareElementsForDesignerService';
import { IDragDropService } from './dragDropService/IDragDropService';
import { ICopyPasteService } from "./copyPasteService/ICopyPasteService.js";
import { IDesignerPointerExtensionProvider } from "../widgets/designerView/extensions/pointerExtensions/IDesignerPointerExtensionProvider.js";
import { IModelCommandService } from "./modelCommandService/IModelCommandService.js";
import { IDesignViewConfigButtonsProvider } from "../widgets/designerView/IDesignViewConfigButtonsProvider.js";
import { IDemoProviderService } from "./demoProviderService/IDemoProviderService.js";
import { IBindableObjectsService } from "./bindableObjectsService/IBindableObjectsService.js";
import { IBindableObjectDragDropService } from "./bindableObjectsService/IBindableObjectDragDropService.js";

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
  "prepareElementsForDesignerService": IPrepareElementsForDesignerService;
  "dragDropService": IDragDropService;
  "copyPasteService": ICopyPasteService;
  "modelCommandService": IModelCommandService
  "demoProviderService": IDemoProviderService;
}

export class ServiceContainer extends BaseServiceContainer<ServiceNameMap>  {

  readonly config: {
    codeViewWidget: new (...args: any[]) => ICodeView & HTMLElement;
    demoViewWidget: new (...args: any[]) => IDemoView & HTMLElement;
  } = {
      codeViewWidget: CodeViewMonaco,
      demoViewWidget: DemoView
    };

  public readonly designerExtensions: Map<(ExtensionType | string), IDesignerExtensionProvider[]> = new Map();

  public readonly designViewConfigButtons: IDesignViewConfigButtonsProvider[] = [];
  
  public readonly designerPointerExtensions: IDesignerPointerExtensionProvider[] = [];

  public designerContextMenuExtensions: IContextMenuExtension[];

  public readonly globalContext: GlobalContext = new GlobalContext(this);

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

  get propertiesServices(): IPropertiesService[] {
    return this.getServices('propertyService');
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

  get prepareElementsForDesignerService(): IPrepareElementsForDesignerService {
    return this.getLastService('prepareElementsForDesignerService');
  }

  get dragDropService(): IDragDropService {
    return this.getLastService('dragDropService');
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
}