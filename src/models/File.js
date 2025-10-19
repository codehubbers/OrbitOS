import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, default: '' },
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
  lastModified: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: false },
});

export default mongoose.models.File || mongoose.model('File', FileSchema);
