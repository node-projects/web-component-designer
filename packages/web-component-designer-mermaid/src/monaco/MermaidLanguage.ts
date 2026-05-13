export function addMermaidLanguageToMonaco(monaco?: any) {
    if (!monaco)
        //@ts-ignore
        monaco = window.monaco;

    monaco.languages.register({ id: "mermaidLanguage" });

    monaco.languages.setMonarchTokensProvider("mermaidLanguage", {
        tokenizer: {
            root: [
                [/%%.*$/, "comment"],
                [/\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|mindmap|requirementDiagram|requirement|functionalRequirement|interfaceRequirement|performanceRequirement|physicalRequirement|designConstraint|element)\b/, "keyword"],
                [/[a-zA-Z][\w-]*(?=\s*(\[|\(|--|==|-\.))/, "identifier"],
                [/(-->|---|-.->|-.-|==>|===)/, "operator"],
                [/\|[^|]*\|/, "string"],
            ],
        },
    });

    monaco.editor.defineTheme("mermaidTheme", {
        base: "vs",
        inherit: false,
        rules: [
            { token: "comment", foreground: "008000" },
            { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
            { token: "identifier", foreground: "795E26" },
            { token: "operator", foreground: "AF00DB" },
            { token: "string", foreground: "A31515" },
        ],
        colors: {
            "editor.foreground": "#000000",
        },
    });
}
