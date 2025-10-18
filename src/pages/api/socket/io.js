import { Server } from 'socket.io';
import { verifyToken } from '../../../lib/auth';
import Document from '../../../models/Document';
import { Delta } from 'quill-delta';

const socketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socket/io',
      cors: { origin: '*' },
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await verifyToken({
          headers: { authorization: `Bearer ${token}` },
        });
        socket.userId = user._id;
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.userId);

      // Join document room
      socket.on('join-document', async (documentId) => {
        socket.join(documentId);

        // Notify others of new user
        socket.to(documentId).emit('user-joined', {
          userId: socket.userId,
          timestamp: new Date(),
        });

        // Send current document state
        const document = await Document.findById(documentId);
        socket.emit('document-state', document.content);
      });

      // Handle document changes with Operational Transform
      socket.on('document-change', async (data) => {
        const { documentId, delta, version } = data;

        const document = await Document.findById(documentId);
        const currentDelta = new Delta(document.content);
        const incomingDelta = new Delta(delta);

        // Transform deltas to handle concurrent edits :cite[1]
        const transformedDelta = currentDelta.transform(incomingDelta, true);
        const newDelta = currentDelta.compose(transformedDelta);

        // Update document
        await Document.findByIdAndUpdate(documentId, {
          content: newDelta.ops,
          lastModified: new Date(),
          lastModifiedBy: socket.userId,
          version: version + 1,
        });

        // Broadcast to other users
        socket.to(documentId).emit('document-update', {
          delta: transformedDelta,
          version: version + 1,
          userId: socket.userId,
        });
      });

      // Presence indicators :cite[8]
      socket.on('user-activity', (data) => {
        socket.to(data.documentId).emit('user-active', {
          userId: socket.userId,
          activity: data.activity,
          position: data.position,
          timestamp: new Date(),
        });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default socketHandler;
