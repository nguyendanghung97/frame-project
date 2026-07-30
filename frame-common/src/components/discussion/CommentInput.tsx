import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { SendHorizontal, Trash2, X } from 'lucide-react'
import { cn } from '../../frame_layout/cn'
import { Avatar } from './Avatar'
import { getPlainTextLength, htmlToPlainText, plainTextToHtml } from './helpers'
import type { IDiscussionCreator } from './types'

export interface CommentInputHandle {
  focus: () => void
  blur: () => void
  setContent: (content: string) => void
  clearContent: () => void
  focusEnd: () => void
}

export interface CommentInputProps {
  placeholder?: string
  onSubmit: (content: string) => void | Promise<void>
  onCancel?: () => void
  onFocus?: () => void
  initialValue?: string
  currentUser?: IDiscussionCreator
  showAvatar?: boolean
  variant?: 'default' | 'reply'
  autoFocus?: boolean
  disabled?: boolean
  extraActions?: ReactNode
  replyToName?: string | null
  replyContent?: string | null
  onCancelReply?: () => void
  onReplyClick?: () => void
  editToName?: string | null
  editContent?: string | null
  onCancelEdit?: () => void
  onEditClick?: () => void
  hideAvatar?: boolean
  onDelete?: () => void
  onBannerHeightChange?: (height: number) => void
  isErrorTarget?: boolean
}

export const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(
  (
    {
      placeholder = 'Add new comments',
      onSubmit,
      onCancel,
      onFocus,
      initialValue = '',
      currentUser,
      showAvatar = true,
      variant = 'default',
      autoFocus = false,
      extraActions,
      replyToName,
      replyContent,
      onCancelReply,
      onReplyClick,
      editToName,
      editContent,
      onCancelEdit,
      onEditClick,
      hideAvatar = false,
      onDelete,
      onBannerHeightChange,
      isErrorTarget = false,
    },
    ref,
  ) => {
    const [plainContent, setPlainContent] = useState(() => htmlToPlainText(initialValue))
    const [submitting, setSubmitting] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const bannerRef = useRef<HTMLDivElement>(null)

    const isReplying = !!replyToName
    const isEditing = !!editToName
    const showBanner = isReplying || isEditing
    const htmlContent = plainTextToHtml(plainContent)

    // Hydrate once when edit mode turns on (do not reset while user is typing)
    useEffect(() => {
      if (!isEditing || editContent == null) return
      setPlainContent(htmlToPlainText(editContent))
      // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering edit
    }, [isEditing])

    useEffect(() => {
      if (!onBannerHeightChange) return
      if (!showBanner) {
        onBannerHeightChange(0)
        return
      }
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onBannerHeightChange(entry.contentRect.height)
        }
      })
      if (bannerRef.current) observer.observe(bannerRef.current)
      return () => observer.disconnect()
    }, [showBanner, onBannerHeightChange])

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      setContent: (newContent: string) => setPlainContent(htmlToPlainText(newContent)),
      clearContent: () => setPlainContent(''),
      focusEnd: () => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
      },
    }))

    useEffect(() => {
      if (autoFocus) {
        setTimeout(() => textareaRef.current?.focus(), 0)
      }
    }, [autoFocus])

    const isContentEmpty = !plainContent.trim()
    const plainTextLength = useMemo(() => getPlainTextLength(htmlContent), [htmlContent])
    const maxLength = 1000
    const bannerContent = replyContent || editContent

    const handleSubmit = async () => {
      if (isContentEmpty || submitting || plainTextLength > maxLength) return
      const contentToSend = htmlContent
      setSubmitting(true)
      if (!isEditing) setPlainContent('')
      try {
        await onSubmit(contentToSend)
        if (isEditing) setPlainContent('')
      } catch (err) {
        console.error('Submit failed:', err)
      } finally {
        setSubmitting(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSubmit()
      }
    }

    return (
      <div
        className={cn('discussion-input', variant === 'reply' && 'discussion-input--reply')}
        onFocus={onFocus}
      >
        {showBanner && (
          <div
            ref={bannerRef}
            onClick={isReplying ? onReplyClick : onEditClick}
            className={cn(
              'discussion-item_banner group/banner',
              isEditing ? 'discussion-is-editing' : 'discussion-is-replying',
              hideAvatar ? 'discussion-item_banner--flush' : 'discussion-item_banner--offset',
            )}
          >
            <div className="discussion-item_banner-row">
              <div className="discussion-item_banner-title">
                <span
                  className={cn(
                    'discussion-item_banner-label',
                    isEditing
                      ? 'discussion-item_banner-label--edit'
                      : 'discussion-item_banner-label--reply',
                  )}
                >
                  {isEditing ? 'EDITING COMMENT' : 'REPLYING TO'}
                </span>
                {isReplying && (
                  <span className="discussion-item_banner-name">{replyToName}</span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isReplying) onCancelReply?.()
                  else onCancelEdit?.()
                }}
                className="discussion-item_banner-close"
                title="Cancel"
              >
                <X className="discussion-item_banner-close-icon" />
              </button>
            </div>
            {bannerContent && (
              <div
                className="discussion-item_banner-preview"
                dangerouslySetInnerHTML={{ __html: bannerContent }}
              />
            )}
          </div>
        )}

        <div className="discussion-input-row">
          {!hideAvatar && showAvatar && currentUser && (
            <Avatar user={currentUser} className="discussion-avatar-face--lg" />
          )}
          <div className="discussion-input-editor_wrap">
            <textarea
              ref={textareaRef}
              className="discussion-input-textarea"
              value={plainContent}
              onChange={(e) => setPlainContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={2}
              disabled={submitting}
            />

            <div className="discussion-input-toolbar">
              <div className="discussion-input-toolbar-left">
                {extraActions}
              </div>
              <div className="discussion-input-toolbar-right">
                {isEditing && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="discussion-input-delete_btn"
                    title="Delete comment"
                  >
                    <Trash2 className="discussion-input-icon" />
                  </button>
                )}
                <div
                  className={cn(
                    'discussion-input-hint',
                    plainTextLength >= maxLength
                      ? 'discussion-input-hint--error'
                      : plainTextLength >= maxLength * 0.9
                        ? 'discussion-input-hint--warn'
                        : 'discussion-input-hint--ok',
                  )}
                >
                  [Shift + Enter] to add a new line
                </div>
                {onCancel && (
                  <button type="button" onClick={onCancel} className="discussion-input-dismiss_btn">
                    Dismiss
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isContentEmpty || submitting || plainTextLength > maxLength}
                  className="discussion-input-send_btn"
                >
                  {submitting ? (
                    <div className="discussion-input-send_spinner" />
                  ) : (
                    <SendHorizontal
                      size="0.875rem"
                      strokeWidth={2.5}
                      className="discussion-input-send_icon"
                    />
                  )}
                  {isEditing ? (
                    isErrorTarget ? <span>Retry</span> : <span>Save</span>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

CommentInput.displayName = 'CommentInput'
