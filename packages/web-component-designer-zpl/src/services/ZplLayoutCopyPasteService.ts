import { ICopyPasteService, IDesignItem, InstanceServiceContainer, ServiceContainer, IRect, getTextFromClipboard, copyTextToClipboard, DefaultHtmlParserService } from '@node-projects/web-component-designer';

export class ZplLayoutCopyPasteService implements ICopyPasteService {
    constructor() {
    }

    async copyItems(designItems: IDesignItem[]): Promise<void> {
        let savedata = "";
        for (let d of designItems) {
            savedata += d.element.outerHTML;
        }
        await copyTextToClipboard(savedata);
    }

    async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
        let result: IDesignItem[] = [];
        const text = await getTextFromClipboard();
        let htmlParser = new DefaultHtmlParserService();
        result = await htmlParser.parse(text, serviceContainer, instanceServiceContainer, true);
        return [result, null];
    }
}
