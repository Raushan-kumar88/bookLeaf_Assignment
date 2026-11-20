/**
 * Book published through BookLeaf, owned by one author (User).
 *
 * Nullable fields (publicationDate, mrp, royaltyPerCopy, printPartner,
 * lastRoyaltyPayoutDate) are intentional: the dataset includes books still
 * "In Production" that have no price or royalty yet. The app must render these
 * gracefully, so the schema allows null instead of forcing defaults.
 */
import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true, unique: true, index: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    isbn: { type: String },
    genre: { type: String },
    publicationDate: { type: Date, default: null },
    status: { type: String, required: true }, // e.g. "Published & Live"

    // Money (per-copy royalty + lifetime totals). Null until a book is live.
    mrp: { type: Number, default: null },
    royaltyPerCopy: { type: Number, default: null },
    totalCopiesSold: { type: Number, default: 0 },
    totalRoyaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },

    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', bookSchema);
