# web-component-designer-texteditextension-stylo

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-texteditextension-stylo

     npm i @node-projects/web-component-designer-texteditextension-stylo

## Description

This is a extension to edit Text via the @papyrs/stylo

## Usage

    import { EditTextWithStyloExtensionProvider } from '@node-projects/web-component-designer-texteditextension-stylo';
    serviceContainer.designerExtensions.set(ExtensionType.Doubleclick, [new EditTextWithStyloExtensionProvider()]);