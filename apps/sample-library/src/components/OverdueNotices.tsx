import { useLibrary } from "../library";

/**
 * This section can be hidden with the toggle on the Books page — useful for
 * testing how feedback comments behave when their component disappears.
 */
export function OverdueNotices() {
  const { books } = useLibrary();
  const overdue = books.filter((book) => book.status === "overdue");

  return (
    <section className="overdue-notices" aria-label="Overdue notices">
      <h2 className="section-title">⏰ Overdue notices</h2>
      {overdue.length === 0 ? (
        <p className="muted">Nothing is overdue. Lovely.</p>
      ) : (
        <ul className="overdue-list">
          {overdue.map((book) => (
            <li key={book.id} className="overdue-item">
              <span className="overdue-book">
                {book.cover} {book.title}
              </span>
              <span className="overdue-due">was due {book.dueDate}</span>
              <button type="button" className="btn btn-ghost">
                Send reminder
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
