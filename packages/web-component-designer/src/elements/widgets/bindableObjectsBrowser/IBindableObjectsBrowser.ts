import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { BindableObjectsTarget } from "../../services/bindableObjectsService/BindableObjectsTarget.js";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer.js";
import { ServiceContainer } from "../../services/ServiceContainer.js";
import { IBindableObject } from "../../services/bindableObjectsService/IBindableObject.js";

export interface IBindableObjectsBrowser extends HTMLElement {
    initialize(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, bindableObjectsTarget: BindableObjectsTarget): Promise<void>;
    selectedObject: IBindableObject<any>;
    objectDoubleclicked: TypedEvent<void>;
}