export enum PropertyType {
    property = 'property',
    attribute = 'attribute',
    propertyAndAttribute = 'propertyAndAttribute',
    cssValue = 'cssvalue',

    complex = 'complex', // editor is special and could write multiple properties
    add = 'add' // editor allows to add a new one
}