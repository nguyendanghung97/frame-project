import type { IDiscussion } from './types'

export function processDiscussionData(flatData: IDiscussion[]): IDiscussion[] {
  const map: Record<string, IDiscussion> = {}
  const roots: IDiscussion[] = []
  const rootIds = new Set<string>()

  flatData.forEach((item) => {
    if (item?.id) {
      map[item.id] = { ...item, replies: [] }
    }
  })

  flatData.forEach((item) => {
    if (item.depth === 0 && item.id && !rootIds.has(item.id)) {
      roots.push(map[item.id])
      rootIds.add(item.id)
    } else if (item.parent_id && map[item.parent_id]) {
      const parent = map[item.parent_id]
      if (!parent.replies?.some((r) => r.id === item.id)) {
        parent.replies?.push(map[item.id])
      }
    }
  })

  const sortByCreated = (a: IDiscussion, b: IDiscussion) =>
    new Date(a.created).getTime() - new Date(b.created).getTime()

  roots.sort(sortByCreated)
  roots.forEach((root) => {
    if (root.replies && root.replies.length > 0) {
      root.replies.sort(sortByCreated)
    }
  })

  return roots
}

export function cleanEditorContent(content: string) {
  return content
    .replace(/^(<p><br><\/p>)+/g, '')
    .replace(/(<p><br><\/p>)+$/g, '')
    .trim()
}

export function getPlainTextLength(html: string): number {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim().length
  }
  if (!html || html === '<p><br></p>' || html === '<p></p>') return 0
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .trim().length
}

export function formatTimeOnly(time: string): string {
  const date = new Date(time)
  return date
    .toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}

export function formatDividerDate(time: string): string {
  const date = new Date(time)
  const today = new Date()
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  // Match NCS: Today | MM/DD/YYYY (en-US)
  if (isToday) return 'Today'
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Plain text → simple HTML paragraphs (demo editor). */
export function plainTextToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n+/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '').trim()
  }
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').trim()
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
