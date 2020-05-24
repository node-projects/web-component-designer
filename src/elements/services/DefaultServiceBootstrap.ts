import { ServiceContainer } from './ServiceContainer';
import { PolymerPropertiesService } from './propertiesService/PolymerPropertiesService';
import { LitElementPropertiesService } from './propertiesService/LitElementPropertiesService';
import { NativeElementsPropertiesService } from './propertiesService/NativeElementsPropertiesService';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService';
import { HtmlWriterService } from './htmlWriterService/HtmlWriterService';

let serviceContainer = new ServiceContainer();

serviceContainer.register("propertyService", new PolymerPropertiesService());
serviceContainer.register("propertyService", new LitElementPropertiesService());
serviceContainer.register("propertyService", new NativeElementsPropertiesService());
serviceContainer.register("instanceService", new DefaultInstanceService());
serviceContainer.register("editorTypesService", new DefaultEditorTypesService());
serviceContainer.register("htmlWriterService", new HtmlWriterService());

export default serviceContainer;