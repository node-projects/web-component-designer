import type { IDesignItem } from '../../item/IDesignItem.js';

export interface ICopyPreparationService {
  /** Prepare detached copies before paste or drag-copy insertion. */
  prepareCopies(items: IDesignItem[], targetRoot: IDesignItem): void;
}
