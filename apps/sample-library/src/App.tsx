import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { LibraryProvider } from "./library";
import { BooksPage } from "./pages/BooksPage";
import { CheckoutPage } from "./pages/CheckoutPage";

export function App() {
  return (
    <LibraryProvider>
      <div className="app-shell">
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/books" replace />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
        <footer className="site-footer">Maple Street Library — internal design review build</footer>
      </div>
    </LibraryProvider>
  );
}
