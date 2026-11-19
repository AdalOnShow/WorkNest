import type { Database } from '#/db'
import { projectMember } from '#/db/schema'
import { and, eq } from 'drizzle-orm'

export type ProjectRole = (typeof projectMember.role.enumValues)[number]

/** Roles that can manage a project's tasks, members and invitations. */
export const MANAGER_ROLES: ReadonlyArray<ProjectRole> = [
  'ADMIN',
  'PROJECT_MANAGER',
]

export function canManage(role: ProjectRole) {
  return MANAGER_ROLES.includes(role)
}

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

/**
 * Returns the caller's role in the project, or throws when they are not a
 * member or (if `roles` is given) their role is not one of `roles`.
 *
 * Both cases throw the same message by default so project ids can't be
 * probed by non-members.
 */
export async function requireProjectRole(
  db: Database,
  projectId: string,
  userId: string,
  options: {
    roles?: ReadonlyArray<ProjectRole>
    message?: string
  } = {},
): Promise<ProjectRole> {
  const message = options.message ?? 'Project not found or access denied'
  const role = await getProjectRole(db, projectId, userId)
  if (!role) throw new Error(message)
  if (options.roles && !options.roles.includes(role)) throw new Error(message)
  return role
}
