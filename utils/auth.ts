import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  
  return { 
    userId: Number(session.user.id), 
    session 
  }
}

export async function requirePageAuth() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  return { 
    userId: Number(session.user.id), 
    session 
  }
}
