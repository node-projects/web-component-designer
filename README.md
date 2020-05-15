# web-component-designer

## Caution - this is a preview Version, we hope to release a RC in May/June 2020

A HTML WebComponent for Designing Webcomponents and HTML Pages.

Based on PolymerLabs Wizzywid

[![Build Status](https://github.com/node-projects/web-component-designer/workflows/Node%20CI/badge.svg?branch=master)](https://github.com/node-projects/web-component-designer/actions?query=workflow%3A%22Node+CI%22+branch%3Amaster)

This is a Designer Framework wich could easily be included in your own Software..

<img width="985" alt="screenshot of wizzywid" src="https://user-images.githubusercontent.com/1369170/28957547-22175752-78a7-11e7-8770-49df35698e55.png">

## Demo

look at: https://node-projects.github.io/web-component-designer-demo/index.html

repository: https://github.com/node-projects/web-component-designer-demo

## What is needed

- constructable-stylesheets-polyfill on browser not yet supporting these
- optional - ace code editor (if you use code-view-ace)
- optional - code mirrow code editor (if you use code-view-codemirrow) (todo)
- optional - monaco code editor (if you use code-view-monaco) (todo)
- optional - fancytree (if you use tree-view-fancytree) (todo)

## Features we are workin on

 - Refactor as a reusable NPM component (not yet started, (remove app-shell))
 - Conversation to Typescript (done)
 - Multiselection (WIP)
 - Drag/Move refactoring (WIP)
 - New Property Editor (not yet Started) (planed to inject custom property handling classes)
 - CSS Grid Positioning (planed)
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

  * Run the app in a local server
```
  $ polymer serve --port 8000 --open
```

  * Navigate Chrome to [localhost:8000]() to see the app.

  * To build GitHub Page run
```
  $ polymer build
```



## Using

at first you have to setup a service container, providing services for History, Properties, Elements, ....

## Configuring
**Disclaimer**: to configure the app to have other elements than the ones it
already has, you should clone it, build it, and make one of the changes below.
I don't want to add a "anyone should add any element to this exact deployed app"
feature because that invites a database and a bunch of XSS opportunities in the
house, and that's not really the point of this project. That being said, I would
like the steps below to be as easy as possible. ❤️

Also, start all of the sentences below with "In theory, ...". 😅

### Adding another native element

Add another entry to the `elements-native.json` file. If this is a weird
native element, you might have to do some code changes:
  - if it doesn't have a closing tag (like `<input>` or `<img>`), update `dumpElementEndTag`
  in `code-view.html`
  - if it doesn't have a "slot", i.e. you shouldn't be able to drop children
  in it (like `<input>`), you need to make 1 change each in `app-shell.html`.
  `designer-view.html` (just search for `input`, you'll find it.).
  Yes I should probably make this only exist in one place, but you know what,
  communicating between siblings is hard.

### Adding another custom element

Add the element you want to the `devDependencies` section of this
project's `package.json` file, then run `npm install`. This element needs
to use HTML Imports for it to work. If the import isn't of the form
`element-name/element-name.html`, you'll have to hand craft `dumpImports()` in
`code-view.html`.

### Adding another sample

Add the name of the sample in `elements-samples.json`, and create a file in the
`samples` directory with the same name. This file should contain a `<template>`,
and in the template the contents of your new sample. Note that this template
obviously has no shadow DOM (unless you add just a custom element), so if in it
you add a `<style> div {color: red}</style>`, this will, of course, style
all the divs in the app, and you'll have a hard time removing that code :(

### Adding a new theme
To reskin the app, you need to define a set of custom properties. Check the `retheme`
method in `app.js` for the list. Or see it in [action](https://polymerlabs.github.io/wizzywid/#tufte).
