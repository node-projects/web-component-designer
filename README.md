# web-component-designer

## Caution - this is a preview Version, a RC is planed for Q3/2021

A HTML WebComponent for Designing Webcomponents and HTML Pages.

Based on PolymerLabs Wizzywid (but it does not use Polymer any more.)

This is a Designer Framework wich could easily be included in your own Software..

![image](https://user-images.githubusercontent.com/364896/117482820-358e2d80-af65-11eb-97fd-9d15ebf1966f.png)

## NPM Package

At the moment there is no NPM Package.
But there will be one when project is in Release Candidate state.

## Demo

look at: https://node-projects.github.io/web-component-designer-demo/index.html
repository: https://github.com/node-projects/web-component-designer-demo

or a simple one: https://node-projects.github.io/web-component-designer-simple-demo/index.html
repository: https://github.com/node-projects/web-component-designer-simple-demo

## What is needed

- @node-projects/base-custom-webcomponent a very small basic webcomponent library (maybe this will be included directly later, to be dependecy free)
- constructable-stylesheets-polyfill on browser not yet supporting these (for Safari & Firefox)
- optional - ace code editor
- optional - monaco code editor (if you use code-view-monaco)
- optional - code mirror code editor (if you use code-view-codemirror) (workin but buggy)
- optional - fancytree (if you use tree-view-extended, palette-tree-view or bindable-objects-browser)

## Features we are workin on

 - CSS Grid Positioning (planed)
 - look at the issues
 - Much, much more ...

## Developing

  * Install dependencies
```
  $ npm install
```

  * Compile Typescript after doing changes
```
  $ npm run build
```

## Using

at first you have to setup a service container, providing services for History, Properties, Elements, ....

## Configuring

## For some Widgets the Designer needs Additional Dependencies

## Code Editor

You can select to use on of 3 Code Editors Available (ACE, CodeMirrow, Monaco).
If you use one of the Widgets, you need to include the JS lib in you index.html and then use the specific widget.

## TreeView

We have 2 Tree Components. One Dependend Less and one Feature Rich wich uses FancyTree (and cause of this it needs JQuery and JqueryUI)

## DragDrop

If you'd like to use the Designer on Mobile, you need the mobile-drag-drop npm Library and include our polyfill.
Your addition to your index.html should look like this:

    <link rel="stylesheet" href="/node_modules/mobile-drag-drop/default.css">
    <script src="/node_modules/mobile-drag-drop/index.js"></script>
    <script src="/node_modules/@node-projects/web-component-designer/dist/polyfill/mobileDragDrop.js"></script>

## Copyright notice:

The Library uses Images from the Chrome Dev Tools, see
https://github.com/ChromeDevTools/devtools-frontend/tree/main/front_end/Images/src
and
https://github.com/ChromeDevTools/devtools-frontend/blob/main/LICENSE