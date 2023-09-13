# web-component-designer-stylesheetservice-css-tools

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-stylesheetservice-css-tools

     npm i @node-projects/web-component-designer-stylesheetservice-css-tools

## Description

This is a Stylesheetparser using @adobe/css-tools

## Usage

    import { CssToolsStylesheetService } from '@node-projects/web-component-designer-stylesheetservice-css-tools';
    serviceContainer.register("stylesheetService", designerCanvas => new CssToolsStylesheetService(designerCanvas));