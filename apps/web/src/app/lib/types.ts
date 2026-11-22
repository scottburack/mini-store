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

export type CartItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: number;
}

export type Cart = {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
}