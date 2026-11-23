"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "./api";
import { AUTH_COOKIE } from "./auth";
import { nestFetch, relayCookies } from "./nest";

export type AuthFormState = { error?: string; email?: string };

export async function login(_prev: AuthFormState, formData: FormData) {
  return authenticate("/auth/login", formData);
}

export async function register(_prev: AuthFormState, formData: FormData) {
  return authenticate("/auth/register", formData);
}

export async function logout() {
  // The JWT is stateless, so there's nothing to revoke in Nest: dropping the
  // browser's cookie is what logs the user out.
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/");
}

async function authenticate(
  path: "/auth/login" | "/auth/register",
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await nestFetch(path, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return { error: await errorMessage(res), email };
  }

  // Relays access_token (set) and cart_id (cleared after the merge).
  const changed = await relayCookies(res);
  if (!changed.includes(AUTH_COOKIE)) {
    return { error: "Something went wrong. Please try again.", email };
  }

  redirect("/");
}

async function errorMessage(res: Response): Promise<string> {
  if (res.status === 401) return "Invalid email or password.";
  if (res.status === 409) return "An account with that email already exists.";

  const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  if (Array.isArray(body?.message)) return body.message.join(". ");
  return body?.message ?? "Something went wrong. Please try again.";
}
