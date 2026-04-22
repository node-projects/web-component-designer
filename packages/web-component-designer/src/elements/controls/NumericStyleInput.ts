import { BaseCustomWebComponentConstructorAppend, css, html, TypedEvent } from '@node-projects/base-custom-webcomponent';
import { combineNumericStyleInputValue, formatNumericStyleInputNumber, getNumericStyleInputUnitLabel, normalizeNumericStyleInputOptionValues, parseNumericStyleInputValue, resolveNumericStyleInputSelectedUnit } from './NumericStyleInputValueHelpers.js';

export type { ParsedNumericStyleInputValue } from './NumericStyleInputValueHelpers.js';
export { parseNumericStyleInputValue, formatNumericStyleInputNumber, combineNumericStyleInputValue } from './NumericStyleInputValueHelpers.js';

export type NumericStyleInputValueChangedEventArgs = { newValue?: string, oldValue?: string };
export type NumericStyleInputPreviewFinishedEventArgs = { newValue?: string, oldValue?: string, wasCancelled?: boolean };
export type NumericStyleInputUnitValueConversionArgs = {
  value: number,
  numberText: string,
  rawValue: string,
  fromUnit: string,
  toUnit: string
};

type NumericStyleInputMode = 'unit' | 'fixed' | 'custom';

type NumericStyleInputDisplayState = {
  mode: NumericStyleInputMode,
  inputValue: string,
  inputVisible: boolean,
  inputEnabled: boolean,
  selectValue: string,
  selectedUnit?: string
};

const customOptionValue = '__node-projects-custom-value__';
const dragHandleGlyph = '⋮';
export class NumericStyleInput extends BaseCustomWebComponentConstructorAppend {

