import { createClipboardCopyData } from "./ClipboardCopyData.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer.js';
import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IRect } from "../../../interfaces/IRect.js";
import { copyToClipboard, getFromClipboard, getTextFromClipboard } from "../../helper/ClipboardHelper.js";

export const positionsJsonMime = 'web text/positions';

export class CopyPasteService implements ICopyPasteService {
  async copyItems(designItems: IDesignItem[]): Promise<void> {
    const { html, positions } = createClipboardCopyData(designItems);
    await copyToClipboard([["text/html", html], [positionsJsonMime, JSON.stringify(positions)]]);
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: (IRect | null)[]]> {
    let html = '';
    let positions: (IRect | null)[] | null = null;
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
    const designItems = await parserService.parse(html, serviceContainer, instanceServiceContainer, true);
    serviceContainer.copyPreparationService?.prepareCopies(designItems, instanceServiceContainer.rootDesignItem);
    return [designItems, positions ?? undefined];
  }
}