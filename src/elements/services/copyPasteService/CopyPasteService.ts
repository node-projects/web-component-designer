import { IDesignItem } from "../../item/IDesignItem.js";
import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer.js';
import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IRect } from "../../../interfaces/IRect.js";
import { copyToClipboard, getFromClipboard, getTextFromClipboard } from "../../helper/ClipboardHelper.js";

export const positionsJsonMime = 'web text/positions';

export class CopyPasteService implements ICopyPasteService {
  async copyItems(designItems: IDesignItem[]): Promise<void> {
    const copyText = DomConverter.ConvertToString(designItems, null, false);
    const positions = designItems.map(x => x.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(x.element));
    copyToClipboard([["text/html", copyText], [positionsJsonMime, JSON.stringify(positions)]]);
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
    let html = '';
    let positions: IRect[] = null;
    const items = await getFromClipboard();
    if (items != null) {
      try {
        html = await (await items[0].getType('text/html'))?.text();
      } catch { }
      if (!html)
        html = await (await items[0].getType('text/plain'))?.text();
      try {
        let positionsJson = await (await items[0].getType(positionsJsonMime))?.text();
        positions = JSON.parse(positionsJson)
      } catch { }
    } else {
      html = await getTextFromClipboard();
    }
    const parserService = serviceContainer.htmlParserService;
    return [await parserService.parse(html, serviceContainer, instanceServiceContainer), positions];
  }
}