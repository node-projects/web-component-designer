# web-component-designer

<mark>This is a preview version. It's already usable but big refactorings could still happen.</mark>

A HTML web component for designing web components and HTML pages based on PolymerLabs wizzywid which can easily be integrated in your own software.
Meanwhile polymer is not used anymore.

![image](https://user-images.githubusercontent.com/364896/117482820-358e2d80-af65-11eb-97fd-9d15ebf1966f.png)

## NPM Package

At the moment there is no npm package available, but there will be one as soon as the software has reached RC status.

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

https://github.com/node-projects/web-component-designer/issues

## Developing

  * Install dependencies
```
  $ npm install
```

  * Compile typescript after doing changes
```
  $ npm run build (if you use Visual Studio Code, you can also run the build task via Ctrl + Shift + B > tsc:build - tsconfig.json)
```

  * *Link node module*<br/>
```
  $ npm link 
```

## Using

At first you have to setup a service container providing services for history, properties, elements, ...

## Code Editor

You can select to use one of 3 code editors available (ACE, CodeMirrow, Monaco).
If you use one of the widgets, you need to include the JS lib in your index.html and then use the specific widget.

## TreeView

We have 2 tree components. One independent and one feature rich which uses FancyTree (and cause of this it needs JQuery and JqueryUI).

## DragDrop

If you'd like to use the designer on mobile, you need the mobile-drag-drop npm library and include our polyfill.
Your index.html should be extended as follows:

    <link rel="stylesheet" href="/node_modules/mobile-drag-drop/default.css">
    <script src="/node_modules/mobile-drag-drop/index.js"></script>
    <script src="/node_modules/@node-projects/web-component-designer/dist/polyfill/mobileDragDrop.js"></script>

## Copyright notice

The Library uses Images from the Chrome Dev Tools, see
https://github.com/ChromeDevTools/devtools-frontend/tree/main/front_end/Images/src
and
https://github.com/ChromeDevTools/devtools-frontend/blob/main/LICENSE
