import { useState } from 'react';

export default function NotesApp() {
  const [notes, setNotes] = useState('Welcome to Notes!\n\nStart typing your notes here...');

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-full p-4 border-none outline-none resize-none"
          placeholder="Start typing your notes..."
        />
      </div>
      <div className="border-t p-2 bg-gray-50 text-sm text-gray-600">
        {notes.length} characters
      </div>
    </div>
  );
}