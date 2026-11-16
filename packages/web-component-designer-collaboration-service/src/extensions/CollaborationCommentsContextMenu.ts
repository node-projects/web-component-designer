import { ContextmenuInitiator, getCollaborationNodeIndex, ICollaborationComment, ICollaborationService, IContextMenuExtension, IContextMenuItem, IDesignerCanvas, IDesignItem } from '@node-projects/web-component-designer';

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength)
    return text;
  return text.substring(0, Math.max(0, maxLength - 1)) + '…';
}

function createCommentId() {
  return globalThis.crypto?.randomUUID?.() ?? `comment-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export class CollaborationCommentsContextMenu implements IContextMenuExtension {
  constructor(private readonly requireConnection = false) { }

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    const service = designerView.instanceServiceContainer.collaborationService;
    return !!service && (!this.requireConnection || service.state === 'connected') && !!designItem && !designItem.isRootItem;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    const collaborationService = designerCanvas.instanceServiceContainer.collaborationService;
    const targetNodeIndex = getCollaborationNodeIndex(designItem);
    if (targetNodeIndex == null)
      return [];

    const comments = collaborationService!.comments.filter(x => x.targetNodeIndex === targetNodeIndex);
    const localPeerId = collaborationService!.session?.peerId ?? 'local';
    const translationService = designerCanvas.serviceContainer.getLastService('translationService');

    const items: IContextMenuItem[] = [
      {
        title: translationService.translate('add comment'),
        action: () => {
          const value = globalThis.prompt?.(designerCanvas.serviceContainer.getLastService('translationService').translate('Add comment'), '')?.trim();
          if (!value)
            return;

          const now = Date.now();
          collaborationService!.upsertComment({
            id: createCommentId(),
            text: value,
            authorPeerId: localPeerId,
            targetNodeIndex,
            targetDesignItemId: designItem.id,
            createdAt: now,
            updatedAt: now,
            resolved: false
          });
        }
      }
    ];

    if (comments.length) {
      items.push({ title: '-' });
      items.push({
        title: translationService.translate('comments ({count})', { count: String(comments.length) }),
        children: comments.map(comment => this.createCommentMenuItem(comment, collaborationService!, designItem))
      });
    }

    return items;
  }

  private createCommentMenuItem(comment: ICollaborationComment, collaborationService: ICollaborationService, designItem: IDesignItem): IContextMenuItem {
    const translationService = designItem.serviceContainer.getLastService('translationService');
    return {
      title: `${translationService.translate(comment.resolved ? 'resolved' : 'open')}: ${truncateText(comment.text, 36)}`,
      children: [
        {
          title: translationService.translate(comment.resolved ? 'reopen' : 'resolve'),
          action: () => collaborationService.upsertComment({
            ...comment,
            targetDesignItemId: designItem.id,
            resolved: !comment.resolved,
            updatedAt: Date.now()
          })
        },
        {
          title: translationService.translate('remove'),
          action: () => collaborationService.removeComment(comment.id)
        }
      ]
    };
  }
}