//@ts-ignore
Blockly.Blocks['get_sub_property'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("getSubProperty");

        this.appendValueInput('OBJECT')
            .setCheck('Object')
            .appendField('object');

        this.appendValueInput('PROPERTYPATH')
            .setCheck("String")
            .appendField('propertypath');

        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['get_sub_property'] = function (block, generator) {
    //@ts-ignore
    const obj = Blockly.JavaScript.valueToCode(block, 'OBJECT', Blockly.JavaScript.ORDER_ATOMIC);
    //@ts-ignore
    const propertypath = Blockly.JavaScript.valueToCode(block, 'PROPERTYPATH', Blockly.JavaScript.ORDER_ATOMIC);
    const code = `extractPart(${obj}, ${propertypath})`;
    //@ts-ignore
    return [code, Blockly.JavaScript.ORDER_NONE];
};