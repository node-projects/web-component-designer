import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";
import { DomHelper } from '@node-projects/base-custom-webcomponent/dist/DomHelper.js';
import { IDemoProviderService } from "./IDemoProviderService.js";

export class DemoProviderService implements IDemoProviderService {
  provideDemo(container: HTMLElement, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, code: string, style: string) {
    return new Promise<void>(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.display = 'none';
      DomHelper.removeAllChildnodes(container);
      container.appendChild(iframe);

      iframe.onload = () => {
        iframe.style.display = 'block';
        resolve();
      };

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write('<script type="module">');
      for (let i of instanceServiceContainer.designContext.imports) {
        doc.write("import '" + i + "';");
      }
      doc.write("document.body.style.display='';");
      doc.write('</script>');
      doc.write('<style>' + (style ?? '') + '</style>');
      doc.write('<body style="display:none; width: 100%; height: 100%; margin: 0; padding: 0; position: absolute;">' + code + '</body>');
      doc.close();
    });
  }
}