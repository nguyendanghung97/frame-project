import type { IDiscussion, IDiscussionCreator } from './types'

export const DEMO_RESOURCE = 'notebook_entry'
export const DEMO_RESOURCE_ID = 'demo-entry-001'

export const DEMO_CURRENT_USER: IDiscussionCreator = {
  id: 'user-alice',
  name: 'Alice Nguyen',
  avatar: null,
}

export const DEMO_USERS = {
  alice: DEMO_CURRENT_USER,
  bob: {
    id: 'user-bob',
    name: 'Bob Tran',
    avatar: null,
  } satisfies IDiscussionCreator,
  carol: {
    id: 'user-carol',
    name: 'Carol Le',
    avatar: null,
  } satisfies IDiscussionCreator,
  system: {
    id: 'user-system',
    name: 'System',
    avatar: null,
  } satisfies IDiscussionCreator,
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function baseComment(
  partial: Partial<IDiscussion> & Pick<IDiscussion, 'id' | 'content' | 'creator' | 'depth'>,
): IDiscussion {
  const created = partial.created ?? hoursAgo(2)
  return {
    master_id: null,
    parent_id: null,
    organization_id: 'org-demo',
    resource: DEMO_RESOURCE,
    resource_id: DEMO_RESOURCE_ID,
    attachment_count: 0,
    reaction_count: 0,
    flag_count: 0,
    _realm: 'demo',
    created,
    updated: created,
    _creator: partial.creator.id,
    updater: null,
    _deleted: null,
    etag: `etag-${partial.id}`,
    requires_acknowledgement: false,
    is_acknowledged: false,
    status: 'success',
    replies: [],
    ...partial,
  }
}

/** Seed flat list for the demo discussion panel. */
export const DEMO_FLAT_COMMENTS: IDiscussion[] = [
  baseComment({
    id: 'sys-1',
    type: 'SYSTEM',
    depth: 0,
    content: '<p>Discussion started for this notebook entry.</p>',
    creator: DEMO_USERS.system,
    created: hoursAgo(26),
  }),
  baseComment({
    id: 'c-1',
    depth: 0,
    content: '<p>Patient vitals look stable this morning. Please confirm the noon check.</p>',
    creator: DEMO_USERS.bob,
    created: hoursAgo(5),
    requires_acknowledgement: true,
    is_acknowledged: false,
  }),
  baseComment({
    id: 'c-1-r1',
    depth: 1,
    parent_id: 'c-1',
    content: '<p>Confirmed — noon vitals logged in the chart.</p>',
    creator: DEMO_USERS.carol,
    created: hoursAgo(4),
  }),
  baseComment({
    id: 'c-1-ack',
    depth: 1,
    parent_id: 'c-1',
    content: '<p>Acknowledged</p>',
    creator: DEMO_USERS.carol,
    created: hoursAgo(3.8),
    is_acknowledge_reply: true,
  }),
  baseComment({
    id: 'c-2',
    depth: 0,
    content: '<p>Can we schedule a short huddle before discharge?</p>',
    creator: DEMO_USERS.alice,
    created: hoursAgo(2),
  }),
  baseComment({
    id: 'c-2-r1',
    depth: 1,
    parent_id: 'c-2',
    content: '<p>Yes — 15:00 works for me.</p>',
    creator: DEMO_USERS.bob,
    created: hoursAgo(1.5),
  }),
  baseComment({
    id: 'c-2-r2',
    depth: 1,
    parent_id: 'c-2',
    content: '<p>I can join as well.</p>',
    creator: DEMO_USERS.carol,
    created: hoursAgo(1),
  }),
  baseComment({
    id: 'c-3',
    depth: 0,
    content: '<p>Pharmacy updated the medication list — review when you have a moment.</p>',
    creator: DEMO_USERS.carol,
    created: hoursAgo(0.5),
  }),
]
