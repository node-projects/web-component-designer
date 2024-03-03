//@ts-ignore
Blockly.Blocks['return'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("return");
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("value");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['return'] = function (block) {
    //@ts-ignore
    const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
    let code = 'return ' + value + ';';
    return code;
};