// src/system/services/TopBarInfoAboutService.js

export default class TopBarInfoAboutService {
  constructor(appInfo) {
    this.appInfo = appInfo;
  }

  getInfoIcon() {
    return {
      show: true,
      onClick: this.appInfo.onShowAbout
    };
  }
}