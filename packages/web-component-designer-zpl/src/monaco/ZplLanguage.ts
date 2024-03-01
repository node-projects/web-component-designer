export function addZplLanguageToMonaco(monaco?: any) {
    if (!monaco)
        //@ts-ignore
        monaco = window.monaco;
    //@ts-ignore
    monaco.languages.register({ id: "zplLanguage" });

    //@ts-ignore
    monaco.languages.setMonarchTokensProvider("zplLanguage", {
        tokenizer: {
            root: [
                // lookbehind seems not to work - [/(?<=\^FD)[^\^]*/, "text"],
                [/\^FX[^\^]*/, "comment"],
                [/\^FD[^\^]*/, "text"],
                [/\^../, "command"],
            ],
        },
    });

    //@ts-ignore
    monaco.editor.defineTheme("zplTheme", {
        base: "vs",
        inherit: false,
        rules: [
            { token: "text", foreground: "999999" },
            { token: "comment", foreground: "008000" },
            { token: "command", foreground: "0000FF", fontStyle: "bold" },
        ],
        colors: {
            "editor.foreground": "#000000",
        },
    })
}