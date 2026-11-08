/** @jest-environment jsdom */
import { beforeAll, expect, jest, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { PropertyType } from '../src/elements/services/propertiesService/PropertyType';
import { ValueType } from '../src/elements/services/propertiesService/ValueType';
import { getCssNumericEditorConfig, isUnitPropertyType } from '../src/elements/services/propertiesService/propertyEditors/UnitPropertyEditorConfig';

const properties: Record<string, { type: string, syntax: string, values?: string[] }> = JSON.parse(readFileSync(new URL('../src/elements/services/propertiesService/services/CssProperties.json', import.meta.url), 'utf8'));
let editors: import('../src/elements/services/propertiesService/DefaultPropertyEditorTypesService').DefaultPropertyEditorTypesService;

beforeAll(async () => {
    CSSStyleSheet.prototype.replaceSync = function () { };
    const { DefaultPropertyEditorTypesService } = await import('../src/elements/services/propertiesService/DefaultPropertyEditorTypesService');
    editors = new DefaultPropertyEditorTypesService();
});

test('every CSS definition has syntax and a supported editor type', () => {
    for (const [name, metadata] of Object.entries(properties)) {
        expect(metadata.syntax).toBeTruthy();
        expect(isUnitPropertyType('css-' + metadata.type) || ['color', 'font', 'list', 'position', 'string'].includes(metadata.type)).toBe(true);
        if (metadata.type === 'list')
            expect(metadata.values?.length).toBeGreaterThan(0);
        expect(name).not.toContain('-');
    }
});

test.each(['borderShape', 'textFit', 'rowRule', 'rowRuleBreak', 'ruleOverlap', 'animationTrigger', 'timelineTrigger', 'anchorName', 'positionArea', 'viewTransitionName', 'maskImage'])('includes missing and 2026 property %s', name => {
    expect(properties[name]?.syntax).toBeTruthy();
});

test('alignment suggestions contain full valid values', () => {
    expect(properties.alignItems.values).toContain('safe center');
    expect(properties.alignSelf.values).toContain('auto');
    expect(properties.alignItems.values).not.toContain('safe');
    expect(properties.alignItems.values).not.toContain('space-between');
    expect(properties.objectPosition.values).toContain('center');
});

test('the CSS service exposes new names and routes known and custom properties', async () => {
    const { CssPropertiesService } = await import('../src/elements/services/propertiesService/services/CssPropertiesService');
    const service = new CssPropertiesService('layout');
    expect(service.getPropertyNameSuggestions([])).toContain('row-rule');
    expect((await service.getProperty(null, 'width')).type).toBe('css-length');
    expect((await service.getProperty(null, 'flex-grow')).type).toBe('css-number');
    expect((await service.getProperty(null, 'z-index')).type).toBe('css-integer');
    expect((await service.getProperty(null, '--custom')).type).toBe('string');
});

test.each([
    ['flexGrow', ['']],
    ['zIndex', ['']],
    ['ascentOverride', ['%']],
    ['opacity', ['', '%']],
    ['animationDuration', ['ms', 's']],
    ['imageResolution', ['dpi', 'dpcm', 'dppx', 'x']]
])('uses numeric CSS editors for %s and preserves expressions', (name: string, units: string[]) => {
    const property = { name, type: 'css-' + properties[name].type, values: properties[name].values, service: {} as any, propertyType: PropertyType.cssValue };
    const editor = editors.getEditorForProperty(property);
    expect(editor.element.querySelector('node-projects-numeric-style-input')).not.toBeNull();
    expect(getCssNumericEditorConfig(property)?.units).toEqual(units);
    editor.refreshValue(ValueType.all, 'var(--value) !important');
    expect((editor.element.firstElementChild as any).value).toBe('var(--value)');
    expect(getCssNumericEditorConfig(property)?.fixedValues).toContain('revert-layer');
});

test('CSS keyword suggestions allow custom values and preserve important when edited', async () => {
    const setValue = jest.fn(async () => { });
    const editor = editors.getEditorForProperty({
        name: 'display', type: 'css-list', values: properties.display.values,
        propertyType: PropertyType.cssValue, service: { setValue } as any
    });
    editor.designItemsChanged([{ openGroup: () => ({ commit() { } }) } as any]);
    editor.refreshValue(ValueType.all, 'var(--display) !important');
    const input = editor.element.querySelector('input');
    expect(input.type).toBe('text');
    expect(input.value).toBe('var(--display)');
    expect(Array.from(input.querySelectorAll('option'), option => option.value)).toContain('grid');
    input.value = 'inline grid';
    input.dispatchEvent(new Event('change'));
    expect(setValue).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'inline grid !important');
});
