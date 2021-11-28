export enum CommandType {
  'copy' = 'copy',
  'paste' = 'paste',
  'cut' = 'cut',
  'delete' = 'delete',
  'undo' = 'undo',
  'redo' = 'redo',

  'selectAll' = 'selectAll',

  'moveToFront' = 'moveToFront',
  'moveForward' = 'moveForward',
  'moveBackward' = 'moveBackward',
  'moveToBack' = 'moveToBack',

  'arrangeLeft' = 'arrangeLeft',
  'arrangeCenter' = 'arrangeCenter',
  'arrangeRight' = 'arrangeRight',
  'arrangeTop' = 'arrangeTop',
  'arrangeMiddle' = 'arrangeMiddle',
  'arrangeBottom' = 'arrangeBottom',

  'unifyWidth' = 'unifyWidth',
  'unifyHeight' = 'unifyHeight',

  'distributeHorizontal' = 'distributeHorizontaly',
  'distributeVertical' = 'distributeVertical',

  'setTool' = 'setTool',
  'screenshot' = 'screenshot',
}