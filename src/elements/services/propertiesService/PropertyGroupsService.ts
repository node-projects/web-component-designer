import { IDesignItem } from '../../item/IDesignItem.js';
import { IPropertiesService } from './IPropertiesService.js';
import { IPropertyGroupsService } from './IPropertyGroupsService.js';
import { AttributesPropertiesService } from './services/AttributesPropertiesService.js';
import { CommonPropertiesService } from './services/CommonPropertiesService.js';
import { CssPropertiesService } from './services/CssPropertiesService.js';

export class PropertyGroupsService implements IPropertyGroupsService {
    protected _pgList: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'properties', propertiesService: null },
        { name: 'attributes', propertiesService: new AttributesPropertiesService() },
        { name: 'common', propertiesService: new CommonPropertiesService() },
        { name: 'styles', propertiesService: new CssPropertiesService("styles") },
        { name: 'layout', propertiesService: new CssPropertiesService("layout") },
        { name: 'flex', propertiesService: new CssPropertiesService("flex") },
        { name: 'grid', propertiesService: new CssPropertiesService("grid") },
    ];

    protected _svgPgList: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'properties', propertiesService: null },
        { name: 'attributes', propertiesService: new AttributesPropertiesService() },
        { name: 'styles', propertiesService: new CssPropertiesService("styles") },
        { name: 'layout', propertiesService: new CssPropertiesService("layout") },
    ];

    getPropertygroups(designItems: IDesignItem[]): { name: string; propertiesService: IPropertiesService; }[] {
        if (designItems == null || designItems.length == 0)
            return [];
        this._pgList[0].propertiesService = designItems[0].serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(designItems[0]));
        this._svgPgList[0].propertiesService = designItems[0].serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(designItems[0]));
        if (designItems[0].element instanceof SVGElement)
            return this._svgPgList;
        return this._pgList;
    }
}