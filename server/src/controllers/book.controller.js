import { asyncHandler } from '../utils/asyncHandler.js';
import * as bookService from '../services/book.service.js';

/** GET /api/books  — the logged-in author's books. */
export const getMyBooks = asyncHandler(async (req, res) => {
  const books = await bookService.getBooksByAuthor(req.user.id);
  res.json({ count: books.length, books });
});
