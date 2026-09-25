import { ExtensionType, SeperatorContextMenu, ServiceContainer } from "@node-projects/web-component-designer";
import { CollaborationCommentsContextMenu } from "./extensions/CollaborationCommentsContextMenu.js";
import { CollaborationOverlayExtensionProvider } from "./extensions/CollaborationOverlayExtensionProvider.js";
import { CollaborationCursorOverlayExtensionProvider } from "./extensions/CollaborationCursorOverlayExtensionProvider.js";
import { DefaultCollaborationService } from "./services/DefaultCollaborationService.js";

export function setupCollaborationService(serviceContainer: ServiceContainer) {
    serviceContainer.registerDocumentService("collaborationService", container => new DefaultCollaborationService(container));

    serviceContainer.designerExtensions.set(ExtensionType.Permanent, [
        ...serviceContainer.designerExtensions.get(ExtensionType.Permanent) ?? [],
        new CollaborationOverlayExtensionProvider(),
        new CollaborationCursorOverlayExtensionProvider(),
    ]);

    serviceContainer.designerContextMenuExtensions = [
        ...serviceContainer.designerContextMenuExtensions,
        new SeperatorContextMenu(),
        new CollaborationCommentsContextMenu(),
    ];
}