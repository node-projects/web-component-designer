import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { ServiceContainer } from '../ServiceContainer.js';
import { IHtmlParserService } from './IHtmlParserService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import type ts from 'typescript'

function* findAllNodesOfKind(node: ts.Node, kind: number) {
  if (node.kind == kind)
    yield node;
  for (const c of node.getChildren())
    yield* findAllNodesOfKind(c, kind);
}

export class BaseCustomWebcomponentParserService implements IHtmlParserService {
  private htmlParser: IHtmlParserService;

  constructor(htmlParser: IHtmlParserService) {
    this.htmlParser = htmlParser;
  }

  async parse(code: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
    const sourceFile = this.parseTypescriptFile(code);

    let htmlCode = "";
    let cssStyle = "";
    const nodes = findAllNodesOfKind(sourceFile, 212);
    for (let nd of nodes) {
      if (nd.tag.escapedText == 'html' && nd.parent.name.escapedText == "template")
        htmlCode = nd.template.rawText;
      if (nd.tag.escapedText == 'css' && nd.parent.name.escapedText == "style")
        cssStyle = nd.template.rawText;
    }

    if (cssStyle)
      instanceServiceContainer.stylesheetService.setStylesheets([{ name: 'css', content: cssStyle }]);

    return this.htmlParser.parse(htmlCode, serviceContainer, instanceServiceContainer, parseSnippet);
  }

  public writeBack(code: string, html: string, css: string, newLineCrLf: boolean): string {
    const sourceFile = this.parseTypescriptFile(code);


    const transformTemplateLiterals = <T extends ts.Node>(context: ts.TransformationContext) =>
      (rootNode: T) => {
        function visit(node: ts.Node): ts.Node {
          //@ts-ignore
          if (ts.isTemplateLiteral(node) &&
            //@ts-ignore
            ts.isTaggedTemplateExpression(node.parent) &&
            (<any>node.parent.tag).escapedText == 'html' &&
            (<any>node.parent.parent).name.escapedText == "template") {
            //@ts-ignore
            return <ts.Node>ts.factory.createNoSubstitutionTemplateLiteral(html.replaceAll('\n', '\r\n'), html.replaceAll('\n', '\r\n'));
          } else if (css &&
            //@ts-ignore
            ts.isTemplateLiteral(node) &&
            //@ts-ignore
            ts.isTaggedTemplateExpression(node.parent) &&
            (<any>node.parent.tag).escapedText == 'css' &&
            (<any>node.parent.parent).name.escapedText == "style") {
            //@ts-ignore
            return <ts.Node>ts.factory.createNoSubstitutionTemplateLiteral(css.replaceAll('\n', '\r\n'), css.replaceAll('\n', '\r\n'));
          }
          //@ts-ignore
          return ts.visitEachChild(node, visit, context);
        }
        //@ts-ignore
        return ts.visitNode(rootNode, visit);
      };
    //@ts-ignore
    let transformed = ts.transform(sourceFile, [transformTemplateLiterals]).transformed[0];

    //@ts-ignore
    const printer = ts.createPrinter({ newLine: newLineCrLf ? ts.NewLineKind.CarriageReturnLineFeed : ts.NewLineKind.LineFeed });
    //@ts-ignore
    const result = printer.printNode(ts.EmitHint.Unspecified, transformed, transformed);

    return result;
  }

  private parseTypescriptFile(code: string) {
    const compilerHost: ts.CompilerHost = {
      fileExists: () => true,
      getCanonicalFileName: filename => filename,
      getCurrentDirectory: () => '',
      getDefaultLibFileName: () => 'lib.d.ts',
      getNewLine: () => '\n',
      getSourceFile: filename => {
        //@ts-ignore
        return ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
      },
      readFile: () => null,
      useCaseSensitiveFileNames: () => true,
      writeFile: () => null,
    };

    const filename = 'aa.ts';
    //@ts-ignore
    const program = ts.createProgram([filename], {
      noResolve: true,
      //@ts-ignore
      target: ts.ScriptTarget.Latest,
    }, compilerHost);

    const sourceFile = program.getSourceFile(filename);
    return sourceFile;
  }
}