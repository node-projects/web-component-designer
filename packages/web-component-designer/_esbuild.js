import * as esbuild from 'esbuild';
import { minifyHTMLLiteralsPlugin } from 'esbuild-plugin-minify-html-literals';

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
