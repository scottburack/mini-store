"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "./api";
import { AUTH_COOKIE } from "./auth";

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

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return { error: await errorMessage(res), email };
  }

  // Nest's Set-Cookie came back to this server, not the browser. Relay it.
  const token = readSetCookie(res.headers.getSetCookie(), AUTH_COOKIE);
  if (!token) {
    return { error: "Something went wrong. Please try again.", email };
  }

  (await cookies()).set(AUTH_COOKIE, token.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: token.maxAge,
  });

  redirect("/");
}

async function errorMessage(res: Response): Promise<string> {
  if (res.status === 401) return "Invalid email or password.";
  if (res.status === 409) return "An account with that email already exists.";

  const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  if (Array.isArray(body?.message)) return body.message.join(". ");
  return body?.message ?? "Something went wrong. Please try again.";
}

function readSetCookie(headers: string[], name: string) {
  for (const header of headers) {
    const [pair, ...attributes] = header.split(";").map((part) => part.trim());
    const eq = pair.indexOf("=");
    if (pair.slice(0, eq) !== name) continue;

    const maxAge = attributes.find((attr) => attr.toLowerCase().startsWith("max-age="));
    return {
      value: pair.slice(eq + 1),
      maxAge: maxAge ? Number(maxAge.split("=")[1]) : undefined,
    };
  }
  return null;
}
