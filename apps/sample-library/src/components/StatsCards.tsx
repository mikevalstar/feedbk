import { useLibrary } from "../library";

export function StatsCards() {
  const { books } = useLibrary();
  const checkedOut = books.filter((book) => book.status === "checked-out").length;
  const overdue = books.filter((book) => book.status === "overdue").length;

  const stats = [
    { label: "Books in catalog", value: books.length, icon: "📖" },
    { label: "Checked out", value: checkedOut, icon: "👜" },
    { label: "Overdue", value: overdue, icon: "⏰" },
    { label: "Active members", value: 214, icon: "🪪" },
  ];

  return (
    <section className="stats-cards" aria-label="Library statistics">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <span className="stat-icon">{stat.icon}</span>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-label">{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
