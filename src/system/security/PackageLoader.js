// src/system/security/PackageLoader.js

import { AppValidator } from './AppValidator';

export class PackageLoader {
  static async loadApprovedApps() {
    try {
      const response = await fetch('/api/packages/approved');
      const packages = await response.json();
      return packages.filter((pkg) => this.validatePackage(pkg));
    } catch (error) {
      console.error('Failed to load approved apps:', error);
      return [];
    }
  }

  static async loadDevApp(folderPath) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Dev apps only allowed in development mode');
    }

    try {
      const response = await fetch(
        `/api/packages/dev?path=${encodeURIComponent(folderPath)}`,
      );
      const appData = await response.json();

      const validation = AppValidator.validateApp(
        appData.manifest,
        appData.code,
      );
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        ...appData,
        isDev: true,
        signature: 'dev-unsigned',
      };
    } catch (error) {
      console.error('Failed to load dev app:', error);
      throw error;
    }
  }

  static validatePackage(pkg) {
    return (
      pkg.signature &&
      pkg.manifest &&
      AppValidator.validateSignature(pkg, pkg.signature)
    );
  }

  static createSandboxedComponent(appCode, manifest) {
    // Create isolated React component
    const sandboxedCode = `
      (function() {
        const React = arguments[0];
        const orbitAPI = arguments[1];
        
        // Restricted globals
        const window = undefined;
        const document = undefined;
        const eval = undefined;
        const Function = undefined;
        
        ${appCode}
        
        return typeof App !== 'undefined' ? App : null;
      })
    `;

    try {
      const componentFactory = new Function('return ' + sandboxedCode)();
      return componentFactory;
    } catch (error) {
      console.error('Failed to create sandboxed component:', error);
      return null;
    }
  }
}
