import { ServiceContainer } from './ServiceContainer';
import { PolymerPropertiesService } from './propertiesService/services/PolymerPropertiesService';
import { LitElementPropertiesService } from './propertiesService/services/LitElementPropertiesService';
import { NativeElementsPropertiesService } from './propertiesService/services/NativeElementsPropertiesService';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService';
import { HtmlWriterService } from './serializationService/HtmlWriterService';
import { BaseCustomWebComponentPropertiesService } from './propertiesService/services/BaseCustomWebComponentPropertiesService';
import { DefaultPlacementService } from './placementService/DefaultPlacementService';
import { DefaultHtmlParserService } from './htmlParserService/DefaultHtmlParserService';
//import { NodeHtmlParserService } from './htmlParserService/NodeHtmlParserService';
import { Lit2PropertiesService } from './propertiesService/services/Lit2PropertiesService';

let serviceContainer = new ServiceContainer();

serviceContainer.register("propertyService", new PolymerPropertiesService());
serviceContainer.register("propertyService", new LitElementPropertiesService());
serviceContainer.register("propertyService", new NativeElementsPropertiesService());
serviceContainer.register("propertyService", new Lit2PropertiesService());
serviceContainer.register("propertyService", new BaseCustomWebComponentPropertiesService());
serviceContainer.register("instanceService", new DefaultInstanceService());
serviceContainer.register("editorTypesService", new DefaultEditorTypesService());
serviceContainer.register("htmlWriterService", new HtmlWriterService());
serviceContainer.register("containerService", new DefaultPlacementService());
serviceContainer.register("htmlParserService", new DefaultHtmlParserService());
//serviceContainer.register("htmlParserService", new NodeHtmlParserService());

export default serviceContainer;