The node-html-parser parser service must populate designItemDocumentPositionService
source parts during parse, not only element positions. Code-to-design transitions
do not run the writer first, so attribute jumps need parser-generated
`attribute:${name}` and `attribute:${name}/value` source parts immediately after
`parseDesignerHTML`.
