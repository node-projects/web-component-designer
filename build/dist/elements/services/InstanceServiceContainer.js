import { BaseServiceContainer } from "./BaseServiceContainer.js";
export class InstanceServiceContainer extends BaseServiceContainer {
  get undoService() {
    return this.getLastService('undoService');
  }

  get selectionService() {
    return this.getLastService('selectionService');
  }

  get contentService() {
    return this.getLastService('contentService');
  }

}