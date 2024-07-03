## Similar Frameworks

| Name                    | Licence  | Edit Source | Split View | Zooming | Resize Transformed | No Iframe | Iframe | Iframe isolation | Modifies Dom | Multiplayer | URL                                    |
|-------------------------|----------|-------------|------------|---------|--------------------| ----------|--------|------------------|--------------|-------------|----------------------------------------|
| web-component-designer  | MIT      | yes         | yes        | yes     | yes                | yes       | yes    | allow-same-origin| no           | yes no          |                                        |
| GrapeJS                 | BSD-3    | yes         | no         | no      | broken             | no        | yes    | no               | yes          | no          | https://grapesjs.com/                  |
| CraftJS                 | MIT      | no          | no         | no      |                    | no        | yes    | no               | yes          | no          | https://craft.js.org/                  |
| raisins                 | MIT      | -           | no         | no      |                    | no        | yes    | yes              | yes          | no          | https://github.com/saasquatch/raisins  |


### Description
- Zooming          => can zoom Designer Canvas
- No iframe        => can Design in a Shadow Root (No Iframe, all Components already loaded are usable)
- Iframe           => can Design inside of an Iframe
- Iframe Isolation => iframe can be isolated (against XSS attacks)
- Modifies DOM     => inserts it's overlays directly into edited DOM (this could be Bad, when a Component depends on the DOM or css classes collide)
- Multiplayer      => Multiple Users can design a document at the same time