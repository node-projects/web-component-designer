export async function copyTextToClipboard(text) {
    copyToClipboard([['text/plain', text]]);
}

//used, so you could copy internal if you have no clipboard access
let internalClipboard = null;

export async function copyToClipboard(items: [format: string, data: string][]) {

    if (navigator.clipboard) {
        try {
            let data = [];
            for (let n of items) {
                data.push(new ClipboardItem({ [n[0]]: new Blob([n[1]], { type: n[0] }) }));
            }
            await navigator.clipboard.write(data);
        } catch (err) {
            await navigator.clipboard.writeText(items[0][1]);
            internalClipboard = items[0][1];
        }
        console.info('Copy to clipboard successful');
    } else {
        let activeElement: HTMLElement = <HTMLElement>document.activeElement;
        while (activeElement?.shadowRoot?.activeElement)
            activeElement = <HTMLElement>activeElement.shadowRoot.activeElement;

        internalClipboard = items[0][1];

        const textArea = document.createElement('textarea');
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.value = items[0][1];
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error(err);
            }
        }
        document.body.removeChild(textArea);

        activeElement.focus()
    }
}

export async function getTextFromClipboard(): Promise<string> {
    if (navigator.clipboard) {
        return new Promise(async (resolve, reject) => {
            const clipText = await navigator.clipboard.readText();
            resolve(clipText);
        });
    } else {
        return new Promise(async (resolve, reject) => {
            const textArea = document.createElement('textarea');
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('paste');
            let value = textArea.value;
            if (!value)
                value = internalClipboard;
            document.body.removeChild(textArea);
            resolve(value);
        });
    }
}

export async function getFromClipboard() {
    if (navigator.clipboard) {
        return await navigator.clipboard.read();
    } else {
        return null;
    }
}