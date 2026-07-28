import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ActionError } from "./action-result"

export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new ActionError("UNAUTHORIZED", "You need to be signed in to do that.")
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
