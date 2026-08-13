import { Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod/v4'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Sprout, ArrowLeft, Mail } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      console.log('Forgot password:', value)
    },
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-[400px]">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Sprout className="w-6 h-6 text-black" />
          </div>
          <span className="font-heading text-2xl font-bold text-foreground">
            WorkNest
          </span>
        </div>

        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
          Forgot your password?
        </h2>
        <p className="text-muted-foreground mb-8">
          Enter your email and we will send you a link to reset your password.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
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

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={form.state.isSubmitting}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send reset link
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
