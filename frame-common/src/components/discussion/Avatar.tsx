import { SquareCheckBig } from 'lucide-react'
import { cn } from '../../frame_layout/cn'
import type { IDiscussionCreator } from './types'

const THEMES = [
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-indigo-100 text-indigo-600',
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-600',
  'bg-violet-100 text-violet-600',
  'bg-cyan-100 text-cyan-600',
  'bg-pink-100 text-pink-600',
]

export function Avatar({
  user,
  className,
  isAck,
}: {
  user?: IDiscussionCreator
  className?: string
  isAck?: boolean
}) {
  const themeIndex =
    (user?.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0) %
    THEMES.length
  const themeClass = THEMES[themeIndex]
  const [bg, text] = themeClass.split(' ')

  return (
    <div className="discussion-avatar">
      <div className={cn('discussion-avatar-face', bg, className)}>
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="discussion-avatar-img" />
        ) : (
          <span className={cn('discussion-avatar-initials', text)}>
            {(user?.name || '?')[0].toUpperCase()}
          </span>
        )}
      </div>
      {isAck && (
        <div className="discussion-avatar-ack">
          <SquareCheckBig className="discussion-avatar-ack-icon" />
        </div>
      )}
    </div>
  )
}
