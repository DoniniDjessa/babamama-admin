"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/phone-input"

const loginSchema = z.object({
  loginType: z.enum(["email", "phone"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => {
  if (data.loginType === "email") {
    return data.email && z.string().email().safeParse(data.email).success
  }
  return data.phone && data.phone.length > 0
}, {
  message: "Please provide a valid email or phone number",
  path: ["email"]
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginType: "email",
    },
  })

  const loginType = watch("loginType")

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      let identifier = ""
      
      if (data.loginType === "email" && data.email) {
        identifier = data.email
      } else if (data.loginType === "phone" && data.phone) {
        // For phone login, we'll use the phone number as the identifier
        // Note: Supabase requires email by default, so we may need to store phone in a custom field
        // For now, we'll try to use phone as email if it's in the format +XXXXXXXXXX
        identifier = data.phone
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  // Check for messages in URL params
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const msg = params.get("message")
    if (msg === "check_email") {
      setMessage("Please check your email to confirm your account before logging in.")
    }
    const err = params.get("error")
    if (err === "auth_failed") {
      setError("Authentication failed. Please try again.")
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-600">
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Login Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={loginType === "email" ? "default" : "outline"}
                onClick={() => setValue("loginType", "email")}
                className="flex-1"
              >
                Email
              </Button>
              <Button
                type="button"
                variant={loginType === "phone" ? "default" : "outline"}
                onClick={() => setValue("loginType", "phone")}
                className="flex-1"
              >
                Phone
              </Button>
            </div>

            {/* Email Input */}
            {loginType === "email" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            )}

            {/* Phone Input */}
            {loginType === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  value={watch("phone")}
                  onChange={(value) => setValue("phone", value || "")}
                  error={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-slate-600">Don't have an account? </span>
              <Link href="/register" className="text-slate-900 font-medium hover:underline">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

