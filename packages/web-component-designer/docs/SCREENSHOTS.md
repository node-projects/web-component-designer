# Refreshing the README screenshots

The images in `images/` were captured from the [hosted full demo](https://node-projects.github.io/web-component-designer-demo/index.html) on 2026-10-17 at a 1280 × 720 viewport. They show the demo application's shell, rather than the minimal core document container.

To reproduce the scene:

1. Open the full demo and switch the document to **Code**.
2. Replace the document HTML with [images/sample.html](images/sample.html).
3. Return to **Designer**, activate the Pointer tool, and select the **Explore the canvas** button.
4. Keep the document tree, miniature, properties, stylesheet, refactor, and debug panels visible as shown in the screenshots.
5. Capture the viewport with the dark theme as `images/designer-dark.jpg`.
6. Use the theme switch in the top-right corner and capture `images/designer-light.jpg`.

The sample uses inline CSS and no external assets. The demo's existing global `font-size: 20px` stylesheet is left in place. The selected button demonstrates selection handles and the native element property inspector. Panel sizes, bundled designer version, and rendering may change as the hosted demo evolves.
