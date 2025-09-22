// src/services/AppRegistry.js

import NotesApp from '../apps/NotesApp';
import SettingsApp from '../apps/SettingsApp';
import BrowserApp from '../apps/BrowserApp';
import MonitorApp from '../apps/MonitorApp';

/**
 * A central registry for all available applications.
 * This provides a single source of truth for the entire OS.
 * To add a new app, simply create its definition and import it here.
 */
class AppRegistry {
  constructor() {
    this.apps = [NotesApp, SettingsApp, BrowserApp, MonitorApp];
  }

  /**
   * Returns a list of all registered applications.
   * @returns {App[]} An array of App instances.
   */
  getAllApps() {
    return this.apps;
  }
}

export default new AppRegistry();
