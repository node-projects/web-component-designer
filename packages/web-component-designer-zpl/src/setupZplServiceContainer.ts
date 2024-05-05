import { ExtensionType, DefaultModelCommandService, DefaultHtmlParserService, JsonFileElementsService, ServiceContainer, PositionExtensionProvider, SelectionDefaultExtensionProvider, GrayOutExtensionProvider, AltToEnterContainerExtensionProvider, NamedTools, PointerTool, RectangleSelectorTool, ZoomTool, PanTool, MagicWandSelectorTool, ZMoveContextMenu, CopyPasteContextMenu, MultipleItemsSelectedContextMenu, ItemsBelowContextMenu, ElementDragTitleExtensionProvider, PointerToolButtonProvider, SeperatorToolProvider, SelectorToolButtonProvider, ZoomToolButtonProvider, HighlightElementExtensionProvider, ContentService, IDesignerCanvas, SelectionService, UndoService, GrayOutDragOverContainerExtensionProvider, ElementAtPointService, SnaplinesProviderService, DefaultInstanceService, PropertyGroupsService, DesignItemDocumentPositionService, DragDropService, BaseCustomWebComponentPropertiesService, DefaultEditorTypesService, TransformToolButtonProvider } from '@node-projects/web-component-designer';
import { ZplLayoutPlacementService } from './services/ZplLayoutPlacementService.js';
import { ZplParserService } from './services/ZplParserService.js';
import { ZplImageDrop } from './services/ZplImageDrop.js';
import { ZplLayoutCopyPasteService } from './services/ZplLayoutCopyPasteService.js';
import { ZplLayoutResizeExtensionProvider } from './extensions/ZplLayoutResizeExtensionProvider.js';
import { ZplDemoView } from './widgets/views/zpl-demo-view.js';

export function createZplDesignerServiceContainer() {
    let serviceContainer = new ServiceContainer();

    serviceContainer.register("instanceService", new DefaultInstanceService());
    serviceContainer.register("containerService", new ZplLayoutPlacementService());
    serviceContainer.register("snaplinesProviderService", new SnaplinesProviderService());
    serviceContainer.register("htmlParserService", new DefaultHtmlParserService());
    serviceContainer.register("htmlParserService", new ZplParserService());
    serviceContainer.register("htmlWriterService", new ZplParserService());
    serviceContainer.register("elementAtPointService", new ElementAtPointService());
    serviceContainer.register("externalDragDropService", new ZplImageDrop());
    serviceContainer.register("dragDropService", new DragDropService());
    serviceContainer.register("copyPasteService", new ZplLayoutCopyPasteService());
    serviceContainer.register("modelCommandService", new DefaultModelCommandService());
    serviceContainer.register('editorTypesService', new DefaultEditorTypesService());
    serviceContainer.register("propertyGroupsService", new PropertyGroupsService());
    serviceContainer.register("propertyService", new BaseCustomWebComponentPropertiesService(true));

    serviceContainer.register("undoService", (designerCanvas: IDesignerCanvas) => new UndoService(designerCanvas));
    serviceContainer.register("selectionService", (designerCanvas: IDesignerCanvas) => new SelectionService(designerCanvas, false));
    serviceContainer.register("contentService", (designerCanvas: IDesignerCanvas) => new ContentService(designerCanvas.rootDesignItem));
    serviceContainer.register("designItemDocumentPositionService", (designerCanvas: IDesignerCanvas) => new DesignItemDocumentPositionService(designerCanvas));

    serviceContainer.designerExtensions.set(ExtensionType.Permanent, [
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.PrimarySelection, [
        new ElementDragTitleExtensionProvider(),
        new PositionExtensionProvider(),
        new ZplLayoutResizeExtensionProvider(true)
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.Selection, [
        new SelectionDefaultExtensionProvider()
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.PrimarySelectionContainer, [
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.MouseOver, [
        new HighlightElementExtensionProvider()
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.ContainerDrag, [
        new GrayOutExtensionProvider()
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.ContainerDragOverAndCanBeEntered, [
        new AltToEnterContainerExtensionProvider(),
        new GrayOutDragOverContainerExtensionProvider(),
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.ContainerExternalDragOverAndCanBeEntered, [
        new GrayOutDragOverContainerExtensionProvider(),
    ]);

    serviceContainer.designerTools.set(NamedTools.Pointer, new PointerTool());
    serviceContainer.designerTools.set(NamedTools.DrawSelection, new RectangleSelectorTool());
    serviceContainer.designerTools.set(NamedTools.Zoom, new ZoomTool());
    serviceContainer.designerTools.set(NamedTools.Pan, new PanTool());
    serviceContainer.designerTools.set(NamedTools.RectangleSelector, new RectangleSelectorTool());
    serviceContainer.designerTools.set(NamedTools.MagicWandSelector, new MagicWandSelectorTool());

    serviceContainer.designerContextMenuExtensions = [
        new CopyPasteContextMenu(),
        new ZMoveContextMenu(),
        new MultipleItemsSelectedContextMenu(),
        new ItemsBelowContextMenu()
    ];

    serviceContainer.designViewToolbarButtons.push(
        new PointerToolButtonProvider(),
        new SeperatorToolProvider(22),
        new SelectorToolButtonProvider(),
        new SeperatorToolProvider(22),
        new ZoomToolButtonProvider(),
        new SeperatorToolProvider(22),
        new TransformToolButtonProvider()
    );

    serviceContainer.config.demoViewWidget = ZplDemoView;

    serviceContainer.register('elementsService', new JsonFileElementsService('zpl', new URL("./widgets/elements.json", import.meta.url)));

    return serviceContainer;
}

