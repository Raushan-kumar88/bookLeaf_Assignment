/**
 * Book data access. Authors only ever see their own books — every query here
 * is scoped by the author's id (passed from req.user.id by the controller).
 */
import { Book } from '../models/book.model.js';

/** All books owned by one author, newest publications first. */
export function getBooksByAuthor(authorId) {
  return Book.find({ author: authorId }).sort({ createdAt: 1 }).lean();
}

/**
 * Fetch a single book but only if it belongs to this author.
 * Used to validate the book dropdown when an author raises a ticket.
 */
export function getAuthorBook(bookId, authorId) {
  return Book.findOne({ _id: bookId, author: authorId });
}
