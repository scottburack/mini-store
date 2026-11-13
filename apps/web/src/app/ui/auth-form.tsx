"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthFormState } from "@/app/lib/auth-actions";

const copy = {
  login: {
    title: "Log in",
    button: "Log in",
    pending: "Logging in…",
    prompt: "No account yet?",
    linkHref: "/register",
    linkText: "Register",
  },
  register: {
    title: "Create an account",
    button: "Register",
    pending: "Creating account…",
    prompt: "Already have an account?",
    linkHref: "/login",
    linkText: "Log in",
  },
} as const;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    mode === "login" ? login : register,
    {},
  );
  const text = copy[mode];

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email}
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? text.pending : text.button}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        {text.prompt}{" "}
        <Link href={text.linkHref} className="underline">
          {text.linkText}
        </Link>
      </p>
    </main>
  );
}
