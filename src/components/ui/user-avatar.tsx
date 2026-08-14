import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface UserAvatarProps {
  name: string
  image?: string
  size?: 'sm' | 'md' | 'lg'
  showOnlineStatus?: boolean
  isOnline?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserAvatar({
  name,
  image,
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  className,
}: UserAvatarProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={cn(SIZE_MAP[size], 'border border-border')}>
        <AvatarImage src={image} alt={name} />
        <AvatarFallback className="bg-accent text-card-foreground font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            isOnline ? 'bg-primary' : 'bg-muted-foreground',
            size === 'sm'
              ? 'w-2 h-2'
              : size === 'md'
                ? 'w-2.5 h-2.5'
                : 'w-3 h-3',
          )}
        />
      )}
    </div>
  )
}
