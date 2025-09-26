// src/system/services/WindowTopBarKeyShortcutRegistrationService.js

export default class WindowTopBarKeyShortcutRegistrationService {
  constructor(windowElement) {
    this.shortcuts = new Map();
    this.isListening = false;
    this.windowElement = windowElement;
    this.isWindowFocused = false;
  }

  register(key, callback) {
    this.shortcuts.set(key, callback);
    if (!this.isListening) {
      this.startListening();
    }
  }

  unregister(key) {
    this.shortcuts.delete(key);
    if (this.shortcuts.size === 0) {
      this.stopListening();
    }
  }

  startListening() {
    this.isListening = true;
    document.addEventListener('keydown', this.handleKeyDown);
    if (this.windowElement) {
      this.windowElement.addEventListener('focusin', this.handleFocusIn);
      this.windowElement.addEventListener('focusout', this.handleFocusOut);
    }
  }

  stopListening() {
    this.isListening = false;
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.windowElement) {
      this.windowElement.removeEventListener('focusin', this.handleFocusIn);
      this.windowElement.removeEventListener('focusout', this.handleFocusOut);
    }
  }

  handleKeyDown = (event) => {
    // Only handle shortcuts if this window is focused
    if (!this.isWindowFocused) return;
    
    const key = this.getKeyString(event);
    const callback = this.shortcuts.get(key);
    if (callback) {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  };

  handleFocusIn = () => {
    this.isWindowFocused = true;
  };

  handleFocusOut = () => {
    this.isWindowFocused = false;
  };

  getKeyString(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    // Handle special keys
    let key = event.key;
    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toLowerCase();
    
    parts.push(key);
    return parts.join('+');
  }

  cleanup() {
    this.stopListening();
    this.shortcuts.clear();
  }
}