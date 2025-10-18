import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: Array, default: [] }, // Quill Delta operations
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permission: {
        type: String,
        enum: ['view', 'comment', 'edit'],
        default: 'view',
      },
    },
  ],
  permissions: {
    public: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    allowCopy: { type: Boolean, default: true }, // Clipboard sharing control :cite[5]
  },
  version: { type: Number, default: 0 },
  lastModified: { type: Date, default: Date.now },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.models.Document ||
  mongoose.model('Document', documentSchema);
