import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings — WorkNest' }],
  }),
})

function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')

  return (
    <PageContainer>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="headline-sm text-foreground">Settings</h1>
          <p className="body-md text-muted-foreground mt-1">Manage your account settings</p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-[14px] p-6 space-y-4">
          <h3 className="label-lg text-foreground">Profile</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-card-foreground">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-background border-border text-foreground rounded-lg focus-visible:ring-ring/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-card-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background border-border text-foreground rounded-lg focus-visible:ring-ring/40"
              />
            </div>
            <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Appearance Section */}
        <div className="bg-card border border-border rounded-[14px] p-6 space-y-4">
          <h3 className="label-lg text-foreground">Appearance</h3>
          <div className="space-y-3">
            <p className="body-sm text-muted-foreground">Theme</p>
            <div className="flex gap-4">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    theme === t
                      ? 'border-primary bg-accent'
                      : 'border-border hover:bg-accent/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={t}
                    checked={theme === t}
                    onChange={() => setTheme(t)}
                    className="sr-only"
                  />
                  <div className={`w-3 h-3 rounded-full ${
                    theme === t ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-sm text-foreground capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Account Section */}
        <div className="bg-card border border-border rounded-[14px] p-6 space-y-4">
          <h3 className="label-lg text-foreground">Account</h3>
          <div className="space-y-3">
            <Button variant="outline" className="border-border text-card-foreground hover:bg-accent">
              Change Password
            </Button>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
