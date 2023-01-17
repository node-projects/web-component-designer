import { IDesignItem } from "../../item/IDesignItem.js";
import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer.js';
import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IRect } from "../../../interfaces/IRect.js";

export const positionsJsonMime = 'web text/positions';

export class CopyPasteService implements ICopyPasteService {

  async copyItems(designItems: IDesignItem[]): Promise<void> {
    const copyText = DomConverter.ConvertToString(designItems, null, false);
    try {
      const positions = designItems.map(x => x.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(x.element));
      const data = [new ClipboardItem({ ["text/html"]: new Blob([copyText], { type: 'text/html' }), [positionsJsonMime]: new Blob([JSON.stringify(positions)], { type: positionsJsonMime }) })];   
      await navigator.clipboard.write(data);
    } catch (err) {
      await navigator.clipboard.writeText(copyText);
    }
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
    const items = await navigator.clipboard.read();
    let html = '';
    try {
      html = await (await items[0].getType('text/html'))?.text();
    } catch { }
    if (!html)
      html = await (await items[0].getType('text/plain'))?.text();
    let positions: IRect[] = null;
    try {
      let positionsJson = await (await items[0].getType(positionsJsonMime))?.text();
      positions = JSON.parse(positionsJson)
    } catch { }
    const parserService = serviceContainer.htmlParserService;
    return [await parserService.parse(html, serviceContainer, instanceServiceContainer), positions];
  }
}