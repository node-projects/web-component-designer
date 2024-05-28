//@ts-ignore
Blockly.Blocks['get_parameter'] = {
    init: function () {
        this.appendValueInput('NAME')
            .setCheck("String")
            //@ts-ignore
            .appendField('get_parameter');

        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript.forBlock['get_parameter'] = function (block, generator) {
    //@ts-ignore
    const name = Blockly.JavaScript.valueToCode(block, 'NAME', Blockly.JavaScript.ORDER_ATOMIC);
    const code = `context.parameters[${name}]`;
    //@ts-ignore
    return [code, Blockly.JavaScript.ORDER_NONE];
};