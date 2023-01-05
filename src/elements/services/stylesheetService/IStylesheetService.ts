import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IProperty } from "../propertiesService/IProperty.js";
import * as csstree from 'css-tree';

export interface IStylesheetService {
    getDefiningRule(designItems: IDesignItem[], property: IProperty): csstree.RulePlain;
    updateDefiningRule(designItems: IDesignItem[], prop: IProperty, value: string): boolean;
    stylesheetChanged: TypedEvent<{ stylesheet: string }>;
}