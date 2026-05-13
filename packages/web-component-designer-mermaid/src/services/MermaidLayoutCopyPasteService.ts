import { copyTextToClipboard, DefaultHtmlParserService, getTextFromClipboard, ICopyPasteService, IDesignItem, IRect, InstanceServiceContainer, ServiceContainer } from "@node-projects/web-component-designer";

export class MermaidLayoutCopyPasteService implements ICopyPasteService {
    async copyItems(designItems: IDesignItem[]): Promise<void> {
        let savedata = "";
        for (const designItem of designItems) {
            savedata += designItem.element.outerHTML;
        }
        await copyTextToClipboard(savedata);
    }

    async getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]> {
        const text = await getTextFromClipboard();
        const htmlParser = new DefaultHtmlParserService();
        const result = await htmlParser.parse(text, serviceContainer, instanceServiceContainer, true);
        return [result, null];
    }
}
