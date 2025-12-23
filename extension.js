const vscode = require('vscode');

// --- 1. Configuration First ---
const CONFIG = {
    COMMAND_SEL: 'modern-rgb-converter.convert',
    COMMAND_ALL: 'modern-rgb-converter.convertAll',
    // Supports rgba(0,0,0,0.1) or rgb(0,0,0)
    COLOR_REGEX: /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/g,
    LABELS: {
        NO_MATCH: 'No legacy rgba format colors found.',
        SUCCESS_ALL: 'File color conversion completed!',
        DEBUG_HEADER: '=== CSS Modernizer Diagnostic Report ==='
    }
};

/**
 * Core conversion logic: Convert 0.4 to 40% and reformat
 */
function transformLogic(text) {
    return text.replace(CONFIG.COLOR_REGEX, (match, r, g, b, a) => {
        if (a !== undefined) {
            const alphaPercent = Math.round(parseFloat(a) * 100);
            return `rgb(${r} ${g} ${b} / ${alphaPercent}%)`;
        }
        return `rgb(${r} ${g} ${b})`;
    });
}

/**
 * 3. Debug Tool
 * Quick test of current file status
 */
function debug() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return console.log("Debug: No active editor");

    const fullText = editor.document.getText();
    const matches = fullText.match(CONFIG.COLOR_REGEX);

    console.log(CONFIG.LABELS.DEBUG_HEADER);
    console.log("Current file length:", fullText.length);
    console.log("Detected legacy format count:", matches ? matches.length : 0);
    if (matches) console.log("Example:", matches[0]);
}

function activate(context) {
    // Command A: Convert selection only
    let selCommand = vscode.commands.registerCommand(CONFIG.COMMAND_SEL, () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (text) {
            editor.edit(eb => eb.replace(selection, transformLogic(text)));
        }
    });

    // Command B: Convert entire file (with validation)
    let allCommand = vscode.commands.registerCommand(CONFIG.COMMAND_ALL, () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const fullText = document.getText();

        // Validation: Check if there are any matches
        if (!CONFIG.COLOR_REGEX.test(fullText)) {
            vscode.window.showWarningMessage(CONFIG.LABELS.NO_MATCH);
            return;
        }

        // Execute diagnostic output
        debug();

        const newText = transformLogic(fullText);

        // Get full file range and replace
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        const fullRange = new Range(firstLine.range.start, lastLine.range.end);

        editor.edit(eb => eb.replace(fullRange, newText))
              .then(() => vscode.window.showInformationMessage(CONFIG.LABELS.SUCCESS_ALL));
    });

    context.subscriptions.push(selCommand, allCommand);
}

const { Range } = vscode;
exports.activate = activate;