import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { ISearchResult } from "./ISearchResult.js";

export interface ISearchService {
  search(designerCanvas: IDesignerCanvas, searchTerm: string, options?: { caseSensitive?: boolean, wholeWord?: boolean, useRegExp?: boolean }): ISearchResult[];
}