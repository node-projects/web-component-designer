export default
    {
        "styles": {
            "color": {
                "type": "color"
            },
            "background-color": {
                "type": "color"
            },
            "box-sizing": {
                "type": "list",
                "values": [
                    "border-box",
                    "content-box"
                ]
            },
            "border": {
                "type": "string",
                "default": "0px none rbg(0,0,0)"
            },
            "box-shadow": {
                "type": "string",
                "default": "none"
            },
            "opacity": {
                "type": "number",
                "min": 0,
                "max": 0
            },
            "padding": {
                "type": "thickness"
            },
            "margin": {
                "type": "thickness"
            },
            "position": {
                "type": "list",
                "values": [
                    "static",
                    "relative",
                    "absolute"
                ]
            },
            "left": {
                "type": "css-length"
            },
            "top": {
                "type": "css-length"
            },
            "right": {
                "type": "css-length"
            },
            "bottom": {
                "type": "css-length"
            },
            "width": {
                "type": "css-length"
            },
            "height": {
                "type": "css-length"
            }
        },
        "flex": {
            "position": {
                "type": "list",
                "values": [
                    "static",
                    "relative",
                    "absolute"
                ]
            },
            "display": {
                "type": "list",
                "values": [
                    "block",
                    "inline-block",
                    "flex",
                    "contents",
                    "grid",
                    "inherit",
                    "initial",
                    "none"
                ]
            },
            "flex-direction": {
                "type": "list",
                "values": [
                    "row",
                    "row-reverse",
                    "column",
                    "column-reverse"
                ]
            },
            "flex-wrap": {
                "type": "list",
                "values": [
                    "nowrap",
                    "wrap",
                    "warp-reverse"
                ]
            },
            "justify-self": {
                "type": "list",
                "values": [
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around"
                ]
            },
            "justify-items": {
                "type": "list",
                "values": [
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around"
                ]
            },
            "justify-content": {
                "type": "list",
                "values": [
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around"
                ]
            },
            "align-self": {
                "type": "list",
                "values": [
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around"
                ]
            },
            "align-items": {
                "type": "list",
                "values": [
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around"
                ]
            },
            "align-content": {
                "type": "list",
                "values": [
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around"
                ]
            },
            "flex": {
                "type": "string",
                "default": "0 1 auto"
            }
        }
    }