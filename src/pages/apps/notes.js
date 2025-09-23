// src/pages/apps/notes.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

// Import icons for the UI
import {
  XMarkIcon,
} from '@heroicons/react/24/outline';

/**
 * A feature-rich rich text editor application for OrbitOS.
 * Enhanced with top bar services and menu system.
 * 
 * First created by @Ziqian-Huang0607
 * Contributors: @dailker
 */

const Notes = ({ topBarService, dropdownService, infoService, keyShortcutService, setMarkdownActions }) => {
  const { theme } = useTheme();
  // --- STATE MANAGEMENT ---
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
  const [searchMatches, setSearchMatches] = useState([]);
  const [hasSelection, setHasSelection] = useState(false);



  // --- REACT HOOKS & LOGIC HANDLERS ---
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

  const handleNew = () => {
    setContent('');
    setFileName('new.txt');
    setHasChanges(false);
  };

  const handleSave = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    setHasChanges(false);
  };

  const handleSaveAs = () => {
    const newFileName = prompt('Enter filename:', fileName);
    if (newFileName) {
      setFileName(newFileName);
      handleSave();
    }
  };

  const handleOpenLocal = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.html';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
        setFileName(file.name);
        setHasChanges(false);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReplaceAll = () => {
    if (!findText) {
      alert('Please enter text to find.');
      return;
    }
    setContent((prevContent) => prevContent.replaceAll(findText, replaceText));
  };

  const getSelectedText = () => {
    if (textareaRef) {
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      return content.substring(start, end);
    }
    return '';
  };

  const findMatches = (searchText) => {
    if (!searchText) return [];
    const matches = [];
    let index = content.indexOf(searchText);
    while (index !== -1) {
      matches.push(index);
      index = content.indexOf(searchText, index + 1);
    }
    return matches;
  };

  const handleFindNext = () => {
    if (!findText) return;
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % matches.length;
    setCurrentSearchIndex(nextIndex);
    const matchPos = matches[nextIndex];
    
    if (textareaRef) {
      textareaRef.focus();
      textareaRef.setSelectionRange(matchPos, matchPos + findText.length);
    }
  };

  const handleFindPrevious = () => {
    if (!findText) return;
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const prevIndex = currentSearchIndex <= 0 ? matches.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    const matchPos = matches[prevIndex];
    
    if (textareaRef) {
      textareaRef.focus();
      textareaRef.setSelectionRange(matchPos, matchPos + findText.length);
    }
  };

  const handleSelectAndFindNext = () => {
    const selected = getSelectedText();
    if (selected && textareaRef) {
      setFindText(selected);
      const matches = findMatches(selected);
      if (matches.length > 0) {
        const currentPos = textareaRef.selectionStart;
        const nextMatch = matches.find(pos => pos > currentPos) || matches[0];
        const matchIndex = matches.indexOf(nextMatch);
        setCurrentSearchIndex(matchIndex);
        textareaRef.focus();
        textareaRef.setSelectionRange(nextMatch, nextMatch + selected.length);
      }
    }
  };

  const wrapSelectedText = (prefix, suffix = prefix) => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newText);
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleBold = () => wrapSelectedText('**');
  const handleItalic = () => wrapSelectedText('*');
  const handleStrikethrough = () => wrapSelectedText('~~');
  const handleCode = () => wrapSelectedText('`');
  const handleHeader = () => wrapSelectedText('# ', '');

  // Update dropdown handlers
  useEffect(() => {
    if (dropdownService) {
      const dropdowns = dropdownService.getDropdowns();
      dropdowns.forEach(dropdown => {
        dropdown.items.forEach(item => {
          if (item.label === 'New') item.action = handleNew;
          else if (item.label === 'Open Local File') item.action = handleOpenLocal;
          else if (item.label === 'Save') {
            item.action = handleSave;
            item.disabled = !hasChanges;
          }
          else if (item.label === 'Save As') item.action = handleSaveAs;
          else if (item.label === 'Find...') item.action = () => setShowFindReplace(true);
          else if (item.label === 'Replace...') item.action = () => setShowFindReplace(true);
          else if (item.label === 'Select and Find Next') {
            item.action = handleSelectAndFindNext;
            item.disabled = !hasSelection;
          }
        });
      });
    }
  }, [dropdownService, hasChanges, hasSelection]);

  // Register keyboard shortcuts
  useEffect(() => {
    if (keyShortcutService) {
      keyShortcutService.register('Ctrl+f', () => setShowFindReplace(true));
      keyShortcutService.register('Ctrl+h', () => setShowFindReplace(true));
      keyShortcutService.register('Ctrl+s', handleSave);
      keyShortcutService.register('Ctrl+n', handleNew);
      keyShortcutService.register('F3', handleFindNext);
      keyShortcutService.register('Shift+F3', handleFindPrevious);
      keyShortcutService.register('Ctrl+F3', handleSelectAndFindNext);
      
      return () => {
        keyShortcutService.cleanup();
      };
    }
  }, [keyShortcutService]);

  // Setup info service
  useEffect(() => {
    if (infoService) {
      infoService.appInfo.onShowAbout = () => setShowAboutModal(true);
    }
  }, [infoService]);

  // Update markdown actions
  useEffect(() => {
    if (setMarkdownActions) {
      setMarkdownActions({
        handleBold,
        handleItalic,
        handleStrikethrough,
        handleCode,
        handleHeader
      });
    }
  }, [setMarkdownActions, handleBold, handleItalic, handleStrikethrough, handleCode, handleHeader]);

  // --- JSX RENDER ---
  return (
    <div className={`flex flex-col h-full w-full ${theme.app.bg} ${theme.app.text} overflow-hidden`}>

      {/* Find & Replace Panel */}
      {showFindReplace && (
        <div className={`p-2 border-b ${theme.app.bg} flex items-center gap-2 text-sm shadow-md flex-shrink-0 z-10`}>
          <input
            type="text"
            placeholder="Find"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className={`px-2 py-1 border rounded-md w-48 focus:ring-2 focus:ring-blue-500 outline-none ${theme.app.input}`}
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleFindPrevious}
            className="p-1 hover:bg-gray-200 rounded"
            title="Find Previous"
          >
            ▲
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleFindNext}
            className="p-1 hover:bg-gray-200 rounded"
            title="Find Next"
          >
            ▼
          </button>
          <input
            type="text"
            placeholder="Replace with"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className={`px-2 py-1 border rounded-md w-48 focus:ring-2 focus:ring-blue-500 outline-none ${theme.app.input}`}
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
            className="ml-auto p-1 hover:bg-gray-200 rounded"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative flex-grow">
        <textarea
          ref={setTextareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onSelect={() => {
            if (textareaRef) {
              const selected = textareaRef.selectionStart !== textareaRef.selectionEnd;
              setHasSelection(selected);
            }
          }}
          className="w-full h-full p-3 border-0 outline-none resize-none font-mono text-sm"
          placeholder="Start typing..."
        />
        {/* Floating Word Count */}
        <div className="absolute bottom-4 right-5 z-10 bg-gray-800 text-white text-xs font-mono px-3 py-1 rounded-full shadow-lg opacity-80 pointer-events-none">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </main>

      {/* About Modal */}
      {showAboutModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">About Notes Editor</h2>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-700">
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
