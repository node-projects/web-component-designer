import { ServiceContainer } from "./ServiceContainer.js";
import { PolymerPropertiesService } from "./propertiesService/PolymerPropertiesService.js";
import { LitElementPropertiesService } from "./propertiesService/LitElementPropertiesService.js";
import { NativeElementsPropertiesService } from "./propertiesService/NativeElementsPropertiesService.js";
import { DefaultInstanceService } from "./instanceService/DefaultInstanceService.js";
import { DefaultEditorTypesService } from "./propertiesService/DefaultEditorTypesService.js";
let serviceContainer = new ServiceContainer(); // serviceContainer.register("actionHistory", new UndoService());
// serviceContainer.register("propertyService", new CssPropertiesService("css"));
// serviceContainer.register("propertyService", new CssPropertiesService("flex"));

serviceContainer.register("propertyService", new PolymerPropertiesService());
serviceContainer.register("propertyService", new LitElementPropertiesService());
serviceContainer.register("propertyService", new NativeElementsPropertiesService());
serviceContainer.register("instanceService", new DefaultInstanceService());
serviceContainer.register("editorTypesService", new DefaultEditorTypesService());
export default serviceContainer;