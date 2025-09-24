// src/system/services/TopBarDropdownService.js

export default class TopBarDropdownService {
  constructor() {
    this.dropdowns = [];
  }

  addDropdown(label, items) {
    this.dropdowns.push({ label, items });
  }

  getDropdowns() {
    return this.dropdowns;
  }

  createFileDropdown(handlers) {
    return {
      label: 'File',
      items: [
        { label: 'New', action: handlers.onNew },
        { type: 'separator' },
        { label: 'Open', action: handlers.onOpen, disabled: true },
        { label: 'Open Local File', action: handlers.onOpenLocal },
        { type: 'separator' },
        { label: 'Save', action: handlers.onSave, disabled: !handlers.hasChanges },
        { label: 'Save As', action: handlers.onSaveAs },
        { type: 'separator' },
        { label: 'Print', action: handlers.onPrint }
      ]
    };
  }

  createEditDropdown(handlers) {
    return {
      label: 'Edit',
      items: [
        { label: 'Undo', action: handlers.onUndo },
        { label: 'Redo', action: handlers.onRedo },
        { type: 'separator' },
        { label: 'Cut', action: handlers.onCut },
        { label: 'Copy', action: handlers.onCopy },
        { label: 'Paste', action: handlers.onPaste }
      ]
    };
  }

  createSearchDropdown(handlers) {
    return {
      label: 'Search',
      items: [
        { label: 'Find...', action: handlers.onFind, shortcut: 'Ctrl+F' },
        { label: 'Select and Find Next', action: handlers.onSelectFindNext, shortcut: 'Ctrl+F3', disabled: handlers.hasSelection === false },
        { type: 'separator' },
        { label: 'Replace...', action: handlers.onReplace, shortcut: 'Ctrl+H' }
      ]
    };
  }
}