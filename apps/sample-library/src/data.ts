export type BookStatus = "available" | "checked-out" | "overdue";

export type Book = {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  cover: string; // emoji stand-in for cover art
  accent: string; // css color for the cover block
  status: BookStatus;
  dueDate: string | null;
};

export type Activity = {
  id: string;
  member: string;
  action: string;
  book: string;
  when: string;
};

export const BOOKS: Book[] = [
  { id: "bk-1", title: "The Lighthouse Keeper", author: "Mara Ellison", year: 2019, genre: "Fiction", cover: "🏝️", accent: "#cfe3f5", status: "available", dueDate: null },
  { id: "bk-2", title: "Gardens of Glass", author: "Theo Brandt", year: 2021, genre: "Fantasy", cover: "🪴", accent: "#d8f0d4", status: "checked-out", dueDate: "2026-06-20" },
  { id: "bk-3", title: "A Brief History of Bread", author: "Ines Calloway", year: 2017, genre: "Non-fiction", cover: "🍞", accent: "#f7e6c4", status: "overdue", dueDate: "2026-05-28" },
  { id: "bk-4", title: "Night Trains", author: "Sofia Marek", year: 2023, genre: "Mystery", cover: "🚂", accent: "#e2d9f3", status: "available", dueDate: null },
  { id: "bk-5", title: "The Cartographer's Daughter", author: "Liam Okafor", year: 2020, genre: "Adventure", cover: "🗺️", accent: "#f5d9cf", status: "available", dueDate: null },
  { id: "bk-6", title: "Sourdough Summers", author: "Priya Nair", year: 2022, genre: "Memoir", cover: "🌾", accent: "#f9efc7", status: "checked-out", dueDate: "2026-06-15" },
  { id: "bk-7", title: "Code & Candlelight", author: "Ada Wexler", year: 2024, genre: "Romance", cover: "🕯️", accent: "#fbd9e8", status: "available", dueDate: null },
  { id: "bk-8", title: "The Quiet Orchard", author: "Hugo Lindqvist", year: 2016, genre: "Fiction", cover: "🍎", accent: "#dff0e0", status: "overdue", dueDate: "2026-06-01" },
  { id: "bk-9", title: "Storm Atlas", author: "Renata Cruz", year: 2025, genre: "Science", cover: "🌩️", accent: "#d6e4f7", status: "available", dueDate: null },
];

export const RECENT_ACTIVITY: Activity[] = [
  { id: "act-1", member: "Jonah P.", action: "returned", book: "Night Trains", when: "Today, 10:12" },
  { id: "act-2", member: "Mira S.", action: "checked out", book: "Gardens of Glass", when: "Today, 9:41" },
  { id: "act-3", member: "Theo B.", action: "renewed", book: "Sourdough Summers", when: "Yesterday, 16:03" },
  { id: "act-4", member: "Ada W.", action: "placed a hold on", book: "Storm Atlas", when: "Yesterday, 11:27" },
  { id: "act-5", member: "Renata C.", action: "returned", book: "A Brief History of Bread", when: "Mon, 14:55" },
];

export const MEMBER = {
  name: "Mike Valstar",
  cardNumber: "MSL-2041-7783",
  memberSince: "2019",
  booksOut: 2,
  holds: 1,
  fines: "$1.50",
};
