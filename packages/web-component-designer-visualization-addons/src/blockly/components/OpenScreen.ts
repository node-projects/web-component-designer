//@ts-ignore
Blockly.Blocks['open_screen'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('open screen');

        this.appendValueInput('SCREEN')
            .setCheck('String')
            .appendField('screen');

        this.appendValueInput('RELATIVESIGNALSPATH')
            .setCheck("String")
            .appendField('relativeSignalsPath');


        this.appendValueInput('NOHISTORY')
            .setCheck("Boolean")
            .appendField('noHistory');

        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['open_screen'] = function (block) {
    //@ts-ignore
    const screen = Blockly.JavaScript.valueToCode(block, 'SCREEN', Blockly.JavaScript.ORDER_ATOMIC);
    //@ts-ignore
    const relativeSignalsPath = Blockly.JavaScript.valueToCode(block, 'RELATIVESIGNALSPATH', Blockly.JavaScript.ORDER_ATOMIC);
    //@ts-ignore
    const noHistory = Blockly.JavaScript.valueToCode(block, 'NOHISTORY', Blockly.JavaScript.ORDER_ATOMIC);
    let code = `RUNTIME.openScreen({screen: ${screen}, relativeSignalsPath: ${relativeSignalsPath}, noHistory: ${noHistory}})`;

    return code;
};