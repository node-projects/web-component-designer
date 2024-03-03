//@ts-ignore
Blockly.Blocks['console'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('console')
            //@ts-ignore
            .appendField(new Blockly.FieldDropdown([["debug", "DEBUG"], ["error", "ERROR"], ["info", "INFO"], ["log", "LOG"], ["warn", "WARN"]]), "LEVEL");

        this.appendValueInput('VALUE')
            .setCheck(null)
            .appendField('value');

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['console'] = function (block) {
    var level = block.getFieldValue('LEVEL');
    //@ts-ignore
    const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
    let code = `console['${(<string>level).toLowerCase()}'](${value});
`;
    return code;
};