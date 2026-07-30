import type { IDiscussion, IDiscussionCreator } from './types'
import {
  DEMO_CURRENT_USER,
  DEMO_FLAT_COMMENTS,
  DEMO_RESOURCE,
  DEMO_RESOURCE_ID,
} from './mockData'
import { cleanEditorContent, delay, processDiscussionData } from './helpers'

let flatStore: IDiscussion[] = DEMO_FLAT_COMMENTS.map((c) => ({ ...c }))
let idCounter = 100

function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function cloneFlat(): IDiscussion[] {
  return flatStore.map((c) => ({ ...c, replies: undefined }))
}

export function getDemoRoots(): IDiscussion[] {
  return processDiscussionData(cloneFlat())
}

export async function demoLoadComments(): Promise<IDiscussion[]> {
  await delay(350)
  return getDemoRoots()
}

export async function demoCreateComment(params: {
  content: string
  resource: string
  resourceId: string
  requiresAck?: boolean
  currentUser?: IDiscussionCreator
}): Promise<IDiscussion> {
  await delay(400)
  const user = params.currentUser ?? DEMO_CURRENT_USER
  const now = new Date().toISOString()
  const comment: IDiscussion = {
    id: nextId('c'),
    master_id: null,
    parent_id: null,
    depth: 0,
    content: cleanEditorContent(params.content),
    organization_id: 'org-demo',
    resource: params.resource || DEMO_RESOURCE,
    resource_id: params.resourceId || DEMO_RESOURCE_ID,
    creator: user,
    attachment_count: 0,
    reaction_count: 0,
    flag_count: 0,
    _realm: 'demo',
    created: now,
    updated: now,
    _creator: user.id,
    updater: null,
    _deleted: null,
    etag: `etag-${Date.now()}`,
    requires_acknowledgement: !!params.requiresAck,
    is_acknowledged: false,
    status: 'success',
    replies: [],
  }
  flatStore = [...flatStore, comment]
  return comment
}

export async function demoReplyComment(params: {
  parentId: string
  content: string
  currentUser?: IDiscussionCreator
}): Promise<IDiscussion> {
  await delay(400)
  const parent = flatStore.find((c) => c.id === params.parentId)
  if (!parent) throw new Error('Parent comment not found')

  const user = params.currentUser ?? DEMO_CURRENT_USER
  const now = new Date().toISOString()
  const reply: IDiscussion = {
    id: nextId('r'),
    master_id: parent.master_id || parent.id,
    parent_id: params.parentId,
    depth: 1,
    content: cleanEditorContent(params.content),
    organization_id: parent.organization_id,
    resource: parent.resource,
    resource_id: parent.resource_id,
    creator: user,
    attachment_count: 0,
    reaction_count: 0,
    flag_count: 0,
    _realm: 'demo',
    created: now,
    updated: now,
    _creator: user.id,
    updater: null,
    _deleted: null,
    etag: `etag-${Date.now()}`,
    requires_acknowledgement: false,
    is_acknowledged: false,
    status: 'success',
    replies: [],
  }
  flatStore = [...flatStore, reply]
  return reply
}

export async function demoUpdateComment(params: {
  commentId: string
  content: string
  requiresAck?: boolean | null
}): Promise<IDiscussion> {
  await delay(350)
  const idx = flatStore.findIndex((c) => c.id === params.commentId)
  if (idx < 0) throw new Error('Comment not found')

  const updated: IDiscussion = {
    ...flatStore[idx],
    content: cleanEditorContent(params.content),
    updated: new Date().toISOString(),
    status: 'success',
  }
  if (params.requiresAck === true) updated.requires_acknowledgement = true
  if (params.requiresAck === false) updated.requires_acknowledgement = false

  flatStore = flatStore.map((c, i) => (i === idx ? updated : c))
  return updated
}

export async function demoDeleteComment(commentId: string): Promise<void> {
  await delay(300)
  flatStore = flatStore.filter(
    (c) => c.id !== commentId && c.parent_id !== commentId,
  )
}

export async function demoAcknowledgeComment(params: {
  commentId: string
  currentUser?: IDiscussionCreator
}): Promise<IDiscussion> {
  await delay(300)
  const parent = flatStore.find((c) => c.id === params.commentId)
  if (!parent) throw new Error('Comment not found')

  const user = params.currentUser ?? DEMO_CURRENT_USER
  const now = new Date().toISOString()
  const ack: IDiscussion = {
    id: nextId('ack'),
    master_id: parent.master_id || parent.id,
    parent_id: params.commentId,
    depth: 1,
    content: '<p>Acknowledged</p>',
    organization_id: parent.organization_id,
    resource: parent.resource,
    resource_id: parent.resource_id,
    creator: user,
    attachment_count: 0,
    reaction_count: 0,
    flag_count: 0,
    _realm: 'demo',
    created: now,
    updated: now,
    _creator: user.id,
    updater: null,
    _deleted: null,
    etag: `etag-${Date.now()}`,
    requires_acknowledgement: false,
    is_acknowledged: false,
    status: 'success',
    is_acknowledge_reply: true,
    replies: [],
  }

  flatStore = flatStore.map((c) =>
    c.id === params.commentId ? { ...c, is_acknowledged: true } : c,
  )
  flatStore = [...flatStore, ack]
  return ack
}

export function demoResetStore() {
  flatStore = DEMO_FLAT_COMMENTS.map((c) => ({ ...c }))
  idCounter = 100
}
