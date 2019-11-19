import { TypedEvent } from "../../../basic/TypedEvent.js";
export class ContentService {
  constructor() {
    this.onContentChanged = new TypedEvent();
  }

}