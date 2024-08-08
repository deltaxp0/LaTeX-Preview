const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.showLatex', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'latexPreview',
            'LaTeX Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent();

        // Send initial LaTeX content to the webview
        updateWebview(panel, editor.document.getText());

        // Set up a listener for document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === editor.document) {
                updateWebview(panel, event.document.getText());
            }
        });

        // Set up a listener for editor changes
        const changeEditorSubscription = vscode.window.onDidChangeActiveTextEditor(newEditor => {
            if (newEditor && newEditor.document === editor.document) {
                updateWebview(panel, newEditor.document.getText());
            }
        });

        panel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            changeEditorSubscription.dispose();
        }, null, context.subscriptions);
    });

    context.subscriptions.push(disposable);
}

function updateWebview(panel, content) {
    panel.webview.postMessage({ type: 'update', content: content });
}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LaTeX Preview</title>
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
            <script id="MathJax-script" async
                src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
            <style>
                body {
                    background-color: white;
                    color: black;
                }
                #latex-container {
                    border: 1px solid #ccc;
                    padding: 10px;
                    margin-top: 10px;
                    background-color: white;
                }
                #error-container {
                    color: red;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div id="latex-container"></div>
            <div id="error-container"></div>
            <script>
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'update') {
                        document.getElementById('error-container').innerText = '';
                        try {
                            document.getElementById('latex-container').innerText = message.content;
                            MathJax.typeset();
                        } catch (error) {
                            document.getElementById('error-container').innerText = 'Error rendering LaTeX: ' + error.message;
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
