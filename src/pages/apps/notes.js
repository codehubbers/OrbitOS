// src/pages/apps/notes.js

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useDrive } from '@/context/DriveContext';
import { useCollaboration } from '@/context/CollaborationContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import * as Delta from 'quill-delta';
import CollaborationToolbar from '@/components/collaboration/CollaborationToolbar';
import { useNotification } from '@/system/services/NotificationRegistry';

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
 * Enhanced with top bar services, menu system, Google Drive integration, and collaboration features.
 */
const Notes = ({
  topBarService,
  dropdownService,
  infoService,
  keyShortcutService,
  setMarkdownActions,
  documentId,
}) => {
  const { theme } = useTheme();
  const { isConnected: isDriveConnected } = useDrive();
  const {
    // Added collaboration context
    socket,
    activeUsers,
    presence,
    joinDocument,
    sendDocumentChange,
    sendUserActivity,
  } = useCollaboration();

  const { showNotification } = useNotification();

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
  const [availableFiles, setAvailableFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // --- COLLABORATION STATE ---
  const [documentState, setDocumentState] = useState({
    content: new Delta(),
    version: 0,
  });
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [pickerAction, setPickerAction] = useState(null);
  const [findReplaceMode, setFindReplaceMode] = useState('find');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0); // Added missing state

  // Add this function to load files
  const loadAvailableFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setAvailableFiles(data.files || []);
      } else {
        console.error('Failed to load files');
        setAvailableFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setAvailableFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // --- COLLABORATION HANDLERS ---
  const handleLocalContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(true);

    // Update current note in storage (autosave draft)
    const currentNote = JSON.parse(
      localStorage.getItem('orbitos-current-note') || '{}',
    );
    if (currentNote.id) {
      localStorage.setItem(
        'orbitos-current-note-draft',
        JSON.stringify({
          ...currentNote,
          content: newContent,
        }),
      );
    }
  };

  const handleCollaborativeContentChange = useCallback(
    (newContent, deltaOps) => {
      if (!isCollaborative || !documentId) return;

      const delta = new Delta(deltaOps);
      sendDocumentChange(documentId, delta.ops, documentState.version);
      sendUserActivity(documentId, 'typing', {
        cursorPosition: newContent.length,
      });
    },
    [
      isCollaborative,
      documentId,
      sendDocumentChange,
      sendUserActivity,
      documentState.version,
    ],
  );

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

  // --- COLLABORATION EFFECTS ---
  useEffect(() => {
    if (documentId && socket) {
      joinDocument(documentId);
      setIsCollaborative(true);
    }
  }, [documentId, socket, joinDocument]);

  useEffect(() => {
    if (!socket) return;

    socket.on('document-state', (content) => {
      setDocumentState({ content: new Delta(content), version: 0 });
    });

    socket.on('document-update', ({ delta, version, userId }) => {
      const newDelta = documentState.content.compose(new Delta(delta));
      setDocumentState({ content: newDelta, version });
      setContent(newDelta.toString());
    });

    return () => {
      socket.off('document-state');
      socket.off('document-update');
    };
  }, [socket, documentState.content]);

  // --- EVENT LISTENERS ---
  useEffect(() => {
    const handleNotesRefresh = () => {
      setContent('');
      setFileName('Untitled Note');
      setHasChanges(false);
    };

    const handleNotesLoad = (event) => {
      const note = event.detail.note;
      setContent(note.content || ''); // FIX: Ensure content is set
      setFileName(note.name || note.title);
      setHasChanges(false);
    };

    const handleNotesTitleUpdate = (event) => {
      setFileName(event.detail.name);
    };

    const handleToggleFindReplace = (event) => {
      setShowFindReplace(event.detail.show);
      setFindReplaceMode(event.detail.mode);
    };

    const handleNotesPrint = () => {
      handlePrint();
    };

    const handleShowNotesPicker = (event) => {
      if (event.detail.action === 'open') {
        setShowDocumentPicker(true);
        setPickerAction('open');
      }
    };

    // Add event listeners
    window.addEventListener('notes-print', handleNotesPrint);
    window.addEventListener('show-notes-picker', handleShowNotesPicker);
    window.addEventListener('notes-refresh', handleNotesRefresh);
    window.addEventListener('notes-load', handleNotesLoad);
    window.addEventListener('notes-title-update', handleNotesTitleUpdate);
    window.addEventListener('toggle-find-replace', handleToggleFindReplace);
    window.addEventListener('show-notes-picker', handleShowNotesPicker);

    // Initialize notes storage if it doesn't exist
    if (!localStorage.getItem('orbitos-notes')) {
      const initialNotes = [
        {
          id: 'default',
          title: 'Welcome to Notes',
          content: 'Welcome to OrbitOS Notes!\n\nStart typing here...',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('orbitos-notes', JSON.stringify(initialNotes));
      localStorage.setItem(
        'orbitos-current-note',
        JSON.stringify(initialNotes[0]),
      );

      setContent(initialNotes[0].content);
      setFileName(initialNotes[0].title);
    } else {
      // Load the most recent note
      const notes = JSON.parse(localStorage.getItem('orbitos-notes'));
      const currentNote = JSON.parse(
        localStorage.getItem('orbitos-current-note') ||
          JSON.stringify(notes[0]),
      );

      setContent(currentNote.content || ''); // FIX: Ensure content is set
      setFileName(currentNote.name || currentNote.title);
    }

    return () => {
      window.removeEventListener('notes-print', handleNotesPrint);
      window.removeEventListener('show-notes-picker', handleShowNotesPicker);
      window.removeEventListener('notes-refresh', handleNotesRefresh);
      window.removeEventListener('notes-load', handleNotesLoad);
      window.removeEventListener('notes-title-update', handleNotesTitleUpdate);
      window.removeEventListener(
        'toggle-find-replace',
        handleToggleFindReplace,
      );
      window.removeEventListener('show-notes-picker', handleShowNotesPicker);
    };
  }, []);

  // --- FILE HANDLERS ---
  const handleNew = () => {
    setContent('');
    setFileName('new.txt');
    setDriveFileId(null);
    setHasChanges(false);
  };

  useEffect(() => {
    // Load available files when component mounts or when picker is shown
    if (showDocumentPicker) {
      loadAvailableFiles();
    }
  }, [showDocumentPicker]);

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

  const handleSaveAsLocal = () => {
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

  const handleSaveLocal = () => {
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
    showNotification('File saved locally', 'success');
  };

  const handleCreateNewLocal = () => {
    const newFileName = prompt(
      'Enter filename for new local file:',
      'untitled.txt',
    );
    if (newFileName) {
      setFileName(newFileName);
      setContent('');
      setDriveFileId(null);
      setHasChanges(false);
      showNotification(`Created new local file: ${newFileName}`, 'success');
    }
  };

  // --- TEXT EDITING HANDLERS ---
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

  // --- COMBINED CONTENT HANDLER ---
  const handleContentChange = (e) => {
    const newContent = e.target.value;

    // Update local state
    setContent(newContent);
    setHasChanges(true);

    // Handle collaborative updates if applicable
    if (isCollaborative && documentId) {
      const delta = new Delta().insert(newContent);
      handleCollaborativeContentChange(newContent, delta.ops);
    } else {
      // Handle local storage updates
      const currentNote = JSON.parse(
        localStorage.getItem('orbitos-current-note') || '{}',
      );
      if (currentNote.id) {
        localStorage.setItem(
          'orbitos-current-note-draft',
          JSON.stringify({
            ...currentNote,
            content: newContent,
          }),
        );
      }
    }
  };

  // --- COLLABORATION SHARING ---
  const handleShareDocument = async (userEmail, permission) => {
    try {
      const response = await fetch('/api/documents/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId, // Make sure documentId is available in scope
          userEmail,
          permission,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use your notification system here
        alert(data.message); // Temporary until notification system is integrated
      } else {
        throw new Error(data.error || 'Failed to share document');
      }
    } catch (error) {
      alert(error.message); // Temporary until notification system is integrated
    }
  };

  const handleOpen = () => {
    setShowDocumentPicker(true);
    setPickerAction('open');
  };

  const handleSave = async () => {
    const currentNote = JSON.parse(
      localStorage.getItem('orbitos-current-note') || '{}',
    );

    // FIX: Get content directly from state instead of querying DOM
    const contentToSave = content; // Use the React state directly

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentNote._id, // Use database ID
          name: fileName, // Use current fileName state
          content: contentToSave, // Use the state content
        }),
      });

      if (response.ok) {
        const { file } = await response.json();

        // Update localStorage with the saved file data
        localStorage.setItem('orbitos-current-note', JSON.stringify(file));

        // Update fileName with the name from server (in case it was changed)
        setFileName(file.name);

        showNotification('Note saved successfully!', 'success');
        setHasChanges(false);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save failed:', error);
      showNotification('Failed to save note', 'error');
    }
  };

  const handleSaveAs = async () => {
    // FIX: Use state content directly
    const contentToSave = content;

    const newFileName = prompt('Save as:', fileName || 'Untitled Note');
    if (!newFileName) return;

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFileName,
          content: contentToSave,
        }),
      });

      if (response.ok) {
        const { file: savedFile } = await response.json();

        // Update current note with the new file
        localStorage.setItem('orbitos-current-note', JSON.stringify(savedFile));

        // Update state
        setFileName(savedFile.name);
        setHasChanges(false);

        showNotification(`Note saved as "${savedFile.name}"`, 'success');
      } else {
        throw new Error('Save As failed');
      }
    } catch (error) {
      console.error('Save As failed:', error);
      showNotification('Failed to save note', 'error');
    }
  };

  const handlePrint = async () => {
    try {
      // Create a print-friendly version of the content
      const printWindow = window.open('', '_blank');
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .print-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .print-content { white-space: pre-wrap; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${fileName}</h1>
              <p>Printed from OrbitOS Notes on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="print-content">${content}</div>
            <div class="no-print">
              <br>
              <button onclick="window.print()">Print</button>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (error) {
      console.error('Print failed:', error);
      showNotification('Failed to open print dialog', 'error');
    }
  };

  // --- USEEFFECT HOOKS FOR SERVICES ---
  useEffect(() => {
    if (dropdownService) {
      const fileMenu = dropdownService
        .getDropdowns()
        .find((d) => d.label === 'File');
      if (fileMenu) {
        fileMenu.items = [
          { label: 'New', action: handleNew },
          { type: 'separator' },
          { label: 'Open', action: handleOpen },
          { label: 'Open Local File', action: handleOpenLocal },
          {
            label: 'Open from Google Drive',
            action: handleOpenFromDrive,
            disabled: !isDriveConnected,
          },
          { type: 'separator' },
          { label: 'Save', action: handleSave, disabled: !hasChanges },
          { label: 'Save As', action: handleSaveAs },
          { label: 'Save As Local', action: handleSaveAsLocal },
          {
            label: 'Save Local',
            action: handleSaveLocal,
            disabled: !hasChanges,
          },
          { type: 'separator' },
          { label: 'Print', action: handlePrint },
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
      keyShortcutService.register('Ctrl+s', handleSave);
      keyShortcutService.register('Ctrl+Shift+s', handleSaveLocal); // New shortcut for local save
      keyShortcutService.register('Ctrl+n', handleNew);
      keyShortcutService.register('Ctrl+Shift+n', handleCreateNewLocal); // New shortcut for new local file
      keyShortcutService.register('Ctrl+f', () => setShowFindReplace(true));
      keyShortcutService.register('Ctrl+h', () => setShowFindReplace(true));
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

      {/* Collaboration Toolbar */}
      {isCollaborative && (
        <CollaborationToolbar
          activeUsers={activeUsers}
          presence={presence}
          onShare={handleShareDocument}
          documentId={documentId}
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
          onChange={handleContentChange}
          onSelect={() => {
            if (textareaRef)
              setHasSelection(
                textareaRef.selectionStart !== textareaRef.selectionEnd,
              );
          }}
          className={`w-full h-full p-3 border-0 outline-none resize-none font-mono text-sm ${theme.app.paper_bg} ${theme.app.text}`}
          placeholder="Start typing..."
        />

        {/* Presence indicators */}
        {isCollaborative &&
          Object.values(presence).map((user) => (
            <div
              key={user.userId}
              className="absolute pointer-events-none"
              style={{ left: user.position?.cursorPosition || 0 }}
            >
              <div className="w-2 h-5 bg-blue-500 animate-pulse" />
              <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                {user.userId}
              </div>
            </div>
          ))}

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
              <strong>Version:</strong> 0.03 (OrbitOS Enhanced with
              Collaboration)
              <br />
              <strong>Developer:</strong> @Gordon.H | Codehubbers
              <br />
              <strong>Contributors:</strong> @dailker
              <br />
              <br />
              Enhanced rich text editor with top bar services, menu system, file
              operations, find and replace, real-time word count, and
              collaborative editing.
            </p>
          </div>
        </div>
      )}

      {showDocumentPicker && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-2xl w-96 max-h-80vh overflow-y-auto ${theme.app.bg} border ${theme.app.border}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${theme.app.text}`}>
                Open Document
              </h2>
              <button
                onClick={() => {
                  setShowDocumentPicker(false);
                  setPickerAction(null);
                }}
                className={`p-1 rounded-full ${theme.app.text_subtle} ${theme.app.button_subtle_hover}`}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Local Files Section */}
              <div>
                <h3 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">
                  Local Files
                </h3>
                <button
                  onClick={() => {
                    handleOpenLocal();
                    setShowDocumentPicker(false);
                  }}
                  className={`w-full p-3 text-left rounded-lg border-2 ${theme.app.button_subtle_hover} ${theme.app.border} mb-2`}
                >
                  <div className="font-semibold">Open Local File</div>
                  <div className="text-sm opacity-75">
                    Open a file from your computer
                  </div>
                </button>
              </div>

              {/* Google Drive Section */}
              {isDriveConnected && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">
                    Cloud Storage
                  </h3>
                  <button
                    onClick={() => {
                      setShowOpenModal(true);
                      setShowDocumentPicker(false);
                    }}
                    className={`w-full p-3 text-left rounded-lg border-2 ${theme.app.button_subtle_hover} ${theme.app.border} mb-2`}
                  >
                    <div className="font-semibold">Open from Google Drive</div>
                    <div className="text-sm opacity-75">
                      Open a file from your Google Drive
                    </div>
                  </button>
                </div>
              )}

              {/* OrbitOS Files Section */}
              <div>
                <h3 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">
                  OrbitOS Files
                </h3>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                  {isLoadingFiles ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm mt-2">Loading files...</p>
                    </div>
                  ) : availableFiles.length > 0 ? (
                    availableFiles.map((file) => (
                      <button
                        key={file._id}
                        onClick={() => {
                          setContent(file.content || '');
                          setFileName(file.name);
                          setHasChanges(false);
                          setShowDocumentPicker(false);

                          // Update current note in localStorage
                          const currentNote = {
                            _id: file._id,
                            name: file.name,
                            content: file.content,
                            lastModified: file.lastModified,
                          };
                          localStorage.setItem(
                            'orbitos-current-note',
                            JSON.stringify(currentNote),
                          );
                        }}
                        className={`w-full p-3 text-left rounded ${theme.app.button_subtle_hover} mb-1`}
                      >
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs opacity-75">
                          {new Date(file.lastModified).toLocaleDateString()} •
                          {file.content
                            ? ` ${file.content.length} characters`
                            : ' Empty'}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No files found</p>
                      <p className="text-sm">
                        Create a new file to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create New File Option */}
              <button
                onClick={() => {
                  handleNew();
                  setShowDocumentPicker(false);
                }}
                className={`w-full p-3 text-left rounded-lg border-2 border-dashed ${theme.app.button_subtle_hover} ${theme.app.border}`}
              >
                <div className="font-semibold">+ Create New File</div>
                <div className="text-sm opacity-75">
                  Start with a blank document
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
