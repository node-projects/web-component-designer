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

    let htmlCode = "";
    let cssStyle = "";
    const nodes = findAllNodesOfKind(sourceFile, 212);
    for (let nd of nodes) {
      if (nd.tag.escapedText == 'html' && nd.parent.name.escapedText == "template")
        htmlCode = nd.template.rawText;
      if (nd.tag.escapedText == 'css' && nd.parent.name.escapedText == "style")
        cssStyle = nd.template.rawText;
    }

    instanceServiceContainer.stylesheetService.setStylesheets([{ name: 'css', content: cssStyle }]);

    return this.htmlParser.parse(htmlCode, serviceContainer, instanceServiceContainer, parseSnippet);
  }
}