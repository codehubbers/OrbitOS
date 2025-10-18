class ClipboardService {
  constructor() {
    this.clipboardData = new Map();
  }

  async copyToSharedClipboard(data, documentId, permission = 'view') {
    try {
      // Store in shared context
      this.clipboardData.set(documentId, {
        data,
        timestamp: new Date(),
        owner: this.getCurrentUser(),
        permission,
      });

      // Sync with other collaborators
      if (this.socket) {
        this.socket.emit('clipboard-update', {
          documentId,
          data,
          permission,
        });
      }

      // Update local clipboard :cite[5]
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(
          typeof data === 'string' ? data : JSON.stringify(data),
        );
      }
    } catch (error) {
      console.warn('Failed to access system clipboard:', error);
    }
  }

  async pasteFromSharedClipboard(documentId) {
    try {
      const clipboardItem = this.clipboardData.get(documentId);

      if (!clipboardItem) {
        // Fallback to system clipboard
        if (navigator.clipboard) {
          return await navigator.clipboard.readText();
        }
        return null;
      }

      // Check permissions
      if (this.hasPermission(clipboardItem.permission)) {
        return clipboardItem.data;
      }

      return null;
    } catch (error) {
      console.warn('Failed to read from clipboard:', error);
      return null;
    }
  }

  hasPermission(requiredPermission) {
    const userPermissions = this.getCurrentUserPermissions();
    const permissionHierarchy = { view: 0, comment: 1, edit: 2 };

    return (
      permissionHierarchy[userPermissions] >=
      permissionHierarchy[requiredPermission]
    );
  }
}

export default new ClipboardService();
