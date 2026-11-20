/**
 * User = an author OR an admin (one collection, separated by `role`).
 *
 * Authors are seeded from the sample dataset; admins are created by the seeder.
 * Passwords are never stored in plain text — the pre-save hook hashes them, and
 * `password` is excluded from queries by default (`select: false`).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants.js';

const userSchema = new mongoose.Schema(
  {
    // Business id from the dataset (e.g. "AUTH001"). Admins don't have one.
    authorId: { type: String, unique: true, sparse: true, index: true },

    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.AUTHOR,
      index: true,
    },

    // Author profile (optional for admins)
    phone: { type: String },
    city: { type: String },
    joinedDate: { type: Date },
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare a plaintext candidate against the stored hash (used at login).
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash in JSON responses.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
