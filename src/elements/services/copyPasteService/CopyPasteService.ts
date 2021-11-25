import { IDesignItem } from "../../item/IDesignItem.js";
import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer';
import { InstanceServiceContainer } from '../InstanceServiceContainer';

export class CopyPasteService implements ICopyPasteService {
  
  async copyItems(designItems: IDesignItem[]):Promise<void> {
    const copyText = DomConverter.ConvertToString(designItems, null);
    await navigator.clipboard.writeText(copyText);
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer:InstanceServiceContainer) :Promise<IDesignItem[]> {
    const text = await navigator.clipboard.readText();
    const parserService = serviceContainer.htmlParserService;
    return await parserService.parse(text, serviceContainer, instanceServiceContainer);
  }
}