import { PageContainer } from '#/components/layout/page-container'
import { PageHeader } from '#/components/layout/page-header'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { UserAvatar } from '#/components/ui/user-avatar'
import {
  deleteProfilePhoto,
  updateProfile,
  uploadProfilePhoto,
} from '#/server-functions/profile'
import { createFileRoute } from '@tanstack/react-router'
import { Camera, Loader2, Pencil, Save, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings — WorkNest' }],
  }),
})

function SettingsPage() {
  const { user } = Route.useRouteContext()
  const { theme: storedTheme, setTheme } = useTheme()
  // next-themes only knows the stored theme on the client; mark the selection
  // after mount so the server HTML and the first client render match.
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => setThemeMounted(true), [])
  const theme = themeMounted ? storedTheme : undefined

  const [name, setName] = useState(user.name)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarImage = previewUrl || user.image || undefined

  const handleSaveName = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setIsSaving(true)
    try {
      await updateProfile({ data: { name: name.trim() } })
      toast.success('Profile updated')
      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile',
      )
    } finally {
      setIsSaving(false)
    }
  }, [name])

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
      reader.readAsDataURL(file)

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('photo', file)
        await uploadProfilePhoto({ data: formData })
        toast.success('Photo updated')
        window.location.reload()
      } catch (error) {
        setPreviewUrl(null)
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload photo',
        )
      } finally {
        setIsUploading(false)
      }
    },
    [],
  )

  const handleDeletePhoto = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteProfilePhoto()
      setPreviewUrl(null)
      toast.success('Photo removed')
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove photo',
      )
    } finally {
      setIsDeleting(false)
    }
  }, [])

  const handleCancelEdit = useCallback(() => {
    setName(user.name)
    setIsEditing(false)
  }, [user.name])

  const formatDate = (date: Date | string | number) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }

  return (
    <PageContainer>
      <div className="max-w-2xl space-y-8">
        <PageHeader
          title="Settings"
          description="Your profile, appearance and account"
        />

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h3 className="label-lg text-foreground">Profile</h3>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <UserAvatar name={user.name} image={avatarImage} size="lg" />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              {!isUploading && !isDeleting && (
                <button
                  type="button"
                  aria-label={
                    user.image ? 'Change profile photo' : 'Upload profile photo'
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {/* Hover/focus overlay (pointer users). */}
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Camera className="w-5 h-5 text-white" />
                  </span>
                  {/* Always-visible badge so touch users can find it too. */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-ink text-ink-foreground">
                    <Camera className="size-3" />
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoSelect}
                className="hidden"
                tabIndex={-1}
                aria-hidden
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {isUploading && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading photo
                </p>
              )}
            </div>
            {user.image && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePhoto}
                disabled={isUploading || isDeleting}
                className="border-border text-muted-foreground hover:text-destructive hover:border-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Remove photo'
                )}
              </Button>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Name & Email */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-card-foreground">
                  Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 bg-background border-border text-foreground rounded-lg focus-visible:ring-ring/40"
                  />
                ) : (
                  <p className="body-sm text-foreground h-11 flex items-center">
                    {user.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-card-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="h-11 bg-background border-border text-foreground rounded-lg focus-visible:ring-ring/40 opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="label-sm text-muted-foreground block mb-1">
                Joined
              </label>
              <p className="body-sm text-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveName}
                    disabled={isSaving || !name.trim()}
                    className=" font-semibold"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="border-border text-card-foreground hover:bg-accent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="border-border text-card-foreground hover:bg-accent"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Appearance Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
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
                  <div
                    className={`w-3 h-3 rounded-full ${
                      theme === t ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="text-sm text-foreground capitalize">
                    {t}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Account Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="label-lg text-foreground">Account</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="border-border text-card-foreground hover:bg-accent"
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
