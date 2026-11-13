import type { Metadata } from "next";
import { AuthForm } from "@/app/ui/auth-form";

export const metadata: Metadata = { title: "Log in · Mini Store" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
