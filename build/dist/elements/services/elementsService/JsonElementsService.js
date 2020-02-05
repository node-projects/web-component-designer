// Reads a Json File and provides the Elements listed there
export class JsonElementsService {
  constructor(name, file) {
    this._name = name;
    let request = new XMLHttpRequest();
    request.open('GET', file);

    request.onreadystatechange = () => {
      if (request.readyState == 4) {
        let data = request.responseText;
        let parsed = JSON.parse(data);
        this._elementList = [];

        for (const i in parsed.elements) {
          let element = parsed.elements[i];
          if (this.isIElementDefintion(element)) this._elementList.push(element);else this._elementList.push({
            tag: element
          });
        }

        if (this._resolveStored) this._resolveStored(this._elementList);
      }
    };

    request.send();
  }

  get name() {
    return this._name;
  }

  getElements() {
    if (this._elementList) return Promise.resolve(this._elementList);
    return new Promise(resolve => this._resolveStored = resolve);
  }

  isIElementDefintion(object) {
    return object != null && object.tag != null;
  }

}