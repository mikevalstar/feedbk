import type { Book } from "../data";
import { useLibrary } from "../library";

const STATUS_LABELS = {
  available: "Available",
  "checked-out": "Checked out",
  overdue: "Overdue",
};

export function BookCard({ book }: { book: Book }) {
  const { cart, addToCart } = useLibrary();
  const inCart = cart.some((item) => item.id === book.id);
  const canCheckOut = book.status === "available" && !inCart;

  return (
    <article className="book-card">
      <div className="book-cover" style={{ background: book.accent }}>
        <span className="book-emoji">{book.cover}</span>
        <span className={`book-status book-status--${book.status}`}>{STATUS_LABELS[book.status]}</span>
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">
          {book.author} · {book.year}
        </p>
        <p className="book-genre">{book.genre}</p>
        {book.dueDate && (
          <p className={book.status === "overdue" ? "book-due book-due--overdue" : "book-due"}>Due {book.dueDate}</p>
        )}
        <button
          type="button"
          className="btn btn-primary book-action"
          disabled={!canCheckOut}
          onClick={() => addToCart(book)}
        >
          {inCart ? "In checkout" : book.status === "available" ? "Check out" : "Unavailable"}
        </button>
      </div>
    </article>
  );
}
