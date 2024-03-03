//@ts-ignore
Blockly.Blocks['query_selector_all'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('querySelectorAll')
            //@ts-ignore
            .appendField(new Blockly.FieldDropdown([["currentScreen", "CURRENTSCREEN"], ["parentScreen", "PARENTSCREEN"]]), "SOURCE");

        this.appendValueInput('SELECTOR')
            .setCheck("String")
            //@ts-ignore
            .appendField('selector');

        this.setInputsInline(true);
        this.setOutput(true, 'Array');
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['query_selector_all'] = function (block, generator) {
    var dropdown_source = block.getFieldValue('SOURCE');
    //@ts-ignore
    const selector = Blockly.JavaScript.valueToCode(block, 'SELECTOR', Blockly.JavaScript.ORDER_ATOMIC);

    let code;
    if (dropdown_source === 'CURRENTSCREEN')
        code = `shadowRoot.querySelectorall(${selector})`;
    else if (dropdown_source === 'PARENTSCREEN')
        code = `shadowRoot.querySelectorall(${selector})`;
    //@ts-ignore
    return [code, Blockly.JavaScript.ORDER_NONE];
};