// src/system/services/TopBarService.js

export default class TopBarService {
  constructor(appId, appName, icon = null) {
    this.appId = appId;
    this.appName = appName;
    this.icon = icon;
    this.title = 'new.txt';
    this.customAttributes = {};
  }

  setTitle(title) {
    this.title = title;
  }

  setCustomAttribute(key, value) {
    this.customAttributes[key] = value;
  }

  getCustomAttribute(key) {
    return this.customAttributes[key];
  }

  getDisplayTitle() {
    const hasChanges = this.getCustomAttribute('hasChanges');
    return `${hasChanges ? '• ' : ''}${this.title}`;
  }

  renderTopBar(onMinimize, onClose) {
    return {
      icon: this.icon,
      title: this.getDisplayTitle(),
      onMinimize,
      onClose
    };
  }
}