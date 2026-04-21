import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { NodeType } from '../../../../item/NodeType.js';
import { createPasteFormatSnapshotFromEntries, getPasteFormatEntries, PasteFormatKind } from '../../../../services/copyPasteService/PasteFormatSnapshot.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class PasteFormatContextMenu implements IContextMenuExtension {
  public shouldProvideContextmenu(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return !designerCanvas.readOnly
      && this._getTargetDesignItems(designerCanvas).length > 0;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [{
      title: 'paste format',
      children: [
        this._createPasteFormatItem(designerCanvas, 'all'),
        { title: '-' },
        this._createPasteFormatItem(designerCanvas, 'border'),
        this._createPasteFormatItem(designerCanvas, 'background'),
        this._createPasteFormatItem(designerCanvas, 'transform'),
        this._createPasteFormatItem(designerCanvas, 'text')
      ]
    }];
  }

  private _createPasteFormatItem(designerCanvas: IDesignerCanvas, kind: PasteFormatKind): IContextMenuItem {
    return {
      title: kind,
      action: () => {
        void this._pasteFormat(designerCanvas, kind);
      }
    };
  }

  private _getTargetDesignItems(designerCanvas: IDesignerCanvas): IDesignItem[] {
    return designerCanvas.instanceServiceContainer.selectionService.selectedElements?.filter(x => x?.nodeType === NodeType.Element && !x.isRootItem) ?? [];
  }

  private async _pasteFormat(designerCanvas: IDesignerCanvas, kind: PasteFormatKind): Promise<void> {
    const [pasteDesignItems] = await designerCanvas.serviceContainer.copyPasteService.getPasteItems(designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
    const pasteSource = pasteDesignItems?.find(x => x?.nodeType === NodeType.Element && x.hasStyles && !x.isRootItem);
    const snapshot = pasteSource ? createPasteFormatSnapshotFromEntries(pasteSource.styles()) : null;
    if (!snapshot) {
      return;
    }

    const entries = getPasteFormatEntries(snapshot, kind);
    const targets = this._getTargetDesignItems(designerCanvas);
    if (!entries.length || !targets.length) {
      return;
    }

    const group = targets[0].openGroup(`paste format: ${kind}`);
    let changed = false;

    for (const target of targets) {
      for (const entry of entries) {
        if (target.getStyle(entry.name) === entry.value) {
          continue;
        }

        target.setStyle(entry.name, entry.value);
        changed = true;
      }
    }

    if (changed) {
      group.commit();
    } else {
      group.abort();
    }
  }
}