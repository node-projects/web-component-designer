# web-component-designer-htmlparserservice-base-custom-webcomponent

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-htmlparserservice-base-custom-webcomponent

     npm i @node-projects/web-component-designer-htmlparserservice-base-custom-webcomponent

## Description

This is a HTML Parser Service for Templates inside of BaseCustomWebcomponent, it needs a HTML Parser Service as Parameter.

## Usage

    import { NodeHtmlParserService } from '@node-projects/web-component-designer-htmlparserservice-nodehtmlparser';
    import { BaseCustomWebcomponentParserService } from '@node-projects/web-component-designer-htmlparserservice-base-custom-webcomponent';
    serviceContainer.register("htmlParserService", new BaseCustomWebcomponentParserService(new NodeHtmlParserService()));