"use server";

import { redirect } from "next/navigation";
import { destroySession, loginWithPassword } from "@/lib/auth";

export async function loginAction(_: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const session = await loginWithPassword(email, password);
  if (!session) return { error: "Correo o contraseña incorrectos." };
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
