import { DesignItem } from "../../item/DesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { ISearchResult } from "./ISearchResult.js";
import { ISearchService } from "./ISearchService.js";

export class SearchService implements ISearchService {
    async search(designerCanvas: IDesignerCanvas, searchTerm: string, options?: { caseSensitive?: boolean, wholeWord?: boolean, useRegExp?: boolean }): Promise<ISearchResult[]> {
        if (searchTerm != "") {
            let selectedElements = designerCanvas.rootDesignItem.querySelectorAll(searchTerm);
            let searchResults: ISearchResult[] = [];
            for (let i = 0; i < selectedElements.length; i++) {
                const designItem = DesignItem.GetDesignItem(selectedElements[i]);
                if (designItem)
                    searchResults.push({ designItem });
            }
            return searchResults;
        }
        return null;
    }
}