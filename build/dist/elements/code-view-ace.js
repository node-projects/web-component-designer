import { BaseCustomWebComponent } from "./controls/BaseCustomWebComponent.js";
import { LazyLoadJavascript } from "./controls/LazyLoadJavascript.js";
export class CodeViewAce extends BaseCustomWebComponent {
  constructor() {
    super();
    this.style.display = 'block';
    this._editor = document.createElement("div");
    this._editor.style.height = '100%';
    this._editor.style.width = '100%';

    this._shadow.appendChild(this._editor);
  }

  async connectedCallback() {
    if (!this._initialized) {
      await LazyLoadJavascript.Load('./node_modules/ace-builds/src-min/ace.js');
      this._propertyDefaultsForTag = {};
      this._attributeDefaultsForTag = {};
      this._aceEditor = ace.edit(this._editor);

      this._aceEditor.setReadOnly(true);

      this._aceEditor.setTheme("ace/theme/monokai");

      this._aceEditor.getSession().setMode("ace/mode/html");

      this._aceEditor.$blockScrolling = Infinity;

      this._aceEditor.setOptions({
        fontSize: "14px"
      });

      this._initialized = true;
    }
  }

  update(code) {
    this._aceEditor.setValue(code);

    this._aceEditor.clearSelection();
  }

  has(tag) {
    return !!this._propertyDefaultsForTag[tag];
  }

  save(tag, packageName, el) {
    if (this._propertyDefaultsForTag[tag]) {
      return;
    }

    this._propertyDefaultsForTag[tag] = {};
    this._attributeDefaultsForTag[tag] = {};

    if (!packageName) {
      packageName = this.elementsToPackages[tag]; // If you still didn't find an answer, default to the tag name.

      if (!packageName) {
        packageName = tag;
      }
    }

    this._propertyDefaultsForTag[tag]['__package_name__'] = packageName;
    var props = getProtoProperties(el);
    var attributes = getAttributesIfCustomElement(el);
    let propsKeys = ['id', 'slot', 'classList'].concat(props); // Property defaults

    for (let i = 0; i < propsKeys.length; i++) {
      let prop = propsKeys[i];

      if (prop === 'classList') {
        this._propertyDefaultsForTag[tag][prop] = el[prop].value;
      } else {
        this._propertyDefaultsForTag[tag][prop] = el[prop];
      }
    } // Attribute defaults.


    for (let i = 0; i < attributes.length; i++) {
      let attr = attributes[i];
      this._attributeDefaultsForTag[tag][attr] = el.getAttribute(attr);
    }
  }

