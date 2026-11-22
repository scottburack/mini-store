import { cookies } from "next/headers";
import { API_URL } from "./api";
import { AUTH_COOKIE } from "./auth";

export const CART_COOKIE = "cart_id";

// The only cookies we pass between the browser and Nest.
const RELAYED_COOKIES = [AUTH_COOKIE, CART_COOKIE];

/** Server-side fetch to Nest that forwards the browser's auth and cart cookies. */
export async function nestFetch(path: string, init: RequestInit = {}) {
  const store = await cookies();
  const cookieHeader = RELAYED_COOKIES.flatMap((name) => {
    const value = store.get(name)?.value;
    return value ? [`${name}=${value}`] : [];
  }).join("; ");

  const headers = new Headers(init.headers);
  if (cookieHeader) headers.set("Cookie", cookieHeader);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(`${API_URL}${path}`, { ...init, headers });
}

/**
 * Copies Nest's Set-Cookie headers (set or clear) onto the browser's response.
 * Only call from a Server Action or Route Handler. Returns the names it changed.
 */
export async function relayCookies(res: Response): Promise<string[]> {
  const store = await cookies();
  const changed: string[] = [];

  for (const header of res.headers.getSetCookie()) {
    const cookie = parseSetCookie(header);
    if (!cookie || !RELAYED_COOKIES.includes(cookie.name)) continue;

    if (cookie.expired) {
      store.delete(cookie.name);
    } else {
      store.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: cookie.maxAge,
      });
    }
    changed.push(cookie.name);
  }
  return changed;
}

function parseSetCookie(header: string) {
  const [pair, ...attributes] = header.split(";").map((part) => part.trim());
  const eq = pair.indexOf("=");
  if (eq < 1) return null;

  const attr = (key: string) =>
    attributes.find((a) => a.toLowerCase().startsWith(`${key}=`))?.split("=")[1];
  const maxAge = attr("max-age");
  const expires = attr("expires");
  const value = pair.slice(eq + 1);

  return {
    name: pair.slice(0, eq),
    value,
    maxAge: maxAge ? Number(maxAge) : undefined,
    // Express's clearCookie sends an empty value with Expires set to 1970.
    expired:
      value === "" ||
      (maxAge !== undefined && Number(maxAge) <= 0) ||
      (expires !== undefined && Date.parse(expires) <= Date.now()),
  };
}
