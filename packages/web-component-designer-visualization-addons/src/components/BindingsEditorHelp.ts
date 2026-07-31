export const bindingsEditorHelpHtml = `<!DOCTYPE html>
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
    line-height: 1.6;
}

.ref-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.ref-table th {
    text-align: left;
    font-weight: 600;
    color: #24405c;
    border-bottom: 1px solid #d0d7de;
    padding: 4px 6px;
}

.ref-table td {
    padding: 3px 6px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
}

.ref-table tr:last-child td { border-bottom: none; }

.ref-table td:first-child {
    font-family: Consolas, monospace;
    color: #005cc5;
    white-space: nowrap;
    width: 110px;
}

.note {
    font-size: 11px;
    color: #666;
    font-style: italic;
}

code {
    font-family: Consolas, monospace;
    background: #eef2f6;
    padding: 1px 4px;
    border-radius: 3px;
    color: #2c4a68;
    font-size: 11px;
}
</style>
</head>
<body>
<div class="content">

    <div class="intro-banner">
        A <strong>Binding</strong> connects one or more signals to a property of an element.<br>
        An optional <strong>formula</strong> transforms the signal values before they are applied.
        A <strong>converter</strong> maps the final value to a display value.
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">1</span> Signals (Objects) <span class="section-hint">what data to read</span></div>
        <div class="note" style="margin-bottom:2px;">Each row adds one signal. The <em>name</em> column sets the variable name used in the formula.</div>
        <pre class="snippet"><span style="color:#6a737d;font-style:italic">// name column empty → variable is __0, __1, __2 … (positional)</span>
<span style="color:#6a737d;font-style:italic">// name column filled → variable uses that name in the formula</span>

<span style="color:#005cc5">name</span>: mySpeed   <span style="color:#005cc5">signal</span>: .Drive.Speed   → accessible as  mySpeed
<span style="color:#005cc5">name</span>: (empty)   <span style="color:#005cc5">signal</span>: .Drive.Active  → accessible as  __1  (second row)</pre>
        <div class="note">Multiple signals let you combine values in a formula, e.g. <code>__0 &gt; 0 &amp;&amp; __1</code>.</div>
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">2</span> Signal path prefixes &amp; special paths <span class="section-hint">special access modes</span></div>
        <table class="ref-table">
            <tr><th>Prefix / Pattern</th><th>What it accesses</th></tr>
            <tr><td>(none)</td><td>The signal's current value directly</td></tr>
            <tr><td>__name</td><td>Internal screen variable — local to the current screen, not connected to any external data source. Initial value is <code>null</code>. Useful for screen-local state like tab selection or panel visibility.</td></tr>
            <tr><td>?name</td><td>A property of the signal object itself (e.g. <code>?quality</code> → signal quality)</td></tr>
            <tr><td>??name</td><td>The value of a property of the signal object</td></tr>
            <tr><td>#name</td><td>A property of the bound target element</td></tr>
            <tr><td>##name</td><td>The current value of a property of the bound target element</td></tr>
            <tr><td>$objectId</td><td>The entire signal configuration object (meta-data)</td></tr>
            <tr><td>§name</td><td>A special framework-provided value (if supported)</td></tr>
            <tr><td>{name}</td><td>Dynamic signal path: embed another signal's value inside the path, e.g. <code>.Plant.{.ActiveLine}.Speed</code></td></tr>
        </table>
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">3</span> Formula <span class="section-hint">transform signal values with JavaScript</span></div>
        <div class="note" style="margin-bottom:2px;">Leave the formula empty to pass the first signal's value through unchanged.</div>
        <pre class="snippet"><span style="color:#6a737d;font-style:italic">// Access signal values by position or by name:</span>
__0 * 100               <span style="color:#6a737d;font-style:italic">// first signal × 100</span>
__0 &gt; 0 &amp;&amp; __1          <span style="color:#6a737d;font-style:italic">// combine two signals</span>
speed &gt; limit           <span style="color:#6a737d;font-style:italic">// named variables</span>

<span style="color:#6a737d;font-style:italic">// Special variables available in the formula:</span>
__ctx                   <span style="color:#6a737d;font-style:italic">// the full binding context object</span>
__res                   <span style="color:#6a737d;font-style:italic">// the result of the previous evaluation</span></pre>
        <div class="note">The formula must be a single JavaScript expression that returns a value (no <code>return</code> statement needed).</div>
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">4</span> Write Back &amp; Two-Way <span class="section-hint">send values back to signals</span></div>
        <pre class="snippet"><span style="color:#6a737d;font-style:italic">// Write back signal</span>
<span style="color:#6a737d;font-style:italic">// → writes the formula result back to a signal whenever</span>
<span style="color:#6a737d;font-style:italic">//   the element property changes (useful for derived values)</span>

<span style="color:#6a737d;font-style:italic">// Two-Way binding</span>
<span style="color:#6a737d;font-style:italic">// → also sets the signal when the element fires a DOM event</span>
<span style="color:#6a737d;font-style:italic">//   (e.g. "change" for inputs). Enable "events" to configure</span>
<span style="color:#6a737d;font-style:italic">//   which events trigger the write-back.</span>
<span style="color:#6a737d;font-style:italic">// → "formula write back" applies a reverse transformation</span>
<span style="color:#6a737d;font-style:italic">//   before writing (useful when the formula changes the scale)</span></pre>
        <div class="note">Two-Way is only available for <em>property</em> and <em>attribute</em> targets. Separate multiple event names with a semicolon.</div>
    </div>

    <div class="content-section">
        <div class="section-title"><span class="section-num">5</span> Converter <span class="section-hint">map values to display values</span></div>
        <div class="note" style="margin-bottom:4px;">Use the table to map specific conditions to output values. The <em>condition</em> column supports several matching modes:</div>
        <table class="ref-table">
            <tr><th>Condition key</th><th>Matches when …</th></tr>
            <tr><td>true / false</td><td>Signal value equals the boolean</td></tr>
            <tr><td>42</td><td>Signal value equals the number exactly</td></tr>
            <tr><td>running</td><td>Signal value equals the string "running"</td></tr>
            <tr><td>&gt;10</td><td>Signal value is greater than 10</td></tr>
            <tr><td>&gt;=5</td><td>Signal value is ≥ 5</td></tr>
            <tr><td>&lt;3</td><td>Signal value is &lt; 3</td></tr>
            <tr><td>10-20</td><td>Signal value is in the range 10 … 20 (inclusive)</td></tr>
            <tr><td>default</td><td>Fallback when no other key matches</td></tr>
        </table>
        <div class="note" style="margin-top:4px;">The value column supports template literals — use <code>\${value}</code> to embed the original signal value in the output string.</div>
        <div class="note" style="margin-top:4px;"><strong>Named converter:</strong> enter a converter name in the <em>converter</em> field above the table to use a pre-registered converter instead of the inline table.</div>
    </div>

</div>
</body>
</html>`;
