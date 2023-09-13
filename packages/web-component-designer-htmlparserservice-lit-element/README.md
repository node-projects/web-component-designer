# web-component-designer-htmlparserservice-lit-element

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-htmlparserservice-lit-element

     npm i @node-projects/web-component-designer-htmlparserservice-lit-element

## Description

This is a HTML Parser Service for Templates inside of LitElement, it needs a HTML Parser Service as Parameter.
And it only can parse very simple Templates at the moment.
It also needed to be switched to use Typescript instead of esprima.

## Usage

    import { NodeHtmlParserService } from '@node-projects/web-component-designer-htmlparserservice-nodehtmlparser';
    import { LitElementParserService } from '@node-projects/web-component-designer-htmlparserservice-lit-element';
    serviceContainer.register("htmlParserService", new LitElementParserService(new NodeHtmlParserService()));