# vscode-quick-scope

*quick-scope* briefly highlights unique characters on the current line while a Vim <kbd>f</kbd>, <kbd>F</kbd>, <kbd>t</kbd>, or <kbd>T</kbd> motion is waiting for its target character. This also works with operators such as `cf` and `dt`, and in visual mode.

## Features

Based on https://github.com/unblevable/quick-scope for Vim. See the readme there for now!

## Requirements

This extension integrates with the VSCodeVim extension. Install VSCodeVim to use the `f`, `F`, `t`, and `T` motions with jump highlights.

## Extension Settings

The jump highlight colors can be changed in VS Code settings. Use six-digit hex colors such as `#ff9900`; the dimmed background also accepts an eight-digit hex color with alpha, such as `#00000033`.

- `vscode-quick-scope.highlightColor`: Color for characters that can be targeted (default `#ff9900`).
- `vscode-quick-scope.dimmedTextColor`: Text color for the rest of the current line (default `#808080`).
- `vscode-quick-scope.dimmedBackgroundColor`: Translucent overlay on the current line (default `#00000033`).

## Known Issues

None yet. Please leave Github issues

## Release Notes

### 0.1.0

Initial release
