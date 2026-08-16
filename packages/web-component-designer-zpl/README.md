# web-component-designer-zpl

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer-zpl

     npm i @node-projects/web-component-designer-zpl

## Description

This package contains widgets and services which help to create a ZPL designer.

It supports printer-oriented previews for ZPL fonts 0 and A-H, 28 barcode
symbologies rendered with BWIP-JS, property-aware resizing, and preservation of
designer-only objects in ZPL metadata comments.

## Usage

See the ZPL designer sample application.

## Acknowledgements and third-party licenses

Parts of the barcode mappings, preview geometry, resizing behavior, font metrics,
and bundled printer-preview fonts were adapted from
[ZPLab](https://github.com/u8array/ZPLab).
We sincerely thank [u8array](https://github.com/u8array) and the ZPLab project
for making this excellent work available to the community.

If you are looking for a complete standalone ZPL label designer,
[ZPLab](https://zplab.org/) is an excellent choice. This package serves a
different purpose: it provides embeddable components and services for integrating
ZPL label design into another application.

See [THIRD-PARTY-LICENSES.md](./THIRD-PARTY-LICENSES.md) for the complete ZPLab,
BWIP-JS, and font notices. The add-on's original source remains MIT licensed;
third-party components retain their respective licenses.
