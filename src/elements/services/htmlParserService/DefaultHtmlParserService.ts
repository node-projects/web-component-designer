import { IDesignItem } from "../../..";
import { InstanceServiceContainer } from "../InstanceServiceContainer";
import { ServiceContainer } from "../ServiceContainer";
import { IHtmlParserService } from "./IHtmlParserService";

export class DefaultHtmlParserService implements IHtmlParserService {
  parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem> {
    //const parser = new DOMParser();
    //const doc = parser.parseFromString(html, 'text/html');
    return null;
  }


}