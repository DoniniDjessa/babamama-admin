import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getAdminProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ali-admins")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching admin profile:", error)
    return null
  }

  return data
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } }
  }
  return { user }
}

