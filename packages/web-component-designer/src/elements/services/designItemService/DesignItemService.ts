import { DesignItem } from "../../item/DesignItem.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";
import { IDesignItemService } from "./IDesignItemService.js";

export class DesignItemService implements IDesignItemService {
    createDesignItem(node: Node, parsedNode: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): IDesignItem {
        return new DesignItem(node, parsedNode, serviceContainer, instanceServiceContainer);
    }
}