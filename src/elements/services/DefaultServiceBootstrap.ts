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
import { ZoomTool } from '../widgets/designerView/tools/ZoomTool.';
import { PanTool } from '../widgets/designerView/tools/PanTool';
import { CopyPasteContextMenu } from '../widgets/designerView/extensions/contextMenu/CopyPasteContextMenu';
import { ZMoveContextMenu } from '../widgets/designerView/extensions/contextMenu/ZMoveContextMenu';
import { MultipleItemsSelectedContextMenu } from '../widgets/designerView/extensions/contextMenu/MultipleItemsSelectedContextMenu';

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
serviceContainer.designerExtensions.set(ExtensionType.Selection, [new SelectionDefaultExtensionProvider()]);
serviceContainer.designerExtensions.set(ExtensionType.PrimarySelectionContainer, [new GridExtensionProvider()]);
serviceContainer.designerExtensions.set(ExtensionType.MouseOver, [new MouseOverExtensionProvider()]);

serviceContainer.designerTools.set(NamedTools.PointerTool, new PointerTool());
serviceContainer.designerTools.set(NamedTools.DrawPathTool, new DrawPathTool());
serviceContainer.designerTools.set(NamedTools.ZoomTool, new ZoomTool());
serviceContainer.designerTools.set(NamedTools.PanTool, new PanTool());

serviceContainer.designerContextMenuExtensions = [new CopyPasteContextMenu(), new ZMoveContextMenu(), new MultipleItemsSelectedContextMenu()];

export default serviceContainer;