  public static override readonly style = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
    }

    #container {
      display: grid;
      gap: 0;
      grid-template-columns: minmax(0, 1fr) auto 16px;
      width: 100%;
      height: 24px;
      align-items: stretch;
    }

    #value-wrapper {
      display: grid;
      grid-template-columns: 14px minmax(0, 1fr);
      min-width: 0;
    }

    #scrubber,
    #input,
    #select,
    #stepper button {
      /* border: 1px solid var(--input-border-color, #596c7a); */
      border: none;
      box-sizing: border-box;
      height: 24px;
      min-height: 24px;
      background: transparent;
      color: inherit;
      font: inherit;
      outline: none;
      box-shadow: none;
    }

    #scrubber,
    #stepper button {
      padding: 0;
      line-height: 1;
    }

    #scrubber {
      border-right: 0;
      cursor: ns-resize;
      font-size: 11px;
      letter-spacing: -1px;
    }

    #input {
      border-left: 0;
      border-right: 0;
      min-width: 0;
      text-align: right;
    }

    #input:focus,
    #select:focus,
    #scrubber:focus,
    #stepper button:focus {
      outline: none;
      box-shadow: none;
      border-color: var(--input-border-color, #596c7a);
    }

    #input[disabled],
    #scrubber[disabled] {
      cursor: default;
    }

    #input[disabled] {
      color: inherit;
      opacity: 1;
      -webkit-text-fill-color: currentColor;
    }

    #select {
      border-left: 0;
      padding: 0 15px 0 2px;
      line-height: 1;
      -webkit-appearance: none;
      appearance: none;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4'%3E%3Cpath d='M0 0l4 4 4-4z' fill='%23999'/%3E%3C/svg%3E") no-repeat right 2px center;
    }

    #measure {
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      font: inherit;
      pointer-events: none;
    }

    #stepper {
      display: grid;
      height: 24px;
      min-height: 24px;
      overflow: hidden;
      grid-template-rows: repeat(2, minmax(0, 1fr));
    }

    #stepper button {
      height: auto;
      min-height: 0;
      width: 16px;
      min-width: 16px;
      font-size: 10px;
    }
  `;

  public static override readonly template = html`
    <div id="container">
      <div id="value-wrapper">
        <button id="scrubber" type="button" aria-label="Drag to change value">${dragHandleGlyph}</button>
        <input id="input" type="text" spellcheck="false">
      </div>
      <select id="select"></select>
      <div id="stepper">
        <button id="increase" type="button" aria-label="Increase value">+</button>
        <button id="decrease" type="button" aria-label="Decrease value">-</button>
      </div>
      <span id="measure"></span>
    </div>
  `;

  private _value = '';
  public get value() {
    return this._value;
  }
  public set value(value) {
    this._setValue(value, false, false);
  }
  public valueChanged = new TypedEvent<NumericStyleInputValueChangedEventArgs>();
  public valuePreviewChanged = new TypedEvent<NumericStyleInputValueChangedEventArgs>();
  public valuePreviewFinished = new TypedEvent<NumericStyleInputPreviewFinishedEventArgs>();

  private _units: string[] = ['px', '%', 'pt'];
  public get units() {
    return [...this._units];
  }
  public set units(value: string[]) {
    this._units = this._normalizeOptionValues(value);
    this._lastNumericUnit = this._units[0] ?? this._lastNumericUnit;
    this._updateValue();
  }

  private _fixedValues: string[] = [];
  public get fixedValues() {
    return [...this._fixedValues];
  }
  public set fixedValues(value: string[]) {
    this._fixedValues = this._normalizeOptionValues(value);
    this._updateValue();
  }

  private _step = 1;
  public get step() {
    return this._step;
  }
  public set step(value: number) {
    this._step = Number.isFinite(value) && value > 0 ? value : 1;
  }

  private _unitSteps: Record<string, number> = {};
  public get unitSteps() {
    return { ...this._unitSteps };
  }
  public set unitSteps(value: Record<string, number>) {
    this._unitSteps = value ?? {};
  }

  private _min: number = null;
  public get min() {
    return this._min;
  }
  public set min(value: number) {
    this._min = Number.isFinite(value) ? value : null;
  }

  private _max: number = null;
  public get max() {
    return this._max;
  }
  public set max(value: number) {
    this._max = Number.isFinite(value) ? value : null;
  }

  private _readOnly = false;
  public get readOnly() {
    return this._readOnly;
  }
  public set readOnly(value: boolean) {
    this._readOnly = value;
    this._applyReadonlyState();
  }

  public get isInPreview(): boolean {
    return this._previewStartValue != null;
  }

  private _allowCustomValue = true;
  public get allowCustomValue() {
    return this._allowCustomValue;
  }
  public set allowCustomValue(value: boolean) {
    this._allowCustomValue = value;
    this._updateValue();
  }

  private _unitValueConverter: (args: NumericStyleInputUnitValueConversionArgs) => string;
  public get unitValueConverter() {
    return this._unitValueConverter;
  }
  public set unitValueConverter(value: (args: NumericStyleInputUnitValueConversionArgs) => string) {
    this._unitValueConverter = value;
  }

  private _input: HTMLInputElement;
  private _select: HTMLSelectElement;
  private _measure: HTMLSpanElement;
  private _scrubberButton: HTMLButtonElement;
  private _increaseButton: HTMLButtonElement;
  private _decreaseButton: HTMLButtonElement;
  private _lastNumericValue = 0;
  private _lastNumericUnit = 'px';
  private _dragPointerId: number = null;
  private _dragStartY = 0;
  private _dragStartNumericValue = 0;
  private _appliedDragSteps = 0;
  private _previewStartValue: string = null;
  private _previewChanged = false;
  private _displayValueLock: string = null;
  private _stepperPointerId: number = null;
  private _stepperDirection = 0;
  private _stepperRepeatTimeout: number = null;
  private _stepperRepeatInterval: number = null;
  private _windowDragPointerMoveHandler = (event: PointerEvent) => this._handleWindowDragPointerMove(event);
  private _windowDragPointerUpHandler = (event: PointerEvent) => this._finishDragInteractionForPointerEvent(event, false);
  private _windowDragPointerCancelHandler = (event: PointerEvent) => this._finishDragInteractionForPointerEvent(event, true);
  private _windowDragBlurHandler = () => this._finishDragInteraction(false);
  private _windowPointerUpHandler = (event: PointerEvent) => this._handleWindowStepperPointerEnd(event);
  private _windowPointerCancelHandler = (event: PointerEvent) => this._handleWindowStepperPointerEnd(event);
  private _windowBlurHandler = () => this._finishStepperInteraction(false);
  private _preferCustomMode = false;

  constructor() {
    super();
    this._restoreCachedInititalValues();
    this._input = this._getDomElement<HTMLInputElement>('input');
    this._select = this._getDomElement<HTMLSelectElement>('select');
    this._measure = this._getDomElement<HTMLSpanElement>('measure');
    this._scrubberButton = this._getDomElement<HTMLButtonElement>('scrubber');
    this._increaseButton = this._getDomElement<HTMLButtonElement>('increase');
    this._decreaseButton = this._getDomElement<HTMLButtonElement>('decrease');
  }

  ready() {
    this._parseAttributesToProperties();
    this._wireEvents();
    this._updateValue();
  }

  private _wireEvents() {
    this._input.addEventListener('change', () => this._applyTypedValue());
    this._input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this._applyTypedValue();
        this._input.blur();
      }
    });

    this._scrubberButton.addEventListener('pointerdown', e => this._handlePointerDown(e));

    this._select.addEventListener('change', () => this._applySelectedMode());
    this._increaseButton.addEventListener('pointerdown', e => this._handleStepperPointerDown(e, 1));
    this._decreaseButton.addEventListener('pointerdown', e => this._handleStepperPointerDown(e, -1));
  }

  private _handlePointerDown(event: PointerEvent) {
    if (this._readOnly)
      return;
    if (!this._isSelectedUnitMode()) {
      if (!this._switchToUnitModeForInteraction())
        return;
    }
    this._dragPointerId = event.pointerId;
    this._dragStartY = event.clientY;
    this._dragStartNumericValue = this._readEditableNumericValue(this._select.value);
    this._appliedDragSteps = 0;
    this._startPreviewSession();
    this._attachDragWindowListeners();
    try {
      this._scrubberButton.setPointerCapture(event.pointerId);
    } catch {
    }
    event.preventDefault();
  }

  private _handleWindowDragPointerMove(event: PointerEvent) {
    if (this._dragPointerId !== event.pointerId || !this._isSelectedUnitMode())
      return;

    const stepCount = this._calculateDraggedStepCount(this._dragStartY - event.clientY);
    if (stepCount === this._appliedDragSteps)
      return;

    this._appliedDragSteps = stepCount;
    const unit = this._select.value;
    const step = this._getEffectiveStep(unit);
    this._previewNumericValue(this._getInteractiveStepValue(this._dragStartNumericValue, stepCount, step), unit, step);
    event.preventDefault();
  }

  private _finishDragInteractionForPointerEvent(event: PointerEvent, wasCancelled: boolean) {
    if (this._dragPointerId !== event.pointerId)
      return;

    this._finishDragInteraction(wasCancelled, event.pointerId);
  }

  private _finishDragInteraction(wasCancelled: boolean, pointerId?: number) {
    if (this._dragPointerId == null)
      return;

    this._dragPointerId = null;
    this._appliedDragSteps = 0;
    this._detachDragWindowListeners();
    if (pointerId != null) {
      try {
        if (this._scrubberButton.hasPointerCapture(pointerId))
          this._scrubberButton.releasePointerCapture(pointerId);
      } catch {
      }
    }
    this._finishPreviewSession(wasCancelled);
  }

  private _handleStepperPointerDown(event: PointerEvent, direction: number) {
    if (this._readOnly)
      return;
    if (!this._isSelectedUnitMode()) {
      if (!this._switchToUnitModeForInteraction())
        return;
    }

    this._finishStepperInteraction(true);
    this._stepperPointerId = event.pointerId;
    this._stepperDirection = direction;
    this._attachStepperWindowListeners();
    this._startPreviewSession();
    this._applyStepPreview(direction);
    this._stepperRepeatTimeout = window.setTimeout(() => {
      this._stepperRepeatInterval = window.setInterval(() => this._applyStepPreview(this._stepperDirection), 50);
    }, 350);
    event.preventDefault();
  }

  private _handleWindowStepperPointerEnd(event: PointerEvent) {
    if (this._stepperPointerId !== event.pointerId)
      return;

    this._finishStepperInteraction(false);
  }

  private _finishStepperInteraction(wasCancelled: boolean) {
    if (this._stepperPointerId == null)
      return;

    this._stepperPointerId = null;
    this._stepperDirection = 0;
    this._detachStepperWindowListeners();
    this._stopStepperRepeat();
    this._finishPreviewSession(wasCancelled);
  }

  private _applySelectedMode() {
    const selectedOption = this._select.selectedOptions.item(0);
    if (!selectedOption)
      return;

    const selectedKind = selectedOption.dataset['kind'];
    if (selectedKind === 'fixed') {
      this._commitValue(selectedOption.value);
      return;
    }

    if (selectedKind === 'custom') {
      this._preferCustomMode = true;
      this._updateValue();
      requestAnimationFrame(() => {
        this._input.focus();
        this._input.select();
      });
      return;
    }

    const selectedUnit = selectedOption.value;
    this._lastNumericUnit = selectedUnit;
    this._preferCustomMode = false;

    const parsedValue = parseNumericStyleInputValue(this._value);
    if (parsedValue.kind === 'numeric') {
      const convertedValue = this._convertNumericValue(parsedValue, selectedUnit);
      this._commitValue(convertedValue);
      return;
    }

    const resolvedCurrentValue = this._resolveCurrentValueForUnit(selectedUnit);
    if (resolvedCurrentValue != null) {
      this._commitValue(resolvedCurrentValue);
      return;
    }

    if (parsedValue.kind === 'empty') {
      this._updateValue();
      this._input.focus();
      return;
    }

    const typedNumericValue = Number(this._input.value);
    if (!Number.isNaN(typedNumericValue)) {
      this._applyNumericValue(typedNumericValue, selectedUnit);
      return;
    }

    // Switching from a non-numeric value (e.g. unset/inherit) to a unit:
    // clear the value so the unit mode is shown with an empty input
    this._commitValue('');
    this._input.focus();
  }

  private _applyTypedValue() {
    const selectedOption = this._select.selectedOptions.item(0);
    const selectedKind = selectedOption?.dataset['kind'];
    if (selectedKind === 'fixed')
      return;

    if (selectedKind === 'custom') {
      this._commitValue(this._input.value);
      return;
    }

    const numberText = this._input.value?.trim() ?? '';
    if (!numberText) {
      this._commitValue('');
      return;
    }

    const numericValue = Number(numberText);
    if (!Number.isNaN(numericValue))
      this._lastNumericValue = this._clampNumericValue(numericValue);

    this._commitValue(combineNumericStyleInputValue(numberText, selectedOption?.value ?? ''));
  }

  private _updateValue() {
    if (!this._input || !this._select)
      return;

    if (this._previewStartValue == null)
      this._renderSelectOptions();

    const displayState = this._getDisplayState(this._displayValueLock ?? this._value);
    this._input.value = displayState.inputValue;
    this._input.style.display = displayState.inputVisible ? '' : 'none';
    this._input.disabled = this._readOnly || !displayState.inputEnabled;
    this._select.value = displayState.selectValue;
    this._autoSizeSelect();

    if (displayState.mode === 'unit' && displayState.selectedUnit != null)
      this._lastNumericUnit = displayState.selectedUnit;
    if (displayState.mode === 'unit' && displayState.inputValue !== '') {
      const typedNumericValue = Number(displayState.inputValue);
      if (!Number.isNaN(typedNumericValue))
        this._lastNumericValue = this._clampNumericValue(typedNumericValue);
    }

    const hasUnits = this._units.length > 0;
    const interactionDisabled = this._readOnly || (!hasUnits || (displayState.mode === 'custom'));
    this._scrubberButton.disabled = interactionDisabled;
    this._increaseButton.disabled = interactionDisabled;
    this._decreaseButton.disabled = interactionDisabled;
    this._applyReadonlyState();
  }

  private _getDisplayState(value: string): NumericStyleInputDisplayState {
    const parsedValue = parseNumericStyleInputValue(value);
    if (parsedValue.kind === 'numeric') {
      if (this._preferCustomMode)
        return this._createCustomDisplayState(parsedValue.numberText);

      if (parsedValue.unit && this._units.length && !this._units.includes(parsedValue.unit))
        return this._createCustomDisplayState(value);

      const selectedUnit = resolveNumericStyleInputSelectedUnit(parsedValue.unit, this._lastNumericUnit, this._units) ?? '';
      return {
        mode: 'unit',
        inputValue: parsedValue.numberText,
        inputVisible: true,
        inputEnabled: true,
        selectValue: this._units.includes(selectedUnit) ? selectedUnit : (this._select.value || customOptionValue),
        selectedUnit
      };
    }

    if (parsedValue.kind === 'text') {
      if (!this._preferCustomMode && this._fixedValues.includes(parsedValue.text)) {
        return {
          mode: 'fixed',
          inputValue: '',
          inputVisible: true,
          inputEnabled: false,
          selectValue: parsedValue.text
        };
      }
      return this._createCustomDisplayState(parsedValue.text);
    }

    if (this._preferCustomMode)
      return this._createCustomDisplayState('');

    const selectedUnit = this._lastNumericUnit ?? this._units[0] ?? '';
    if (this._units.includes(selectedUnit)) {
      return {
        mode: 'unit',
        inputValue: '',
        inputVisible: true,
        inputEnabled: true,
        selectValue: selectedUnit,
        selectedUnit
      };
    }

    return this._createCustomDisplayState('');
  }

  private _createCustomDisplayState(text: string): NumericStyleInputDisplayState {
    if (!this._allowCustomValue && this._units.length) {
      return {
        mode: 'unit',
        inputValue: text,
        inputVisible: true,
        inputEnabled: true,
        selectValue: this._units[0],
        selectedUnit: this._units[0]
      };
    }

    return {
      mode: 'custom',
      inputValue: text,
      inputVisible: true,
      inputEnabled: true,
      selectValue: customOptionValue
    };
  }

  private _renderSelectOptions() {
    const selectedValue = this._select.value;
    this._select.replaceChildren();

    if (this._units.length) {
      const group = document.createElement('optgroup');
      group.label = 'Units';
      for (const unit of this._units)
        group.appendChild(this._createOption(getNumericStyleInputUnitLabel(unit), unit, 'unit'));
      this._select.appendChild(group);
    }

    if (this._fixedValues.length) {
      const group = document.createElement('optgroup');
      group.label = 'Values';
      for (const fixedValue of this._fixedValues)
        group.appendChild(this._createOption(fixedValue, fixedValue, 'fixed'));
      this._select.appendChild(group);
    }

    if (this._allowCustomValue || this._select.options.length === 0)
      this._select.appendChild(this._createOption('custom', customOptionValue, 'custom'));

    if (selectedValue !== '')
      this._select.value = selectedValue;
    else if (this._select.querySelector('option[value=""]'))
      this._select.value = '';
  }

  private _createOption(label: string, value: string, kind: NumericStyleInputMode): HTMLOptionElement {
    const option = document.createElement('option');
    option.text = label;
    option.value = value;
    option.dataset['kind'] = kind;
    return option;
  }

  private _autoSizeSelect() {
    if (!this._measure || !this._select)
      return;
    const selectedOption = this._select.selectedOptions.item(0);
    this._measure.textContent = selectedOption?.text ?? '';
    const textWidth = this._measure.offsetWidth;
    if (textWidth > 0) {
      // 14px accounts for the custom dropdown arrow + padding
      this._select.style.width = (textWidth + 17) + 'px';
    } else {
      // Element not yet laid out, defer measurement
      requestAnimationFrame(() => this._autoSizeSelect());
    }
  }

  private _applyReadonlyState() {
    if (!this._input || !this._select)
      return;
    this._input.readOnly = this._readOnly;
    this._select.disabled = this._readOnly;
  }

  private _convertNumericValue(parsedValue: { numberText: string, value: number, unit: string }, selectedUnit: string) {
    if (selectedUnit == null)
      return this._value;

    const fromUnit = parsedValue.unit;
    const convertedValue = this._unitValueConverter?.({
      value: parsedValue.value,
      numberText: parsedValue.numberText,
      rawValue: this._value,
      fromUnit,
      toUnit: selectedUnit
    });

    return convertedValue ?? combineNumericStyleInputValue(parsedValue.numberText, selectedUnit);
  }

  private _resolveCurrentValueForUnit(selectedUnit: string) {
    if (selectedUnit == null)
      return null;

    const convertedValue = this._unitValueConverter?.({
      value: Number.NaN,
      numberText: '',
      rawValue: this._value,
      fromUnit: '',
      toUnit: selectedUnit
    })?.trim();

    return convertedValue ? convertedValue : null;
  }

  private _readEditableNumericValue(selectedUnit: string) {
    const parsedValue = parseNumericStyleInputValue(this._value);
    if (parsedValue.kind === 'numeric') {
      const convertedValue = this._convertNumericValue(parsedValue, selectedUnit);
      const convertedParsedValue = parseNumericStyleInputValue(convertedValue);
      if (convertedParsedValue.kind === 'numeric')
        return convertedParsedValue.value;
      return parsedValue.value;
    }

    if (this._input.value?.trim()) {
      const typedNumericValue = Number(this._input.value);
      if (!Number.isNaN(typedNumericValue))
        return typedNumericValue;
    }

    return this._lastNumericValue;
  }

  private _applyNumericValue(value: number, unit: string) {
    this._lastNumericValue = this._clampNumericValue(value);
    this._lastNumericUnit = unit;
    this._commitValue(combineNumericStyleInputValue(formatNumericStyleInputNumber(this._lastNumericValue), unit));
  }

  private _previewNumericValue(value: number, unit: string, step?: number) {
    this._lastNumericValue = this._clampNumericValue(value);
    this._lastNumericUnit = unit;
    const effectiveStep = step ?? this._getEffectiveStep(unit);
    this._setValue(combineNumericStyleInputValue(this._formatInteractiveNumericValue(this._lastNumericValue, effectiveStep), unit), false, true);
  }

  private _commitValue(value: string) {
    this._setValue(value, true, false);
  }

  private _setValue(value: string, emitCommit: boolean, emitPreview: boolean) {
    const normalizedValue = value ?? '';
    if (!emitCommit && !emitPreview && this._previewStartValue != null)
      return;

    const oldValue = this._value;
    this._value = normalizedValue;
    if (emitPreview)
      this._displayValueLock = normalizedValue;
    else if (this._displayValueLock != null) {
      if (normalizedValue === this._displayValueLock || normalizedValue !== oldValue)
        this._displayValueLock = null;
    }
    this._preferCustomMode = false;
    this._updateValue();
    if (oldValue !== normalizedValue) {
      if (emitPreview) {
        this._previewChanged = true;
        this.valuePreviewChanged.emit({ newValue: normalizedValue, oldValue: oldValue });
      }
      if (emitCommit)
        this.valueChanged.emit({ newValue: normalizedValue, oldValue: oldValue });
    }
  }

  private _startPreviewSession() {
    if (this._previewStartValue == null) {
      this._previewStartValue = this._value;
      this._previewChanged = false;
    }
  }

  private _finishPreviewSession(wasCancelled: boolean) {
    if (this._previewStartValue == null)
      return;

    const oldValue = this._previewStartValue;
    const newValue = this._displayValueLock ?? this._value;
    const changed = this._previewChanged && oldValue !== newValue;
    const finalWasCancelled = wasCancelled || !changed;
    this._previewStartValue = null;
    this._previewChanged = false;
    if (finalWasCancelled) {
      this._displayValueLock = null;
      this._value = oldValue;
      this._updateValue();
    } else {
      this._displayValueLock = newValue;
      this._updateValue();
    }
    this.valuePreviewFinished.emit({ newValue, oldValue, wasCancelled: finalWasCancelled });
  }

  private _applyStepPreview(direction: number) {
    const unit = this._select.value;
    const step = this._getEffectiveStep(unit);
    this._previewNumericValue(this._getInteractiveStepValue(this._readEditableNumericValue(unit), direction, step), unit, step);
  }

  private _stopStepperRepeat() {
    if (this._stepperRepeatTimeout != null) {
      window.clearTimeout(this._stepperRepeatTimeout);
      this._stepperRepeatTimeout = null;
    }
    if (this._stepperRepeatInterval != null) {
      window.clearInterval(this._stepperRepeatInterval);
      this._stepperRepeatInterval = null;
    }
  }

  private _attachStepperWindowListeners() {
    window.addEventListener('pointerup', this._windowPointerUpHandler, true);
    window.addEventListener('pointercancel', this._windowPointerCancelHandler, true);
    window.addEventListener('blur', this._windowBlurHandler);
  }

  private _attachDragWindowListeners() {
    window.addEventListener('pointermove', this._windowDragPointerMoveHandler, true);
    window.addEventListener('pointerup', this._windowDragPointerUpHandler, true);
    window.addEventListener('pointercancel', this._windowDragPointerCancelHandler, true);
    window.addEventListener('blur', this._windowDragBlurHandler);
  }

  private _detachStepperWindowListeners() {
    window.removeEventListener('pointerup', this._windowPointerUpHandler, true);
    window.removeEventListener('pointercancel', this._windowPointerCancelHandler, true);
    window.removeEventListener('blur', this._windowBlurHandler);
  }

  private _detachDragWindowListeners() {
    window.removeEventListener('pointermove', this._windowDragPointerMoveHandler, true);
    window.removeEventListener('pointerup', this._windowDragPointerUpHandler, true);
    window.removeEventListener('pointercancel', this._windowDragPointerCancelHandler, true);
    window.removeEventListener('blur', this._windowDragBlurHandler);
  }

  private _calculateDraggedStepCount(pixelDelta: number) {
    const absolutePixels = Math.abs(pixelDelta);
    const fineSteps = Math.min(absolutePixels, 20) / 5;
    const mediumSteps = Math.max(Math.min(absolutePixels - 20, 40), 0) / 3;
    const coarseSteps = Math.max(absolutePixels - 60, 0) / 2;
    const stepCount = Math.trunc(fineSteps + mediumSteps + coarseSteps);
    return Math.sign(pixelDelta) * stepCount;
  }

  private _getEffectiveStep(unit?: string): number {
    if (unit) {
      const unitStep = this._unitSteps[unit];
      if (Number.isFinite(unitStep) && unitStep > 0)
        return unitStep;
    }
    return this._step;
  }

  private _getInteractiveStepValue(value: number, stepCount: number, step?: number) {
    const effectiveStep = step ?? this._step;
    const clampedValue = this._clampNumericValue(value);
    if (!Number.isFinite(clampedValue) || !Number.isFinite(stepCount) || stepCount === 0)
      return clampedValue;

    const stepBase = this._min ?? 0;
    const quotient = (clampedValue - stepBase) / effectiveStep;
    const roundedQuotient = Math.round(quotient);
    const isAligned = Math.abs(quotient - roundedQuotient) < 1e-9;

    let targetIndex: number;
    if (stepCount > 0) {
      const firstIndex = isAligned ? roundedQuotient + 1 : Math.ceil(quotient);
      targetIndex = firstIndex + stepCount - 1;
    } else {
      const firstIndex = isAligned ? roundedQuotient - 1 : Math.floor(quotient);
      targetIndex = firstIndex + stepCount + 1;
    }

    const targetValue = stepBase + (targetIndex * effectiveStep);
    return this._clampNumericValue(this._roundToStepPrecision(targetValue, effectiveStep));
  }

  private _formatInteractiveNumericValue(value: number, step?: number) {
    const effectiveStep = step ?? this._step;
    return formatNumericStyleInputNumber(this._roundToStepPrecision(value, effectiveStep), this._getStepPrecision(effectiveStep));
  }

  private _roundToStepPrecision(value: number, step?: number) {
    const precision = this._getStepPrecision(step);
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }

  private _getStepPrecision(step?: number) {
    const stepText = `${step ?? this._step}`.toLowerCase();
    if (stepText.includes('e-')) {
      const [coefficientText, exponentText] = stepText.split('e-');
      const exponent = Number(exponentText);
      const decimalPartLength = coefficientText.includes('.') ? coefficientText.length - coefficientText.indexOf('.') - 1 : 0;
      return exponent + decimalPartLength;
    }

    const decimalIndex = stepText.indexOf('.');
    return decimalIndex >= 0 ? stepText.length - decimalIndex - 1 : 0;
  }

  private _switchToUnitModeForInteraction(): boolean {
    const targetUnit = this._lastNumericUnit ?? this._units[0];
    if (targetUnit == null)
      return false;

    this._preferCustomMode = false;

    const resolved = this._resolveCurrentValueForUnit(targetUnit);
    if (resolved != null) {
      this._commitValue(resolved);
      return this._isSelectedUnitMode();
    }

    this._applyNumericValue(this._lastNumericValue, targetUnit);
    return this._isSelectedUnitMode();
  }

  private _isSelectedUnitMode() {
    return this._select.selectedOptions.item(0)?.dataset['kind'] === 'unit';
  }

  private _normalizeOptionValues(values: string[]) {
    return normalizeNumericStyleInputOptionValues(values);
  }

  private _clampNumericValue(value: number) {
    let result = value;
    if (this._min != null)
      result = Math.max(this._min, result);
    if (this._max != null)
      result = Math.min(this._max, result);
    return result;
  }
}

customElements.define('node-projects-numeric-style-input', NumericStyleInput);