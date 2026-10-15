// "use strict";
import * as vscode from "vscode";
import getHighlights from "./matcher";

const primaryDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("editor.selectionBackground")
});

const secondaryDecorationType = vscode.window.createTextEditorDecorationType({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: new vscode.ThemeColor("editor.selectionBackground")
});

export function activate(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;
  let timeout: any;

  const clearHighlights = (editor: vscode.TextEditor) => {
    editor.setDecorations(primaryDecorationType, []);
    editor.setDecorations(secondaryDecorationType, []);
  };

  const hideHighlights = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (activeEditor) {
      clearHighlights(activeEditor);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-quick-scope.showHighlights", () => {
      if (!activeEditor) {
        return;
      }
      if (timeout) {
        clearTimeout(timeout);
      }
      updateDecorations();
      // A failed find motion does not change the selection, so always clear
      // the highlights after Vim's key sequence timeout as a fallback.
      timeout = setTimeout(hideHighlights, 1500);
    })
  );

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      hideHighlights();
      activeEditor = editor;
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeTextEditorSelection(
    event => {
      if (event.textEditor === activeEditor) {
        hideHighlights();
      }
    },
    null,
    context.subscriptions
  );

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const cursorPosition = getPosition(activeEditor);
    const cursorColumn = cursorPosition.character;
    const line = getLine(activeEditor, cursorPosition);

    const beforeText = line.slice(0, cursorColumn);
    const beforeTextReversed = beforeText
      .split("")
      .reverse()
      .join("");
    const beforeHighlights = getHighlights(beforeTextReversed, "reverse").map(
      h => ({ ...h, position: cursorColumn - h.position - 1 })
    );

    const afterText = line.slice(cursorPosition.character + 1);
    const afterHighlights = getHighlights(afterText, "forward").map(h => ({
      ...h,
      position: cursorColumn + h.position + 1
    }));

    setDecorations(
      [...beforeHighlights, ...afterHighlights].filter(
        h => h.type === "primary"
      ),
      primaryDecorationType,
      cursorPosition.line
    );
    setDecorations(
      [...beforeHighlights, ...afterHighlights].filter(
        h => h.type === "secondary"
      ),
      secondaryDecorationType,
      cursorPosition.line
    );
  }

  function setDecorations(highlights, decorationType, cursorLine) {
    const decorations: vscode.DecorationOptions[] = highlights.map(h => ({
      range: new vscode.Range(
        cursorLine,
        h.position,
        cursorLine,
        h.position + 1
      )
    }));
    activeEditor.setDecorations(decorationType, decorations);
  }

  function getPosition(editor: vscode.TextEditor): vscode.Position {
    return editor.selection.active;
  }

  function getLine(
    editor: vscode.TextEditor,
    position: vscode.Position
  ): string {
    return editor.document.lineAt(position).text;
  }
}
