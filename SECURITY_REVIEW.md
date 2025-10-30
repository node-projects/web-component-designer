# Security Review

## Potential DOM XSS in `LitElementParserService.ts`

**File:** `packages/web-component-designer-htmlparserservice-lit-element/src/service/htmlParserService/LitElementParserService.ts`

**Line:** 76

**Code:**
```typescript
} else if (item.nodeType == 3) {
    this._parseDiv.innerHTML = item.rawText;
    let element = this._parseDiv.childNodes[0];
    designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
}
```

**Vulnerability:**
The code uses `innerHTML` to parse the `rawText` of a node. If `rawText` contains malicious HTML, it could be executed, leading to a DOM-based Cross-Site Scripting (XSS) vulnerability. An attacker could potentially craft a web component with malicious content that would be executed when parsed by the designer.

**Recommendation:**
Avoid using `innerHTML` to parse content. If the goal is to decode HTML entities, use a safer method like creating a text node and reading its value, or using a dedicated library for decoding. A safer alternative would be to use `textContent`:
```typescript
this._parseDiv.textContent = item.rawText;
```
This will ensure that the content is treated as text and not parsed as HTML, mitigating the XSS risk.

---

## Potential DOM XSS in `NodeHtmlParserService.ts`

**File:** `packages/web-component-designer-htmlparserservice-nodehtmlparser/src/service/htmlParserService/NodeHtmlParserService.ts`

**Line:** 99

**Code:**
```typescript
} else if (item.nodeType == 3) {
      const parseDiv = instanceServiceContainer.designerCanvas.rootDesignItem.document.createElement("div");
      parseDiv.innerHTML = item.rawText;
      let element = parseDiv.childNodes[0];
      designItem = DesignItem.GetOrCreateDesignItem(element, item, serviceContainer, instanceServiceContainer);
}
```

**Vulnerability:**
This is the same vulnerability as in `LitElementParserService.ts`. The code uses `innerHTML` to parse the `rawText` of a node, which can lead to a DOM-based XSS vulnerability if the `rawText` contains malicious HTML.

**Recommendation:**
The recommendation is the same as for `LitElementParserService.ts`. Use a safer method to parse the content, such as `textContent`:
```typescript
const parseDiv = instanceServiceContainer.designerCanvas.rootDesignItem.document.createElement("div");
parseDiv.textContent = item.rawText;
```
This will prevent the browser from interpreting the content as HTML, thus mitigating the XSS risk.
