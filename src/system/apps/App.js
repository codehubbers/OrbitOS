// src/apps/App.js

/**
 * Base class for all applications. This acts as a manifest,
 * providing the OS with metadata to launch and manage an app.
 */
export default class App {
  /**
   * @param {object} config - The application's configuration.
   * @param {string} config.id - A unique identifier (e.g., 'notes').
   * @param {string} config.name - The display name (e.g., 'Notes').
   * @param {string} config.icon - The emoji or image URL for the icon.
   * @param {string} config.component - The key for the React component in appComponents.
   */
  constructor({ id, name, icon, component }) {
    this.id = id;
    this.processId = Math.random().toString(10).substring(16);
    this.name = name;
    this.icon = icon;
    this.component = component;
  }
}
