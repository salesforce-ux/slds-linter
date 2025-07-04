import chalk from 'chalk';

/**
 * Auto-detects the current editor based on environment variables and common patterns.
 * 
 * @returns The detected editor name or 'vscode' as fallback
 */
export function detectCurrentEditor(): string {
  // Check for common environment variables
  const editor = process.env.EDITOR || process.env.VISUAL;
  
  if (editor) {
    // Extract editor name from path
    const editorName = editor.toLowerCase();
    
    if (editorName.includes('code') || editorName.includes('vscode')) {
      return 'vscode';
    } else if (editorName.includes('cursor')) {
      return 'cursor';
    } else if (editorName.includes('atom')) {
      return 'atom';
    } else if (editorName.includes('sublime') || editorName.includes('subl')) {
      return 'sublime';
    } else if (editorName.includes('vim') || editorName.includes('nvim')) {
      return 'vim';
    } else if (editorName.includes('emacs')) {
      return 'emacs';
    } else if (editorName.includes('nano')) {
      return 'nano';
    }
  }
  
  // Check for Cursor specific environment variables first (since Cursor sets TERM_PROGRAM=vscode)
  if (process.env.CURSOR_TRACE_ID || (process.env.TERM_PROGRAM||'').toLowerCase().includes('cursor')) {
    return 'cursor';
  }
  
  // Check for VS Code specific environment variables
  if (process.env.VSCODE_PID || (process.env.TERM_PROGRAM||'').toLowerCase().includes('vscode')) {
    return 'vscode';
  }
    
  // Default fallback
  return 'vscode';
}

/**
 * Returns an editor-specific link for opening a file at a given line and column.
 *
 * @param editor - The editor to use (e.g., 'vscode').
 * @param absolutePath - The absolute path to the file.
 * @param line - The line number in the file.
 * @param column - The column number in the file.
 * @returns A URL string that can be used to open the file in the specified editor.
 */
export function getEditorLink(
  editor: string,
  absolutePath: string,
  line: number,
  column: number
): string {
  switch (editor.toLowerCase()) {
    case 'vscode':
      return `vscode://file/${absolutePath}:${line}:${column}`;
    case 'cursor':
      return `cursor://file/${absolutePath}:${line}:${column}`;
    case 'atom':
      return `atom://core/open/file?filename=${absolutePath}&line=${line}&column=${column}`;
    default:
      // Generic fallback - most editors support file:line:column format
      return `file://${absolutePath}:${line}:${column}`;
  }
}



/**
 * Creates an ANSI hyperlink (if supported) for the line:column text.
 *
 * @param lineCol - The line:column string (e.g., "10:5").
 * @param absolutePath - The absolute path to the file.
 * @param line - The line number in the file.
 * @param column - The column number in the file.
 * @param editor - The editor to use (e.g., 'vscode', 'atom', 'sublime'). If not provided, will auto-detect.
 * @returns A string with ANSI escape sequences to create a clickable hyperlink.
 */
export function createClickableLineCol(
  lineCol: string,
  absolutePath: string,
  line: number,
  column: number,
  editor?: string
): string {
  const detectedEditor = editor || detectCurrentEditor();
  const link = getEditorLink(detectedEditor, absolutePath, line, column);
  return `\u001b]8;;${link}\u0007${chalk.blueBright(lineCol)}\u001b]8;;\u0007`;
}
