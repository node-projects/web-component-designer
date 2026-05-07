DefaultHtmlParserService cannot read original source ranges from DOMParser nodes.
After full parses, run the HTML writer with `updatePositions=true` on the created
design items so attribute/source-part navigation works immediately from the
normalized designer HTML, matching what code view receives after switching back.
