import { IDesignItem } from "../../item/IDesignItem.js";
import { DomConverter } from "../../widgets/designerView/DomConverter.js";
import { ICopyPasteService } from "./ICopyPasteService.js";
import { ServiceContainer } from '../ServiceContainer.js';
import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IRect } from "../../../interfaces/IRect.js";
import { copyToClipboard, getFromClipboard, getTextFromClipboard } from "../../helper/ClipboardHelper.js";
import { DesignItem } from "../../item/DesignItem.js";

export class CopyPasteAsJsonService implements ICopyPasteService {
  async copyItems(designItems: IDesignItem[]): Promise<void> {
    const copyText = DomConverter.ConvertToString(designItems, false);
    const positions = designItems.map(x => x.instanceServiceContainer.designerCanvas.getNormalizedElementCoordinates(x.element));
    let data = { html: copyText, positions: positions };
    copyToClipboard([["application/json", JSON.stringify(data)]]);
  }

  async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
    let data = '';
    let html = '';
    let positions: IRect[] = null;
    const items = await getFromClipboard();
    if (items != null) {
      try {
        data = await (await items[0].getType('text/html'))?.text();
      } catch { }
      if (!data)
        try {
          data = await (await items[0].getType('text/plain'))?.text();
        } catch { }
      try {
        data = await (await items[0].getType('application/json'))?.text();
      } catch { }
      try {
        let imageFmt = items[0].types.find(x => x.startsWith("image/"))
        if (imageFmt) {
          let imgData = await items[0].getType(imageFmt);
          let di = await DesignItem.createDesignItemFromImageBlob(serviceContainer, instanceServiceContainer, imgData);
          return [[di]];
        }
      } catch { }
    } else {
      data = await getTextFromClipboard();
    }
    if (data.startsWith('{')) {
      let dataObj = JSON.parse(data);
      html = dataObj.html;
      positions = dataObj.positions;
    } else {
      html = data;
    }
    const parserService = serviceContainer.htmlParserService;
    return [await parserService.parse(html, serviceContainer, instanceServiceContainer, true), positions];
  }


}