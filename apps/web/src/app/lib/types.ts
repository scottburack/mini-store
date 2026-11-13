export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
}

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type User = {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
}