import { useMemo, useState, type ReactNode } from 'react'
import {
  ClipboardCheck,
  Loader2,
  MessageSquareX,
  PencilOff,
  RefreshCw,
  SquareCheckBig,
  SquarePen,
} from 'lucide-react'
import { cn } from '../../frame_layout/cn'
import { Avatar } from './Avatar'
import { formatTimeOnly } from './helpers'
import type { IDiscussion, IDiscussionCreator } from './types'

export interface CommentItemProps {
  comment: IDiscussion
  isReply?: boolean
  onAddReply?: (parentId: string, content: string) => void | Promise<void>
  onEdit?: (commentId: string, content: string) => void | Promise<void>
  onStartEdit?: (commentId: string, content: string) => void
  onStartReply?: (commentId: string) => void
  editingId?: string | null
  setEditingId?: (id: string | null) => void
  replyingId?: string | null
  setReplyingId?: (id: string | null) => void
  onDelete?: (commentId: string) => void
  currentUserId?: string
  currentUser?: IDiscussionCreator
  extraActions?: ReactNode
  hasNext?: boolean
  isLast?: boolean
  hideAvatar?: boolean
  isExpanded?: boolean
  onToggleExpand?: (isExpanded: boolean) => void
  onFocusInput?: () => void
  highlightedId?: string | null
  onCancelEdit?: () => void
  onRefresh?: () => void
  setShouldAutoScroll?: (val: boolean) => void
  scrollToComment?: (id: string) => void
  onRetry?: (comment: IDiscussion) => void
  onAcknowledge?: (commentId: string) => void | Promise<void>
  readOnly?: boolean
}

