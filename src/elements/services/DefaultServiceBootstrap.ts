import { ServiceContainer } from './ServiceContainer';
import { PolymerPropertiesService } from './propertiesService/services/PolymerPropertiesService';
import { LitElementPropertiesService } from './propertiesService/services/LitElementPropertiesService';
import { NativeElementsPropertiesService } from './propertiesService/services/NativeElementsPropertiesService';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService';
import { HtmlWriterService } from './htmlWriterService/HtmlWriterService';
import { BaseCustomWebComponentPropertiesService } from './propertiesService/services/BaseCustomWebComponentPropertiesService';

let serviceContainer = new ServiceContainer();

serviceContainer.register("propertyService", new PolymerPropertiesService());
serviceContainer.register("propertyService", new LitElementPropertiesService());
serviceContainer.register("propertyService", new NativeElementsPropertiesService());
serviceContainer.register("propertyService", new BaseCustomWebComponentPropertiesService());
serviceContainer.register("instanceService", new DefaultInstanceService());
serviceContainer.register("editorTypesService", new DefaultEditorTypesService());
serviceContainer.register("htmlWriterService", new HtmlWriterService());

export default serviceContainer;