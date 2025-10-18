import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6,
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  avatar: {
    type: String,
    default: null,
  },
  roles: [
    {
      type: String,
      enum: ['user', 'admin', 'editor'],
      default: 'user',
    },
  ],
  permissions: {
    canEdit: { type: Boolean, default: true },
    canShare: { type: Boolean, default: true },
    canDelete: { type: Boolean, default: false },
    maxFileSize: { type: Number, default: 10485760 }, // 10MB
    allowedFileTypes: [{ type: String }],
  },
  preferences: {
    theme: { type: String, default: 'light' },
    wallpaper: { type: String, default: '/backgrounds/orbitos-default.jpg' },
    notifications: { type: Boolean, default: true },
  },
  installedApps: [
    {
      appId: { type: String, required: true },
      manifest: { type: Object, required: true },
      downloadUrl: { type: String, required: true },
      installedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
