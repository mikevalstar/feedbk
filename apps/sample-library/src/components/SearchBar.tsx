const GENRES = ["All", "Fiction", "Fantasy", "Non-fiction", "Mystery", "Adventure", "Memoir", "Romance", "Science"];

type SearchBarProps = {
  query: string;
  genre: string;
  onQueryChange: (value: string) => void;
  onGenreChange: (value: string) => void;
};

export function SearchBar({ query, genre, onQueryChange, onGenreChange }: SearchBarProps) {
  return (
    <section className="search-bar" aria-label="Book search">
      <input
        className="search-input"
        type="search"
        placeholder="Search by title or author…"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <div className="genre-chips">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            className={g === genre ? "chip chip-active" : "chip"}
            onClick={() => onGenreChange(g)}
          >
            {g}
          </button>
        ))}
      </div>
    </section>
  );
}
