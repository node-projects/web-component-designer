import { IPropertiesService } from "./propertiesService/IPropertiesService";
import { IContainerService } from './containerService/IContainerService';
import { IElementsService } from './elementsService/IElementsService';
import { IInstanceService } from './instanceService/IInstanceService';
import { IEditorTypesService } from './propertiesService/IEditorTypesService';
import { BaseServiceContainer } from './BaseServiceContainer';

interface ServiceNameMap {
    "propertyService": IPropertiesService;
    "containerService": IContainerService;
    "elementsService": IElementsService;
    "instanceService": IInstanceService;
    "editorTypesService": IEditorTypesService;
}

export class ServiceContainer  extends BaseServiceContainer<ServiceNameMap>  {
    
    get porpertiesServices(): IPropertiesService[] {
        return this.getServices('propertyService');
    }

    get containerServices(): IContainerService[] {
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
}