import { IDesignItem, IPropertiesService } from "@node-projects/web-component-designer";
import { MermaidDocumentPropertiesService } from "./MermaidDocumentPropertiesService.js";

export class MermaidPropertyGroupsService {
    private readonly _documentPropertiesService = new MermaidDocumentPropertiesService();

    getPropertygroups(designItems: IDesignItem[]): { name: string; propertiesService: IPropertiesService; }[] {
        const designItem = designItems?.[0];
        if (!designItem)
            return [];

        if (designItem.isRootItem)
            return [{ name: "mermaid", propertiesService: this._documentPropertiesService }];

        const propertiesService = designItem.serviceContainer.getLastServiceWhere("propertyService", service => service.isHandledElement(designItem));
        return propertiesService ? [{ name: "properties", propertiesService }] : [];
    }
}
