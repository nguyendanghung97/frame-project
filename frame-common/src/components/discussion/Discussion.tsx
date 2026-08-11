import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronsDown,
  ClipboardCheck,
  Loader2,
  MessageSquareMore,
  MessageSquareX,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../../frame_layout/cn'
import { CommentInput, type CommentInputHandle } from './CommentInput'
import { CommentItem } from './CommentItem'
import { DateDivider } from './DateDivider'
import {
  demoAcknowledgeComment,
  demoCreateComment,
  demoDeleteComment,
  demoLoadComments,
  demoReplyComment,
  demoUpdateComment,
} from './demoStore'
import { cleanEditorContent, formatDividerDate } from './helpers'
import { DEMO_CURRENT_USER, DEMO_RESOURCE, DEMO_RESOURCE_ID } from './mockData'
import type { DiscussionProps, IDiscussion } from './types'

function Discussion({
  className,
  onClose,
  hideAvatar = true,
  showEmptyState = true,
  resourceOverride,
  resourceIdOverride,
  defaultResource,
  defaultResourceId,
  currentResource,
  currentResourceId,
  bannerHeader,
  readOnly = false,
}: DiscussionProps) {
  const currentUser = DEMO_CURRENT_USER
  const [comments, setComments] = useState<IDiscussion[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [bannerHeight, setBannerHeight] = useState(0)
  const [requiresAck, setRequiresAck] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const mainInputRef = useRef<CommentInputHandle>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        })
      }
    }, 150)
  }, [])
  const originalEditContentRef = useRef<string | null>(null)

  // Track whether user is at the bottom of the scroll container
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const handleScroll = () => {
      const threshold = 60
      setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const scopeResource =
    currentResource || defaultResource || resourceOverride || DEMO_RESOURCE
  const scopeResourceId =
    currentResourceId || defaultResourceId || resourceIdOverride || DEMO_RESOURCE_ID

  const findCommentDeep = useCallback(
    (id: string): IDiscussion | null => {
      const search = (list: IDiscussion[]): IDiscussion | null => {
        for (const item of list) {
          if (item.id === id) return item
          if (item.replies?.length) {
            const found = search(item.replies)
            if (found) return found
          }
        }
        return null
      }
      return search(comments)
    },
    [comments],
  )

  const replyingComment = useMemo(
    () => (replyingId ? findCommentDeep(replyingId) : null),
    [findCommentDeep, replyingId],
  )

  const editingComment = useMemo(
    () => (editingId ? findCommentDeep(editingId) : null),
    [findCommentDeep, editingId],
  )

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const roots = await demoLoadComments()
      setComments(roots)
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => {
        setRefreshing(false)
        setInitialLoading(false)
      }, 200)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData, scopeResource, scopeResourceId])

  useEffect(() => {
    if (!highlightedId) return
    const timer = setTimeout(() => setHighlightedId(null), 3000)
    return () => clearTimeout(timer)
  }, [highlightedId])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!initialLoading) {
      scrollToBottom('instant')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoading])

  const handleScrollToInput = useCallback(() => {
    setTimeout(() => {
      const wrapper = inputWrapperRef.current
      const container = wrapper?.closest('.discussion-scroll')
      if (wrapper && container instanceof HTMLElement) {
        const wrapperRect = wrapper.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const isObscured =
          wrapperRect.bottom > containerRect.bottom || wrapperRect.top < containerRect.top
        if (isObscured) {
          container.scrollTo({
            top: wrapper.offsetTop + wrapper.offsetHeight - container.clientHeight + 16,
            behavior: 'smooth',
          })
        }
      }
    }, 150)
  }, [])

  useEffect(() => {
    if ((replyingId || editingId) && mainInputRef.current) {
      mainInputRef.current.focus()
      handleScrollToInput()
    }
  }, [replyingId, editingId, focusToken, handleScrollToInput])

  const scrollToComment = useCallback((id: string) => {
    setTimeout(() => {
      const element = document.getElementById(`comment-${id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        setHighlightedId(id)
      }
    }, 50)
  }, [])

  const generateOptimisticComment = useCallback(
    (content: string, parentId?: string): IDiscussion => {
      const now = new Date().toISOString()
      return {
        id: `opt-${Date.now()}`,
        content: cleanEditorContent(content),
        parent_id: parentId || null,
        depth: parentId ? 1 : 0,
        creator: currentUser,
        _creator: currentUser.id,
        created: now,
        status: 'pending',
        replies: [],
        master_id: null,
        organization_id: 'org-demo',
        resource: scopeResource,
        resource_id: scopeResourceId,
        attachment_count: 0,
        reaction_count: 0,
        flag_count: 0,
        _realm: 'demo',
        updated: now,
        updater: null,
        _deleted: null,
        etag: '',
        requires_acknowledgement: false,
        is_acknowledged: false,
      }
    },
    [currentUser, scopeResource, scopeResourceId],
  )

  const handleAddComment = async (content: string) => {
    const optimistic = generateOptimisticComment(content)
    if (requiresAck) optimistic.requires_acknowledgement = true
    setComments((prev) => [...prev, optimistic])
    scrollToBottom()

    try {
      const created = await demoCreateComment({
        content,
        resource: scopeResource,
        resourceId: scopeResourceId,
        requiresAck,
        currentUser,
      })
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...created, status: 'success' } : c)))
      setRequiresAck(false)
      await fetchData()
      scrollToBottom()
    } catch (err) {
      console.error('Failed to add comment:', err)
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? { ...c, status: 'error' } : c)),
      )
      throw err
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    const optimistic = generateOptimisticComment(content, parentId)
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), optimistic] } : c,
      ),
    )

    try {
      await demoReplyComment({ parentId, content, currentUser })
      setRequiresAck(false)
      setReplyingId(null)
      await fetchData()
      setExpandedCommentId(parentId)
      scrollToComment(parentId)
    } catch (err) {
      console.error('Failed to add reply:', err)
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== parentId) return c
          return {
            ...c,
            replies: (c.replies || []).map((r) =>
              r.id === optimistic.id ? { ...r, status: 'error' } : r,
            ),
          }
        }),
      )
      throw err
    }
  }

  const handleEditComment = useCallback(
    async (commentId: string, newContent: string) => {
      setComments((prev) => {
        const update = (list: IDiscussion[]): IDiscussion[] =>
          list.map((c) => {
            if (c.id === commentId) {
              return { ...c, content: cleanEditorContent(newContent), status: 'pending' }
            }
            if (c.replies?.length) return { ...c, replies: update(c.replies) }
            return c
          })
        return update(prev)
      })

      try {
        const originalAck = editingComment?.requires_acknowledgement || false
        await demoUpdateComment({
          commentId,
          content: newContent,
          requiresAck: requiresAck ? true : originalAck ? false : null,
        })
        setRequiresAck(false)
        setEditingId(null)
        originalEditContentRef.current = null
        await fetchData()
        scrollToComment(commentId)
      } catch (err) {
        console.error('Failed to update comment:', err)
        setComments((prev) => {
          const update = (list: IDiscussion[]): IDiscussion[] =>
            list.map((c) => {
              if (c.id === commentId) return { ...c, status: 'error' }
              if (c.replies?.length) return { ...c, replies: update(c.replies) }
              return c
            })
          return update(prev)
        })
        throw err
      }
    },
    [editingComment, requiresAck, fetchData, scrollToComment],
  )

  const handleRetry = useCallback(async (comment: IDiscussion) => {
    setComments((prev) => {
      const update = (list: IDiscussion[]): IDiscussion[] =>
        list.map((c) => {
          if (c.id === comment.id) return { ...c, status: 'pending' }
          if (c.replies?.length) return { ...c, replies: update(c.replies) }
          return c
        })
      return update(prev)
    })

    try {
      if (!comment.id.startsWith('opt-')) {
        await demoUpdateComment({ commentId: comment.id, content: comment.content })
      } else if (comment.parent_id) {
        await demoReplyComment({
          parentId: comment.parent_id,
          content: comment.content,
          currentUser,
        })
      } else {
        await demoCreateComment({
          content: comment.content,
          resource: scopeResource,
          resourceId: scopeResourceId,
          currentUser,
        })
      }
      await fetchData()
    } catch (err) {
      console.error('Retry failed:', err)
      setComments((prev) => {
        const update = (list: IDiscussion[]): IDiscussion[] =>
          list.map((c) => {
            if (c.id === comment.id) return { ...c, status: 'error' }
            if (c.replies?.length) return { ...c, replies: update(c.replies) }
            return c
          })
        return update(prev)
      })
    }
  }, [currentUser, fetchData, scopeResource, scopeResourceId])

  const confirmDelete = async (deleteId: string) => {
    try {
      await demoDeleteComment(deleteId)
      setEditingId(null)
      setReplyingId(null)
      setRequiresAck(false)
      mainInputRef.current?.clearContent()
      await fetchData()
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const handleStartEdit = useCallback(
    (commentId: string, content: string) => {
      const findRootId = (id: string): string | null => {
        if (comments.some((c) => c.id === id)) return id
        for (const root of comments) {
          if (root.replies?.some((r) => r.id === id)) return root.id
        }
        return null
      }
      const rootId = findRootId(commentId)
      if (rootId) setExpandedCommentId(rootId)
      setReplyingId(null)
      setEditingId(commentId)
      originalEditContentRef.current = content
      mainInputRef.current?.setContent(content)
      setFocusToken((t) => t + 1)
    },
    [comments],
  )

  const handleStartReply = useCallback((commentId: string) => {
    setEditingId(null)
    originalEditContentRef.current = null
    setReplyingId(commentId)
    setExpandedCommentId(commentId)
    mainInputRef.current?.clearContent()
    setFocusToken((t) => t + 1)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    originalEditContentRef.current = null
    setRequiresAck(false)
    mainInputRef.current?.clearContent()
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingId(null)
    mainInputRef.current?.clearContent()
  }, [])

  const handleAcknowledge = useCallback(
    async (commentId: string) => {
      await demoAcknowledgeComment({ commentId, currentUser })
      await fetchData()
      scrollToComment(commentId)
    },
    [currentUser, fetchData, scrollToComment],
  )

  const handleMainSubmit = async (content: string) => {
    if (editingId) {
      await handleEditComment(editingId, content)
      return
    }
    if (replyingId) {
      await handleReply(replyingId, content)
      return
    }
    await handleAddComment(content)
  }

  const handleToggleAck = () => setRequiresAck(!requiresAck)

  const originalAck =
    editingComment?.requires_acknowledgement ||
    replyingComment?.requires_acknowledgement ||
    false
  const isAcked = editingComment?.is_acknowledged || false
  const isChecked = originalAck ? !requiresAck : requiresAck

  const requestAckButton = !replyingId && (
    <button
      type="button"
      onClick={handleToggleAck}
      disabled={isAcked}
      title={
        isAcked
          ? 'This message has been acknowledged'
          : originalAck
            ? 'Unset Request'
            : 'Request Acknowledgement'
      }
      className={cn(
        'discussion-ack_toggle group/ack',
        isAcked ? 'discussion-ack_toggle--acked' : 'discussion-ack_toggle--idle',
      )}
    >
      <div
        className={cn(
          'discussion-ack_toggle-box',
          !isAcked &&
          (isChecked
            ? 'discussion-ack_toggle-box--checked'
            : 'discussion-ack_toggle-box--unchecked'),
          isAcked && 'discussion-ack_toggle-box--acked',
        )}
      >
        {isAcked ? (
          <ClipboardCheck className="discussion-comment_item-ack_icon" />
        ) : isChecked ? (
          <Check className="discussion-ack_toggle-check" />
        ) : null}
      </div>
      <span className="discussion-ack_toggle-label">
        {isAcked ? 'Acknowledged' : originalAck ? 'Unset Request' : 'Ack'}
      </span>
    </button>
  )

  const refreshButton = (
    <button
      type="button"
      onClick={() => void fetchData()}
      disabled={refreshing}
      className="discussion-refresh_btn"
      title="Refresh discussion"
    >
      {refreshing ? (
        <Loader2 className="discussion-icon-spin" />
      ) : (
        <RefreshCw className="discussion-input-icon" />
      )}
      <span className="discussion-refresh_btn-label">Refresh</span>
    </button>
  )

  const closeButton = onClose ? (
    <button type="button" onClick={onClose} className="discussion-close_btn group" title="Hide discussion">
      <MessageSquareX className="discussion-input-icon" />
      <span className="discussion-close_btn-label">Hide</span>
    </button>
  ) : null

  const isEmpty = !initialLoading && comments.length === 0

  return (
    <div className={cn('discussion-root', className)}>
      {bannerHeader}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          className={cn('discussion-scroll', bannerHeight > 0 && 'discussion-scroll--banner')}
        >
          <div className="discussion-scroll-inner">
            {initialLoading ? (
              <div className="discussion-empty">
                <div className="discussion-empty-icon_wrap">
                  <Loader2 className="discussion-empty-icon--spin" />
                </div>
                <p className="discussion-empty-text">Loading discussion…</p>
              </div>
            ) : isEmpty && showEmptyState ? (
              <div className="discussion-empty">
                <div className="discussion-empty-icon_wrap">
                  <MessageSquareMore className="discussion-empty-icon" />
                </div>
                <p className="discussion-empty-text">
                  No comments yet. Start the discussion below.
                </p>
              </div>
            ) : (
              comments.map((comment, index) => {
                const currentDateLabel = formatDividerDate(comment.created)
                const prevDateLabel =
                  index > 0 ? formatDividerDate(comments[index - 1].created) : null
                const showDivider = currentDateLabel !== prevDateLabel

                return (
                  <div key={comment.id} className="discussion-timeline_item">
                    {showDivider && <DateDivider date={currentDateLabel} />}
                    <CommentItem
                      comment={comment}
                      hasNext={index < comments.length - 1 || !!(replyingId || editingId)}
                      isLast={index === comments.length - 1}
                      hideAvatar={hideAvatar}
                      currentUserId={currentUser.id}
                      currentUser={currentUser}
                      editingId={editingId}
                      setEditingId={setEditingId}
                      replyingId={replyingId}
                      setReplyingId={setReplyingId}
                      onStartEdit={handleStartEdit}
                      onStartReply={handleStartReply}
                      onCancelEdit={handleCancelEdit}
                      onFocusInput={() => mainInputRef.current?.focus()}
                      highlightedId={highlightedId}
                      isExpanded={expandedCommentId === comment.id}
                      onToggleExpand={(open) =>
                        setExpandedCommentId(open ? comment.id : null)
                      }
                      onRefresh={() => void fetchData()}
                      onRetry={(c) => void handleRetry(c)}
                      onAcknowledge={handleAcknowledge}
                      onDelete={(id) => {
                        if (window.confirm('Delete this comment?')) {
                          void confirmDelete(id)
                        }
                      }}
                      readOnly={readOnly}
                      scrollToComment={scrollToComment}
                    />
                  </div>
                )
              })
            )}

            <div
              style={{ height: Math.max(0, bannerHeight) }}
              className="discussion-banner_spacer"
            />
          </div>
        </div>

        <div
          className={cn(
            'discussion-scroll-to-bottom',
            isAtBottom ? 'discussion-scroll-to-bottom--hidden' : 'discussion-scroll-to-bottom--visible',
          )}
        >
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="discussion-scroll-to-bottom_btn"
            title="Scroll to latest message"
          >
            <ChevronsDown className="discussion-scroll-to-bottom_icon" />
            Latest
          </button>
        </div>
      </div>

      {!readOnly && (
        <div ref={inputWrapperRef} className="discussion-composer">
          <div className="discussion-composer-inner">
            <CommentInput
              ref={mainInputRef}
              currentUser={currentUser}
              hideAvatar
              showAvatar={false}
              placeholder={
                editingId
                  ? 'Edit your comment…'
                  : replyingId
                    ? 'Write a reply…'
                    : 'Add new comments'
              }
              replyToName={replyingComment?.creator?.name}
              replyContent={replyingComment?.content}
              onCancelReply={handleCancelReply}
              onReplyClick={() => {
                if (replyingId) scrollToComment(replyingId)
              }}
              editToName={editingComment ? 'comment' : null}
              editContent={editingComment?.content}
              onCancelEdit={handleCancelEdit}
              onEditClick={() => {
                if (editingId) scrollToComment(editingId)
              }}
              onDelete={
                editingId
                  ? () => {
                    if (window.confirm('Delete this comment?')) {
                      void confirmDelete(editingId)
                    }
                  }
                  : undefined
              }
              onBannerHeightChange={setBannerHeight}
              onSubmit={handleMainSubmit}
              extraActions={
                <div className="discussion-extra_actions">
                  {requestAckButton}
                  {refreshButton}
                  {closeButton && (
                    <>
                      <div className="discussion-composer_close_divider" />
                      {closeButton}
                    </>
                  )}
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  )

}

export default Discussion
