import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod/v4'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { Sprout, Github, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      console.log('Signup:', value)
    },
  })

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-24">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
              WorkNest
            </span>
          </Link>

          <h1 className="font-heading text-5xl font-bold text-foreground leading-tight mb-6">
            Start collaborating
            <br />
            with your team
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Create your account and start managing projects, tasks, and team collaboration in minutes.
          </p>
        </div>

        {/* Abstract geometric shapes */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/5" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/10" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-primary/40" />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 rounded-full bg-primary/60" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>

          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
            Create your account
          </h2>
          <p className="text-muted-foreground mb-8">
            Get started with WorkNest for free
          </p>

          {/* Social Logins */}
          <div className="flex gap-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-card hover:bg-accent"
              onClick={() => console.log('Google signup')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-card hover:bg-accent"
              onClick={() => console.log('GitHub signup')}
            >
              <Github className="w-5 h-5 mr-2" />
              GitHub
            </Button>
          </div>

          <div className="relative my-6">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {/* Signup Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <form.Field
                name="fullName"
                validators={{
                  onChange: ({ value }) => {
                    if (value.length < 2) return 'Name must be at least 2 characters'
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.errors.length > 0 ? 'border-destructive' : ''
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </>
                )}
              </form.Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    const result = z.email().safeParse(value)
                    return result.success ? undefined : result.error.issues[0]?.message
                  },
                }}
              >
                {(field) => (
                  <>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.errors.length > 0 ? 'border-destructive' : ''
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </>
                )}
              </form.Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    if (value.length < 8) return 'Password must be at least 8 characters'
                    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter'
                    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter'
                    if (!/[0-9]/.test(value)) return 'Password must contain at least one number'
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={
                          field.state.meta.errors.length > 0
                            ? 'border-destructive pr-10'
                            : 'pr-10'
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </>
                )}
              </form.Field>
              <p className="text-xs text-muted-foreground">
                Must contain at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <form.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value }) => {
                    if (value !== form.state.values.password) return "Passwords don't match"
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.errors.length > 0 ? 'border-destructive' : ''
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </>
                )}
              </form.Field>
            </div>

            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAgreed(!agreed)}
                className={`
                  mt-0.5 w-4 h-4 rounded border flex items-center justify-center
                  transition-colors
                  ${agreed
                    ? 'bg-primary border-primary text-black'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                {agreed && <Check className="w-3 h-3" />}
              </button>
              <span className="text-sm text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary hover:text-primary/80">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </a>
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={form.state.isSubmitting || !agreed}
            >
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
