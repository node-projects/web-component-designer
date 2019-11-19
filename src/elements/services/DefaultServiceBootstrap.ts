import { ServiceContainer } from './ServiceContainer';
import { PolymerPropertiesService } from './propertiesService/PolymerPropertiesService';
import { LitElementPropertiesService } from './propertiesService/LitElementPropertiesService';
import { NativeElementsPropertiesService } from './propertiesService/NativeElementsPropertiesService';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService';

let serviceContainer = new ServiceContainer();

// serviceContainer.register("actionHistory", new UndoService());
// serviceContainer.register("propertyService", new CssPropertiesService("css"));
// serviceContainer.register("propertyService", new CssPropertiesService("flex"));
serviceContainer.register("propertyService", new PolymerPropertiesService());
serviceContainer.register("propertyService", new LitElementPropertiesService());
serviceContainer.register("propertyService", new NativeElementsPropertiesService());
serviceContainer.register("instanceService", new DefaultInstanceService());
serviceContainer.register("editorTypesService", new DefaultEditorTypesService());

export default serviceContainer;