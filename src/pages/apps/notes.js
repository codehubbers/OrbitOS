// src/pages/apps/notes.js

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useApp } from '@/context/AppContext';
import { themes } from '@/system/themes';

// Import icons for the UI
import {
  FolderOpenIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Dynamically import ReactQuill to prevent SSR errors.
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p className="p-4 text-gray-500">Loading Editor...</p>,
});

/**
 * A feature-rich rich text editor application for OrbitOS.
 * This version uses a robust flexbox layout and a floating element for the word count
 * to ensure all UI is visible regardless of parent container behavior.
 */
const Notes = () => {
  const { state } = useApp();
  const currentTheme = themes[state.theme];

  // --- STATE MANAGEMENT ---
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // --- EDITOR & TOOLBAR CONFIGURATION ---
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  // --- REACT HOOKS & LOGIC HANDLERS ---
  useEffect(() => {
    if (typeof content === 'string') {
      const textOnly = content.replace(/<[^>]*>?/gm, '');
      const words = textOnly.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length === 1 && words[0] === '' ? 0 : words.length);
    }
  }, [content]);

  const handleSave = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'MyNote.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleLoad = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setContent(e.target.result);
    reader.readAsText(file);
  };

  const handleReplaceAll = () => {
    if (!findText) {
      alert('Please enter text to find.');
      return;
    }
    setContent((prevContent) => prevContent.replaceAll(findText, replaceText));
  };

  // --- JSX RENDER ---
  return (
    // revert to a clean flexbox layout. 'overflow-hidden' is key.
    <div
      className={`flex flex-col h-full w-full ${state.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} overflow-hidden`}
    >
      {/* Menu Bar: 'flex-shrink-0' prevents this from being squeezed. */}
      <header
        className={`px-3 h-12 border-b ${state.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} flex items-center gap-3 text-sm z-20 shadow-sm flex-shrink-0`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 p-2 rounded-md ${state.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
            title="Save file"
          >
            <ArrowDownTrayIcon
              className={`h-5 w-5 ${currentTheme.textSecondary}`}
            />{' '}
            <span className="font-medium">Save</span>
          </button>
          <label
            className={`flex items-center gap-2 p-2 rounded-md ${state.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} cursor-pointer`}
            title="Load file"
          >
            <FolderOpenIcon
              className={`h-5 w-5 ${currentTheme.textSecondary}`}
            />{' '}
            <span className="font-medium">Load</span>
            <input
              type="file"
              onChange={handleLoad}
              className="hidden"
              accept=".txt,.html"
            />
          </label>
        </div>
        <div
          className={`w-px h-6 ${state.theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}
        />
        <div className="flex items-center">
          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className={`flex items-center gap-2 p-2 rounded-md ${showFindReplace ? 'bg-blue-100 text-blue-700' : state.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
            title="Find and Replace"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />{' '}
            <span className="font-medium">Find & Replace</span>
          </button>
        </div>
        <div className="flex-grow" />
        <button
          onClick={() => setShowAboutModal(true)}
          className={`flex items-center gap-2 p-2 rounded-md ${state.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
          title="About this app"
        >
          <InformationCircleIcon
            className={`h-5 w-5 ${currentTheme.textSecondary}`}
          />
        </button>
      </header>

      {/* Find & Replace Panel: Also gets 'flex-shrink-0'. */}
      {showFindReplace && (
        <div
          className={`p-2 border-b ${state.theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} flex items-center gap-2 text-sm shadow-md flex-shrink-0 z-10`}
        >
          <input
            type="text"
            placeholder="Find"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="px-2 py-1 border rounded-md w-48 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Replace with"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="px-2 py-1 border rounded-md w-48 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleReplaceAll}
            className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Replace All
          </button>
        </div>
      )}

      {/* Main Content Area: 'relative' to position the word count. 'flex-grow' and 'h-0' make it fill the space. */}
      <main className="relative flex-grow h-0">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          className="h-full w-full border-0"
        />
        {/* Floating Word Count. Sits on top of the editor in the bottom-right corner. */}
        <div
          className={`absolute bottom-4 right-5 z-10 ${state.theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-white'} text-xs font-mono px-3 py-1 rounded-full shadow-lg opacity-80 pointer-events-none`}
        >
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </main>

      {/* "About" */}
      {showAboutModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className={`${state.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-2xl w-96`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${currentTheme.text}`}>
                About Notes Editor
              </h2>
              <button
                onClick={() => setShowAboutModal(false)}
                className={`p-1 rounded-full ${currentTheme.textSecondary} ${state.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className={currentTheme.textSecondary}>
              <strong>Version:</strong> 0.01 (OrbitOS Stage 1)
              <br />
              <strong>Developer:</strong> @Gordon.H | Codehubbers
              <br />
              <br />
              This is an enhanced built-in rich text editor built for the
              OrbitOS project. It includes features like file saving/loading,
              find and replace, and real-time word count.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
