import { IDesignItem } from "../../item/IDesignItem.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";

export interface IDesignItemService {
    createDesignItem(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem; 
    handleSpecialAttributes(attributeName: string, designItem: IDesignItem): void;
}