// src/pages/apps/notes.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useDrive } from '@/context/DriveContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * A modal for opening a text file from Google Drive.
 */
const OpenFromDriveModal = ({ theme, onFileSelect, onClose }) => {
  const { files, isLoading } = useDrive();
  // Filter to show only editable text files, not Google Docs/Sheets etc.
  const textFiles = files.filter((file) => file.mimeType === 'text/plain');

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`p-6 rounded-lg shadow-2xl w-96 ${theme.app.bg} border ${theme.app.border}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.app.text}`}>
            Open from Google Drive
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${theme.app.text_subtle} ${theme.app.button_subtle_hover}`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="h-64 overflow-y-auto">
          {isLoading ? (
            <p>Loading files...</p>
          ) : textFiles.length === 0 ? (
            <p className="text-gray-500 italic">
              No plain text files found in your Drive's root.
            </p>
          ) : (
            <ul className="space-y-1">
              {textFiles.map((file) => (
                <li
                  key={file.id}
                  onClick={() => onFileSelect(file)}
                  className={`p-2 rounded cursor-pointer flex items-center gap-2 ${theme.app.button_subtle_hover}`}
                >
                  <img src={file.iconLink} alt="" className="w-4 h-4" />{' '}
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * A feature-rich rich text editor application for OrbitOS.
 * Enhanced with top bar services, menu system, and Google Drive integration.
 */
const Notes = ({
  topBarService,
  dropdownService,
  infoService,
  keyShortcutService,
  setMarkdownActions,
}) => {
  const { theme } = useTheme();
  const { isConnected: isDriveConnected } = useDrive();

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
  const [hasSelection, setHasSelection] = useState(false);
  const [driveFileId, setDriveFileId] = useState(null); // <-- ADDED: To track Drive files
  const [showOpenModal, setShowOpenModal] = useState(false); // <-- ADDED: To control the modal

  // --- REACT HOOKS & LOGIC HANDLERS ---
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length === 1 && words[0] === '' ? 0 : words.length);
    if (driveFileId || content) setHasChanges(true);
  }, [content, driveFileId]);

  useEffect(() => {
    if (topBarService) {
      topBarService.setTitle(fileName);
      topBarService.setCustomAttribute('hasChanges', hasChanges);
    }
  }, [fileName, hasChanges, topBarService]);

  // --- FILE HANDLERS (MODIFIED & NEW) ---
  const handleNew = () => {
    setContent('');
    setFileName('new.txt');
    setDriveFileId(null);
    setHasChanges(false);
  };

  const handleOpenFromDrive = () => {
    if (!isDriveConnected) {
      alert('Please connect to Google Drive in the Settings app first.');
      return;
    }
    setShowOpenModal(true);
  };

  const handleFileSelectedFromDrive = async (file) => {
    setShowOpenModal(false);
    try {
      const res = await fetch(`/api/files/gdrive/${file.id}`);
      const data = await res.json();
      setContent(data.content || '');
      setFileName(file.name);
      setDriveFileId(file.id);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load file content:', error);
      alert('Failed to load file content.');
    }
  };

  const handleSaveToDrive = async () => {
    if (!isDriveConnected) return alert('Not connected to Google Drive.');
    if (!hasChanges) return;

    if (!driveFileId) {
      // It's a new file
      const newFileName = prompt(
        'Enter a name for your new Drive file:',
        fileName,
      );
      if (!newFileName) return;
      try {
        const res = await fetch('/api/files/gdrive/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newFileName, content }),
        });
        const data = await res.json();
        if (data.file) {
          setFileName(data.file.name);
          setDriveFileId(data.file.id);
          setHasChanges(false);
        }
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    } else {
      // It's an existing file
      try {
        await fetch(`/api/files/gdrive/${driveFileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        setHasChanges(false);
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handleSaveToLocal = () => {
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
      handleSaveToLocal();
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
        setDriveFileId(null); // Loading a local file means it's not a Drive file
        setHasChanges(false);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // --- OTHER HANDLERS (Unchanged) ---
  const handleReplaceAll = () => {
    if (!findText) return alert('Please enter text to find.');
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
    const prevIndex =
      currentSearchIndex <= 0 ? matches.length - 1 : currentSearchIndex - 1;
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
        const nextMatch = matches.find((pos) => pos > currentPos) || matches[0];
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
    const newText =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);
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

  // --- USEEFFECT HOOKS ---
  useEffect(() => {
    if (dropdownService) {
      const fileMenu = dropdownService
        .getDropdowns()
        .find((d) => d.label === 'File');
      if (fileMenu) {
        fileMenu.items = [
          { label: 'New', action: handleNew, shortcut: 'Ctrl+N' },
          { isSeparator: true },
          { label: 'Open Local File...', action: handleOpenLocal },
          {
            label: 'Open from Google Drive...',
            action: handleOpenFromDrive,
            disabled: !isDriveConnected,
          },
          { isSeparator: true },
          { label: 'Save As Local File...', action: handleSaveAs },
          {
            label: 'Save to Google Drive',
            action: handleSaveToDrive,
            disabled: !isDriveConnected || !hasChanges,
          },
        ];
      }

      const editMenu = dropdownService
        .getDropdowns()
        .find((d) => d.label === 'Edit');
      if (editMenu) {
        editMenu.items.forEach((item) => {
          if (item.label === 'Find...')
            item.action = () => setShowFindReplace(true);
          else if (item.label === 'Replace...')
            item.action = () => setShowFindReplace(true);
        });
      }
      const searchMenu = dropdownService
        .getDropdowns()
        .find((d) => d.label === 'Search');
      if (searchMenu) {
        searchMenu.items.forEach((item) => {
          if (item.label === 'Select and Find Next') {
            item.action = handleSelectAndFindNext;
            item.disabled = !hasSelection;
          }
        });
      }
    }
  }, [dropdownService, hasChanges, hasSelection, isDriveConnected]);

  useEffect(() => {
    if (keyShortcutService) {
      keyShortcutService.register('Ctrl+f', () => setShowFindReplace(true));
      keyShortcutService.register('Ctrl+h', () => setShowFindReplace(true));
      // Save is now more complex, so we remove the simple shortcut for now.
      // keyShortcutService.register('Ctrl+s', handleSave);
      keyShortcutService.register('Ctrl+n', handleNew);
      keyShortcutService.register('F3', handleFindNext);
      keyShortcutService.register('Shift+F3', handleFindPrevious);
      keyShortcutService.register('Ctrl+F3', handleSelectAndFindNext);
      return () => {
        keyShortcutService.cleanup();
      };
    }
  }, [keyShortcutService]);

  useEffect(() => {
    if (infoService)
      infoService.appInfo.onShowAbout = () => setShowAboutModal(true);
  }, [infoService]);

  useEffect(() => {
    if (setMarkdownActions)
      setMarkdownActions({
        handleBold,
        handleItalic,
        handleStrikethrough,
        handleCode,
        handleHeader,
      });
  }, [
    setMarkdownActions,
    handleBold,
    handleItalic,
    handleStrikethrough,
    handleCode,
    handleHeader,
  ]);

  // --- JSX RENDER ---
  return (
    <div
      className={`flex flex-col h-full w-full ${theme.app.bg} ${theme.app.text} overflow-hidden`}
    >
      {showOpenModal && (
        <OpenFromDriveModal
          theme={theme}
          onFileSelect={handleFileSelectedFromDrive}
          onClose={() => setShowOpenModal(false)}
        />
      )}

      {showFindReplace && (
        <div
          className={`p-2 border-b ${theme.app.bg} flex items-center gap-2 text-sm shadow-md flex-shrink-0 z-10 ${theme.app.border}`}
        >
          <input
            type="text"
            placeholder="Find"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className={`px-2 py-1 border rounded-md w-48 ${theme.app.input}`}
          />
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
            className={`px-2 py-1 border rounded-md w-48 ${theme.app.input}`}
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

      <main className="relative flex-grow">
        <textarea
          ref={setTextareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onSelect={() => {
            if (textareaRef)
              setHasSelection(
                textareaRef.selectionStart !== textareaRef.selectionEnd,
              );
          }}
          className={`w-full h-full p-3 border-0 outline-none resize-none font-mono text-sm ${theme.app.paper_bg} ${theme.app.text}`}
          placeholder="Start typing..."
        />
        <div
          className={`absolute bottom-4 right-5 z-10 text-xs font-mono px-3 py-1 rounded-full shadow-lg opacity-80 pointer-events-none ${theme.app.badge}`}
        >
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </main>

      {showAboutModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className={`bg-white p-6 rounded-lg shadow-2xl w-96 ${theme.app.bg} border ${theme.app.border}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${theme.app.text}`}>
                About Notes Editor
              </h2>
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
              Enhanced rich text editor with top bar services, menu system, file
              operations, find and replace, and real-time word count.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
