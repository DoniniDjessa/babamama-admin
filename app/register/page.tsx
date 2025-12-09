"use client"

import { useState } from "react"
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

const registerSchema = z.object({
  loginType: z.enum(["email", "phone"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
}).superRefine((data, ctx) => {
  if (data.loginType === "email") {
    if (!data.email || !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a valid email address",
        path: ["email"],
      })
    }
  } else {
    if (!data.phone || data.phone.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a valid phone number",
        path: ["phone"],
      })
    }
  }
  
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })
  }
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      loginType: "email",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
    mode: "onChange",
  })

  const loginType = watch("loginType")

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      let email = ""
      let phone = ""

      if (data.loginType === "email" && data.email) {
        email = data.email
        // For email registration, we can use the email directly
      } else if (data.loginType === "phone" && data.phone) {
        // For phone registration, we need to create a temporary email
        // or use phone as identifier. Supabase requires email, so we'll
        // create a format like: +221771234567@phone.local
        phone = data.phone
        email = `${data.phone.replace(/\s/g, "")}@phone.local`
      } else {
        setError("Please provide a valid email or phone number")
        setIsLoading(false)
        return
      }

      if (!email) {
        setError("Email or phone number is required")
        setIsLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: phone || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at || !authData.session) {
          // User is already confirmed or session exists, redirect to dashboard
          router.push("/")
          router.refresh()
        } else {
          // Email confirmation required
          setSuccess(true)
          // Show message that confirmation email was sent
          setTimeout(() => {
            router.push("/login?message=check_email")
          }, 3000)
        }
      } else {
        setError("Registration failed. Please try again.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold font-[var(--font-fira-sans)]">Registration Successful!</h2>
              <p className="text-slate-600">
                Please check your email to confirm your account. You will be redirected to login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-bold">Admin Register</CardTitle>
          <CardDescription>
            Create a new admin account to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors)
          })} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                {...register("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

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
                  onChange={(value) => {
                    setValue("phone", value || "", { shouldValidate: true })
                  }}
                  name="phone"
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

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-slate-600">Already have an account? </span>
              <Link href="/login" className="text-slate-900 font-medium hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

