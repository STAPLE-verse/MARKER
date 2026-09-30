"use server";

import { z } from "zod";
import { loginSchema } from "./schemas";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function login(data: z.infer<typeof loginSchema>) {
  try {
    const parsed = loginSchema.parse(data);
    
    await signIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}
