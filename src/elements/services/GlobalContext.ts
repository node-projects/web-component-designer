import { ITool } from '../../../dist/elements/widgets/designerView/tools/ITool';

//TODO: global conext not yet used.
//Service container should not be something with changeing information, so global context is for tool and color (and maybe more)
//infos shared betweed designer widgets
export class GlobalContext {
  tool: ITool;
  strokeColor: string;
  fillBrush: string;
}