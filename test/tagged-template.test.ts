import { expect, test } from '@jest/globals'
import { parseModule, Syntax } from 'esprima-next'
import { parse } from 'node-html-parser'
import { Module, MethodDefinition, ExportNamedDeclaration, ClassDeclaration, ClassBody, Identifier, FunctionExpression, BlockStatement, ReturnStatement, TaggedTemplateExpression, TemplateLiteral } from 'esprima-next/dist/esm/esprima';

test('tagged template test', () => {
  let code = `export class MyElement extends LitElement {
        render() {
          return html\`
            <h1>Hello, \${this.name}!</h1>
            <button @click=\${this._onClick}>
              Click Count: \${this.count}
            </button>
            <slot></slot>
          \`;
        }
      }`;

  const parsed = parseModule(code);
  const tt: TemplateLiteral = getTaggedTemplate(parsed);

  for (let q of tt.quasis) {
    let h = parse(q.value.raw);
    expect(h).not.toBe(null);
  }
});

function getTaggedTemplate(ast: { type: string }) {
  switch (ast.type) {
    case Syntax.Program: {
      for (let sli of (<Module>ast).body) {
        let p = getTaggedTemplate(sli);
        if (p)
          return p;
      }
      return null;
    }
    case Syntax.ExportNamedDeclaration:
      return getTaggedTemplate((<ExportNamedDeclaration>ast).declaration);
    case Syntax.ClassDeclaration:
      return getTaggedTemplate((<ClassDeclaration>ast).body);
    case Syntax.ClassBody:
      for (let mth of (<ClassBody>ast).body) {
        if (mth.type == Syntax.MethodDefinition) {
          let mthd = <MethodDefinition>mth;
          if (mthd.key.type == Syntax.Identifier && (<Identifier>mthd.key).name == "render") {
            return getTaggedTemplate(mthd.value);
          }
        }

      }
      return null;

    case Syntax.FunctionExpression:
      return getTaggedTemplate((<FunctionExpression>ast).body);
    case Syntax.BlockStatement:
      return getTaggedTemplate((<BlockStatement>ast).body[0]);
    case Syntax.ReturnStatement:
      return getTaggedTemplate((<ReturnStatement>ast).argument);
    case Syntax.TaggedTemplateExpression:
      return (<TaggedTemplateExpression>ast).quasi;
  }
  return null;
}
