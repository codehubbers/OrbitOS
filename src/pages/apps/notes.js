// src/pages/apps/notes.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Notes = ({ topBarService, dropdownService, infoService, keyShortcutService, setMarkdownActions }) => {
  const { theme } = useTheme();
  
  // --- STATE MANAGEMENT --- (No changes here)
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [fileName, setFileName] = useState('new.txt');
  const [hasChanges, setHasChanges] = useState(false);
  const [textareaRef, setTextareaRef] = useState(null);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [hasSelection, setHasSelection] = useState(false);

  // --- LOGIC & HOOKS --- (No changes here, the logic is sound)
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length === 1 && words[0] === '' ? 0 : words.length);
    if (content) setHasChanges(true);
  }, [content]);

  useEffect(() => {
    if (topBarService) {
      topBarService.setTitle(fileName);
      topBarService.setCustomAttribute('hasChanges', hasChanges);
    }
  }, [fileName, hasChanges, topBarService]);
  
  // ... (All your handler functions like handleNew, handleSave, handleFindNext, etc., remain exactly the same)
  const handleNew = () => { /* ... */ };
  const handleSave = () => { /* ... */ };
  const handleSaveAs = () => { /* ... */ };
  const handleOpenLocal = () => { /* ... */ };
  const handleReplaceAll = () => { /* ... */ };
  const getSelectedText = () => { /* ... */ };
  const findMatches = (searchText) => { /* ... */ };
  const handleFindNext = () => { /* ... */ };
  const handleFindPrevious = () => { /* ... */ };
  const handleSelectAndFindNext = () => { /* ... */ };
  const wrapSelectedText = (prefix, suffix = prefix) => { /* ... */ };
  const handleBold = () => wrapSelectedText('**');
  const handleItalic = () => wrapSelectedText('*');
  const handleStrikethrough = () => wrapSelectedText('~~');
  const handleCode = () => wrapSelectedText('`');
  const handleHeader = () => wrapSelectedText('# ', '');
  
  useEffect(() => {
    if (dropdownService) {
      const dropdowns = dropdownService.getDropdowns();
      dropdowns.forEach(dropdown => {
        dropdown.items.forEach(item => {
          if (item.label === 'New') item.action = handleNew;
          else if (item.label === 'Open Local File') item.action = handleOpenLocal;
          else if (item.label === 'Save') { item.action = handleSave; item.disabled = !hasChanges; }
          else if (item.label === 'Save As') item.action = handleSaveAs;
          else if (item.label === 'Find...') item.action = () => setShowFindReplace(true);
          else if (item.label === 'Replace...') item.action = () => setShowFindReplace(true);
          else if (item.label === 'Select and Find Next') { item.action = handleSelectAndFindNext; item.disabled = !hasSelection; }
        });
      });
    }
  }, [dropdownService, hasChanges, hasSelection]);

  useEffect(() => {
    if (keyShortcutService) {
      keyShortcutService.register('Ctrl+f', () => setShowFindReplace(true));
      keyShortcutService.register('Ctrl+h', () => setShowFindReplace(true));
      keyShortcutService.register('Ctrl+s', handleSave);
      keyShortcutService.register('Ctrl+n', handleNew);
      keyShortcutService.register('F3', handleFindNext);
      keyShortcutService.register('Shift+F3', handleFindPrevious);
      keyShortcutService.register('Ctrl+F3', handleSelectAndFindNext);
      return () => { keyShortcutService.cleanup(); };
    }
  }, [keyShortcutService]);

  useEffect(() => {
    if (infoService) { infoService.appInfo.onShowAbout = () => setShowAboutModal(true); }
  }, [infoService]);

  useEffect(() => {
    if (setMarkdownActions) { setMarkdownActions({ handleBold, handleItalic, handleStrikethrough, handleCode, handleHeader }); }
  }, [setMarkdownActions, handleBold, handleItalic, handleStrikethrough, handleCode, handleHeader]);

  // --- JSX RENDER (WITH THEME FIXES) ---
  return (
    <div className={`flex flex-col h-full w-full ${theme.app.bg} ${theme.app.text} overflow-hidden`}>

      {/* Find & Replace Panel */}
      {showFindReplace && (
        <div className={`p-2 border-b ${theme.app.border} ${theme.app.bg_secondary || theme.app.bg} flex items-center gap-2 text-sm shadow-md flex-shrink-0 z-10`}>
          <input
            type="text"
            placeholder="Find"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className={`px-2 py-1 rounded-md w-48 focus:ring-2 focus:ring-blue-500 outline-none ${theme.app.input}`}
          />
          {/* --- FIXED BUTTONS --- */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleFindPrevious}
            className={`p-1 rounded ${theme.app.button_subtle_hover}`}
            title="Find Previous"
          >
            ▲
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleFindNext}
            className={`p-1 rounded ${theme.app.button_subtle_hover}`}
            title="Find Next"
          >
            ▼
          </button>
          <input
            type="text"
            placeholder="Replace with"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className={`px-2 py-1 rounded-md w-48 focus:ring-2 focus:ring-blue-500 outline-none ${theme.app.input}`}
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleReplaceAll}
            className={`px-4 py-1 rounded-md ${theme.app.button}`}
          >
            Replace All
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFindReplace(false)}
            className={`ml-auto p-1 rounded ${theme.app.button_subtle_hover}`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative flex-grow">
        {/* --- FIXED TEXTAREA --- */}
        <textarea
          ref={setTextareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onSelect={() => {
            if (textareaRef) {
              setHasSelection(textareaRef.selectionStart !== textareaRef.selectionEnd);
            }
          }}
          className={`w-full h-full p-3 border-0 outline-none resize-none font-mono text-sm ${theme.app.paper_bg} ${theme.app.text}`}
          placeholder="Start typing..."
        />
        {/* --- FIXED WORD COUNT BADGE --- */}
        <div className={`absolute bottom-4 right-5 z-10 text-xs font-mono px-3 py-1 rounded-full shadow-lg opacity-80 pointer-events-none ${theme.app.badge}`}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </main>

      {/* --- FIXED ABOUT MODAL --- */}
      {showAboutModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-2xl w-96 ${theme.app.bg} border ${theme.app.border}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${theme.app.text}`}>About Notes Editor</h2>
              <button
                onClick={() => setShowAboutModal(false)}
                className={`p-1 rounded-full ${theme.app.text_subtle} ${theme.app.button_subtle_hover}`}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className={theme.app.text}>
              <strong>Version:</strong> 0.02 (OrbitOS Enhanced)
              <br />
              <strong>Developer:</strong> @Gordon.H | Codehubbers
              <br />
              <strong>Contributors:</strong> @dailker
              <br />
              <br />
              Enhanced rich text editor with top bar services, menu system,
              file operations, find and replace, and real-time word count.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;