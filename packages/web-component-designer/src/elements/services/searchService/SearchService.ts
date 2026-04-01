import { DesignItem } from "../../item/DesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { ISearchResult } from "./ISearchResult.js";
import { ISearchService } from "./ISearchService.js";

export class SearchService implements ISearchService {
    search(designerCanvas: IDesignerCanvas, searchTerm: string, options?: { caseSensitive?: boolean, wholeWord?: boolean, useRegExp?: boolean }): ISearchResult[] {
        if (searchTerm != "") {
            let selectedElements = designerCanvas.rootDesignItem.querySelectorAll(searchTerm);
            let searchResults: ISearchResult[] = [];
            for (let i = 0; i <= selectedElements.length; i++) {
                if (designerCanvas.rootDesignItem.element.contains(selectedElements[i]))
                    searchResults.push({ designItem: DesignItem.GetDesignItem(selectedElements[i]) });
            }
            return searchResults;
        }
        return null;
    }
}