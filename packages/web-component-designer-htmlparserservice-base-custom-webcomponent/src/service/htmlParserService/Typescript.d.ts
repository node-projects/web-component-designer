//import typescript = require("typescript");
//export = typescript;
//export as namespace ts;

import ts = require('typescript');

declare global {
    namespace globalThis {
        export { ts }
    }
}