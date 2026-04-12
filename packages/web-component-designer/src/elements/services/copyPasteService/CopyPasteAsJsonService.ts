import { IDesignItem } from "../../item/IDesignItem.js";
import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer.js';
import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IRect } from "../../../interfaces/IRect.js";
import { copyToClipboard, getFromClipboard, getTextFromClipboard } from "../../helper/ClipboardHelper.js";
import { DesignItem } from "../../item/DesignItem.js";
import { filterChildPlaceItems } from "../../helper/LayoutHelper.js";

interface ICopyPasteJsonData {
  html?: string;
  positions?: IRect[];
}

interface IClipboardPasteData {
  html: string;
  positions: IRect[] | null;
  imageData: Blob | null;
}

export class CopyPasteAsJsonService implements ICopyPasteService {
  async copyItems(designItems: IDesignItem[]): Promise<void> {
    const items = filterChildPlaceItems(designItems);
    const copyText = DomConverter.ConvertToString(items, false);
    const positions = items.map(x => x.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(x.element));
    const data: ICopyPasteJsonData = { html: copyText, positions: positions };
    copyToClipboard([["text/html", copyText], ["text/plain", copyText], ["application/json", JSON.stringify(data)]]);
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
    const pasteData = await this._readClipboardPasteData();
    if (pasteData.imageData) {
      let di = await DesignItem.createDesignItemFromImageBlob(serviceContainer, instanceServiceContainer, pasteData.imageData);
      return [[di]];
    }

    const parserService = serviceContainer.htmlParserService;
    return [await parserService.parse(pasteData.html, serviceContainer, instanceServiceContainer, true), pasteData.positions ?? undefined];
  }

  private async _readClipboardPasteData(): Promise<IClipboardPasteData> {
    let html = '';
    let positions: IRect[] | null = null;
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