//@ts-ignore
Blockly.Blocks['set_state'] = {
    init: function () {
        this.appendValueInput('OID')
            .setCheck("String")
            //@ts-ignore
            .appendField('set_state');

        this.appendValueInput('VALUE')
            .setCheck(null)
            .appendField('with');

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['set_state'] = function (block) {
    //@ts-ignore
    const id = Blockly.JavaScript.valueToCode(block, 'OID', Blockly.JavaScript.ORDER_ATOMIC);
    //@ts-ignore
    const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
    const code = `await IOB.setState(${id}, ${value});\n`;

    return code;
};