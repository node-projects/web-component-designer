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

interface ServiceNameMap {
  "propertyService": IPropertiesService;
  "containerService": IPlacementService;
  "elementsService": IElementsService;
  "instanceService": IInstanceService;
  "editorTypesService": IEditorTypesService;
  "htmlWriterService": IHtmlWriterService;
  "htmlParserService": IHtmlParserService;
  "intializationService": IIntializationService;
  "bindingService": IBindingService;
  "elementAtPointService": IElementAtPointService;
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

  public designerContextMenuExtensions: IContextMenuExtension[];

  public readonly globalContext: GlobalContext = new GlobalContext();

  public readonly designerTools: Map<string | NamedTools, ITool> = new Map();

  get bindingServices(): IBindingService[] {
    return this.getServices('bindingService');
  }

  get propertiesServices(): IPropertiesService[] {
    return this.getServices('propertyService');
  }

  get containerServices(): IPlacementService[] {
    return this.getServices('containerService');
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

  get htmlWriterServices(): IHtmlWriterService[] {
    return this.getServices('htmlWriterService');
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
}