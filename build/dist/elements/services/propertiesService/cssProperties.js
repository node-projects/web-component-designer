export default class default_1 {}
default_1.styles = [{
  name: "color",
  type: "color"
}, {
  name: "background-color",
  type: "color"
}, {
  name: "box-sizing",
  type: "list",
  values: ["border-box", "content-box"]
}, {
  name: "border",
  type: "string",
  default: "0px none rbg(0,0,0)"
}, {
  name: "box-shadow",
  type: "string",
  default: "none"
}, {
  name: "opacity",
  type: "number",
  min: 0,
  max: 0
}, {
  name: "padding",
  type: "thickness"
}, {
  name: "margin",
  type: "thickness"
}, {
  name: "position",
  type: "list",
  values: ["static", "relative", "absolute"]
}, {
  name: "left",
  type: "css-length"
}, {
  name: "top",
  type: "css-length"
}, {
  name: "right",
  type: "css-length"
}, {
  name: "bottom",
  type: "css-length"
}, {
  name: "width",
  type: "css-length"
}, {
  name: "height",
  type: "css-length"
}];
default_1.flex = [{
  name: "position",
  type: "list",
  values: ["static", "relative", "absolute"]
}, {
  name: "display",
  type: "list",
  values: ["block", "inline-block", "flex", "contents", "grid", "inherit", "initial", "none"]
}, {
  name: "flex-direction",
  type: "list",
  values: ["row", "row-reverse", "column", "column-reverse"]
}, {
  name: "flex-wrap",
  type: "list",
  values: ["nowrap", "wrap", "warp-reverse"]
}, {
  name: "justify-self",
  type: "list",
  values: ["flex-start", "center", "flex-end", "space-between", "space-around"]
}, {
  name: "justify-items",
  type: "list",
  values: ["flex-start", "center", "flex-end", "space-between", "space-around"]
}, {
  name: "justify-content",
  type: "list",
  values: ["flex-start", "center", "flex-end", "space-between", "space-around"]
}, {
  name: "align-self",
  type: "list",
  values: ["flex-start", "center", "flex-end", "space-between", "space-around"]
}, {
  name: "align-items",
  type: "list",
  values: ["flex-start", "center", "flex-end", "space-between", "space-around"]
}, {
  name: "align-content",
  type: "list",
  values: ["flex-start", "center", "flex-end", "space-between", "space-around"]
}, {
  name: "flex",
  type: "string",
  default: "0 1 auto"
}];