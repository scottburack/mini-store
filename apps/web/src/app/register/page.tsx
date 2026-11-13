import type { Metadata } from "next";
import { AuthForm } from "@/app/ui/auth-form";

export const metadata: Metadata = { title: "Register · Mini Store" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
