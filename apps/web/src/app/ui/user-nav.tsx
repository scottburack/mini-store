import Link from "next/link";
import { getCurrentUser } from "@/app/lib/auth";
import { logout } from "@/app/lib/auth-actions";


export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <nav className="flex gap-4 text-sm">
        <Link href="/login" className="hover:underline">Log in</Link>
        <Link href="/register" className="hover:underline">Register</Link>
      </nav>
    )
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-zinc-500">{user.email}</span>
      <form action={logout}>
        <button type="submit" className="hover:underline">
          Log out
        </button>
      </form>
    </div>
  );
}