export function CommentItem(props: CommentItemProps) {
  const {
    comment,
    isReply = false,
    onStartEdit,
    onStartReply,
    editingId,
    setReplyingId,
    currentUserId,
    hasNext = false,
    hideAvatar = false,
    isExpanded: controlledExpanded,
    onToggleExpand,
    onFocusInput,
    highlightedId,
    onCancelEdit,
    onRetry,
    onAcknowledge,
    readOnly = false,
    replyingId,
  } = props

  const ackReplies = useMemo(() => {
    const uniqueCreators = new Map<string, IDiscussion>()
    ;(comment.replies || []).forEach((r) => {
      if (r.is_acknowledge_reply && r.creator?.id && r.creator.id !== comment.creator?.id) {
        if (!uniqueCreators.has(r.creator.id)) {
          uniqueCreators.set(r.creator.id, r)
        }
      }
    })
    return Array.from(uniqueCreators.values())
  }, [comment.replies, comment.creator?.id])

  const isAcknowledgedByMe = useMemo(
    () => ackReplies.some((r) => r.creator?.id === currentUserId),
    [ackReplies, currentUserId],
  )

  const [internalExpanded, setInternalExpanded] = useState(false)
  const [isConfirmingAck, setIsConfirmingAck] = useState(false)

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const setIsExpanded = (val: boolean) => {
    if (onToggleExpand) onToggleExpand(val)
    else setInternalExpanded(val)
  }

  const isOwner =
    !!currentUserId &&
    (comment._creator === currentUserId || comment.creator?.id === currentUserId)

  const handleConfirmAcknowledge = async () => {
    if (!onAcknowledge) return
    setIsConfirmingAck(true)
    try {
      await onAcknowledge(comment.id)
    } catch (error) {
      console.error('Failed to confirm acknowledgement:', error)
    } finally {
      setIsConfirmingAck(false)
    }
  }

  if (comment.type === 'SYSTEM' || comment.type === 'ADMIN') {
    return (
      <div id={`comment-${comment.id}`} className="discussion-system">
        <span className="discussion-system-time">
          {comment?.created ? formatTimeOnly(comment.created) : ''}
        </span>
        {comment?.creator?.name && (
          <span title={comment.creator.name} className="discussion-system-name">
            <span className="discussion-system-name-text">{comment.creator.name}</span>
          </span>
        )}
        <div
          className="discussion-system-body"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      </div>
    )
  }

  if (isReply) {
    return (
      <div className="discussion-reply_item-container">
        <div
          id={`comment-${comment.id}`}
          className={cn(
            'discussion-reply_row group/reply',
            (editingId === comment.id || replyingId === comment.id) &&
              'discussion-reply_row--active',
          )}
          onClick={() => {
            if ((editingId === comment.id || replyingId === comment.id) && onFocusInput) {
              onFocusInput()
            }
          }}
          title={editingId === comment.id ? 'Click to continue editing' : undefined}
        >
          <div className="discussion-reply_name" title={comment?.creator?.name || 'Unknown'}>
            <span className="discussion-reply_name-text">
              {comment?.creator?.name || 'Unknown'}
            </span>
          </div>

          <div className="discussion-reply_body">
            <div className="discussion-reply_body-inner">
              <div
                className={cn(
                  'discussion-reply_text',
                  editingId === comment.id && 'discussion-reply_text--editing',
                  highlightedId === comment.id && 'discussion-reply_text--highlighted',
                )}
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            </div>

            {!readOnly && (
              <div className="discussion-reply_actions">
                {comment.status === 'pending' ? (
                  <div className="discussion-action_icon--spin">
                    <Loader2 size="0.8125rem" strokeWidth={2.5} />
                  </div>
                ) : editingId === comment.id && onCancelEdit ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCancelEdit?.()
                    }}
                    className="discussion-action_icon--cancel"
                    title="Cancel edit"
                  >
                    <PencilOff size="0.8125rem" strokeWidth={3} />
                  </button>
                ) : comment.status === 'error' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetry?.(comment)
                    }}
                    className="discussion-action_icon--retry"
                    title="Retry sending"
                  >
                    <RefreshCw size="0.8125rem" strokeWidth={2.5} />
                  </button>
                ) : (
                  isOwner &&
                  editingId !== comment.id &&
                  !comment.is_acknowledge_reply && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onStartEdit) onStartEdit(comment.id, comment.content)
                      }}
                      className="discussion-action_icon--edit"
                      title="Edit reply"
                    >
                      <SquarePen size="0.8125rem" strokeWidth={2.5} />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="discussion-reply_time_wrap">
            <span className="discussion-reply_time">
              {comment?.created ? formatTimeOnly(comment.created) : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="discussion-comment group">
      {!hideAvatar && !isReply && hasNext && (
        <div
          className={cn(
            'discussion-comment-thread',
            'discussion-comment-thread--next',
          )}
        />
      )}

      {!hideAvatar && !isReply && !readOnly ? (
        <div
          role={comment.replies && comment.replies.length > 0 ? 'button' : undefined}
          tabIndex={comment.replies && comment.replies.length > 0 ? 0 : undefined}
          title={
            comment.replies && comment.replies.length > 0
              ? isExpanded
                ? 'Hide replies'
                : 'Show replies'
              : undefined
          }
          onClick={() => {
            if (!comment.replies?.length) return
            setIsExpanded(!isExpanded)
          }}
          onKeyDown={(e) => {
            if (!comment.replies?.length) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsExpanded(!isExpanded)
            }
          }}
        >
          <Avatar user={comment.creator} className="discussion-avatar-face--lg" />
        </div>
      ) : null}

      <div className="discussion-item_container">
        <div id={`comment-${comment.id}`} className="discussion-comment_item-container">
          <div className="discussion-comment_item-header">
            <div className="discussion-comment_item-header-left">
              <span
                title={comment?.creator?.name || 'Unknown User'}
                className="discussion-comment_item-name"
              >
                <span className="discussion-comment_item-name-text">
                  {comment?.creator?.name || 'Unknown User'}
                </span>
              </span>
              <span className="discussion-comment_item-time">
                {comment?.created ? formatTimeOnly(comment.created) : ''}
              </span>
            </div>

            {!readOnly && (
              <div className="discussion-comment_item-actions">
                {!isReply && (
                  <button
                    type="button"
                    disabled={
                      !!(
                        replyingId === comment.id ||
                        comment.status === 'pending' ||
                        comment.status === 'error'
                      )
                    }
                    onClick={() => {
                      if (onStartReply) onStartReply(comment.id)
                      setIsExpanded(true)
                    }}
                    className={cn(
                      'discussion-comment_item-reply_btn',
                      replyingId === comment.id && 'discussion-comment_item-reply_btn--active',
                      (comment.status === 'pending' || comment.status === 'error') &&
                        'discussion-comment_item-reply_btn--disabled',
                    )}
                  >
                    Reply
                  </button>
                )}

                {!isOwner && comment.requires_acknowledgement && (
                  <button
                    type="button"
                    disabled={isAcknowledgedByMe || isConfirmingAck}
                    onClick={() => void handleConfirmAcknowledge()}
                    title={isAcknowledgedByMe ? 'Acknowledgment Sent' : 'Confirm Receipt'}
                    className={cn(
                      'discussion-comment_item-ack_btn',
                      isAcknowledgedByMe
                        ? 'discussion-comment_item-ack_btn--done'
                        : 'discussion-comment_item-ack_btn--idle',
                    )}
                  >
                    {isConfirmingAck ? (
                      <Loader2 className="discussion-comment_item-ack_icon--spin" />
                    ) : (
                      <SquareCheckBig strokeWidth={2} className="discussion-comment_item-ack_icon" />
                    )}
                  </button>
                )}
                {isOwner && comment.requires_acknowledgement && (
                  <div
                    title={comment.is_acknowledged ? 'Acknowledged' : 'Request Acknowledgement'}
                    className={
                      comment.is_acknowledged
                        ? 'discussion-comment_item-ack_status--done'
                        : 'discussion-comment_item-ack_status--pending'
                    }
                  >
                    <ClipboardCheck strokeWidth={2} className="discussion-comment_item-ack_icon" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            onClick={() => {
              if ((editingId === comment.id || replyingId === comment.id) && onFocusInput) {
                onFocusInput()
              }
            }}
            title={
              editingId === comment.id
                ? 'Click to continue editing'
                : replyingId === comment.id
                  ? 'Click to continue replying'
                  : undefined
            }
            className={cn(
              'discussion-comment_item-content',
              isOwner
                ? 'discussion-comment_item-content--owner'
                : isReply
                  ? 'discussion-comment_item-content--reply'
                  : 'discussion-comment_item-content--default',
              replyingId === comment.id && 'discussion-is-replying',
              editingId === comment.id && 'discussion-is-editing',
              (editingId === comment.id || replyingId === comment.id) &&
                'discussion-comment_item-content--active',
              highlightedId === comment.id && 'discussion-is-highlighted',
            )}
          >
            <div className="discussion-comment_item-body">
              <div
                className={cn(
                  'discussion-comment_item-text',
                  isReply && 'discussion-comment_item-text--reply',
                )}
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
              {!readOnly && (
                <div className="discussion-comment_item-side_actions">
                  {comment.status === 'pending' ? (
                    <div className="discussion-action_icon--spin-muted">
                      <Loader2 size="0.875rem" strokeWidth={2.5} />
                    </div>
                  ) : comment.status === 'error' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRetry?.(comment)
                      }}
                      className="discussion-action_icon--retry"
                      title="Retry sending"
                    >
                      <RefreshCw size="0.875rem" strokeWidth={2.5} />
                    </button>
                  ) : editingId === comment.id ? (
                    onCancelEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCancelEdit?.()
                        }}
                        className="discussion-action_icon--cancel"
                        title="Cancel edit"
                      >
                        <PencilOff size="0.75rem" strokeWidth={3} />
                      </button>
                    )
                  ) : replyingId === comment.id ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (setReplyingId) setReplyingId(null)
                      }}
                      className="discussion-action_icon--cancel-reply"
                      title="Cancel reply"
                    >
                      <MessageSquareX size="0.875rem" strokeWidth={3} />
                    </button>
                  ) : isOwner ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onStartEdit) onStartEdit(comment.id, comment.content)
                      }}
                      className="discussion-action_icon--edit-spaced"
                      title="Edit comment"
                    >
                      <SquarePen size="0.875rem" strokeWidth={3} />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="discussion-reply_container">
            {isExpanded ? (
              comment.replies.map((reply, index) => (
                <CommentItem
                  key={`${reply.id}-${index}`}
                  {...props}
                  comment={reply}
                  isReply
                  hasNext={false}
                  isLast={false}
                />
              ))
            ) : (
              <div className="discussion-replies_collapsed">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(true)
                  }}
                  className="discussion-replies_collapsed-btn"
                >
                  <div className="discussion-replies_avatars">
                    {comment.replies.slice(0, 5).map((reply, index) => (
                      <Avatar
                        key={`${reply.id}-${index}`}
                        user={reply.creator}
                        className="discussion-avatar-face--sm"
                      />
                    ))}
                    {comment.replies.length > 5 && (
                      <div className="discussion-avatar-overflow">
                        +{comment.replies.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="discussion-replies_count">
                    {comment.replies.length}{' '}
                    {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </button>

                {isOwner && ackReplies.length > 0 && (
                  <>
                    <div className="discussion-replies_divider" />
                    <div className="discussion-replies_ack">
                      <div className="discussion-replies_avatars">
                        {ackReplies.slice(0, 5).map((reply, index) => (
                          <Avatar
                            key={`ack-${reply.id}-${index}`}
                            user={reply.creator}
                            className="discussion-avatar-face--sm"
                            isAck
                          />
                        ))}
                      </div>
                      <span className="discussion-replies_ack_count">
                        {ackReplies.length} Acknowledged
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
