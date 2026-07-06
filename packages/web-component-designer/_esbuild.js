import * as esbuild from 'esbuild';
import { minifyHTMLLiteralsPlugin } from 'esbuild-plugin-minify-html-literals';
import { copyFile } from 'node:fs/promises';

await esbuild.build({
  entryPoints: ['./dist/index-all.js'],
  outfile: './dist/index-min.js',

  bundle: true,
  format: 'esm',
  minify: true,
  sourcemap: true,
  platform: 'neutral',

  external: ['@node-projects/base-custom-webcomponent', './NpmPackageHacks.json'  ],

  plugins: [
    minifyHTMLLiteralsPlugin()
  ]
}).catch(() => process.exit(1));

await Promise.all([
  copyFile('./src/elements/helper/NpmPackageHacks.json', './dist/NpmPackageHacks.json'),
  copyFile('./src/elements/helper/NpmPackageHacks.json', './dist/elements/helper/NpmPackageHacks.json')
]);
