//@ts-ignore
Blockly.Blocks['set_element'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('setElement')
            //@ts-ignore
            .appendField(new Blockly.FieldDropdown([["property", "PROPERTY"], ["attribute", "ATTRIBUTE"], ["style", "STYLE"]]), "TARGET");

        this.appendValueInput('ELEMENT')
            .setCheck('Element')
            .appendField('element');

        this.appendValueInput('NAME')
            .setCheck("String")
            .appendField('name');


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
Blockly.JavaScript['set_element'] = function (block) {
    var dropdown_target = block.getFieldValue('TARGET');
    //@ts-ignore
    const element = Blockly.JavaScript.valueToCode(block, 'ELEMENT', Blockly.JavaScript.ORDER_ATOMIC);
    //@ts-ignore
    const name = Blockly.JavaScript.valueToCode(block, 'NAME', Blockly.JavaScript.ORDER_ATOMIC);
    //@ts-ignore
    const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
    let code = '';
    if (dropdown_target === 'PROPERTY') {
        code += element + '[' + name + '] = ' + value + ';\n';
    } else if (dropdown_target === 'ATTRIBUTE') {
        code += element + '.setAttribute(' + name + ', ' + value + ');\n';
    } else if (dropdown_target === 'STYLE') {
        code += element + '.style[' + name + '] = ' + value + ';\n';
    }

    return code;
};