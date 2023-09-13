# web-component-designer-htmlparserservice-nodehtmlparser

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-htmlparserservice-nodehtmlparser

     npm i @node-projects/web-component-designer-htmlparserservice-nodehtmlparser

## Description

This is a HTML Parser Service using a external Lib. The browser Parser strips some Attributes from Templates, so often it's better to use this parser.

## Usage

    import { NodeHtmlParserService } from '@node-projects/web-component-designer-htmlparserservice-nodehtmlparser';
    serviceContainer.register("htmlParserService", new NodeHtmlParserService());