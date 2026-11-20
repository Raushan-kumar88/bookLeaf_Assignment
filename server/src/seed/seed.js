/**
 * Database seeder.
 *
 * Loads the provided sample dataset (10 authors, 18 books) into MongoDB,
 * creates an admin account, and prints test credentials. Safe to re-run:
 * it clears the app's own collections first (it only touches User/Book/
 * Ticket/Message in the "bookleaf" database — nothing else on the cluster).
 *
 * Run with:  npm run seed
 */
import { readFile } from 'fs/promises';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { ROLES } from '../constants.js';
import { User } from '../models/user.model.js';
import { Book } from '../models/book.model.js';
import { Ticket } from '../models/ticket.model.js';
import { Message } from '../models/message.model.js';

/** Parse a date string to a Date, or null when absent. */
const toDate = (value) => (value ? new Date(value) : null);

/** Map one dataset book record to our Book schema shape. */
const mapBook = (raw, authorObjectId) => ({
  bookId: raw.book_id,
  author: authorObjectId,
  title: raw.title,
  isbn: raw.isbn,
  genre: raw.genre,
  publicationDate: toDate(raw.publication_date),
  status: raw.status,
  mrp: raw.mrp ?? null,
  royaltyPerCopy: raw.author_royalty_per_copy ?? null,
  totalCopiesSold: raw.total_copies_sold ?? 0,
  totalRoyaltyEarned: raw.total_royalty_earned ?? 0,
  royaltyPaid: raw.royalty_paid ?? 0,
  royaltyPending: raw.royalty_pending ?? 0,
  lastRoyaltyPayoutDate: toDate(raw.last_royalty_payout_date),
  printPartner: raw.print_partner ?? null,
  availableOn: raw.available_on ?? [],
});

async function seed() {
  const dataUrl = new URL('./bookleaf_sample_data.json', import.meta.url);
  const { authors } = JSON.parse(await readFile(dataUrl, 'utf-8'));

  await connectDB();

  // Clean slate (idempotent re-seed).
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Ticket.deleteMany({}),
    Message.deleteMany({}),
  ]);
  console.log('[seed] cleared existing collections');

  let bookCount = 0;

  for (const a of authors) {
    // User.create() (not insertMany) so the password-hashing hook runs.
    const user = await User.create({
      authorId: a.author_id,
      name: a.name,
      email: a.email,
      password: env.seedDefaultPassword,
      role: ROLES.AUTHOR,
      phone: a.phone,
      city: a.city,
      joinedDate: toDate(a.joined_date),
    });

    const books = (a.books || []).map((b) => mapBook(b, user._id));
    if (books.length) {
      await Book.insertMany(books);
      bookCount += books.length;
    }
  }

  // One admin for the ops team.
  const admin = await User.create({
    name: 'BookLeaf Admin',
    email: 'admin@bookleaf.com',
    password: env.seedDefaultPassword,
    role: ROLES.ADMIN,
    city: 'Delhi',
    joinedDate: new Date(),
  });

  console.log('\n========================================');
  console.log(' SEED COMPLETE');
  console.log('========================================');
  console.log(` Authors : ${authors.length}`);
  console.log(` Books   : ${bookCount}`);
  console.log(` Admin   : 1`);
  console.log('----------------------------------------');
  console.log(' TEST CREDENTIALS');
  console.log(`   Author : ${authors[0].email}`);
  console.log(`   Admin  : ${admin.email}`);
  console.log(`   Password (all accounts): ${env.seedDefaultPassword}`);
  console.log('========================================\n');

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
