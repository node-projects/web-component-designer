import { ServiceContainer } from './ServiceContainer';
import { UndoService } from './undoService/UndoService';
import { PolymerPropertiesService } from './propertiesService/PolymerPropertiesService';
import { LitElementPropertiesService } from './propertiesService/LitElementPropertiesService';
import { NativeElementsPropertiesService } from './propertiesService/NativeElementsPropertiesService';

let serviceContainer = new ServiceContainer();

serviceContainer.register("actionHistory", new UndoService());
serviceContainer.register("porpertyService", new PolymerPropertiesService());
serviceContainer.register("porpertyService", new LitElementPropertiesService());
serviceContainer.register("porpertyService", new NativeElementsPropertiesService());

export default serviceContainer;