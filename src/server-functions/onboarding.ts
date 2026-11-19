import { projectMember, userProfile } from '#/db/schema'
import { authMiddleware } from '#/lib/middleware'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

/**
 * `completed` — the user finished or skipped onboarding.
 * `shouldOnboard` — not completed AND not a member of any project yet.
 * Users who joined through an invitation already have a project, so they
 * are never sent to onboarding.
 */
export const getOnboardingStatus = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context: { db, userId } }) => {
    const [profile, membership] = await Promise.all([
      db
        .select({ completedAt: userProfile.onboardingCompletedAt })
        .from(userProfile)
        .where(eq(userProfile.id, userId))
        .get(),
      db
        .select({ projectId: projectMember.projectId })
        .from(projectMember)
        .where(eq(projectMember.userId, userId))
        .limit(1)
        .get(),
    ])

    const completed = Boolean(profile?.completedAt)
    return { completed, shouldOnboard: !completed && !membership }
  })

export const completeOnboarding = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context: { db, userId } }) => {
    const now = new Date()

    await db
      .insert(userProfile)
      .values({ id: userId, createdAt: now, onboardingCompletedAt: now })
      .onConflictDoUpdate({
        target: userProfile.id,
        set: { onboardingCompletedAt: now },
      })

    return { success: true }
  })
