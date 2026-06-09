import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { BOOKS, type Book } from "./data";

type LibraryContextValue = {
  books: Book[];
  cart: Book[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [cartIds, setCartIds] = useState([] as string[]);

  const value = useMemo(() => {
    const cart = cartIds
      .map((id) => BOOKS.find((book) => book.id === id))
      .filter((book): book is Book => !!book);
    return {
      books: BOOKS,
      cart,
      addToCart: (book: Book) =>
        setCartIds((prev) => (prev.includes(book.id) ? prev : [...prev, book.id])),
      removeFromCart: (bookId: string) => setCartIds((prev) => prev.filter((id) => id !== bookId)),
      clearCart: () => setCartIds([]),
    };
  }, [cartIds]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
