import { cache } from "react";
import { nestFetch } from "./nest";
import type { Cart } from "./types";

export const getCart = cache(async (): Promise<Cart> => {
  const res = await nestFetch("/cart");
  if (!res.ok) throw new Error(`GET /cart failed with ${res.status}`);
  return res.json() as Promise<Cart>;
})