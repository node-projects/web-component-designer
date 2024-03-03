//@ts-ignore
Blockly.defineBlocksWithJsonArray([
    {
        'type': 'start_event',
        'message0': 'Event %1',
        'nextStatement': null,
        'style': 'hat_blocks',
        'args0': [
            {
              'type': 'field_variable',
              'name': 'EVENTVAR',
              'variable': 'event'
            }
          ],
    },
]);

//@ts-ignore
Blockly.JavaScript['start_event'] = function (block) {
    //@ts-ignore
    let name = Blockly.JavaScript.getVariableName(block.getField('EVENTVAR').variable.name);
    return name + ' = ' + 'eventData;\n';
};
