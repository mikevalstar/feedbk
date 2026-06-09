import { useState } from "react";
import { BookCard } from "../components/BookCard";
import { OverdueNotices } from "../components/OverdueNotices";
import { SearchBar } from "../components/SearchBar";
import { StatsCards } from "../components/StatsCards";
import { useLibrary } from "../library";

export function BooksPage() {
  const { books } = useLibrary();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [showOverdue, setShowOverdue] = useState(true);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = books.filter((book) => {
    const matchesQuery =
      !normalizedQuery ||
      book.title.toLowerCase().includes(normalizedQuery) ||
      book.author.toLowerCase().includes(normalizedQuery);
    const matchesGenre = genre === "All" || book.genre === genre;
    return matchesQuery && matchesGenre;
  });

  return (
    <main className="page books-page">
      <div className="page-heading">
        <h1>Browse the catalog</h1>
        <label className="toggle">
          <input type="checkbox" checked={showOverdue} onChange={(event) => setShowOverdue(event.target.checked)} />
          Show overdue notices
        </label>
      </div>

      <StatsCards />
      <SearchBar query={query} genre={genre} onQueryChange={setQuery} onGenreChange={setGenre} />
      {showOverdue && <OverdueNotices />}

      {filtered.length === 0 ? (
        <p className="muted empty-results">
          No books match “{query}” in {genre}.
        </p>
      ) : (
        <div className="book-grid">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </main>
  );
}
