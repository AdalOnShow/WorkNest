import type { Database } from '#/db'
import { projectMember } from '#/db/schema'
import { and, eq } from 'drizzle-orm'

export type ProjectRole = (typeof projectMember.role.enumValues)[number]

/** The user's role in the project, or null when they are not a member. */
export async function getProjectRole(
  db: Database,
  projectId: string,
  userId: string,
): Promise<ProjectRole | null> {
  const rows = await db
    .select({ role: projectMember.role })
    .from(projectMember)
    .where(
      and(
        eq(projectMember.projectId, projectId),
        eq(projectMember.userId, userId),
      ),
    )
    .limit(1)
  return rows.at(0)?.role ?? null
}
