// "use strict";
import * as vscode from "vscode";
import getHighlights from "./matcher";

export function activate(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;
  let isHighlighting = false;
  let dimBackgroundDecorationType: vscode.TextEditorDecorationType;
  let dimmedTextDecorationType: vscode.TextEditorDecorationType;
  let highlightDecorationType: vscode.TextEditorDecorationType;

  const updateDecorationTypes = () => {
    if (dimBackgroundDecorationType) {
      dimBackgroundDecorationType.dispose();
      dimmedTextDecorationType.dispose();
      highlightDecorationType.dispose();
    }

    const config = vscode.workspace.getConfiguration("vscode-quick-scope");
    const highlightColor = config.get<string>("highlightColor", "#ff9900");
    const dimmedTextColor = config.get<string>("dimmedTextColor", "#808080");
    const dimmedBackgroundColor = config.get<string>(
      "dimmedBackgroundColor",
      "#00000033"
    );

    dimBackgroundDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: dimmedBackgroundColor
    });
    dimmedTextDecorationType = vscode.window.createTextEditorDecorationType({
      color: dimmedTextColor
    });
    highlightDecorationType = vscode.window.createTextEditorDecorationType({
      color: highlightColor
    });
    context.subscriptions.push(
      dimBackgroundDecorationType,
      dimmedTextDecorationType,
      highlightDecorationType
    );
  };

  updateDecorationTypes();

  const clearHighlights = (editor: vscode.TextEditor) => {
    editor.setDecorations(dimBackgroundDecorationType, []);
    editor.setDecorations(dimmedTextDecorationType, []);
    editor.setDecorations(highlightDecorationType, []);
  };

  const hideHighlights = () => {
    if (activeEditor) {
      clearHighlights(activeEditor);
    }
    isHighlighting = false;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-quick-scope.showHighlights", () => {
      if (!activeEditor) {
        return;
      }
      isHighlighting = true;
      updateDecorations();
    }),
    vscode.commands.registerCommand("vscode-quick-scope.hideHighlights", () => {
      hideHighlights();
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

  vscode.workspace.onDidChangeConfiguration(
    event => {
      if (event.affectsConfiguration("vscode-quick-scope")) {
        updateDecorationTypes();
        if (isHighlighting && activeEditor) {
          updateDecorations();
        }
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

    const lineRange = new vscode.Range(
      cursorPosition.line,
      0,
      cursorPosition.line,
      line.length
    );
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
    const allHighlights = [...beforeHighlights, ...afterHighlights];
    const targetPositions = {};
    allHighlights.forEach(highlight => {
      targetPositions[highlight.position] = true;
    });

    activeEditor.setDecorations(dimBackgroundDecorationType, [
      { range: lineRange }
    ]);
    const dimmedTextDecorations: vscode.DecorationOptions[] = [];
    for (let i = 0; i < line.length; i++) {
      if (!targetPositions[i]) {
        dimmedTextDecorations.push({
          range: new vscode.Range(
            cursorPosition.line,
            i,
            cursorPosition.line,
            i + 1
          )
        });
      }
    }
    activeEditor.setDecorations(
      dimmedTextDecorationType,
      dimmedTextDecorations
    );

    setDecorations(allHighlights, highlightDecorationType, cursorPosition.line);
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
