import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Textarea } from '#/components/ui/textarea'
import { UserAvatar } from '#/components/ui/user-avatar'
import { deleteTaskComment, updateTaskComment } from '#/server-functions/tasks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export interface TaskCommentData {
  id: string
  content: string
  authorName: string | null
  authorImage: string | null
  createdAt: Date
  edited: boolean
  canEdit: boolean
  canDelete: boolean
}

export function TaskComment({
  taskId,
  comment,
}: {
  taskId: string
  comment: TaskCommentData
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateTaskComment({ data: { commentId: comment.id, content: draft } }),
    onSuccess: async () => {
      await invalidate()
      setIsEditing(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update comment')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTaskComment({ data: { commentId: comment.id } }),
    onSuccess: async () => {
      await invalidate()
      toast.success('Comment deleted')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete comment')
    },
    onSettled: () => setConfirmDelete(false),
  })

  const startEditing = () => {
    setDraft(comment.content)
    setIsEditing(true)
  }

  const canSave =
    draft.trim().length > 0 &&
    draft.trim() !== comment.content &&
    !updateMutation.isPending

  return (
    <div className="group flex gap-3">
      <UserAvatar
        name={comment.authorName || 'User'}
        image={comment.authorImage || undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="label-sm text-foreground">
            {comment.authorName || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground">
            ·{' '}
            {new Date(comment.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
            {comment.edited && ' (edited)'}
          </span>
          {(comment.canEdit || comment.canDelete) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Comment actions for comment by ${comment.authorName || 'Unknown'}`}
                  className="ml-auto size-7 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {comment.canEdit && (
                  <DropdownMenuItem onSelect={startEditing}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {comment.canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (canSave) updateMutation.mutate()
            }}
          >
            <Textarea
              aria-label="Edit comment"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditing(false)
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSave) {
                  updateMutation.mutate()
                }
              }}
              className="min-h-20 bg-background"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!canSave}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        ) : (
          <p className="body-sm mt-1 whitespace-pre-wrap break-words text-card-foreground">
            {comment.content}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete comment"
        description="This comment will be permanently removed."
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
