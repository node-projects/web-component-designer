import { ServiceContainer } from './ServiceContainer';
import { PolymerPropertiesService } from './propertiesService/services/PolymerPropertiesService';
import { LitElementPropertiesService } from './propertiesService/services/LitElementPropertiesService';
import { NativeElementsPropertiesService } from './propertiesService/services/NativeElementsPropertiesService';
import { DefaultInstanceService } from './instanceService/DefaultInstanceService';
import { DefaultEditorTypesService } from './propertiesService/DefaultEditorTypesService';
import { HtmlWriterService } from './htmlWriterService/HtmlWriterService';
import { BaseCustomWebComponentPropertiesService } from './propertiesService/services/BaseCustomWebComponentPropertiesService';
import { DefaultPlacementService } from './placementService/DefaultPlacementService';
import { DefaultHtmlParserService } from './htmlParserService/DefaultHtmlParserService';
//import { NodeHtmlParserService } from './htmlParserService/NodeHtmlParserService';
import { Lit2PropertiesService } from './propertiesService/services/Lit2PropertiesService';
import { ExtensionType } from '../widgets/designerView/extensions/ExtensionType';
import { PrimarySelectionDefaultExtensionProvider } from '../widgets/designerView/extensions/PrimarySelectionDefaultExtensionProvider';
import { GridExtensionProvider } from '../widgets/designerView/extensions/GridExtensionProvider';
import { TransformOriginExtensionProvider } from '../widgets/designerView/extensions/TransformOriginExtensionProvider';
import { CanvasExtensionProvider } from '../widgets/designerView/extensions/CanvasExtensionProvider';
import { PositionExtensionProvider } from '../widgets/designerView/extensions/PositionExtensionProvider';
import { PathExtensionProvider } from '../widgets/designerView/extensions/PathExtensionProvider';
import { MouseOverExtensionProvider } from '../widgets/designerView/extensions/MouseOverExtensionProvider';
import { NamedTools } from '../widgets/designerView/tools/NamedTools';
import { PointerTool } from '../widgets/designerView/tools/PointerTool';
import { DrawPathTool } from '../widgets/designerView/tools/DrawPathTool';
import { SelectionDefaultExtensionProvider } from '../widgets/designerView/extensions/SelectionDefaultExtensionProvider';
import { ResizeExtensionProvider } from '../widgets/designerView/extensions/ResizeExtensionProvider';
import { RotateExtensionProvider } from '../widgets/designerView/extensions/RotateExtensionProvider';
import { ZoomTool } from '../widgets/designerView/tools/ZoomTool';
import { PanTool } from '../widgets/designerView/tools/PanTool';
import { CopyPasteContextMenu } from '../widgets/designerView/extensions/contextMenu/CopyPasteContextMenu';
import { ZMoveContextMenu } from '../widgets/designerView/extensions/contextMenu/ZMoveContextMenu';
import { MultipleItemsSelectedContextMenu } from '../widgets/designerView/extensions/contextMenu/MultipleItemsSelectedContextMenu';
import { RectangleSelectorTool } from '../widgets/designerView/tools/RectangleSelectorTool';
import { MagicWandSelectorTool } from '../widgets/designerView/tools/MagicWandSelectorTool';
import { PickColorTool } from '../widgets/designerView/tools/PickColorTool';
import { TextTool } from '../widgets/designerView/tools/TextTool';
import { GrayOutExtensionProvider } from '../widgets/designerView/extensions/GrayOutExtensionProvider';
import { AltToEnterContainerExtensionProvider } from '../widgets/designerView/extensions/AltToEnterContainerExtensionProvider';

let serviceContainer = new ServiceContainer();

serviceContainer.register("propertyService", new PolymerPropertiesService());
serviceContainer.register("propertyService", new LitElementPropertiesService());
serviceContainer.register("propertyService", new NativeElementsPropertiesService());
serviceContainer.register("propertyService", new Lit2PropertiesService());
serviceContainer.register("propertyService", new BaseCustomWebComponentPropertiesService());
serviceContainer.register("instanceService", new DefaultInstanceService());
serviceContainer.register("editorTypesService", new DefaultEditorTypesService());
serviceContainer.register("htmlWriterService", new HtmlWriterService());
serviceContainer.register("containerService", new DefaultPlacementService());
serviceContainer.register("htmlParserService", new DefaultHtmlParserService());
//serviceContainer.register("htmlParserService", new NodeHtmlParserService());

serviceContainer.designerExtensions.set(ExtensionType.Permanent, [
  new ResizeExtensionProvider(false)
]);
serviceContainer.designerExtensions.set(ExtensionType.PrimarySelection, [
  new PrimarySelectionDefaultExtensionProvider(),
  new GridExtensionProvider(),
  new TransformOriginExtensionProvider(),
  new CanvasExtensionProvider(),
  new PositionExtensionProvider(),
  new PathExtensionProvider(),
  new ResizeExtensionProvider(true),
  new RotateExtensionProvider(),
]);
serviceContainer.designerExtensions.set(ExtensionType.Selection, [
  new SelectionDefaultExtensionProvider()
]);
serviceContainer.designerExtensions.set(ExtensionType.PrimarySelectionContainer, [
  new GridExtensionProvider()
]);
serviceContainer.designerExtensions.set(ExtensionType.MouseOver, [
  new MouseOverExtensionProvider()
]);
serviceContainer.designerExtensions.set(ExtensionType.ContainerDrag, [
  new GrayOutExtensionProvider()
]);
serviceContainer.designerExtensions.set(ExtensionType.ContainerDragOver, [
  new AltToEnterContainerExtensionProvider()
]);

serviceContainer.designerTools.set(NamedTools.Pointer, new PointerTool());
serviceContainer.designerTools.set(NamedTools.DrawSelection, new RectangleSelectorTool());
serviceContainer.designerTools.set(NamedTools.DrawPath, new DrawPathTool());
serviceContainer.designerTools.set(NamedTools.Zoom, new ZoomTool());
serviceContainer.designerTools.set(NamedTools.Pan, new PanTool());
serviceContainer.designerTools.set(NamedTools.RectangleSelector, new RectangleSelectorTool());
serviceContainer.designerTools.set(NamedTools.MagicWandSelector, new MagicWandSelectorTool());
serviceContainer.designerTools.set(NamedTools.PickColor, new PickColorTool());
serviceContainer.designerTools.set(NamedTools.Text, new TextTool());

serviceContainer.designerContextMenuExtensions = [new CopyPasteContextMenu(), new ZMoveContextMenu(), new MultipleItemsSelectedContextMenu()];

export default serviceContainer;