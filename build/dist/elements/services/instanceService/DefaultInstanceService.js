export class DefaultInstanceService {
  getElement(definition) {
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

    return element;
  }

}