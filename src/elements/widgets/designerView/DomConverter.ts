export class DomConverter {
  static intend = 4;

  static ConvertDomToString(element: Element) {
    let retVal = '';
    for (let e of element.children) {
      retVal += DomConverter._convertDomToString(e, 0);
    }
    return retVal;
  }

  private static _convertDomToString(element: Element, level: number): string {
    let retVal = ''.padEnd(level * this.intend, ' ') + '<' + element.localName;
    for (let a of element.attributes) {
      //Replace " in a.value with &quot;
      retVal += ' ' + a.name + '="' + a.value.replace(/"/g, '&quot;') + '"';
    }
    retVal += '>\n';
    if (element.childNodes.length) {
      for (let e of element.childNodes) {
        if (e instanceof Element)
          retVal += DomConverter._convertDomToString(e, 0);
        else if (e instanceof Text)
          retVal += ''.padEnd((level + 1) * this.intend, ' ') + e.nodeValue + '\n'
      }
    }
    if (!(element instanceof HTMLAreaElement)
      && !(element instanceof HTMLBaseElement)
      && !(element instanceof HTMLBRElement)
      && !(element instanceof HTMLTableColElement)
      && !(element instanceof HTMLEmbedElement)
      && !(element instanceof HTMLHRElement)
      && !(element instanceof HTMLIFrameElement)
      && !(element instanceof HTMLImageElement)
      && !(element instanceof HTMLInputElement)
      && !(element instanceof HTMLLinkElement)
      && !(element instanceof HTMLMetaElement)
      && !(element instanceof HTMLParamElement)
      && !(element instanceof HTMLSourceElement)
      && !(element instanceof HTMLTrackElement))
      retVal += ''.padEnd(level * this.intend, ' ') + '</' + element.localName + '>\n';
    return retVal;
  }
}