//@ts-ignore
Blockly.Blocks['debugger'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("debugger");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
    }
};

//@ts-ignore
Blockly.JavaScript['debugger'] = function (block) {
    return 'debugger;\n';
};