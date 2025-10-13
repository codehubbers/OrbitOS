// src/pages/apps/notes.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/system/services/NotificationRegistry';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useFileDialog } from '@/hooks/useFileDialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * A modal for opening a text file from Google Drive.
 */
const OpenFromDriveModal = ({ theme, onFileSelect, onClose }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [authStatus, setAuthStatus] = useState({ connected: false });

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const status = await res.json();
      setAuthStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return { connected: false };
    }
  };

  const loadFiles = async () => {
    try {
      const status = await checkAuthStatus();
      if (status.connected) {
        const res = await fetch('/api/files/database');
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const { createFile: createNewFile } = useFileOperations();

  const handleNewFile = async () => {
    const name = prompt('Enter file name:');
    if (!name) return;

    try {
      await createNewFile(name, '');
      await loadFiles();
      setShowNewMenu(false);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const { updateFile: updateExistingFile } = useFileOperations();

  const handleRename = async (file) => {
    const newName = prompt('Enter new name:', file.name);
    if (!newName || newName === file.name) return;

    try {
      await updateExistingFile(file.id, { name: newName });
      await loadFiles();
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  };

  const { deleteFile } = useFileOperations();

  const handleDelete = async (file) => {
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      await deleteFile(file.id);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`p-6 rounded-lg shadow-2xl w-96 ${theme.app.bg} border ${theme.app.border}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.app.text}`}>
            File Manager
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className={`px-3 py-1 rounded ${theme.app.button}`}
              >
                ➕ New
              </button>
              {showNewMenu && (
                <div
                  className={`absolute top-8 left-0 ${theme.app.bg} border rounded shadow-lg z-10`}
                >
                  <button
                    onClick={handleNewFile}
                    className={`block w-full px-4 py-2 text-left ${theme.app.button_subtle_hover}`}
                  >
                    📄 Text File
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={loadFiles}
              className={`px-3 py-1 rounded ${theme.app.button}`}
            >
              🔄
            </button>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${theme.app.text_subtle} ${theme.app.button_subtle_hover}`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading files...</p>
            </div>
          ) : !authStatus.connected ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-2">
                Connect to Google Drive
              </h3>
              <p className="text-gray-500 mb-4">
                Sign in to access your files and enable backup
              </p>
              <button
                onClick={() =>
                  (window.location.href = '/api/auth/google/login')
                }
                className={`px-4 py-2 rounded ${theme.app.button}`}
              >
                🔗 Connect Google Drive
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-semibold mb-2">No files to show</h3>
              <p className="text-gray-500 mb-4">
                Create your first file to get started
              </p>
              <button
                onClick={handleNewFile}
                className={`px-4 py-2 rounded ${theme.app.button}`}
              >
                ➕ Create File
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {files.map((file) => (
                <li
                  key={file.id}
                  className={`p-2 rounded flex items-center gap-2 ${theme.app.button_subtle_hover} group`}
                >
                  <button
                    onClick={() => onFileSelect(file)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    📄 {file.name}
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </span>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={() => handleRename(file)}
                      className={`p-1 rounded ${theme.app.button_subtle_hover}`}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className={`p-1 rounded ${theme.app.button_subtle_hover}`}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
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
  const { showNotification } = useNotification();
  const { openDialog, FileDialogComponent } = useFileDialog();

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
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0); // <-- ADDED: For search functionality

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
    openDialog(
      'open',
      '',
      (file) => {
        setContent(file.content || '');
        setFileName(file.name);
        setDriveFileId(file.id);
        setHasChanges(false);
      },
      { permittedExtensions: ['txt', 'html', 'md'] },
    );
  };

  const handleFileSelectedFromDrive = async (file) => {
    setShowOpenModal(false);
    setContent(file.content || '');
    setFileName(file.name);
    setDriveFileId(file.id);
    setHasChanges(false);
  };

  const { createFile, updateFile } = useFileOperations();

  const handleSaveToDrive = async () => {
    if (!hasChanges) return;

    try {
      if (!driveFileId) {
        openDialog(
          'save',
          fileName,
          async (fileData) => {
            const data = await createFile(fileData.name, content);
            setFileName(data.name);
            setDriveFileId(data.id);
            setHasChanges(false);
            showNotification('File saved successfully!', 'success');
          },
          { permittedExtensions: ['txt', 'html', 'md'] },
        );
      } else {
        await updateFile(driveFileId, { content });
        setHasChanges(false);
        showNotification('File saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      showNotification('Failed to save file.', 'error');
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

  const handleSaveAsToDrive = async () => {
    openDialog(
      'save',
      fileName,
      async (fileData) => {
        try {
          const data = await createFile(fileData.name, content);
          setFileName(data.name);
          setDriveFileId(data.id);
          setHasChanges(false);
          showNotification('File saved successfully!', 'success');
        } catch (error) {
          console.error('Failed to create file:', error);
          showNotification('Failed to save file.', 'error');
        }
      },
      { permittedExtensions: ['txt', 'html', 'md'] },
    );
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
    if (!findText) {
      showNotification('Please enter text to find.', 'error');
      return;
    }
    setContent((prevContent) => prevContent.replaceAll(findText, replaceText));
    showNotification('Text replaced successfully!', 'success');
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
          { label: 'Open from Database...', action: handleOpenFromDrive },
          { isSeparator: true },
          { label: 'Save As Local File...', action: handleSaveAs },
          {
            label: 'Save to Database',
            action: handleSaveToDrive,
            disabled: !hasChanges,
          },
          { label: 'Save As to Database...', action: handleSaveAsToDrive },
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
  }, [dropdownService, hasChanges, hasSelection]);

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
      <FileDialogComponent />

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
