//@ts-ignore
Blockly.Blocks['query_selector'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('querySelector')
            //@ts-ignore
            .appendField(new Blockly.FieldDropdown([["currentScreen", "CURRENTSCREEN"], ["parentScreen", "PARENTSCREEN"]]), "SOURCE");

        this.appendValueInput('SELECTOR')
            .setCheck("String")
            //@ts-ignore
            .appendField('selector');

        this.setInputsInline(true);
        this.setOutput(true, 'Element');
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['query_selector'] = function (block, generator) {
    var dropdown_source = block.getFieldValue('SOURCE');
    //@ts-ignore
    const selector = Blockly.JavaScript.valueToCode(block, 'SELECTOR', Blockly.JavaScript.ORDER_ATOMIC);

    let code;
    if (dropdown_source === 'CURRENTSCREEN')
        code = `shadowRoot.querySelector(${selector})`;
    else if (dropdown_source === 'PARENTSCREEN')
        code = `shadowRoot.host.getRootNode().querySelector(${selector})`;
    //@ts-ignore
    return [code, Blockly.JavaScript.ORDER_NONE];
};