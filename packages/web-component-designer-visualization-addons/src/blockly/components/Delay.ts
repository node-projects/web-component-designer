//@ts-ignore
Blockly.Blocks['delay'] = {
    init: function () {
        this.appendValueInput('DELAY')
            .setCheck("Number")
            .appendField('delay');

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript.forBlock['delay'] = function (block) {
    //@ts-ignore
    const delay = Blockly.JavaScript.valueToCode(block, 'DELAY', Blockly.JavaScript.ORDER_ATOMIC);
    let code = 'await delay(' + delay + ');\n';
    return code;
};