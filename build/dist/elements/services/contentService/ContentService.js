import { TypedEvent } from "../../../basic/TypedEvent.js";
export class ContentService {
  constructor(rootElement) {
    this.onContentChanged = new TypedEvent();
    this.rootElement = rootElement;
  }

}