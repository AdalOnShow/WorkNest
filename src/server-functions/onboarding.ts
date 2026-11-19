import { createDb } from '#/db'
import { projectMember, userProfile } from '#/db/schema'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'

function getDb() {
  return createDb(getCloudflareEnv().DB)
}

async function requireUserId() {
  const auth = createAuth(getCloudflareEnv())
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * `completed` — the user finished or skipped onboarding.
 * `shouldOnboard` — not completed AND not a member of any project yet.
 * Users who joined through an invitation already have a project, so they
 * are never sent to onboarding.
 */
export const getOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()
    const db = getDb()

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
  },
)

export const completeOnboarding = createServerFn({ method: 'POST' }).handler(
  async () => {
    const userId = await requireUserId()
    const now = new Date()

    await getDb()
      .insert(userProfile)
      .values({ id: userId, createdAt: now, onboardingCompletedAt: now })
      .onConflictDoUpdate({
        target: userProfile.id,
        set: { onboardingCompletedAt: now },
      })

    return { success: true }
  },
)
