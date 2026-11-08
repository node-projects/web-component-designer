// Run from any directory: node packages/web-component-designer/scripts/update-css-properties.mjs
// MDN data is CC0; Webref extracts CSSWG specifications. Reviewed 2026-11-08.
// Pin sources so regeneration is reproducible; update revisions when reviewing new CSS.
import { readFile, writeFile } from 'node:fs/promises';
import { definitionSyntax } from 'css-tree';

const mdnRevision = 'fc60c55f5018ea399516a84ea2c64adf7731da82';
const webrefRevision = 'db43edf2a7c1e0dd1cd2fc9162aea845347edd1d';
const target = new URL('../src/elements/services/propertiesService/services/CssProperties.json', import.meta.url);
async function readSource(url) {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`${response.status}: ${url}`);
    return response.json();
}

const [properties, syntaxes, atRules, gaps] = await Promise.all([
    ...['properties', 'syntaxes', 'at-rules'].map(name => readSource(`https://raw.githubusercontent.com/mdn/data/${mdnRevision}/css/${name}.json`)),
    readSource(`https://raw.githubusercontent.com/w3c/webref/${webrefRevision}/ed/css/css-gaps.json`)
]);

// Gap decorations shipped in 2026 but are not yet covered by MDN's property data.
for (const property of gaps.properties) {
    if (property.value)
        properties[property.name] = { syntax: property.value };
}
const descriptors = Object.assign({}, ...Object.values(atRules).map(rule => rule.descriptors));
const legacySyntaxes = {
    'app-region': 'drag | no-drag',
    'background-repeat-x': 'repeat | no-repeat | space | round',
    'background-repeat-y': 'repeat | no-repeat | space | round',
    'buffered-rendering': 'auto | dynamic | static',
    'color-interpolation': 'auto | sRGB | linearRGB',
    'color-rendering': 'auto | optimizeSpeed | optimizeQuality',
    'speak': 'normal | none | spell-out'
};
const primitiveTypes = {
    'length': 'length', 'length-percentage': 'length',
    'percentage': 'percentage', 'number': 'number', 'integer': 'integer',
    'number-percentage': 'scale', 'opacity-value': 'scale',
    'angle': 'angle', 'time': 'time', 'frequency': 'frequency',
    'resolution': 'resolution', 'flex': 'flex', 'color': 'color', 'paint': 'color', 'position': 'position'
};

function combine(parts, separator = ' ') {
    return parts.reduce((result, values) => result.flatMap(left => values.map(right => [left, right].filter(Boolean).join(separator))).slice(0, 128), ['']);
}

// Numeric editors also accept expressions and repeated values as raw text.
// Mixed shorthands stay text. Suggestions are complete values, not grammar tokens.
function describe(node, seen = new Set()) {
    if (node.type === 'Keyword')
        return { types: [], values: [node.name] };
    if (node.type === 'Function' || (node.type === 'Type' && node.name.endsWith('()')))
        return { types: ['function'], values: [] };
    if (node.type === 'Type' || node.type === 'Property') {
        if (node.type === 'Type' && primitiveTypes[node.name])
            return {
                types: [primitiveTypes[node.name]],
                values: node.name === 'position' ? ['left top', 'center top', 'right top', 'left center', 'center', 'right center', 'left bottom', 'center bottom', 'right bottom'] : []
            };
        const key = `${node.type}:${node.name}`;
        const syntax = (node.type === 'Property' ? properties : syntaxes)[node.name]?.syntax;
        if (syntax && !seen.has(key))
            return describe(definitionSyntax.parse(syntax), new Set([...seen, key]));
        return { types: ['string'], values: [] };
    }
    if (node.type === 'Multiplier') {
        const result = describe(node.term, seen);
        return {
            types: node.max === 1 || result.types.some(type => !['string', 'color', 'position', 'function'].includes(type)) ? result.types : ['string'],
            values: node.min === 0 ? ['', ...result.values] : result.values
        };
    }
    if (node.type === 'Group') {
        const parts = node.terms.map(term => describe(term, seen));
        if (parts.length === 1)
            return parts[0];
        if (node.combinator === '|')
            return { types: parts.flatMap(part => part.types), values: parts.flatMap(part => part.values) };
        if (parts.some(part => part.types.includes('function')))
            return { types: ['function'], values: [] };
        // The canonical order is sufficient for suggestions, even where other
        // permutations are accepted by && and ||.
        const values = combine(parts.map(part => part.values));
        if (node.combinator === '||')
            values.push(...parts.flatMap(part => part.values));
        return { types: parts.some(part => part.types.length) ? ['string'] : [], values };
    }
    return { types: ['string'], values: [] };
}

const previous = JSON.parse(await readFile(target, 'utf8'));
const names = new Set(Object.keys(previous));
for (const [name, property] of Object.entries(properties)) {
    if (!name.startsWith('-') && property.status !== 'obsolete' && property.status !== 'nonstandard')
        names.add(name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));
}

const result = {};
for (const name of [...names].sort()) {
    const cssName = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const syntax = properties[cssName]?.syntax ?? descriptors[cssName]?.syntax ?? legacySyntaxes[cssName];
    let metadata = { type: 'string' };
    if (syntax) {
        const info = describe(definitionSyntax.parse(syntax));
        const types = [...new Set(info.types.filter(type => type !== 'function'))];
        let type = types.length === 0 ? 'list' : types.length === 1 ? types[0] : 'string';
        if (types.length === 2 && types.includes('number') && types.includes('percentage'))
            type = 'scale';
        if (types.length === 2 && types.includes('length') && types.includes('percentage'))
            type = 'length';
        if (types.includes('length') && types.every(type => ['length', 'number', 'percentage'].includes(type)))
            type = 'length';
        if (types.length === 0 && info.types.includes('function'))
            type = 'string';
        const values = [...new Set(info.values.filter(Boolean))];
        metadata = { type, syntax };
        if (values.length)
            metadata.values = values;
    }
    if (name === 'fontFamily')
        metadata.type = 'font';
    if (name === 'rotate' || name === 'offsetRotate')
        metadata.type = 'angle';
    if (name === 'zoom')
        metadata.type = 'scale';
    if (name === 'imageResolution')
        metadata.type = 'resolution';
    result[name] = metadata;
}

await writeFile(target, JSON.stringify(result, null, 4) + '\n');
console.log(`Wrote ${Object.keys(result).length} CSS property definitions.`);
