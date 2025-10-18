export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await verifyToken(req);
      const document = await Document.findById(req.params.documentId);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check ownership
      if (document.owner.equals(user._id)) {
        return next();
      }

      // Check collaborator permissions
      const collaboration = document.collaborators.find((collab) =>
        collab.user.equals(user._id),
      );

      if (
        !collaboration ||
        !hasSufficientPermission(collaboration.permission, requiredPermission)
      ) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(403).json({ error: 'Permission denied' });
    }
  };
};

const hasSufficientPermission = (userPermission, requiredPermission) => {
  const hierarchy = { view: 0, comment: 1, edit: 2 };
  return hierarchy[userPermission] >= hierarchy[requiredPermission];
};
