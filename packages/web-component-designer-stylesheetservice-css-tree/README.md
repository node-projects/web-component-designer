# web-component-designer-stylesheetservice-css-tree

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-stylesheetservice-css-tree

     npm i @node-projects/web-component-designer-stylesheetservice-css-tree

## Description

This is a Stylesheetparser using @adobe/css-tree

## Usage

    import { CssTreeStylesheetService } from '@node-projects/web-component-designer-stylesheetservice-css-tree';
    serviceContainer.register("stylesheetService", designerCanvas => new CssTreeStylesheetService(designerCanvas));