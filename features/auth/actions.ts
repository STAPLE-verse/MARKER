"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema, loginSchema } from "./schemas";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function signUp(data: z.infer<typeof signupSchema>) {
  try {
    const parsed = signupSchema.parse(data);
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: parsed.email }, { username: parsed.username }],
      },
    });

    if (existingUser) {
      return { error: "User with that email or username already exists." };
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    await prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Something went wrong." };
  }
}

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
