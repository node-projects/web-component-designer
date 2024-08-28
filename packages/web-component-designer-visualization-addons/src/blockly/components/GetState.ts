//@ts-ignore
Blockly.Blocks['get_state'] = {
    init: function () {
        this.appendValueInput('OID')
            .setCheck("String")
            //@ts-ignore
            .appendField('get_state');

        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript.forBlock['get_state'] = function (block, generator) {
    //@ts-ignore
    const id = Blockly.JavaScript.valueToCode(block, 'OID', Blockly.JavaScript.ORDER_ATOMIC);
    const code = `(await visualizationHandler.getState((${id}[0] === '.' ? relativeSignalsPath : '') + ${id})).val`;
    //@ts-ignore
    return [code, Blockly.JavaScript.ORDER_NONE];
};