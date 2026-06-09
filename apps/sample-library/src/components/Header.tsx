import { NavLink } from "react-router-dom";
import { useLibrary } from "../library";

export function Header() {
  const { cart } = useLibrary();
  return (
    <header className="site-header">
      <div className="brand">
        <span className="brand-mark">📚</span>
        <div>
          <div className="brand-name">Maple Street Library</div>
          <div className="brand-tag">Open daily 9–6 · Est. 1962</div>
        </div>
      </div>
      <nav className="site-nav">
        <NavLink to="/books" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Books
        </NavLink>
        <NavLink to="/checkout" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Checkout{cart.length > 0 ? ` (${cart.length})` : ""}
        </NavLink>
      </nav>
    </header>
  );
}
