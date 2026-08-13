import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Sprout, MailCheck } from 'lucide-react'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
  head: () => ({
    meta: [{ title: 'Verify Email — WorkNest' }],
  }),
})

function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-[420px] rise-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#68EF3F]">
            <Sprout className="w-5 h-5 text-[#273F2B]" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">WorkNest</span>
        </div>

        <Card className="bg-[#172318] border-[#2D3B2A] rounded-[14px]">
          <CardHeader className="pb-2 pt-6 px-6">
            <h1 className="text-xl font-semibold text-white text-center">
              Verify your email
            </h1>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col items-center space-y-4 mt-4">
              <div className="w-16 h-16 rounded-full bg-[#1F331D] flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-[#68EF3F]" />
              </div>
              <p className="text-sm text-[#B8C0B5] text-center leading-relaxed">
                We've sent a verification link to your email address. Please click the link to activate your account.
              </p>
              <div className="w-full pt-2 space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-full border-[#2D3B2A] bg-transparent text-white hover:bg-[#1F331D] transition-colors"
                >
                  Resend verification email
                </Button>
                <Link to="/login" className="block">
                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-full text-[#B8C0B5] hover:text-white hover:bg-[#1F331D] transition-colors"
                  >
                    Back to log in
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
