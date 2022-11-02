
import { IDesignItem } from "../../item/IDesignItem";
import { IPropertiesService } from "./IPropertiesService";

export interface IPropertyGroupsService {
    getPropertygroups(designItems: IDesignItem[]): { name: string, propertiesService: IPropertiesService }[]
}