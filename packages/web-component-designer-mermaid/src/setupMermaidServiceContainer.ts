import { AbsolutePlacementService, AltToEnterContainerExtensionProvider, BaseCustomWebComponentPropertiesService, CopyPasteContextMenu, DefaultEditorTypeService, DefaultHtmlParserService, DefaultInstanceService, DefaultModelCommandService, DefaultPropertyEditorTypesService, DeletionService, DesignItemDocumentPositionService, DesignItemService, DragDropService, ElementAtPointService, ElementDragTitleExtensionProvider, ExtensionType, GrayOutDragOverContainerExtensionProvider, GrayOutExtensionProvider, HighlightElementExtensionProvider, IDesignerCanvas, ItemsBelowContextMenu, MagicWandSelectorTool, MultipleItemsSelectedContextMenu, NamedTools, PanTool, PointerTool, PointerToolButtonProvider, PositionExtensionProvider, RectangleSelectorTool, ResizeExtensionProvider, SelectionDefaultExtensionProvider, SelectionService, SelectorToolButtonProvider, SeperatorToolProvider, ServiceContainer, SimpleToolButtonProvider, SnaplinesProviderService, TransformToolButtonProvider, UndoService, ZMoveContextMenu, ZoomTool, ZoomToolButtonProvider } from "@node-projects/web-component-designer";
import { MermaidLayoutCopyPasteService } from "./services/MermaidLayoutCopyPasteService.js";
import { MermaidLayoutPlacementService } from "./services/MermaidLayoutPlacementService.js";
import { MermaidParserService } from "./services/MermaidParserService.js";
import { rerouteConnectedMermaidEdges } from "./services/MermaidConnectionRouting.js";
import { ConnectMermaidNodesTool, mermaidFlowIcon } from "./toolbar/ConnectMermaidNodesTool.js";
import { MermaidDemoView } from "./widgets/views/mermaid-demo-view.js";
import { MermaidPropertyGroupsService } from "./services/MermaidPropertyGroupsService.js";
import { MermaidElementsService } from "./services/MermaidElementsService.js";

export function createMermaidDesignerServiceContainer() {
    const serviceContainer = new ServiceContainer();
    const parserService = new MermaidParserService();
    const elementsService = new MermaidElementsService("mermaid", new URL("./widgets/elements.json", import.meta.url));

    serviceContainer.register("instanceService", new DefaultInstanceService());
    serviceContainer.register("containerService", new AbsolutePlacementService());
    serviceContainer.register("containerService", new MermaidLayoutPlacementService());
    serviceContainer.register("snaplinesProviderService", new SnaplinesProviderService());
    serviceContainer.register("htmlParserService", new DefaultHtmlParserService());
    serviceContainer.register("htmlParserService", parserService);
    serviceContainer.register("htmlWriterService", parserService);
    serviceContainer.register("elementAtPointService", new ElementAtPointService());
    serviceContainer.register("dragDropService", new DragDropService());
    serviceContainer.register("copyPasteService", new MermaidLayoutCopyPasteService());
    serviceContainer.register("modelCommandService", new DefaultModelCommandService());
    serviceContainer.register("propertyEditorTypesService", new DefaultPropertyEditorTypesService());
    serviceContainer.register("editorTypeService", new DefaultEditorTypeService());
    serviceContainer.register("propertyGroupsService", new MermaidPropertyGroupsService());
    serviceContainer.register("propertyService", new BaseCustomWebComponentPropertiesService(true));
    serviceContainer.register("designItemService", new DesignItemService());
    serviceContainer.register("deletionService", new DeletionService());

    serviceContainer.register("undoService", (designerCanvas: IDesignerCanvas) => new UndoService(designerCanvas));
    serviceContainer.register("selectionService", (designerCanvas: IDesignerCanvas) => new SelectionService(designerCanvas, false));
    serviceContainer.register("designItemDocumentPositionService", (designerCanvas: IDesignerCanvas) => new DesignItemDocumentPositionService(designerCanvas));

    serviceContainer.instanceServiceContainerCreatedCallbacks.push(instanceServiceContainer => {
        const designerCanvas = instanceServiceContainer.designerCanvas;
        elementsService.setInstanceServiceContainer(instanceServiceContainer);
        instanceServiceContainer.selectionService.setSelectedElements([designerCanvas.rootDesignItem]);
        const previousRaiseDesignItemsChanged = designerCanvas.raiseDesignItemsChanged.bind(designerCanvas);
        designerCanvas.raiseDesignItemsChanged = (designItems, action, operationFinished) => {
            previousRaiseDesignItemsChanged(designItems, action, operationFinished);
            if (action === "place" || action === "resize")
                rerouteConnectedMermaidEdges(instanceServiceContainer, designItems, operationFinished);
        };
    });

    serviceContainer.designerExtensions.set(ExtensionType.Permanent, []);
    serviceContainer.designerExtensions.set(ExtensionType.PrimarySelection, [
        new class extends ElementDragTitleExtensionProvider {
            override shouldExtend(extensionManager: any, designerView: any, designItem: any) {
                if (designItem.element?.localName === "mermaid-edge")
                    return false;
                return super.shouldExtend(extensionManager, designerView, designItem);
            }
        }(),
        new class extends PositionExtensionProvider {
            override shouldExtend(extensionManager: any, designerView: any, designItem: any) {
                if (designItem.element?.localName === "mermaid-edge")
                    return false;
                return super.shouldExtend(extensionManager, designerView, designItem);
            }
        }(),
        new class extends ResizeExtensionProvider {
            override shouldExtend(extensionManager: any, designerView: any, designItem: any) {
                if (designItem.element?.localName === "mermaid-edge")
                    return false;
                return super.shouldExtend(extensionManager, designerView, designItem);
            }
        }(true)
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.Selection, [
        new SelectionDefaultExtensionProvider()
    ]);
    serviceContainer.designerExtensions.set(ExtensionType.PrimarySelectionContainer, []);
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
    serviceContainer.designerTools.set("MermaidFlow", new ConnectMermaidNodesTool());

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
        new SimpleToolButtonProvider("MermaidFlow", mermaidFlowIcon),
        new SeperatorToolProvider(22),
        new ZoomToolButtonProvider(),
        new SeperatorToolProvider(22),
        new TransformToolButtonProvider()
    );

    serviceContainer.config.demoViewWidget = MermaidDemoView;
    serviceContainer.register("elementsService", elementsService);

    return serviceContainer;
}
