export class DefaultInstanceService {
  getElement(definition) {
    if (definition.import) import(definition.import);
    let element = document.createElement(definition.tag);
    element.style.width = '60px';
    element.style.height = '20px';
    element.style.position = 'absolute';

    switch (definition.tag) {
      case "div":
        element.innerHTML = "div";
        break;

      case "input":
        element.type = "text";
    }

    if (definition.defaultContent) {
      if (typeof definition.defaultContent === "string") {
        element.innerHTML = definition.defaultContent;
      } else {
        element.appendChild(definition.defaultContent);
      }
    }

    return element;
  }

}