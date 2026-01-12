import { detectCurrentEditor, getEditorLink } from '../../src/utils/editorLinkUtil';

describe('Editor Link Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('detectCurrentEditor', () => {
    it('should detect VS Code from EDITOR environment variable', () => {
      delete process.env.CURSOR_TRACE_ID;
      process.env.EDITOR = '/usr/bin/code';
      expect(detectCurrentEditor()).toBe('vscode');
    });

    it('should detect VS Code from VISUAL environment variable', () => {
      delete process.env.CURSOR_TRACE_ID;
      process.env.VISUAL = '/usr/bin/vscode';
      expect(detectCurrentEditor()).toBe('vscode');
    });

    it('should detect Cursor editor', () => {
      process.env.EDITOR = '/usr/bin/cursor';
      expect(detectCurrentEditor()).toBe('cursor');
    });

    it('should detect Cursor from CURSOR_TRACE_ID environment variable', () => {
      process.env.CURSOR_TRACE_ID = '12345';
      expect(detectCurrentEditor()).toBe('cursor');
    });

    it('should detect Cursor from TERM_PROGRAM environment variable', () => {
      process.env.TERM_PROGRAM = 'cursor';
      expect(detectCurrentEditor()).toBe('cursor');
    });

    it('should detect Atom editor', () => {
      process.env.EDITOR = '/usr/bin/atom';
      expect(detectCurrentEditor()).toBe('atom');
    });

    it('should detect Sublime Text', () => {
      process.env.EDITOR = '/usr/bin/subl';
      expect(detectCurrentEditor()).toBe('sublime');
    });

    it('should detect Vim', () => {
      process.env.EDITOR = '/usr/bin/vim';
      expect(detectCurrentEditor()).toBe('vim');
    });

    it('should detect Neovim', () => {
      process.env.EDITOR = '/usr/bin/nvim';
      expect(detectCurrentEditor()).toBe('vim');
    });

    it('should detect Emacs', () => {
      process.env.EDITOR = '/usr/bin/emacs';
      expect(detectCurrentEditor()).toBe('emacs');
    });

    it('should detect Nano', () => {
      process.env.EDITOR = '/usr/bin/nano';
      expect(detectCurrentEditor()).toBe('nano');
    });

    it('should detect VS Code from VSCODE_PID environment variable', () => {
      delete process.env.CURSOR_TRACE_ID;
      process.env.VSCODE_PID = '12345';
      expect(detectCurrentEditor()).toBe('vscode');
    });

    it('should detect VS Code from TERM_PROGRAM environment variable', () => {
      delete process.env.CURSOR_TRACE_ID;
      process.env.TERM_PROGRAM = 'vscode';
      expect(detectCurrentEditor()).toBe('vscode');
    });

    it('should fallback to vscode when no editor is detected', () => {
      delete process.env.EDITOR;
      delete process.env.VISUAL;
      delete process.env.VSCODE_PID;
      delete process.env.CURSOR_TRACE_ID;
      delete process.env.TERM_PROGRAM;
      expect(detectCurrentEditor()).toBe('vscode');
    });
  });

  describe('getEditorLink', () => {
    const testPath = '/path/to/file.css';
    const testLine = 10;
    const testColumn = 5;

    it('should create VS Code link', () => {
      const link = getEditorLink('vscode', testPath, testLine, testColumn);
      expect(link).toBe(`vscode://file/${testPath}:${testLine}:${testColumn}`);
    });

    it('should create Cursor link', () => {
      const link = getEditorLink('cursor', testPath, testLine, testColumn);
      expect(link).toBe(`cursor://file/${testPath}:${testLine}:${testColumn}`);
    });

    it('should create Atom link', () => {
      const link = getEditorLink('atom', testPath, testLine, testColumn);
      expect(link).toBe(`atom://core/open/file?filename=${testPath}&line=${testLine}&column=${testColumn}`);
    });

    it('should create Sublime link (uses default)', () => {
      const link = getEditorLink('sublime', testPath, testLine, testColumn);
      expect(link).toBe(`file://${testPath}:${testLine}:${testColumn}`);
    });

    it('should create Vim link (uses default)', () => {
      const link = getEditorLink('vim', testPath, testLine, testColumn);
      expect(link).toBe(`file://${testPath}:${testLine}:${testColumn}`);
    });

    it('should create Emacs link (uses default)', () => {
      const link = getEditorLink('emacs', testPath, testLine, testColumn);
      expect(link).toBe(`file://${testPath}:${testLine}:${testColumn}`);
    });

    it('should create Nano link (uses default)', () => {
      const link = getEditorLink('nano', testPath, testLine, testColumn);
      expect(link).toBe(`file://${testPath}:${testLine}:${testColumn}`);
    });

    it('should create generic link for unknown editor', () => {
      const link = getEditorLink('unknown', testPath, testLine, testColumn);
      expect(link).toBe(`file://${testPath}:${testLine}:${testColumn}`);
    });

    it('should be case insensitive', () => {
      const link1 = getEditorLink('VSCODE', testPath, testLine, testColumn);
      const link2 = getEditorLink('vscode', testPath, testLine, testColumn);
      expect(link1).toBe(link2);
    });
  });

  describe('createClickableLineCol', () => {
    it('should create an ANSI hyperlink wrapper around the colored line:column', async () => {
      process.env.EDITOR = '/usr/bin/code';
      const { createClickableLineCol } = await import('../../src/utils/editorLinkUtil');

      const out = createClickableLineCol('10:5', '/path/to/file.css', 10, 5);

      // OSC 8 hyperlink format: ESC ] 8 ; ; URL BEL ... ESC ] 8 ; ; BEL
      expect(out).toContain('\u001b]8;;');
      expect(out).toContain('vscode://file/');
      expect(out).toContain('/path/to/file.css:10:5');
    });
  });
});