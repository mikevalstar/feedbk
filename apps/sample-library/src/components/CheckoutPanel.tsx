import { useState } from "react";
import { useLibrary } from "../library";

export function CheckoutPanel() {
  const { cart, removeFromCart, clearCart } = useLibrary();
  const [confirmed, setConfirmed] = useState(false);

  const completeCheckout = () => {
    clearCart();
    setConfirmed(true);
  };

  return (
    <section className="checkout-panel" aria-label="Checkout">
      <h2 className="section-title">🧺 Checkout</h2>
      {confirmed && cart.length === 0 ? (
        <div className="checkout-confirmed">
          <p>✅ All set! Your books are due back in 3 weeks.</p>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmed(false)}>
            Start another checkout
          </button>
        </div>
      ) : cart.length === 0 ? (
        <p className="muted">
          Nothing here yet — pick something from the <strong>Books</strong> page.
        </p>
      ) : (
        <div className="checkout-contents">
          <ul className="checkout-list">
            {cart.map((book) => (
              <li key={book.id} className="checkout-item">
                <span className="checkout-cover" style={{ background: book.accent }}>
                  {book.cover}
                </span>
                <span className="checkout-titles">
                  <span className="checkout-title">{book.title}</span>
                  <span className="checkout-author">{book.author}</span>
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => removeFromCart(book.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="checkout-summary">
            <span>
              {cart.length} {cart.length === 1 ? "book" : "books"} · due in 3 weeks
            </span>
            <button type="button" className="btn btn-primary" onClick={completeCheckout}>
              Complete checkout
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
