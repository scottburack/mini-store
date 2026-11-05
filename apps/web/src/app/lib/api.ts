import { notFound } from "next/navigation";
import type { Paginated, Product } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function apiGet<T>(path: string, notFoundOn: number[] = [404]): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (notFoundOn.includes(res.status)) notFound();
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

export function getProducts(page: number, pageSize = 8) {
  return apiGet<Paginated<Product>>(`/products?page=${page}&pageSize=${pageSize}`);
}

export function getProduct(id: string) {
  // The API returns 400 for a malformed id; to a shopper that's just "not found".
  return apiGet<Product>(`/products/${encodeURIComponent(id)}`, [400, 404]);
}
