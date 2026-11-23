import { createClipboardCopyData, type ClipboardCopyData as ICopyPasteJsonData } from "./ClipboardCopyData.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer.js';
import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IRect } from "../../../interfaces/IRect.js";
import { copyToClipboard, getFromClipboard, getTextFromClipboard } from "../../helper/ClipboardHelper.js";
import { DesignItem } from "../../item/DesignItem.js";

interface IClipboardPasteData {
  html: string;
  positions: (IRect | null)[] | null;
  imageData: Blob | null;
}

export class CopyPasteAsJsonService implements ICopyPasteService {
  async copyItems(designItems: IDesignItem[]): Promise<void> {
    const data = createClipboardCopyData(designItems);
    await copyToClipboard([["text/html", data.html], ["text/plain", data.html], ["application/json", JSON.stringify(data)]]);
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: (IRect | null)[]]> {
    const pasteData = await this._readClipboardPasteData();
    if (pasteData.imageData) {
      let di = await DesignItem.createDesignItemFromImageBlob(serviceContainer, instanceServiceContainer, pasteData.imageData);
      serviceContainer.copyPreparationService?.prepareCopies([di], instanceServiceContainer.rootDesignItem);
      return [[di]];
    }

    const parserService = serviceContainer.htmlParserService;
    const designItems = await parserService.parse(pasteData.html, serviceContainer, instanceServiceContainer, true);
    serviceContainer.copyPreparationService?.prepareCopies(designItems, instanceServiceContainer.rootDesignItem);
    return [designItems, pasteData.positions ?? undefined];
  }

  private async _readClipboardPasteData(): Promise<IClipboardPasteData> {
    let html = '';
    let positions: (IRect | null)[] | null = null;
    let imageData: Blob | null = null;

    const items = await getFromClipboard();
    if (items != null) {
      const clipboardItem = items[0];
      const jsonData = await this._tryReadClipboardType(clipboardItem, 'application/json');
      if (jsonData) {
        const parsedJson = this._parseJsonClipboardData(jsonData);
        html = parsedJson?.html ?? '';
        positions = parsedJson?.positions ?? null;
      }

      if (!html) {
        html = await this._tryReadClipboardType(clipboardItem, 'text/html') ?? '';
      }
      if (!html) {
        html = await this._tryReadClipboardType(clipboardItem, 'text/plain') ?? '';
      }

      try {
        let imageFmt = clipboardItem.types.find(x => x.startsWith("image/"));
        if (imageFmt) {
          imageData = await clipboardItem.getType(imageFmt);
        }
      } catch { }
    } else {
      html = await getTextFromClipboard();
    }

    return { html, positions, imageData };
  }

  private _parseJsonClipboardData(data: string): ICopyPasteJsonData | null {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async _tryReadClipboardType(item: ClipboardItem, type: string): Promise<string | null> {
    try {
      return await (await item.getType(type))?.text();
    } catch {
      return null;
    }
  }
}
