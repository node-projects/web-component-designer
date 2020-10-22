import { IDesignItem } from "../../..";
import { InstanceServiceContainer } from "../InstanceServiceContainer";
import { ServiceContainer } from "../ServiceContainer";
import { IHtmlParserService } from "./IHtmlParserService";


export class NodeHtmlParserService implements IHtmlParserService {
  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem> {
    //let parser = await import('node-html-parser');
    //const root = parser.parse(html);

    return null;
  }
}