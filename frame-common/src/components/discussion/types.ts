import type { ReactNode } from 'react'

export interface IDiscussionCreator {
  id: string
  name: string
  avatar: string | null
}

export interface IDiscussion {
  id: string
  master_id: string | null
  parent_id: string | null
  depth: number
  content: string
  organization_id: string
  resource: string
  resource_id: string
  creator: IDiscussionCreator
  attachment_count: number
  reaction_count: number
  flag_count: number
  _realm: string
  created: string
  updated: string
  _creator: string
  updater: string | null
  _deleted: string | null
  etag: string
  requires_acknowledgement: boolean
  is_acknowledged: boolean
  type?: string
  status?: 'pending' | 'success' | 'error'
  replies?: IDiscussion[]
  /** Demo-only: acknowledgement reply marker */
  is_acknowledge_reply?: boolean
}

export interface DiscussionProps {
  className?: string
  onClose?: () => void
  hideAvatar?: boolean
  showEmptyState?: boolean
  resourceOverride?: string
  resourceIdOverride?: string
  defaultResource?: string
  defaultResourceId?: string
  currentResource?: string
  currentResourceId?: string
  bannerHeader?: ReactNode
  newMessageAt?: number
  readOnly?: boolean
}
