import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { ServiceContainer } from '../ServiceContainer.js';
import { IHtmlParserService } from './IHtmlParserService.js';
import { IDesignItem } from '../../item/IDesignItem.js';

export class VueParserService implements IHtmlParserService {
  private htmlParser: IHtmlParserService;

  constructor(htmlParser: IHtmlParserService) {
    this.htmlParser = htmlParser;
  }

  async parse(code: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
    const parsed = await this.htmlParser.parse(code, serviceContainer, instanceServiceContainer, parseSnippet);
    return [parsed.find(x => x.name == 'template')];
  }
}