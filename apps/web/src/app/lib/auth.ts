import { cookies } from "next/headers";
import { cache } from "react";
import { API_URL } from "./api";
import type { User } from "./types";

export const AUTH_COOKIE = "access_token";

// Wrapped in React's cache() so the header and a page can both call it in the
// same request but Nest is only asked once.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `${AUTH_COOKIE}=${token}`}
  })
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /auth/me failed with ${res.status}`);
  return res.json() as Promise<User>;
})