  get() {
    const parent = this.canvasElement; // Imports. Yes i'm using element globals because I'm lazy. Fight me.

    this._imports = '';
    this._templates = '';
    this._style = ''; // Host styles.

    let hostCss = parent.style.cssText.replace(/;/g, `;\n       `).trim();
    let directoryPrefix = './node_modules/';
    this.dumpNode(parent, '    ', directoryPrefix);
    let domModule = `
      <dom-module id="main-app">
        <template>
          <style>
            :host {
              display: block;
              position: relative;
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              ${hostCss}
            }
            ${this._style.trimRight()}
          </style>
          ${this._templates.trimRight()}
        </template>
        <script type="module">
          import { PolymerElement } from './node_modules/@polymer/polymer/polymer-element.js';

          class MainApp extends PolymerElement {
            static get is() { return 'main-app'; }
          }
          
          customElements.define(MainApp.is, MainApp);
        &lt;/script>
      </dom-module>
    `;
    let appTitle = 'wizzywid output';
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
          <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
          <title>${appTitle}</title>
          <script src="${directoryPrefix}@webcomponents/webcomponentsjs/webcomponents-loader.js">&lt;/script>
          ${this._imports.trimRight()}
          <style>
            body {
              margin: 0;
              font-family: 'Roboto', 'Noto', sans-serif;
              line-height: 1.5;
              background-color: white;
            }
          </style>
        </head>
        <body>
          <main-app></main-app>
          ${domModule}
        </body>
      </html>
    `;
    return html.replace(/&lt;/g, '<');
  }

  dump(parent) {
    this.update(this.get());
  }

  dumpNode(parent, indent, directoryPrefix) {
    let nodes = parent.children;

    for (let i = 0; i < nodes.length; i++) {
      // Add to the import if needed.
      let tag = nodes[i].tagName.toLowerCase();

      if (tag === 'style') {
        // Need to indent it
        this._style += nodes[i].textContent.replace(/[\n\r]/g, '\n    ') + '\n';
        continue;
      } else if (tag !== 'iron-icons' && tag.indexOf('-icons') !== -1) {
        // This is not actually an element, it's just an import.
        this._imports += this.dumpImports(tag, '', directoryPrefix) + '\n';
        continue;
      }

      if (tag.indexOf('-') !== -1 && this._imports.indexOf(`${tag}.html`) === -1) {
        this._imports += this.dumpImports(tag, '', directoryPrefix) + '\n';
      }

      this._style += this.dumpStyle(tag, nodes[i], '      '); // If this element doesn't have children, do it on one line.

      this._templates += this.dumpElementStartTag(tag, nodes[i], indent);

      if (tag === 'dom-repeat') {
        // We need to wrap the children in a template.
        this._templates += `\n${indent}  <template>`;
      }

      let endTagIndent = indent;

      if (nodes[i].children.length == 0) {
        this._templates += this.dumpElementText(tag, nodes[i], '');
        endTagIndent = '';
      } else {
        this._templates += '\n';
        this.dumpNode(nodes[i], indent + '  ', directoryPrefix) + '\n';
      }

      if (tag === 'dom-repeat') {
        // We need to wrap the children in a template.
        this._templates += `${indent}  </template>\n`;
        endTagIndent = indent;
      }

      this._templates += this.dumpElementEndTag(tag, nodes[i], endTagIndent) + '\n';
    }
  }

  dumpElementText(tag, node, indent) {
    let text = node.textContent.trim();

    if (text && node.children.length === 0) {
      return `${indent}${text}`;
    } else {
      return '';
    }
  }

  dumpElementStartTag(tag, node, indent) {
    let str = this.dumpPropsAndAttributes(tag, node);
    return str.length === 0 ? `${indent}<${tag}>` : `${indent}<${tag} ${str}>`;
  }

  dumpElementEndTag(tag, node, indent) {
    return tag === 'input' || tag === 'img' ? '' : `${indent}</${tag}>`;
  }

  dumpStyle(tag, node, indent) {
    let css = node.style.cssText.replace(/;/g, `;\n       ${indent}`).trim();

    if (css === '') {
      return '';
    }

    let id = node.id ? '#' + node.id : '';
    return `
      ${indent}${tag}${id} {
      ${indent}  ${css} ${indent}
            }`;
  }

  dumpPropsAndAttributes(tag, node) {
    let str = '';

    if (!this._propertyDefaultsForTag[tag]) {
      this._doDefaultsForUnseenTag(tag);
    } // Do attributes first. Why not.


    let attrs = Object.keys(this._attributeDefaultsForTag[tag]);

    for (let i = 0; i < attrs.length; i++) {
      let name = attrs[i];
      let value = node.getAttribute(name);

      if (value === true || value === "") {
        str += `${name} `;
      } else if (tag === 'iron-ajax' && name === 'params' && value && value.indexOf('[[') !== -1) {
        // HACK: This is an enourmous hack I added for the demo.
        // Problem: in order to put a data binding inside of the params attribute
        // which is an object, I need to use $= Ugh. Also it's definitely
        // an object so flip the quotes.
        str += `${name}$='${value}' `;
      } else if (this._attributeDefaultsForTag[tag][name] != value) {
        str += this._getAttrWithRightQuotes(name, value);
      }
    } // HACK, again: we can't use the dom-repeat's actual `items` attribute
    // in the designer view, because it would instantly stamp. Instead,
    // we saved a data-fakeItemsAttr. Restore it now!


    let value = node.dataset['fakeItemsAttr'];

    if (tag === 'dom-repeat' && value) {
      str += `items="${value}" `;
    }

    let props = Object.keys(this._propertyDefaultsForTag[tag]);

    for (let i = 0; i < props.length; i++) {
      let name = props[i];
      let value = node[name]; // If this property was already an attribute, skip it.

      if (attrs.indexOf(name) !== -1) {
        continue;
      }

      if (name === '__package_name__') {
        continue;
      } else if (name === 'classList') {
        // classList is special. Also 'active' is an internal value, so skip that.
        value = value.value; // classList is an array, surprise!

        value = value.replace('active', '').trim();

        if (value.length !== 0) {
          str += `class="${value}" `;
        }
      } else if (value === true) {
        str += `${name} `;
      } else if (this._propertyDefaultsForTag[tag][name] != value) {
        str += this._getAttrWithRightQuotes(name, value);
      }
    }

    return str.trim();
  }

  dumpImports(tag, indent, directoryPrefix) {
    if (!this._propertyDefaultsForTag[tag]) {
      this._doDefaultsForUnseenTag(tag);
    }

    let packageName = this._propertyDefaultsForTag[tag]['__package_name__']; // If this is app-layout stuff, it needs an extra package name.

    if (packageName === 'app-header' || packageName === 'app-drawer' || packageName === 'app-toolbar') {
      packageName = 'app-layout/' + packageName;
    } else if (packageName === '') {
      packageName = tag;
    }

    return `${indent}<script type="module">
            import '/samples/${tag}.js';
          </script>
    `;
  }

  _doDefaultsForUnseenTag(tag) {
    let el = document.createElement(tag);
    this.save(tag, undefined, el);
  }

  _getAttrWithRightQuotes(name, value) {
    const hasQuotes = String(value).indexOf('"') !== -1;
    return hasQuotes ? `${name}='${value}' ` : `${name}="${value}" `;
  }

}