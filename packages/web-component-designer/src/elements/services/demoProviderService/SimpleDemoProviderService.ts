import { DomHelper, cssFromString } from "@node-projects/base-custom-webcomponent";
import { IDemoProviderService } from "./IDemoProviderService.js";
import { ServiceContainer } from "../ServiceContainer.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";

export class SimpleDemoProviderService implements IDemoProviderService {
  async provideDemo(container: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string) {
    const contentDiv = document.createElement('div');
    let shadowRoot = contentDiv.attachShadow({ mode: 'open' });
    contentDiv.style.width = '100%';
    contentDiv.style.height = '100%';
    contentDiv.style.border = 'none';
    contentDiv.style.display = 'none';
    contentDiv.style.overflow = 'auto';
    contentDiv.style.position = 'absolute';

    container.style.position = 'relative';

    DomHelper.removeAllChildnodes(container);
    container.appendChild(contentDiv);

    let styles: CSSStyleSheet[] = [];
    if (instanceServiceContainer.designerCanvas.additionalStyles)
      styles.push(...instanceServiceContainer.designerCanvas.additionalStyles);
    if (instanceServiceContainer.stylesheetService) {
      styles.push(...instanceServiceContainer.stylesheetService
        .getStylesheets()
        .map(x => cssFromString(x.content)));
    }
    shadowRoot.adoptedStyleSheets = styles;
    shadowRoot.innerHTML = '';
    if ('setHTMLUnsafe' in shadowRoot)
      //@ts-ignore
      shadowRoot.setHTMLUnsafe(code);
    else
      //@ts-ignore
      shadowRoot.innerHTML = code;

    contentDiv.style.display = '';
  }
}