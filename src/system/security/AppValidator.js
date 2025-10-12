// src/system/security/AppValidator.js

export class AppValidator {
  static validateApp(appManifest, appCode) {
    const errors = [];

    // Check required manifest fields
    if (!appManifest.id) errors.push('App ID is required');
    if (!appManifest.name) errors.push('App name is required');
    if (!appManifest.version) errors.push('App version is required');
    if (!appManifest.permissions) errors.push('Permissions array is required');

    // Validate permissions
    const allowedPermissions = ['ui', 'storage', 'network', 'files'];
    appManifest.permissions?.forEach((perm) => {
      if (!allowedPermissions.includes(perm)) {
        errors.push(`Invalid permission: ${perm}`);
      }
    });

    // Check code size (1MB limit)
    if (appCode.length > 1024 * 1024) {
      errors.push('App code exceeds 1MB limit');
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
    ];

    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(appCode)) {
        errors.push(`Dangerous code pattern detected: ${pattern}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateSignature(appData, signature) {
    // In production, verify cryptographic signature
    return signature === 'orbit-signed';
  }
}
