export enum BindingTarget {
    /** Bindings for example starting with . to explicitly target a property */
    explicitProperty = 'explicitProperty',
    property = 'property',
    attribute = 'attribute',
    class = 'class',
    css = 'css',
    cssvar = 'cssvar',
    event = 'event',
    content = 'content', //innertext or html... mhmmm,
    visible = 'visible'
}