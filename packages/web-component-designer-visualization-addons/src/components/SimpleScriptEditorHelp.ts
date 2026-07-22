import { highlightJson } from "../scripting/JsonSnippetHighlighter.js";

function evt(name: string, json: string): string {
  return `<span class="cs-attr">${name}</span>='${highlightJson(json)}'`;
}

export const simpleScriptEditorHelpHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
:root { --accent: #2c6e9b; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
    width: 100%;
    height: 100%;
    font-family: Segoe UI, Arial, sans-serif;
    font-size: 13px;
    color: #333;
    background: #f0f1f3;
}

.content {
    height: 100%;
    overflow-y: auto;
    padding: 10px 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.intro-banner {
    background: #ffffff;
    border-left: 4px solid var(--accent);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.5;
}

.intro-banner code {
    font-family: Consolas, monospace;
    background: #eef2f6;
    padding: 1px 4px;
    border-radius: 3px;
    color: #2c4a68;
}

.content-section {
    background: #ffffff;
    border-radius: 6px;
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.section-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
    border-bottom: 2px solid var(--accent);
    font-size: 13px;
    font-weight: bold;
    padding-bottom: 4px;
    color: #24405c;
}

.section-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    font-size: 10px;
    font-weight: bold;
    flex-shrink: 0;
}

.section-hint {
    font-size: 11px;
    font-weight: normal;
    color: #808080;
}

.snippet {
    font-family: Consolas, "Courier New", monospace;
    font-size: 11px;
    background: #f6f8fa;
    color: #24292e;
    border: 1px solid #e1e4e8;
    border-radius: 4px;
    padding: 6px 10px;
    white-space: pre;
    overflow-x: auto;
    line-height: 1.5;
}

.cs-attr    { color: #005cc5; }
.cs-key     { color: #22863a; }
.cs-str     { color: #032f62; }
.cs-bool    { color: #d73a49; }
.cs-num     { color: #e36209; }
.cs-comment { color: #6a737d; font-style: italic; }

.note {
    font-size: 11px;
    color: #666;
    font-style: italic;
}
</style>
</head>
<body>
<div class="content">

    <div class="intro-banner">
        Events (<code>@click</code>, <code>@change</code>, ...) run a command chain (a <code>Script</code>).<br>
        General syntax: <code>@event='{"commands":[ {...}, {...} ]}'</code> — commands run top to bottom.
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">1</span> Basic structure <span class="section-hint">commands array, sequential execution</span></div>
        <pre class="snippet">${evt(
          "@click",
          `{"commands":[
  { "type": "SetSignalValue", "signal": ".Some.Signal", "value": true },
  { "type": "SetSignalValue", "signal": ".Some.Other", "value": false }
]}`,
        )}</pre>
        <div class="note">Commands run top to bottom. Some commands (Condition, Label, Goto, Repeat, Exit) can change that flow — see their own descriptions in the "Add Command" dialog.</div>
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">2</span> Dynamic / indirect values <span class="section-hint">IScriptMultiplexValue</span></div>
        <div class="note">Instead of a plain value, most command values can be an object <code>{ "source": ..., "name": ... }</code> that is resolved at runtime.</div>
        <pre class="snippet">${highlightJson('{ "source": "expression", "name": "ctx.event.srcElement.value" }')}  <span class="cs-comment">// js expression, 'ctx' is the context object</span>
${highlightJson('{ "source": "complexString", "name": "prefix-{.Some.Signal}-suffix" }')}  <span class="cs-comment">// signal names in {}</span>
${highlightJson('{ "source": "parameter", "name": "myParam" }')}  <span class="cs-comment">// a parameter handed into the script</span></pre>
        <div class="note">Other sources: signal, property, signalInProperty, event, complexSignal, context, elementProperty. The property grid's "..." button opens an editor for these.</div>
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">3</span> Cyclic events <span class="section-hint">re-triggering timer event</span></div>
        <pre class="snippet">${evt(
          "@cyclic:100",
          `{"commands":[
  { "type": "SetSignalValue", "signal": ".Local.Tick", "value": true }
]}`,
        )}</pre>
        <div class="note">A <code>@cyclic:&lt;ms&gt;</code> event retriggers itself automatically every &lt;ms&gt; milliseconds.</div>
    </div>
</div>
</body>
</html>`;

