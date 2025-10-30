# Bad Practices

## Overuse of `any` Type

Throughout the codebase, the `any` type is used extensively. This undermines the benefits of TypeScript's static typing, making the code more prone to runtime errors and harder to refactor and maintain.

### Example: `_createDesignItemsRecursive` in `LitElementParserService.ts`

**File:** `packages/web-component-designer-htmlparserservice-lit-element/src/service/htmlParserService/LitElementParserService.ts`

**Line:** 28

**Code:**
```typescript
_createDesignItemsRecursive(item: any, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, namespace: string): IDesignItem {
```

**Problem:**
The `item` parameter is of type `any`. This means that the compiler will not perform any type checking on this object, and we lose autocompletion and type safety. We have to look at the code to understand what properties `item` has, which is not ideal.

**Recommendation:**
Create an interface or type that defines the structure of the `item` object. This will provide type safety and make the code easier to understand and maintain. For example:
```typescript
interface ParsedHtmlNode {
  nodeType: number;
  rawTagName?: string;
  rawAttrs?: string;
  attributes?: Record<string, string>;
  childNodes?: ParsedHtmlNode[];
  rawText?: string;
}

_createDesignItemsRecursive(item: ParsedHtmlNode, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, namespace: string): IDesignItem {
  // ...
}
```

This is just one example. The codebase should be refactored to replace `any` with more specific types wherever possible.
