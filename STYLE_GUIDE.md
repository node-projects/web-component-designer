# Style Guide

This style guide is based on the predominant conventions found in the codebase. The goal is to create a consistent and maintainable codebase.

## Naming Conventions

*   **Classes and Interfaces:** Use `PascalCase`. Interfaces should be prefixed with `I`.
    *   **Correct:** `class DesignerView`, `interface IDesignItem`
*   **Methods and Functions:** Use `camelCase`.
    *   **Correct:** `executeCommand`, `_onWheel`
*   **Variables and Properties:** Use `camelCase`.
    *   **Correct:** `serviceContainer`, `_designerCanvas`
*   **Private and Protected Members:** Prefix with an underscore `_`.
    *   **Correct:** `private _sVert`, `protected _notifyChangedProperty`
*   **Constants:** Use `UPPER_CASE_SNAKE_CASE` for constants that are truly constant and not just read-only properties.
    *   **Correct:** `const MAX_ZOOM = 10;`
*   **Enums:** Use `PascalCase` for the enum name and `PascalCase` for its members.
    *   **Correct:**
        ```typescript
        enum BindingTarget {
          Property,
          Attribute,
          Css
        }
        ```

## Formatting

*   **Indentation:** Use 2 spaces for indentation.
*   **Braces:** Use the "one true brace style" (opening brace on the same line as the statement).
    *   **Correct:**
        ```typescript
        if (condition) {
          // ...
        } else {
          // ...
        }
        ```
*   **Quotes:** Use single quotes (`'`) for strings.
*   **Spacing:**
    *   Use spaces around operators (`=`, `+`, `-`, etc.).
    *   Use a space after commas in argument lists.
    *   Do not add spaces inside parentheses.
*   **Semicolons:** Use semicolons at the end of statements.

## Best Practices

*   **`let` and `const`:** Prefer `const` over `let`. Use `let` only for variables that need to be reassigned. Avoid using `var`.
*   **Type Safety:** Avoid using the `any` type. Use specific types or interfaces whenever possible.
*   **Imports:** Use ES6 module syntax (`import`/`export`).
*   **Comments:** Use comments to explain complex logic or to document public APIs. Use `//` for single-line comments and `/** ... */` for multi-line comments and JSDoc.

## Inconsistencies to Address

The following are some inconsistencies that were found in the codebase and should be addressed to align with the style guide.

*   **`any` Type:** The `any` type is used excessively throughout the codebase. This should be replaced with more specific types or interfaces.
*   **`var` Keyword:** Some older parts of the codebase use the `var` keyword. This should be replaced with `let` or `const`.
*   **Quotes:** While most of the code uses single quotes, there are some instances of double quotes. This should be standardized to single quotes.
*   **Private/Protected Prefixes:** While the majority of private and protected members are prefixed with `_`, some are not. This should be applied consistently.
