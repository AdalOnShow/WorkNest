/**
 * Shared runtime input schemas for server functions.
 *
 * TypeScript types on a validator are compile-time only: a client can send
 * anything. Every server function validates its input with these schemas.
 */
import { z } from 'zod'

export const LIMITS = {
  id: 64,
  name: 100,
  title: 200,
  description: 5000,
  comment: 5000,
  search: 200,
  email: 254,
  maxPageSize: 100,
} as const

export const idSchema = z.string().trim().min(1).max(LIMITS.id)

export const projectRoleSchema = z.enum([
  'ADMIN',
  'PROJECT_MANAGER',
  'TEAM_MEMBER',
])
export const projectStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD'])
export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED'])
export const taskPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW'])
export const sortDirSchema = z.enum(['asc', 'desc'])

export const searchSchema = z.string().max(LIMITS.search).optional()

/** Epoch milliseconds between 2000-01-01 and 2100-01-01. */
export const deadlineSchema = z
  .number()
  .int()
  .min(946_684_800_000)
  .max(4_102_444_800_000)

export const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(LIMITS.name, `${label} cannot exceed ${LIMITS.name} characters`)

export const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title cannot be empty')
  .max(LIMITS.title, `Title cannot exceed ${LIMITS.title} characters`)

export const descriptionSchema = z
  .string()
  .max(
    LIMITS.description,
    `Description cannot exceed ${LIMITS.description} characters`,
  )

export const commentSchema = z
  .string()
  .trim()
  .min(1, 'Comment content cannot be empty')
  .max(LIMITS.comment, `Comment cannot exceed ${LIMITS.comment} characters`)

/** Page and page size, clamped rather than rejected. */
export function paginationSchema(defaultPageSize: number) {
  return {
    page: z.coerce
      .number()
      .optional()
      .transform((v) =>
        Math.min(10_000, Math.max(1, Math.floor(Number.isFinite(v) ? v! : 1))),
      ),
    pageSize: z.coerce
      .number()
      .optional()
      .transform((v) =>
        Math.min(
          LIMITS.maxPageSize,
          Math.max(1, Math.floor(Number.isFinite(v) ? v! : defaultPageSize)),
        ),
      ),
  }
}

/**
 * Turns a zod schema into a server-function validator that throws a plain
 * `Error` with the first issue's message, so UI toasts show "Title cannot be
 * empty" instead of zod's JSON issue list. Keeps the schema's input type for
 * callers.
 */
export function input<TSchema extends z.ZodType>(schema: TSchema) {
  return (data: z.input<TSchema>): z.output<TSchema> => {
    const result = schema.safeParse(data)
    if (!result.success) {
      const issue = result.error.issues[0]
      const field = issue?.path.join('.')
      const message =
        issue?.code === 'invalid_type' || issue?.code === 'invalid_union'
          ? `Invalid ${field || 'input'}`
          : (issue?.message ?? 'Invalid input')
      throw new Error(message)
    }
    return result.data
  }
}
