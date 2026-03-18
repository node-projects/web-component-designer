# web-component-designer-stylesheetservice-css-tools

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-stylesheetservice-css-parser

     npm i @node-projects/web-component-designer-stylesheetservice-css-parser

## Description

This is a Stylesheetparser using @node-projects/css-parser

## Usage

    import { CssParserStylesheetService } from '@node-projects/web-component-designer-stylesheetservice-css-parser';
    serviceContainer.register("stylesheetService", designerCanvas => new CssParserStylesheetService(designerCanvas));